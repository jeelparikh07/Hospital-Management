import mongoose from 'mongoose';
import Schedule from '../src/models/Schedule.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hospital-queue';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const schedules = await Schedule.find({}).populate('doctorId', 'name email');
  
  console.log('\n📋 Schedules in database:');
  console.log('Total:', schedules.length);
  
  schedules.forEach((s, i) => {
    console.log(`\n${i + 1}. Schedule ID: ${s._id}`);
    console.log(`   Doctor: ${s.doctorId?.name || s.doctorId}`);
    console.log(`   Date: ${s.date}`);
    console.log(`   Session: ${s.sessionName}`);
    console.log(`   Time: ${s.startTime} - ${s.endTime}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Slots: ${s.totalSlots} total, ${s.bookedSlots} booked`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
