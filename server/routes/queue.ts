import express from 'express';
import Queue from '../../src/models/Queue.js';
import Token from '../../src/models/Token.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get queue status
router.get('/status/:doctorId', async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const queue = await Queue.findOne({
      doctorId: req.params.doctorId,
      date: { $gte: queryDate },
    });

    if (!queue) {
      return res.json({
        success: true,
        data: {
          queue: {
            currentToken: 0,
            servingToken: 0,
            totalTokens: 0,
            waitingCount: 0,
            completedCount: 0,
            estimatedWaitTime: 0,
            status: 'active',
          },
        },
      });
    }

    res.json({
      success: true,
      data: { queue },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch queue status',
    });
  }
});

// Get waiting room display data
router.get('/display/:departmentId', async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const tokens = await Token.find({
      departmentId: req.params.departmentId,
      date: { $gte: queryDate },
      status: { $in: ['waiting', 'in-progress'] },
    })
      .sort({ tokenNumber: 1 })
      .limit(10)
      .populate('doctorId', 'name')
      .populate('patientId', 'name');

    const currentToken = tokens.find((t) => t.status === 'in-progress');
    const nextTokens = tokens.filter((t) => t.status === 'waiting').slice(0, 5);

    res.json({
      success: true,
      data: {
        currentToken,
        nextTokens,
        totalWaiting: tokens.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch display data',
    });
  }
});

// Get queue analytics
router.get('/analytics/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = { doctorId: req.params.doctorId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const tokens = await Token.find(query);

    const totalTokens = tokens.length;
    const completedTokens = tokens.filter((t) => t.status === 'completed').length;
    const skippedTokens = tokens.filter((t) => t.status === 'skipped').length;
    const cancelledTokens = tokens.filter((t) => t.status === 'cancelled').length;

    // Calculate average wait time
    const completedWithWaitTime = tokens.filter(
      (t) => t.status === 'completed' && t.actualWaitTime > 0
    );
    const avgWaitTime =
      completedWithWaitTime.length > 0
        ? Math.floor(
            completedWithWaitTime.reduce((sum, t) => sum + t.actualWaitTime, 0) /
              completedWithWaitTime.length
          )
        : 0;

    // Calculate average consultation time
    const completedWithDuration = tokens.filter(
      (t) =>
        t.status === 'completed' &&
        t.consultationStartedAt &&
        t.consultationEndedAt
    );
    const avgConsultationTime =
      completedWithDuration.length > 0
        ? Math.floor(
            completedWithDuration.reduce((sum, t) => {
              const duration =
                (t.consultationEndedAt!.getTime() - t.consultationStartedAt!.getTime()) /
                60000;
              return sum + duration;
            }, 0) / completedWithDuration.length
          )
        : 15;

    res.json({
      success: true,
      data: {
        totalTokens,
        completedTokens,
        skippedTokens,
        cancelledTokens,
        avgWaitTime,
        avgConsultationTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics',
    });
  }
});

// Update queue status
router.put('/status/:queueId', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    const queue = await Queue.findByIdAndUpdate(
      req.params.queueId,
      { status, lastUpdatedAt: new Date() },
      { new: true }
    );

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found',
      });
    }

    // Emit socket event
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('queue-status-update', {
        hospitalId: queue.hospitalId.toString(),
        departmentId: queue.departmentId.toString(),
        queue,
      });
    }

    res.json({
      success: true,
      message: 'Queue status updated',
      data: { queue },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update queue status',
    });
  }
});

export default router;
