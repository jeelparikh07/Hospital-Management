import express from 'express';
import Department from '../../src/models/Department.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all departments for a hospital
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const departments = await Department.find({
      hospitalId: req.params.hospitalId,
      isActive: true,
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: { departments },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch departments',
    });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: { department },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch department',
    });
  }
});

// Create department (Admin/Receptionist only)
router.post('/', authenticateToken, authorizeRole('admin', 'receptionist'), async (req, res) => {
  try {
    const { name, description, hospitalId, icon, color } = req.body;

    const department = await Department.create({
      name,
      description,
      hospitalId,
      icon,
      color,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { department },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create department',
    });
  }
});

// Update department
router.put('/:id', authenticateToken, authorizeRole('admin', 'receptionist'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: { department },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update department',
    });
  }
});

// Delete department
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete department',
    });
  }
});

export default router;
