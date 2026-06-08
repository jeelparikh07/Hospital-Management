import express from 'express';
import mongoose from 'mongoose';
import Schedule from '../../src/models/Schedule.js';
import Appointment from '../../src/models/Appointment.js';
import User from '../../src/models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get schedules for a doctor (with proper string-to-ObjectId conversion)
router.get('/doctor/:doctorId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date, startDate, endDate } = req.query;

    // Convert doctorId string to ObjectId
    let doctorIdObj;
    try {
      doctorIdObj = new mongoose.Types.ObjectId(req.params.doctorId);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format',
      });
    }

    const query: any = { doctorId: doctorIdObj };

    console.log('Fetching schedules for doctor:', req.params.doctorId, 'date:', date);

    // Single date query - compare as string
    if (date) {
      // Date comes as "YYYY-MM-DD" - use exact string match
      query.date = date as string;
    }

    // Date range query - use string comparison
    if (startDate && endDate) {
      query.date = { $gte: startDate as string, $lte: endDate as string };
    }

    const schedules = await Schedule.find(query)
      .sort({ date: 1 })
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name')
      .populate('doctorId', 'name specialization');

    // Calculate availability for each slot
    const schedulesWithAvailability = schedules.map((schedule: any) => {
      const scheduleObj = schedule.toObject();
      scheduleObj.slots = scheduleObj.slots.map((slot: any, idx: number) => ({
        ...slot,
        availableSlots: Math.max(0, slot.maxPatients - slot.bookedCount),
        isFull: slot.bookedCount >= slot.maxPatients,
        isExpired: scheduleObj.date < new Date().toISOString().split('T')[0],
      }));
      return scheduleObj;
    });

    res.json({
      success: true,
      data: { schedules: schedulesWithAvailability },
    });
  } catch (error: any) {
    console.error('Error fetching doctor schedules:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch schedules',
    });
  }
});

// Get all schedules (for admin and patient slot viewing)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { doctorId, date, status, startDate, endDate } = req.query;
    const query: any = {};

    if (doctorId) {
      // Convert doctorId string to ObjectId for proper matching
      try {
        query.doctorId = new mongoose.Types.ObjectId(doctorId as string);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid doctor ID format',
        });
      }
    }

    // Single date query - compare as string
    if (date) {
      query.date = date as string;
    }

    // Date range query - use string comparison
    if (startDate && endDate) {
      query.date = { $gte: startDate as string, $lte: endDate as string };
    }

    if (status) {
      query.status = status;
    }

    const schedules = await Schedule.find(query)
      .sort({ date: 1 })
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name');

    // Calculate availability for each slot
    const schedulesWithAvailability = schedules.map((schedule: any) => {
      const scheduleObj = schedule.toObject();
      scheduleObj.slots = scheduleObj.slots.map((slot: any) => ({
        ...slot,
        availableSlots: Math.max(0, slot.maxPatients - slot.bookedCount),
        isFull: slot.bookedCount >= slot.maxPatients,
        isExpired: scheduleObj.date < new Date().toISOString().split('T')[0],
      }));
      return scheduleObj;
    });

    res.json({
      success: true,
      data: { schedules: schedulesWithAvailability },
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch schedules',
    });
  }
});

