import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import hospitalRoutes from './routes/hospital.js';
import departmentRoutes from './routes/department.js';
import tokenRoutes from './routes/token.js';
import queueRoutes from './routes/queue.js';
import userRoutes from './routes/user.js';
import analyticsRoutes from './routes/analytics.js';
import scheduleRoutes from './routes/schedule.js';
import appointmentRoutes from './routes/appointment.js';
import { initializeSocket } from './socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? false 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
});

// Initialize Socket.io handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hospital-queue';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Auto-fix: Update any schedules with null doctorId
    try {
      const Schedule = (await import('../src/models/Schedule.js')).default;
      const User = (await import('../src/models/User.js')).default;
      
      // Find all doctors
      const doctors = await User.find({ role: 'doctor' });
      console.log(`📋 Found ${doctors.length} doctors`);
      
      // Fix schedules with null doctorId
      const nullSchedules = await Schedule.find({ doctorId: null });
      console.log(`🔧 Found ${nullSchedules.length} schedules with null doctorId`);
      
      if (nullSchedules.length > 0 && doctors.length > 0) {
        // Assign them to the first doctor
        const defaultDoctorId = doctors[0]._id;
        
        for (const schedule of nullSchedules) {
          schedule.doctorId = defaultDoctorId;
          await schedule.save();
        }
        
        console.log(`✅ Fixed ${nullSchedules.length} schedules - assigned to doctor ${doctors[0].name}`);
      }
    } catch (err) {
      console.warn('⚠️  Could not auto-fix schedules:', err);
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export { io };
