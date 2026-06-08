/**
 * Diagnostic script to trace the slot visibility bug
 * Run with: node diagnose-slot-bug.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Schedule from './src/models/Schedule.js';
import User from './src/models/User.js';
import Appointment from './src/models/Appointment.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hospital-queue';

async function diagnose() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check all doctors
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. DOCTORS IN DATABASE');
    console.log('═══════════════════════════════════════════════════════════');
    const doctors = await User.find({ role: 'doctor' }).select('name email hospitalId departmentId specialization');
    console.log(`Found ${doctors.length} doctors:\n`);
    doctors.forEach((doc, i) => {
      console.log(`${i + 1}. Dr. ${doc.name}`);
      console.log(`   Email: ${doc.email}`);
      console.log(`   ID: ${doc._id}`);
      console.log(`   Hospital ID: ${doc.hospitalId || 'NULL'}`);
      console.log(`   Department ID: ${doc.departmentId || 'NULL'}`);
      console.log(`   Specialization: ${doc.specialization || 'N/A'}\n`);
    });

    // 2. Check all schedules
    console.log('═══════════════════════════════════════════════════════════');
    console.log('2. SCHEDULES IN DATABASE');
    console.log('═══════════════════════════════════════════════════════════');
    const schedules = await Schedule.find({}).populate('doctorId', 'name email').populate('hospitalId', 'name').populate('departmentId', 'name');
    console.log(`Found ${schedules.length} schedules:\n`);
    
    schedules.forEach((sched, i) => {
      console.log(`${i + 1}. Schedule ID: ${sched._id}`);
      console.log(`   Doctor: ${sched.doctorId?.name || 'NULL'} (${sched.doctorId?._id || 'NULL'})`);
      console.log(`   Hospital: ${sched.hospitalId?.name || 'NULL'} (${sched.hospitalId?._id || 'NULL'})`);
      console.log(`   Department: ${sched.departmentId?.name || 'NULL'} (${sched.departmentId?._id || 'NULL'})`);
      console.log(`   Date: ${sched.date}`);
      console.log(`   Status: ${sched.status}`);
      console.log(`   Slots: ${sched.slots.length}`);
      sched.slots.forEach((slot, j) => {
        console.log(`     Slot ${j + 1}: ${slot.slotName} | ${slot.startTime}-${slot.endTime} | Max: ${slot.maxPatients} | Booked: ${slot.bookedCount} | Active: ${slot.isActive}`);
      });
      console.log('');
    });

    // 3. Check for potential issues
    console.log('═══════════════════════════════════════════════════════════');
    console.log('3. POTENTIAL ISSUES');
    console.log('═══════════════════════════════════════════════════════════');
    
    let issuesFound = 0;
    
    // Issue 1: Schedules with null doctorId
    const nullDoctorSchedules = schedules.filter(s => !s.doctorId);
    if (nullDoctorSchedules.length > 0) {
      console.log(`⚠️  ISSUE: ${nullDoctorSchedules.length} schedule(s) have NULL doctorId`);
      issuesFound++;
    }
    
    // Issue 2: Schedules with null hospitalId
    const nullHospitalSchedules = schedules.filter(s => !s.hospitalId);
    if (nullHospitalSchedules.length > 0) {
      console.log(`⚠️  ISSUE: ${nullHospitalSchedules.length} schedule(s) have NULL hospitalId`);
      issuesFound++;
    }
    
    // Issue 3: Schedules with null departmentId
    const nullDeptSchedules = schedules.filter(s => !s.departmentId);
    if (nullDeptSchedules.length > 0) {
      console.log(`⚠️  ISSUE: ${nullDeptSchedules.length} schedule(s) have NULL departmentId`);
      issuesFound++;
    }
    
    // Issue 4: Doctors without hospitalId/departmentId
    const doctorsWithoutHospital = doctors.filter(d => !d.hospitalId);
    const doctorsWithoutDept = doctors.filter(d => !d.departmentId);
    if (doctorsWithoutHospital.length > 0) {
      console.log(`⚠️  ISSUE: ${doctorsWithoutHospital.length} doctor(s) have NULL hospitalId`);
      issuesFound++;
    }
    if (doctorsWithoutDept.length > 0) {
      console.log(`⚠️  ISSUE: ${doctorsWithoutDept.length} doctor(s) have NULL departmentId`);
      issuesFound++;
    }
    
    // Issue 5: Schedules with invalid ObjectId references
    for (const sched of schedules) {
      if (sched.hospitalId && !doctors.some(d => d.hospitalId?.toString() === sched.hospitalId._id.toString())) {
        // This is okay - hospital exists but no doctor has it
      }
    }
    
    if (issuesFound === 0) {
      console.log('✅ No obvious data integrity issues found');
    }
    
    // 4. Test query simulation
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('4. QUERY SIMULATION (Patient fetching slots)');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (doctors.length > 0) {
      const testDoctor = doctors[0];
      console.log(`\nSimulating patient query for Dr. ${testDoctor.name} (${testDoctor._id})`);
      
      // Query 1: Using getAll route simulation
      const query1 = { doctorId: testDoctor._id };
      const result1 = await Schedule.find(query1).populate('doctorId', 'name');
      console.log(`Query { doctorId: ObjectId } returned: ${result1.length} schedules`);
      
      // Query 2: Using string doctorId (might be what frontend sends)
      const query2 = { doctorId: testDoctor._id.toString() };
      const result2 = await Schedule.find(query2).populate('doctorId', 'name');
      console.log(`Query { doctorId: "${testDoctor._id}" } (string) returned: ${result2.length} schedules`);
      
      // Query 3: Check if there's a type mismatch
      const allSchedIds = schedules.map(s => s.doctorId?.toString()).filter(Boolean);
      const doctorIdMatch = allSchedIds.some(id => id === testDoctor._id.toString());
      console.log(`Doctor ID match in schedules: ${doctorIdMatch ? 'YES ✓' : 'NO ✗'}`);
    }
    
    // 5. Check appointments
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('5. APPOINTMENTS (Bookings)');
    console.log('═══════════════════════════════════════════════════════════');
    const appointments = await Appointment.find({}).populate('patientId', 'name').populate('doctorId', 'name').limit(10);
    console.log(`Found ${appointments.length} appointments (showing up to 10):\n`);
    appointments.forEach((appt, i) => {
      console.log(`${i + 1}. Token #${appt.tokenNumber} - ${appt.patientId?.name || 'Unknown'} with Dr. ${appt.doctorId?.name || 'Unknown'}`);
      console.log(`   Date: ${appt.appointmentDate}`);
      console.log(`   Slot: ${appt.slotName} (${appt.slotTime})`);
      console.log(`   Status: ${appt.status}`);
      console.log(`   Schedule ID: ${appt.scheduleId}`);
      console.log(`   Slot Index: ${appt.slotIndex}\n`);
    });
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('DIAGNOSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

diagnose();