// Create new schedule with slots
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      hospitalId,
      departmentId,
      date, // Already in "YYYY-MM-DD" format from frontend
      slots, // Array of { slotName, startTime, endTime, maxPatients }
      status,
    } = req.body;

    const userId = (req as any).user?.userId;

    console.log('Creating schedule with data:', {
      hospitalId,
      departmentId,
      date,
      slots,
      userId,
    });

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated. Please login again.',
      });
    }

    // Validate required fields
    if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Date and at least one slot are required',
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Date must be in YYYY-MM-DD format',
      });
    }

    // Validate date is not in the past (compare as strings)
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');

    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create schedule for past dates',
      });
    }

    // Get doctor's hospital and department from user profile if not provided
    let finalHospitalId = hospitalId;
    let finalDepartmentId = departmentId;

    if (!finalHospitalId || !finalDepartmentId) {
      const doctor = await User.findById(userId);
      if (doctor) {
        if (!finalHospitalId) finalHospitalId = doctor.hospitalId;
        if (!finalDepartmentId) finalDepartmentId = doctor.departmentId;
      }
    }

    // Validate that hospitalId and departmentId are available
    if (!finalHospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Hospital information is missing. Please update your profile first.',
      });
    }

    if (!finalDepartmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department information is missing. Please update your profile first.',
      });
    }

    // Validate slots
    const processedSlots = slots.map((slot: any) => ({
      slotName: slot.slotName || 'General',
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxPatients: slot.maxPatients || 10,
      bookedCount: 0,
      isActive: slot.isActive !== false,
    }));

    // Create ObjectId for doctorId
    const doctorIdObj = new mongoose.Types.ObjectId(userId);

    // Check if schedule already exists for this date (string comparison)
    const existingSchedule = await Schedule.findOne({
      doctorId: doctorIdObj,
      date: date, // Use date string directly
    });

    if (existingSchedule) {
      // Merge slots with existing schedule
      processedSlots.forEach((newSlot: any) => {
        const existingIndex = existingSchedule.slots.findIndex(
          (s: any) => s.slotName === newSlot.slotName && s.startTime === newSlot.startTime
        );

        if (existingIndex >= 0) {
          // Update existing slot
          existingSchedule.slots[existingIndex] = {
            ...existingSchedule.slots[existingIndex].toObject(),
            ...newSlot,
          };
        } else {
          // Add new slot
          existingSchedule.slots.push(newSlot);
        }
      });

      await existingSchedule.save();

      const savedSchedule = await Schedule.findById(existingSchedule._id)
        .populate('hospitalId', 'name')
        .populate('departmentId', 'name')
        .populate('doctorId', 'name specialization');

      return res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: { schedule: savedSchedule },
      });
    }

    // Create new schedule - store date as string
    const schedule = await Schedule.create({
      doctorId: doctorIdObj,
      hospitalId: finalHospitalId,
      departmentId: finalDepartmentId,
      date: date, // Store as string "YYYY-MM-DD"
      slots: processedSlots,
      status: status || 'active',
    });

    const savedSchedule = await Schedule.findById(schedule._id)
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name')
      .populate('doctorId', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: { schedule: savedSchedule },
    });
  } catch (error: any) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create schedule',
    });
  }
});

// Update schedule
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      date,
      slots,
      status,
    } = req.body;

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Only the doctor who owns the schedule can update it
    if (schedule.doctorId.toString() !== (req as any).user?.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this schedule',
      });
    }

    // Update fields
    if (date) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Date must be in YYYY-MM-DD format',
        });
      }
      schedule.date = date; // Store as string
    }

    if (slots && Array.isArray(slots)) {
      // Merge slots
      slots.forEach((newSlot: any) => {
        const existingIndex = schedule.slots.findIndex(
          (s: any) => s.slotName === newSlot.slotName && s.startTime === newSlot.startTime
        );

        if (existingIndex >= 0) {
          // Update existing slot - preserve bookedCount if not explicitly changing
          schedule.slots[existingIndex] = {
            ...schedule.slots[existingIndex].toObject(),
            slotName: newSlot.slotName || schedule.slots[existingIndex].slotName,
            startTime: newSlot.startTime || schedule.slots[existingIndex].startTime,
            endTime: newSlot.endTime || schedule.slots[existingIndex].endTime,
            maxPatients: newSlot.maxPatients !== undefined ? newSlot.maxPatients : schedule.slots[existingIndex].maxPatients,
            isActive: newSlot.isActive !== undefined ? newSlot.isActive : schedule.slots[existingIndex].isActive,
          };
        } else {
          // Add new slot
          schedule.slots.push({
            slotName: newSlot.slotName || 'General',
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
            maxPatients: newSlot.maxPatients || 10,
            bookedCount: 0,
            isActive: newSlot.isActive !== false,
          });
        }
      });
    }

    if (status) {
      schedule.status = status;
    }

    await schedule.save();

    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name')
      .populate('doctorId', 'name specialization');

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: { schedule: updatedSchedule },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update schedule',
    });
  }
});

