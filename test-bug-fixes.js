/**
 * Test Suite for Bug Fixes:
 * BUG 1: MongoDB Transaction Error
 * BUG 2: Date Offset / Wrong Slot Showing
 * 
 * Run with: node test-bug-fixes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import Schedule from './src/models/Schedule.js';
import User from './src/models/User.js';
import Appointment from './src/models/Appointment.js';
import Hospital from './src/models/Hospital.js';
import Department from './src/models/Department.js';

dotenv.config();

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hospital-queue';

const testResults = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   Details: ${details}`);
  }
}

function httpRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   BUG FIX VERIFICATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await Appointment.deleteMany({ email: { $regex: 'test-bug' } });
    await Schedule.deleteMany({ email: { $regex: 'test-bug' } });
    await User.deleteMany({ email: { $regex: 'test-bug' } });
    console.log('✅ Test data cleaned\n');

    // Create test data
    console.log('📋 Creating test hospital...');
    let hospital = await Hospital.findOne({ name: 'Test Bug Hospital' });
    if (!hospital) {
      hospital = await Hospital.create({
        name: 'Test Bug Hospital',
        address: '123 Test Street',
        city: 'Test City'
      });
    }

    console.log('📋 Creating test department...');
    let department = await Department.findOne({ name: 'Test Bug Department' });
    if (!department) {
      department = await Department.create({
        name: 'Test Bug Department',
        description: 'Test Department for bug fixes',
        color: '#3B82F6'
      });
    }

    console.log('📋 Creating test doctor...');
    let testDoctor = await User.findOne({ email: 'test-bug-doctor@example.com' });
    if (!testDoctor) {
      testDoctor = await User.create({
        name: 'Dr. Test Bug Doctor',
        email: 'test-bug-doctor@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'doctor',
        hospitalId: hospital._id,
        departmentId: department._id,
        specialization: 'General Medicine',
        consultationDuration: 15
      });
    } else {
      testDoctor.hospitalId = hospital._id;
      testDoctor.departmentId = department._id;
      await testDoctor.save();
    }

    console.log('📋 Creating test patient...');
    let testPatient = await User.findOne({ email: 'test-bug-patient@example.com' });
    if (!testPatient) {
      testPatient = await User.create({
        name: 'Test Bug Patient',
        email: 'test-bug-patient@example.com',
        password: 'password123',
        phone: '0987654321',
        role: 'patient'
      });
    }
    console.log('✅ Test data created\n');

    // Login as doctor
    console.log('🔑 Getting doctor auth token...');
    const doctorLoginRes = await httpRequest('POST', '/auth/login', {
      email: 'test-bug-doctor@example.com',
      password: 'password123'
    });
    
    if (doctorLoginRes.status !== 200 || !doctorLoginRes.data.token) {
      logTest('Doctor Login', false, `Status: ${doctorLoginRes.status}`);
      return;
    }
    const doctorToken = doctorLoginRes.data.token;
    console.log('✅ Doctor token obtained\n');

    // Login as patient
    console.log('🔑 Getting patient auth token...');
    const patientLoginRes = await httpRequest('POST', '/auth/login', {
      email: 'test-bug-patient@example.com',
      password: 'password123'
    });
    
    if (patientLoginRes.status !== 200 || !patientLoginRes.data.token) {
      logTest('Patient Login', false, `Status: ${patientLoginRes.status}`);
      return;
    }
    const patientToken = patientLoginRes.data.token;
    console.log('✅ Patient token obtained\n');

    // Get today's date as string
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.getFullYear() + '-' + 
                        String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(tomorrow.getDate()).padStart(2, '0');

    // TEST 1: Transaction Error Gone
    console.log('───────────────────────────────────────────────────────────');
    console.log('TEST 1: TRANSACTION ERROR GONE');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`Creating schedule for ${todayStr}...`);
    
    const createScheduleRes = await httpRequest('POST', '/schedules', {
      hospitalId: hospital._id.toString(),
      departmentId: department._id.toString(),
      date: todayStr,
      slots: [
        { slotName: 'Morning', startTime: '09:00', endTime: '12:00', maxPatients: 10 }
      ]
    }, doctorToken);

    if (createScheduleRes.status === 201 || createScheduleRes.status === 200) {
      if (createScheduleRes.data.success) {
        logTest('TEST 1: Transaction Error Gone', true, 'Schedule created without transaction error');
        console.log('✅ No "Transaction numbers" error in response');
      } else {
        logTest('TEST 1: Transaction Error Gone', false, createScheduleRes.data.message);
      }
    } else {
      logTest('TEST 1: Transaction Error Gone', false, `Status: ${createScheduleRes.status}, Message: ${createScheduleRes.data?.message}`);
    }

    // TEST 2: Date Save Accuracy
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 2: DATE SAVE ACCURACY');
    console.log('───────────────────────────────────────────────────────────');
    
    const savedSchedule = await Schedule.findOne({
      doctorId: testDoctor._id,
      date: todayStr
    });

    if (savedSchedule) {
      console.log(`Saved date in DB: "${savedSchedule.date}"`);
      console.log(`Expected date:    "${todayStr}"`);
      
      if (savedSchedule.date === todayStr) {
        logTest('TEST 2: Date Save Accuracy', true, `Date saved correctly as "${todayStr}"`);
      } else {
        logTest('TEST 2: Date Save Accuracy', false, `Date mismatch: saved "${savedSchedule.date}", expected "${todayStr}"`);
      }
    } else {
      logTest('TEST 2: Date Save Accuracy', false, 'Schedule not found in database');
    }

    // TEST 3: Patient Sees Correct Date Slot
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 3: PATIENT SEES CORRECT DATE SLOT');
    console.log('───────────────────────────────────────────────────────────');
    
    const fetchSchedulesRes = await httpRequest(
      'GET',
      `/schedules/doctor/${testDoctor._id}`,
      null,
      patientToken
    );

    if (fetchSchedulesRes.status === 200 && fetchSchedulesRes.data.data?.schedules) {
      const schedules = fetchSchedulesRes.data.data.schedules;
      const foundSchedule = schedules.find(s => s.date === todayStr);
      
      if (foundSchedule) {
        logTest('TEST 3: Patient Sees Correct Date Slot', true, `Found schedule for ${todayStr}`);
        console.log(`✅ Patient sees slot for ${todayStr}`);
      } else {
        logTest('TEST 3: Patient Sees Correct Date Slot', false, `No schedule found for ${todayStr}`);
      }
    } else {
      logTest('TEST 3: Patient Sees Correct Date Slot', false, `Status: ${fetchSchedulesRes.status}`);
    }

    // TEST 4: No Day Offset
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 4: NO DAY OFFSET');
    console.log('───────────────────────────────────────────────────────────');
    
    console.log(`Creating schedule for TOMORROW: ${tomorrowStr}...`);
    const tomorrowScheduleRes = await httpRequest('POST', '/schedules', {
      hospitalId: hospital._id.toString(),
      departmentId: department._id.toString(),
      date: tomorrowStr,
      slots: [
        { slotName: 'Afternoon', startTime: '14:00', endTime: '17:00', maxPatients: 5 }
      ]
    }, doctorToken);

    if (tomorrowScheduleRes.status === 201 || tomorrowScheduleRes.status === 200) {
      // Check patient sees it for tomorrow, not today
      const fetchRes = await httpRequest(
        'GET',
        `/schedules/doctor/${testDoctor._id}?date=${tomorrowStr}`,
        null,
        patientToken
      );

      if (fetchRes.status === 200 && fetchRes.data.data?.schedules?.length > 0) {
        const tomorrowSchedules = fetchRes.data.data.schedules;
        const hasCorrectDate = tomorrowSchedules.every(s => s.date === tomorrowStr);
        
        if (hasCorrectDate) {
          logTest('TEST 4: No Day Offset', true, 'Tomorrow slot shows on tomorrow, not today');
          console.log(`✅ Schedule for ${tomorrowStr} correctly stored and retrieved`);
        } else {
          logTest('TEST 4: No Day Offset', false, 'Date mismatch in retrieved schedules');
        }
      } else {
        logTest('TEST 4: No Day Offset', false, 'Could not fetch tomorrow schedule');
      }
    } else {
      logTest('TEST 4: No Day Offset', false, `Failed to create tomorrow schedule: ${tomorrowScheduleRes.data?.message}`);
    }

    // TEST 5: Atomic Booking (No Overbooking)
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 5: ATOMIC BOOKING (NO OVERBOOKING)');
    console.log('───────────────────────────────────────────────────────────');
    
    // Create a slot with maxPatients: 1
    const singleSlotDate = new Date();
    singleSlotDate.setDate(singleSlotDate.getDate() + 2);
    const singleSlotDateStr = singleSlotDate.getFullYear() + '-' + 
                              String(singleSlotDate.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(singleSlotDate.getDate()).padStart(2, '0');

    console.log(`Creating single-patient slot for ${singleSlotDateStr}...`);
    const singleSlotRes = await httpRequest('POST', '/schedules', {
      hospitalId: hospital._id.toString(),
      departmentId: department._id.toString(),
      date: singleSlotDateStr,
      slots: [
        { slotName: 'Limited', startTime: '10:00', endTime: '11:00', maxPatients: 1 }
      ]
    }, doctorToken);

    if (singleSlotRes.status === 201 || singleSlotRes.status === 200) {
      const createdSchedule = singleSlotRes.data.data.schedule;
      
      // First booking - should succeed
      console.log('Attempting first booking...');
      const firstBookingRes = await httpRequest('POST', '/appointments/book', {
        doctorId: testDoctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: department._id.toString(),
        scheduleId: createdSchedule._id,
        slotIndex: 0,
        appointmentDate: singleSlotDateStr,
        notes: 'First booking test'
      }, patientToken);

      if (firstBookingRes.status === 201) {
        console.log('✅ First booking succeeded');
        
        // Create another patient for second booking
        let testPatient2 = await User.findOne({ email: 'test-bug-patient2@example.com' });
        if (!testPatient2) {
          testPatient2 = await User.create({
            name: 'Test Bug Patient 2',
            email: 'test-bug-patient2@example.com',
            password: 'password123',
            phone: '1111111111',
            role: 'patient'
          });
        }

        const patient2LoginRes = await httpRequest('POST', '/auth/login', {
          email: 'test-bug-patient2@example.com',
          password: 'password123'
        });
        const patient2Token = patient2LoginRes.data.token;

        // Second booking - should fail (slot full)
        console.log('Attempting second booking (should fail)...');
        const secondBookingRes = await httpRequest('POST', '/appointments/book', {
          doctorId: testDoctor._id.toString(),
          hospitalId: hospital._id.toString(),
          departmentId: department._id.toString(),
          scheduleId: createdSchedule._id,
          slotIndex: 0,
          appointmentDate: singleSlotDateStr,
          notes: 'Second booking test'
        }, patient2Token);

        if (secondBookingRes.status === 400 && secondBookingRes.data.message?.includes('full')) {
          logTest('TEST 5: Atomic Booking', true, 'Second booking correctly rejected - slot is full');
          console.log('✅ Overbooking prevented');
        } else if (secondBookingRes.status === 201) {
          logTest('TEST 5: Atomic Booking', false, 'Second booking succeeded - OVERBOOKING OCCURRED!');
        } else {
          logTest('TEST 5: Atomic Booking', false, `Unexpected response: ${secondBookingRes.status} - ${secondBookingRes.data?.message}`);
        }
      } else {
        logTest('TEST 5: Atomic Booking', false, `First booking failed: ${firstBookingRes.data?.message}`);
      }
    } else {
      logTest('TEST 5: Atomic Booking', false, `Failed to create single slot: ${singleSlotRes.data?.message}`);
    }

    // TEST 6: Full End to End
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 6: FULL END TO END');
    console.log('───────────────────────────────────────────────────────────');
    
    const e2eDateStr = todayStr; // Use today for E2E test
    
    // 1. Doctor creates slot
    console.log('1. Doctor creates Morning slot for today...');
    const e2eCreateRes = await httpRequest('POST', '/schedules', {
      hospitalId: hospital._id.toString(),
      departmentId: department._id.toString(),
      date: e2eDateStr,
      slots: [
        { slotName: 'E2E Morning', startTime: '08:00', endTime: '10:00', maxPatients: 5 }
      ]
    }, doctorToken);

    if (e2eCreateRes.status !== 201 && e2eCreateRes.status !== 200) {
      logTest('TEST 6: Full End to End', false, 'Failed to create E2E schedule');
    } else {
      const e2eSchedule = e2eCreateRes.data.data.schedule;
      console.log('   ✅ Schedule created');

      // 2. Patient books
      console.log('2. Patient books the slot...');
      const e2eBookRes = await httpRequest('POST', '/appointments/book', {
        doctorId: testDoctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: department._id.toString(),
        scheduleId: e2eSchedule._id,
        slotIndex: 0,
        appointmentDate: e2eDateStr,
        notes: 'E2E test booking'
      }, patientToken);

      if (e2eBookRes.status !== 201) {
        logTest('TEST 6: Full End to End', false, `Patient booking failed: ${e2eBookRes.data?.message}`);
      } else {
        const e2eAppointment = e2eBookRes.data.data.appointment;
        console.log('   ✅ Patient booked, token #' + e2eAppointment.tokenNumber);

        // 3. Check bookedCount
        const updatedSchedule = await Schedule.findById(e2eSchedule._id);
        const slot = updatedSchedule.slots[0];
        
        if (slot.bookedCount === 1) {
          console.log('   ✅ bookedCount = 1');
        } else {
          console.log('   ⚠️ bookedCount = ' + slot.bookedCount + ' (expected 1)');
        }

        // 4. Doctor sees patient in appointments
        console.log('3. Doctor fetches appointments...');
        const e2eDoctorApptRes = await httpRequest(
          'GET',
          `/appointments/doctor/${testDoctor._id}?type=today`,
          null,
          doctorToken
        );

        if (e2eDoctorApptRes.status === 200 && e2eDoctorApptRes.data.data?.appointments?.length > 0) {
          const patientAppt = e2eDoctorApptRes.data.data.appointments.find(
            a => a.patientId?._id === testPatient._id.toString()
          );

          if (patientAppt) {
            logTest('TEST 6: Full End to End', true, 'Full flow completed successfully');
            console.log('   ✅ Doctor sees patient in appointments list');
            console.log(`   ✅ bookedCount: ${slot.bookedCount}, slots remaining: ${slot.maxPatients - slot.bookedCount}`);
          } else {
            logTest('TEST 6: Full End to End', false, 'Doctor cannot see patient appointment');
          }
        } else {
          logTest('TEST 6: Full End to End', false, 'Failed to fetch doctor appointments');
        }
      }
    }

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log('');
    
    testResults.tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    if (testResults.failed === 0) {
      console.log('   ALL TESTS PASSED! 🎉');
      console.log('   Both bugs are FIXED!');
    } else {
      console.log('   SOME TESTS FAILED - Please review the details above');
    }
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

runTests();
