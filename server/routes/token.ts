import express from 'express';
import Token from '../../src/models/Token.js';
import Queue from '../../src/models/Queue.js';
import User from '../../src/models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get tokens for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const query: any = { patientId: req.params.patientId };

    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const tokens = await Token.find(query)
      .sort({ createdAt: -1 })
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name')
      .populate('doctorId', 'name specialization');

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tokens',
    });
  }
});

// Get tokens for a doctor
router.get('/doctor/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { date, status } = req.query;

    console.log('🔍 Doctor tokens request received:');
    console.log('  - doctorId param:', req.params.doctorId);
    console.log('  - date query:', date);
    console.log('  - status query:', status);

    // Convert string doctorId to ObjectId for proper MongoDB matching
    let doctorIdObj;
    try {
      const mongoose = await import('mongoose');
      doctorIdObj = new mongoose.Types.ObjectId(req.params.doctorId);
    } catch (convertError) {
      console.error('❌ Invalid doctorId format:', req.params.doctorId);
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format',
      });
    }

    const query: any = { doctorId: doctorIdObj };

    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    console.log('📝 Query being executed:', JSON.stringify({
      doctorId: doctorIdObj.toString(),
      date: query.date,
      status: query.status,
    }, null, 2));

    const tokens = await Token.find(query)
      .sort({ tokenNumber: 1 })
      .populate('patientId', 'name phone email')
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name')
      .populate('doctorId', 'name specialization');

    console.log(`✅ Found ${tokens.length} tokens for doctor ${req.params.doctorId}`);
    
    if (tokens.length > 0) {
      console.log('📋 First token details:');
      const firstToken = tokens[0];
      console.log('  - Token #:', firstToken.tokenNumber);
      console.log('  - Patient:', firstToken.patientId?.name);
      console.log('  - Status:', firstToken.status);
      console.log('  - Date:', firstToken.date);
      console.log('  - Doctor ID in DB:', firstToken.doctorId);
    }

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error: any) {
    console.error('❌ Error fetching doctor tokens:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch tokens',
    });
  }
});

// Get queue for a department
router.get('/queue/:departmentId', async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const tokens = await Token.find({
      departmentId: req.params.departmentId,
      date: { $gte: queryDate },
    })
      .sort({ tokenNumber: 1 })
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name');

    const waitingTokens = tokens.filter((t) => t.status === 'waiting');
    const inProgressTokens = tokens.filter((t) => t.status === 'in-progress');
    const completedTokens = tokens.filter((t) => t.status === 'completed');

    res.json({
      success: true,
      data: {
        tokens,
        waitingCount: waitingTokens.length,
        inProgressCount: inProgressTokens.length,
        completedCount: completedTokens.length,
        currentToken: inProgressTokens[0]?.tokenNumber || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch queue',
    });
  }
});

// Create new token (Book appointment)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { hospitalId, departmentId, doctorId, type = 'online', notes } = req.body;

    console.log('=== TOKEN BOOKING REQUEST ===');
    console.log('Request body:', { hospitalId, departmentId, doctorId, type });
    console.log('Request body doctorId type:', typeof doctorId);
    console.log('User ID:', (req as any).user?.userId);

    // Use today's date for the token
    const tokenDate = new Date();
    tokenDate.setHours(0, 0, 0, 0);

    // Get the last token number for today
    const lastToken = await Token.findOne({
      hospitalId,
      departmentId,
      doctorId,
      date: { $gte: tokenDate },
    }).sort({ tokenNumber: -1 });

    const tokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    // Get doctor's consultation duration
    const doctor = await User.findById(doctorId);
    
    if (!doctor) {
      console.log('⚠️ Doctor not found:', doctorId);
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }
    
    console.log('✅ Doctor found:', {
      _id: doctor._id,
      name: doctor.name,
      idType: typeof doctor._id,
      idString: doctor._id.toString(),
    });
    
    const consultationDuration = doctor.consultationDuration || 15;

    // Calculate estimated wait time
    const waitingTokens = await Token.countDocuments({
      hospitalId,
      departmentId,
      doctorId,
      date: { $gte: tokenDate },
      status: { $in: ['waiting', 'in-progress'] },
    });

    const estimatedWaitTime = waitingTokens * consultationDuration;

    // Create token
    const tokenData = {
      tokenNumber,
      patientId: (req as any).user?.userId,
      hospitalId,
      departmentId,
      doctorId,
      type,
      notes,
      estimatedWaitTime,
      date: tokenDate,
    };

    console.log('Creating token with data:', tokenData);

    const token = await Token.create(tokenData);

    console.log('✅ Token created:', {
      _id: token._id,
      tokenNumber: token.tokenNumber,
      doctorId: token.doctorId,
      doctorIdType: typeof token.doctorId,
      doctorIdString: token.doctorId.toString(),
      patientId: token.patientId,
      date: token.date,
    });

    // Update queue
    await Queue.findOneAndUpdate(
      { hospitalId, departmentId, doctorId, date: { $gte: tokenDate } },
      {
        $inc: { totalTokens: 1, waitingCount: 1 },
        estimatedWaitTime,
        lastUpdatedAt: new Date(),
      },
      { upsert: true }
    );

    // Populate the token
    const populatedToken = await Token.findById(token._id)
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name')
      .populate('doctorId', 'name specialization');

    console.log('Populated token doctor:', populatedToken?.doctorId);

    // Emit socket event (will be handled by the caller)
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('token-booked', {
        hospitalId,
        departmentId,
        doctorId,
        token: populatedToken,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Token booked successfully',
      data: { token: populatedToken },
    });
  } catch (error: any) {
    console.error('❌ Token booking error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book token',
    });
  }
});

