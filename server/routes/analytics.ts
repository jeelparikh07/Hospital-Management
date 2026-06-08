import express from 'express';
import Token from '../../src/models/Token.js';
import User from '../../src/models/User.js';
import Hospital from '../../src/models/Hospital.js';
import Queue from '../../src/models/Queue.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard analytics (Admin)
router.get('/dashboard', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    const tokens = await Token.find(query);
    const hospitals = await Hospital.find({ isActive: true });
    const doctors = await User.find({ role: 'doctor', isActive: true });
    const patients = await User.find({ role: 'patient', isActive: true });

    // Calculate metrics
    const totalTokens = tokens.length;
    const completedTokens = tokens.filter((t) => t.status === 'completed').length;
    const waitingTokens = tokens.filter((t) => t.status === 'waiting').length;
    const skippedTokens = tokens.filter((t) => t.status === 'skipped').length;
    const cancelledTokens = tokens.filter((t) => t.status === 'cancelled').length;

    // Average wait time
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

    // Average consultation time
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

    // Tokens by department
    const tokensByDepartment: Record<string, number> = {};
    tokens.forEach((t) => {
      const deptId = t.departmentId.toString();
      tokensByDepartment[deptId] = (tokensByDepartment[deptId] || 0) + 1;
    });

    // Tokens by hospital
    const tokensByHospital: Record<string, number> = {};
    tokens.forEach((t) => {
      const hospId = t.hospitalId.toString();
      tokensByHospital[hospId] = (tokensByHospital[hospId] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalHospitals: hospitals.length,
          totalDoctors: doctors.length,
          totalPatients: patients.length,
          totalTokensToday: totalTokens,
          completedToday: completedTokens,
          waitingNow: waitingTokens,
        },
        metrics: {
          avgWaitTime,
          avgConsultationTime,
          completionRate: totalTokens > 0 ? Math.round((completedTokens / totalTokens) * 100) : 0,
          skipRate: totalTokens > 0 ? Math.round((skippedTokens / totalTokens) * 100) : 0,
        },
        tokensByDepartment,
        tokensByHospital,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard analytics',
    });
  }
});

// Get doctor analytics
router.get(
  '/doctor/:doctorId',
  authenticateToken,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const query: any = { doctorId: req.params.doctorId };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.date = { $gte: today };
      }

      const tokens = await Token.find(query);

      const totalTokens = tokens.length;
      const completedTokens = tokens.filter((t) => t.status === 'completed').length;
      const waitingTokens = tokens.filter((t) => t.status === 'waiting').length;

      // Average wait time
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

      // Hourly distribution
      const hourlyDistribution: Record<number, number> = {};
      tokens.forEach((t) => {
        const hour = new Date(t.bookedAt).getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          totalTokens,
          completedTokens,
          waitingTokens,
          avgWaitTime,
          hourlyDistribution,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch doctor analytics',
      });
    }
  }
);

// Get hospital analytics
router.get(
  '/hospital/:hospitalId',
  authenticateToken,
  authorizeRole('admin', 'receptionist'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const query: any = { hospitalId: req.params.hospitalId };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.date = { $gte: today };
      }

      const tokens = await Token.find(query).populate('departmentId', 'name');

      const totalTokens = tokens.length;
      const completedTokens = tokens.filter((t) => t.status === 'completed').length;
      const waitingTokens = tokens.filter((t) => t.status === 'waiting').length;

      // By department
      const byDepartment: Record<string, any> = {};
      tokens.forEach((t: any) => {
        const deptName = t.departmentId?.name || 'Unknown';
        if (!byDepartment[deptName]) {
          byDepartment[deptName] = { total: 0, completed: 0, waiting: 0 };
        }
        byDepartment[deptName].total++;
        if (t.status === 'completed') byDepartment[deptName].completed++;
        if (t.status === 'waiting') byDepartment[deptName].waiting++;
      });

      res.json({
        success: true,
        data: {
          totalTokens,
          completedTokens,
          waitingTokens,
          byDepartment,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch hospital analytics',
      });
    }
  }
);

export default router;
