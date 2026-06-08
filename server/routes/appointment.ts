import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../../src/models/Appointment.js';
import Schedule from '../../src/models/Schedule.js';
import Token from '../../src/models/Token.js';
import Queue from '../../src/models/Queue.js';
import User from '../../src/models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Book an appointment
router.post('/book', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      doctorId,
      hospitalId,
      departmentId,
      scheduleId,
      slotIndex,
      appointmentDate,
      notes,
    } = req.body;

    const patientId = (req as any).user?.userId;

    console.log('=== APPOINTMENT BOOKING REQUEST ===');
    console.log('Request body:', {
      doctorId,
      hospitalId,
      departmentId,
      scheduleId,
      slotIndex,
      appointmentDate,
      patientId,
    });

    // Validate required fields
    if (!doctorId || !scheduleId || slotIndex === undefined || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, schedule, slot, and appointment date are required',
      });
    }

    // Validate appointment date is not in the past
    // appointmentDate comes as "YYYY-MM-DD" string
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');

    if (appointmentDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointment for past dates',
      });
    }

    // Get the schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Validate slot index
    if (slotIndex < 0 || slotIndex >= schedule.slots.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot index',
      });
    }

    const slot = schedule.slots[slotIndex];

    // Check if slot is active
    if (!slot.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This slot is not active',
      });
    }

    // Check if slot is full
    if (slot.bookedCount >= slot.maxPatients) {
      return res.status(400).json({
        success: false,
        message: 'This slot is full. Please choose another slot.',
      });
    }

    // Check if patient already has a booking for this doctor on this date
    const hasExisting = await Appointment.hasExistingBooking(
      new mongoose.Types.ObjectId(patientId),
      new mongoose.Types.ObjectId(doctorId),
      appointmentDate
    );

    if (hasExisting) {
      return res.status(400).json({
        success: false,
        message: 'You already have an appointment with this doctor on this date',
      });
    }

    // Get next token number
    const tokenNumber = await Appointment.getNextTokenNumber(
      new mongoose.Types.ObjectId(doctorId),
      appointmentDate
    );

    // Create appointment and update schedule atomically (without transactions for standalone MongoDB)
    try {
      // First, verify slot is still available (double-check to prevent race condition)
      const freshSchedule = await Schedule.findById(scheduleId);
      if (!freshSchedule || !freshSchedule.slots[slotIndex]) {
        return res.status(400).json({
          success: false,
          message: 'Slot no longer available',
        });
      }

      const freshSlot = freshSchedule.slots[slotIndex];
      if (freshSlot.bookedCount >= freshSlot.maxPatients) {
        return res.status(400).json({
          success: false,
          message: 'This slot is now full. Please choose another slot.',
        });
      }

      // Create appointment - store date as string
      const appointment = await Appointment.create({
        patientId: new mongoose.Types.ObjectId(patientId),
        doctorId: new mongoose.Types.ObjectId(doctorId),
        hospitalId: new mongoose.Types.ObjectId(hospitalId || schedule.hospitalId),
        departmentId: new mongoose.Types.ObjectId(departmentId || schedule.departmentId),
        scheduleId: new mongoose.Types.ObjectId(scheduleId),
        slotIndex,
        slotName: slot.slotName,
        slotTime: `${slot.startTime}-${slot.endTime}`,
        appointmentDate: appointmentDate, // Store as string "YYYY-MM-DD"
        tokenNumber,
        notes: notes || '',
        status: 'pending',
      });

      // Increment booked count using atomic update
      const updateResult = await Schedule.updateOne(
        { 
          _id: new mongoose.Types.ObjectId(scheduleId),
          'slots._id': schedule.slots[slotIndex]._id,
          [`slots.${slotIndex}.bookedCount`]: { $lt: schedule.slots[slotIndex].maxPatients }
        },
        { $inc: { [`slots.${slotIndex}.bookedCount`]: 1 } }
      );

      if (updateResult.modifiedCount === 0) {
        // Rollback: delete the appointment if we couldn't increment
        await Appointment.deleteOne({ _id: appointment._id });
        return res.status(400).json({
          success: false,
          message: 'Slot is now full. Please choose another slot.',
        });
      }

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('patientId', 'name phone email')
        .populate('doctorId', 'name specialization')
        .populate('hospitalId', 'name')
        .populate('departmentId', 'name');

      // If appointment is for TODAY, also create a Token for immediate queue
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = appointmentDate === todayStr;
      if (isToday) {
        console.log('Creating token for today\'s appointment...');

        // Create token - convert string to Date for Token model
        const apptDateObj = new Date(appointmentDate + 'T00:00:00');
        
        // Create token
        const token = await Token.create({
          tokenNumber,
          patientId: new mongoose.Types.ObjectId(patientId),
          hospitalId: new mongoose.Types.ObjectId(hospitalId || schedule.hospitalId),
          departmentId: new mongoose.Types.ObjectId(departmentId || schedule.departmentId),
          doctorId: new mongoose.Types.ObjectId(doctorId),
          date: apptDateObj,
          status: 'waiting',
          type: 'online',
          bookedAt: new Date(),
          estimatedWaitTime: 0,
          notes: notes || '',
        });

        // Update queue
        await Queue.findOneAndUpdate(
          {
            hospitalId: new mongoose.Types.ObjectId(hospitalId || schedule.hospitalId),
            departmentId: new mongoose.Types.ObjectId(departmentId || schedule.departmentId),
            doctorId: new mongoose.Types.ObjectId(doctorId),
            date: { $gte: apptDateObj },
          },
          {
            $inc: { totalTokens: 1, waitingCount: 1 },
            lastUpdatedAt: new Date(),
          },
          { upsert: true }
        );

        console.log('Token created for appointment:', token._id);
      }

      // Emit socket event
      const io = (req.app as any).get('io');
      if (io) {
        io.emit('appointment-booked', {
          doctorId,
          appointment: populatedAppointment,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointment: populatedAppointment,
          isToday,
        },
      });
    } catch (error: any) {
      console.error('Appointment booking error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to book appointment',
      });
    }
  } catch (error: any) {
    console.error('Appointment booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book appointment',
    });
  }
});

