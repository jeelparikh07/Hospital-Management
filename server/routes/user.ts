import express from 'express';
import User from '../../src/models/User.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get doctors by hospital and department
router.get('/doctors', async (req, res) => {
  try {
    const { hospitalId, department } = req.query;

    const query: any = { role: 'doctor', isActive: true };

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    if (department) {
      query.departmentId = department;
    }

    const doctors = await User.find(query)
      .select('-password')
      .populate('hospitalId', 'name')
      .populate('departmentId', 'name');

    res.json({
      success: true,
      data: { doctors },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch doctors',
    });
  }
});

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { role, hospitalId } = req.query;

    const query: any = { isActive: true };

    if (role) {
      query.role = role;
    }

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    const users = await User.find(query).select('-password').populate('hospitalId', 'name');

    res.json({
      success: true,
      data: { users },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('hospitalId', 'name address');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user',
    });
  }
});

// Create user (Admin only)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, role, hospitalId, department, specialization } =
      req.body;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      hospitalId,
      department,
      specialization,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove sensitive fields from update
    delete updateData.password;
    delete updateData.email;

    // Check permissions
    if ((req as any).user?.userId !== id && (req as any).user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this user',
      });
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
});

// Update user password
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check permissions
    if ((req as any).user?.userId !== id && (req as any).user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password (except for admin)
    if ((req as any).user?.role !== 'admin') {
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update password',
    });
  }
});

// Deactivate user (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: { user },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate user',
    });
  }
});

export default router;
