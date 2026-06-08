import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hospital-queue';

console.log('🔍 Debugging Hospital Management System\n');
console.log('MongoDB URI:', MONGODB_URI);
console.log('────────────────────────────────────────\n');

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');
  
  // Check Schedules
  const ScheduleSchema = new mongoose.Schema({}, { strict: false, collection: 'schedules' });
  const Schedule = mongoose.model('Schedule', ScheduleSchema);
  
  const schedules = await Schedule.find({}).lean();
  console.log('📋 SCHEDULES IN DATABASE:', schedules.length);
  if (schedules.length > 0) {
    schedules.forEach((s: any, i: number) => {
      console.log(`\n  ${i + 1}. Schedule ID: ${s._id}`);
      console.log(`     Doctor ID: ${s.doctorId}`);
      console.log(`     Hospital ID: ${s.hospitalId}`);
      console.log(`     Department ID: ${s.departmentId}`);
      console.log(`     Date: ${s.date}`);
      console.log(`     Session: ${s.sessionName}`);
      console.log(`     Time: ${s.startTime} - ${s.endTime}`);
      console.log(`     Status: ${s.status}`);
      console.log(`     Slots: ${s.totalSlots} total, ${s.bookedSlots} booked`);
    });
  } else {
    console.log('  ⚠️  No schedules found in database!\n');
  }
  
  // Check Users (Doctors)
  const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
  const User = mongoose.model('User', UserSchema);
  
  const doctors = await User.find({ role: 'doctor' }).lean();
  console.log('\n👨‍⚕️  DOCTORS IN DATABASE:', doctors.length);
  doctors.forEach((d: any, i: number) => {
    console.log(`\n  ${i + 1}. Doctor ID: ${d._id}`);
    console.log(`     Name: ${d.name}`);
    console.log(`     Email: ${d.email}`);
    console.log(`     Hospital ID: ${d.hospitalId || 'NOT SET'}`);
    console.log(`     Department ID: ${d.departmentId || 'NOT SET'}`);
    console.log(`     Department: ${d.department || 'NOT SET'}`);
  });
  
  // Check Tokens
  const TokenSchema = new mongoose.Schema({}, { strict: false, collection: 'tokens' });
  const Token = mongoose.model('Token', TokenSchema);
  
  const tokens = await Token.find({}).populate('doctorId', 'name').lean();
  console.log('\n🎫 TOKENS IN DATABASE:', tokens.length);
  if (tokens.length > 0) {
    tokens.forEach((t: any, i: number) => {
      console.log(`\n  ${i + 1}. Token: ${t.tokenNumber}`);
      console.log(`     Doctor: ${t.doctorId?.name || t.doctorId}`);
      console.log(`     Patient: ${t.patientId}`);
      console.log(`     Date: ${t.date}`);
      console.log(`     Status: ${t.status}`);
    });
  }
  
  console.log('\n────────────────────────────────────────');
  console.log('✅ Debug complete!\n');
  
  process.exit(0);
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Make sure MongoDB is running on localhost:27017');
  process.exit(1);
});