// Get patient's own appointments
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const patientId = (req as any).user?.userId;
    const { status, upcoming } = req.query;

    const query: any = { patientId: new mongoose.Types.ObjectId(patientId) };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.appointmentDate = { $gte: today };
      query.status = { $in: ['pending', 'completed'] };
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1, tokenNumber: 1 })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name');

    // Add status labels
    const todayStr = new Date().toISOString().split('T')[0];

    const appointmentsWithLabels = appointments.map((appt: any) => {
      const apptObj = appt.toObject();
      const apptDateStr = apptObj.appointmentDate; // Already a string

      let statusLabel = apptObj.status.toUpperCase();
      if (apptObj.status === 'pending') {
        if (apptDateStr === todayStr) {
          statusLabel = 'TODAY';
        } else if (apptDateStr > todayStr) {
          statusLabel = 'UPCOMING';
        }
      }

      return {
        ...apptObj,
        statusLabel,
        isToday: apptDateStr === todayStr,
        isUpcoming: apptDateStr > todayStr,
      };
    });

    res.json({
      success: true,
      data: { appointments: appointmentsWithLabels },
    });
  } catch (error: any) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch appointments',
    });
  }
});

// Get doctor's appointments (today's queue + all appointments)
router.get('/doctor/:doctorId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { doctorId } = req.params;
    const { date, type } = req.query;

    // type: 'today' | 'all' | 'upcoming' | 'completed'
    const query: any = { doctorId: new mongoose.Types.ObjectId(doctorId) };

    if (type === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.appointmentDate = { $gte: today, $lt: tomorrow };
      query.status = { $in: ['pending', 'completed'] };
    } else if (type === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.appointmentDate = { $gte: today };
      query.status = 'pending';
    } else if (type === 'completed') {
      query.status = 'completed';
    } else if (date) {
      // Query by exact string match
      query.appointmentDate = date as string;
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1, tokenNumber: 1 })
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name');

    // Add status labels and time info
    const todayStr = new Date().toISOString().split('T')[0];

    const appointmentsWithLabels = appointments.map((appt: any) => {
      const apptObj = appt.toObject();
      const apptDateStr = apptObj.appointmentDate; // Already a string

      let statusLabel = apptObj.status;
      if (apptObj.status === 'pending') {
        if (apptDateStr === todayStr) {
          statusLabel = 'REMAINING';
        } else if (apptDateStr > todayStr) {
          statusLabel = 'UPCOMING';
        }
      }

      return {
        ...apptObj,
        statusLabel,
        isToday: apptDateStr === todayStr,
        isUpcoming: apptDateStr > todayStr,
      };
    });

    res.json({
      success: true,
      data: { appointments: appointmentsWithLabels },
    });
  } catch (error: any) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch appointments',
    });
  }
});