// Delete a specific slot from schedule
router.put('/:id/slots/:slotIndex/delete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, slotIndex } = req.params;
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Only the doctor who owns the schedule can delete slots
    if (schedule.doctorId.toString() !== (req as any).user?.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this slot',
      });
    }

    const slot = schedule.slots[slotIndex];
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found',
      });
    }

    // Check if slot has bookings
    if (slot.bookedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete slot with ${slot.bookedCount} existing bookings. Cancel bookings first.`,
      });
    }

    // Remove the slot
    schedule.slots.splice(parseInt(slotIndex), 1);
    await schedule.save();

    res.json({
      success: true,
      message: 'Slot deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete slot',
    });
  }
});

// Delete entire schedule
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Only the doctor who owns the schedule can delete it
    if (schedule.doctorId.toString() !== (req as any).user?.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this schedule',
      });
    }

    // Check if schedule has any bookings
    const totalBookings = schedule.slots.reduce((sum: number, slot: any) => sum + slot.bookedCount, 0);
    if (totalBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete schedule with ${totalBookings} existing bookings. Cancel bookings first.`,
      });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete schedule',
    });
  }
});

// Get available dates for a doctor (next 7 days with availability info)
router.get('/availability/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate } = req.query;

    // Convert doctorId to ObjectId
    let doctorIdObj;
    try {
      doctorIdObj = new mongoose.Types.ObjectId(doctorId);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format',
      });
    }

    // Generate date range as strings
    const today = new Date();
    const startStr = startDate as string || today.toISOString().split('T')[0];
    
    const startDateObj = new Date(startStr + 'T00:00:00');
    const end = new Date(startDateObj);
    end.setDate(end.getDate() + 7); // Next 7 days
    const endStr = end.toISOString().split('T')[0];

    // Get all schedules in date range (string comparison)
    const schedules = await Schedule.find({
      doctorId: doctorIdObj,
      date: { $gte: startStr, $lte: endStr },
      status: 'active',
    });

    // Build availability map
    const availabilityMap = new Map();

    for (let d = new Date(startDateObj); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Filter schedules by exact string match
      const daySchedules = schedules.filter(s => s.date === dateStr);

      let totalSlots = 0;
      let bookedSlots = 0;
      let hasActiveSession = false;
      const slotDetails: any[] = [];

      daySchedules.forEach(s => {
        s.slots.forEach((slot: any) => {
          if (slot.isActive) {
            hasActiveSession = true;
            const available = Math.max(0, slot.maxPatients - slot.bookedCount);
            totalSlots += slot.maxPatients;
            bookedSlots += slot.bookedCount;
            slotDetails.push({
              slotName: slot.slotName,
              startTime: slot.startTime,
              endTime: slot.endTime,
              available,
              maxPatients: slot.maxPatients,
              isFull: available === 0,
            });
          }
        });
      });

      availabilityMap.set(dateStr, {
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        available: hasActiveSession && bookedSlots < totalSlots,
        hasActiveSession,
        bookedSlots,
        totalSlots,
        availableSlots: Math.max(0, totalSlots - bookedSlots),
        isToday: d.toDateString() === new Date().toDateString(),
        slotDetails,
      });
    }

    res.json({
      success: true,
      data: { availability: Array.from(availabilityMap.values()) },
    });
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch availability',
    });
  }
});

// Get slots for a specific date (patient-facing endpoint)
router.get('/:doctorId/date/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Convert doctorId to ObjectId
    let doctorIdObj;
    try {
      doctorIdObj = new mongoose.Types.ObjectId(doctorId);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format',
      });
    }

    // Query using exact string match
    const schedule = await Schedule.findOne({
      doctorId: doctorIdObj,
      date: date, // Exact string match
      status: 'active',
    }).populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name');

    if (!schedule) {
      return res.json({
        success: true,
        data: {
          slots: [],
          message: 'No slots available for this date',
        },
      });
    }

    // Check if date has passed (string comparison)
    const todayStr = new Date().toISOString().split('T')[0];
    const isExpired = schedule.date < todayStr;

    const slotsWithAvailability = schedule.slots.map((slot: any) => ({
      ...slot.toObject(),
      availableSlots: Math.max(0, slot.maxPatients - slot.bookedCount),
      isFull: slot.bookedCount >= slot.maxPatients,
      isExpired,
      date: schedule.date,
    }));

    res.json({
      success: true,
      data: {
        slots: slotsWithAvailability,
        scheduleDate: schedule.date,
        doctorName: schedule.doctorId?.name,
      },
    });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch slots',
    });
  }
});

export default router;