// Call next token (Doctor)
router.post('/:id/call', authenticateToken, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    token.status = 'in-progress';
    token.calledAt = new Date();
    token.consultationStartedAt = new Date();
    await token.save();

    // Update queue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Queue.findOneAndUpdate(
      {
        hospitalId: token.hospitalId,
        departmentId: token.departmentId,
        doctorId: token.doctorId,
        date: { $gte: today },
      },
      {
        currentToken: token.tokenNumber,
        servingToken: token.tokenNumber,
        $inc: { waitingCount: -1 },
        lastUpdatedAt: new Date(),
      }
    );

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('token-called', {
        hospitalId: token.hospitalId.toString(),
        departmentId: token.departmentId.toString(),
        doctorId: token.doctorId.toString(),
        tokenNumber: token.tokenNumber,
      });
    }

    res.json({
      success: true,
      message: 'Token called successfully',
      data: { token },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to call token',
    });
  }
});

// Complete token (Doctor)
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    console.log('Completing token:', req.params.id);
    const token = await Token.findById(req.params.id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    if (!token) {
      console.log('Token not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    console.log('Token found:', {
      tokenNumber: token.tokenNumber,
      patient: token.patientId?.name,
      status: token.status,
      consultationStartedAt: token.consultationStartedAt,
      bookedAt: token.bookedAt,
      hospitalId: token.hospitalId,
      departmentId: token.departmentId,
      doctorId: token.doctorId,
    });

    token.status = 'completed';
    token.consultationEndedAt = new Date();
    
    // Calculate actual wait time safely - use optional chaining and fallback
    const consultationStart = token.consultationStartedAt?.getTime?.() || Date.now();
    const booked = token.bookedAt?.getTime?.() || Date.now();
    
    // Only calculate if both dates are valid and consultationStart >= booked
    if (consultationStart && booked && consultationStart >= booked) {
      const waitTimeMs = consultationStart - booked;
      token.actualWaitTime = Math.floor(waitTimeMs / 60000);
      console.log('Calculated wait time:', token.actualWaitTime, 'minutes');
    } else {
      console.log('Invalid dates, setting wait time to 0');
      console.log('  consultationStartedAt:', token.consultationStartedAt);
      console.log('  bookedAt:', token.bookedAt);
      token.actualWaitTime = 0;
    }
    
    await token.save();
    console.log('Token saved successfully');

    // Update queue (don't fail if this errors)
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      console.log('Updating queue for:', {
        hospitalId: token.hospitalId?.toString?.() || token.hospitalId,
        departmentId: token.departmentId?.toString?.() || token.departmentId,
        doctorId: token.doctorId?.toString?.() || token.doctorId,
      });

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
      console.log('Queue updated successfully');
    } catch (queueError: any) {
      console.warn('Failed to update queue:', queueError.message);
      // Don't fail the whole operation if queue update fails
    }

    console.log('Token completed successfully');
    res.json({
      success: true,
      message: 'Token completed successfully',
      data: { token },
    });
  } catch (error: any) {
    console.error('Error completing token:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete token',
    });
  }
});

// Skip token (Doctor)
router.post('/:id/skip', authenticateToken, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    token.status = 'skipped';
    await token.save();

    // Update queue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Queue.findOneAndUpdate(
      {
        hospitalId: token.hospitalId,
        departmentId: token.departmentId,
        doctorId: token.doctorId,
        date: { $gte: today },
      },
      {
        $inc: { skippedCount: 1, waitingCount: -1 },
        lastUpdatedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: 'Token skipped successfully',
      data: { token },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to skip token',
    });
  }
});

// Cancel token (Patient/Receptionist)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Only allow cancellation if token is still waiting
    if (token.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel token that is already in progress or completed',
      });
    }

    token.status = 'cancelled';
    await token.save();

    // Update queue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Queue.findOneAndUpdate(
      {
        hospitalId: token.hospitalId,
        departmentId: token.departmentId,
        doctorId: token.doctorId,
        date: { $gte: today },
      },
      {
        $inc: { waitingCount: -1 },
        lastUpdatedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: 'Token cancelled successfully',
      data: { token },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel token',
    });
  }
});

export default router;