// Mark appointment as completed (Doctor)
router.put('/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Verify doctor owns this appointment
    if (appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this appointment',
      });
    }

    // Cast to any to access instance methods
    const apptAny = appointment as any;
    await apptAny.markCompleted();

    // Also mark the token as completed if it exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const token = await Token.findOne({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: { $gte: today },
      tokenNumber: appointment.tokenNumber,
    });

    if (token) {
      token.status = 'completed';
      token.consultationEndedAt = new Date();
      if (token.consultationStartedAt) {
        token.actualWaitTime = Math.floor((token.consultationStartedAt.getTime() - token.bookedAt.getTime()) / 60000);
      }
      await token.save();

      // Update queue
      await Queue.findOneAndUpdate(
        {
          hospitalId: token.hospitalId,
          departmentId: token.departmentId,
          doctorId: token.doctorId,
          date: { $gte: today },
        },
        {
          $inc: { completedCount: 1 },
          lastUpdatedAt: new Date(),
        }
      );
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization');

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('appointment-completed', {
        doctorId: appointment.doctorId.toString(),
        appointmentId: appointment._id,
      });
    }

    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: { appointment: populatedAppointment },
    });
  } catch (error: any) {
    console.error('Error completing appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete appointment',
    });
  }
});

// Cancel appointment (Patient or Doctor)
router.put('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    const isPatient = appointment.patientId.toString() === userId;
    const isDoctor = appointment.doctorId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment',
      });
    }

    // Cannot cancel completed appointments
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment',
      });
    }

    // Cast to any to access instance methods
    const apptAny = appointment as any;
    await apptAny.markCancelled();

    // Decrement slot booked count
    const schedule = await Schedule.findById(appointment.scheduleId);
    if (schedule && schedule.slots[appointment.slotIndex]) {
      if (schedule.slots[appointment.slotIndex].bookedCount > 0) {
        schedule.slots[appointment.slotIndex].bookedCount -= 1;
        await schedule.save();
      }
    }

    // Cancel the token if it exists and is for today
    const todayStr = new Date().toISOString().split('T')[0];
    const apptDateStr = appointment.appointmentDate; // Already a string

    if (apptDateStr === todayStr) {
      const token = await Token.findOne({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        tokenNumber: appointment.tokenNumber,
      });

      if (token && token.status === 'waiting') {
        token.status = 'cancelled';
        await token.save();

        // Update queue
        const todayObj = new Date(todayStr + 'T00:00:00');
        await Queue.findOneAndUpdate(
          {
            hospitalId: token.hospitalId,
            departmentId: token.departmentId,
            doctorId: token.doctorId,
            date: { $gte: todayObj },
          },
          {
            $inc: { waitingCount: -1 },
            lastUpdatedAt: new Date(),
          }
        );
      }
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('appointment-cancelled', {
        doctorId: appointment.doctorId.toString(),
        appointmentId: appointment._id,
      });
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel appointment',
    });
  }
});

// Get single appointment details
router.get('/appointment/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const isPatient = appointment.patientId._id.toString() === userId;
    const isDoctor = appointment.doctorId._id.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment',
      });
    }

    res.json({
      success: true,
      data: { appointment },
    });
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch appointment',
    });
  }
});

export default router;
