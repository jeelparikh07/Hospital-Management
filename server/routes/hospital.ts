import express from 'express';
import Hospital from '../../src/models/Hospital.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Get all hospitals
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true }).sort({ name: 1 });

    res.json({
      success: true,
      data: { hospitals },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch hospitals',
    });
  }
});

// Get hospital by ID
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    res.json({
      success: true,
      data: { hospital },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch hospital',
    });
  }
});

// Create hospital (Admin only)
router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { name, address, city, state, pincode, phone, email, departments } = req.body;

    const hospital = await Hospital.create({
      name,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      departments,
    });

    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: { hospital },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create hospital',
    });
  }
});

// Update hospital (Admin only)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: { hospital },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update hospital',
    });
  }
});

// Delete hospital (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found',
      });
    }

    res.json({
      success: true,
      message: 'Hospital deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete hospital',
    });
  }
});

export default router;
