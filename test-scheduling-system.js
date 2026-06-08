/**
 * Automated Test Suite for Doctor Scheduling System
 * Tests the full flow: Doctor creates schedule → Patient sees slots → Patient books → Doctor sees patient
 * 
 * Run with: node test-scheduling-system.js
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

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

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

// Helper to make HTTP requests
function httpRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   DOCTOR SCHEDULING SYSTEM - AUTOMATED TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clean up any existing test data
    console.log('🧹 Cleaning up test data...');
    await Appointment.deleteMany({ email: { $regex: 'test-' } });
    await Schedule.deleteMany({ email: { $regex: 'test-' } });
    await User.deleteMany({ email: { $regex: 'test-' } });
    console.log('✅ Test data cleaned\n');

    // Create test hospital
    console.log('📋 Creating test hospital...');
    let hospital = await Hospital.findOne({ name: 'Test Hospital' });
    if (!hospital) {
      hospital = await Hospital.create({
        name: 'Test Hospital',
        address: '123 Test Street',
        city: 'Test City'
      });
    }
    console.log(`✅ Hospital: ${hospital.name} (${hospital._id})\n`);

    // Create test department
    console.log('📋 Creating test department...');
    let department = await Department.findOne({ name: 'Test Department' });
    if (!department) {
      department = await Department.create({
        name: 'Test Department',
        description: 'Test Department for scheduling',
        color: '#3B82F6'
      });
    }
    console.log(`✅ Department: ${department.name} (${department._id})\n`);

    // Create test doctor
    console.log('📋 Creating test doctor...');
    let testDoctor = await User.findOne({ email: 'test-doctor@example.com' });
    if (!testDoctor) {
      testDoctor = await User.create({
        name: 'Dr. Test Doctor',
        email: 'test-doctor@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'doctor',
        hospitalId: hospital._id,
        departmentId: department._id,
        specialization: 'General Medicine',
        consultationDuration: 15
      });
    } else {
      // Ensure doctor has hospital and department
      testDoctor.hospitalId = hospital._id;
      testDoctor.departmentId = department._id;
      await testDoctor.save();
    }
    console.log(`✅ Doctor: ${testDoctor.name} (${testDoctor._id})\n`);

    // Create test patient
    console.log('📋 Creating test patient...');
    let testPatient = await User.findOne({ email: 'test-patient@example.com' });
    if (!testPatient) {
      testPatient = await User.create({
        name: 'Test Patient',
        email: 'test-patient@example.com',
        password: 'password123',
        phone: '0987654321',
        role: 'patient'
      });
    }
    console.log(`✅ Patient: ${testPatient.name} (${testPatient._id})\n`);

    // Login as doctor to get token
    console.log('🔑 Getting doctor auth token...');
    const doctorLoginRes = await httpRequest('POST', '/auth/login', {
      email: 'test-doctor@example.com',
      password: 'password123'
    });
    
    if (doctorLoginRes.status !== 200 || !doctorLoginRes.data.token) {
      logTest('Doctor Login', false, `Status: ${doctorLoginRes.status}`);
      return;
    }
    const doctorToken = doctorLoginRes.data.token;
    console.log(`✅ Doctor token obtained\n`);
    logTest('Doctor Login', true);

    // TEST 1: DATABASE SAVE TEST - Create a schedule
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 1: DATABASE SAVE TEST');
    console.log('───────────────────────────────────────────────────────────');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`Creating schedule for date: ${dateStr}`);
    
    const createScheduleRes = await httpRequest('POST', '/schedules', {
      hospitalId: hospital._id.toString(),
      departmentId: department._id.toString(),
      date: dateStr,
      slots: [
        { slotName: 'Morning', startTime: '09:00', endTime: '12:00', maxPatients: 10 },
        { slotName: 'Evening', startTime: '17:00', endTime: '20:00', maxPatients: 8 }
      ]
    }, doctorToken);

    if (createScheduleRes.status === 201 || createScheduleRes.status === 200) {
      const schedule = createScheduleRes.data.data?.schedule;
      if (schedule && schedule.slots && schedule.slots.length >= 2) {
        logTest('DATABASE SAVE TEST', true, `Created schedule with ${schedule.slots.length} slots`);
        console.log(`✅ Schedule created: ${schedule._id}`);
        console.log(`   Slots: ${schedule.slots.map(s => s.slotName).join(', ')}`);
      } else {
        logTest('DATABASE SAVE TEST', false, 'Schedule created but slots missing');
      }
    } else {
      logTest('DATABASE SAVE TEST', false, `Status: ${createScheduleRes.status}, Message: ${createScheduleRes.data?.message}`);
    }

    // TEST 2: PATIENT FETCH TEST - Fetch slots as patient
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 2: PATIENT FETCH TEST');
    console.log('───────────────────────────────────────────────────────────');

    // Login as patient
    const patientLoginRes = await httpRequest('POST', '/auth/login', {
      email: 'test-patient@example.com',
      password: 'password123'
    });
    
    if (patientLoginRes.status !== 200 || !patientLoginRes.data.token) {
      logTest('Patient Login', false, `Status: ${patientLoginRes.status}`);
      return;
    }
    const patientToken = patientLoginRes.data.token;
    console.log('✅ Patient token obtained\n');

    // Fetch schedules for the doctor
    const fetchSchedulesRes = await httpRequest(
      'GET', 
      `/schedules/doctor/${testDoctor._id}`,
      null,
      patientToken
    );

    if (fetchSchedulesRes.status === 200 && fetchSchedulesRes.data.data?.schedules?.length > 0) {
      const schedules = fetchSchedulesRes.data.data.schedules;
      const foundSchedule = schedules.find(s => {
        const sDate = new Date(s.date).toISOString().split('T')[0];
        return sDate === dateStr;
      });

      if (foundSchedule && foundSchedule.slots.length >= 2) {
        logTest('PATIENT FETCH TEST', true, `Found ${foundSchedule.slots.length} slots for ${dateStr}`);
        console.log(`✅ Slots fetched successfully:`);
        foundSchedule.slots.forEach(slot => {
          console.log(`   - ${slot.slotName}: ${slot.startTime}-${slot.endTime} (${slot.availableSlots} available)`);
        });
      } else {
        logTest('PATIENT FETCH TEST', false, 'Schedule found but slots missing or incorrect');
      }
    } else {
      logTest('PATIENT FETCH TEST', false, `Status: ${fetchSchedulesRes.status}`);
    }

    // TEST 3: AVAILABILITY TEST - Check slot availability
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 3: AVAILABILITY TEST');
    console.log('───────────────────────────────────────────────────────────');

    const scheduleForTest = await Schedule.findOne({
      doctorId: testDoctor._id,
      date: new Date(dateStr)
    });

    if (scheduleForTest) {
      const morningSlot = scheduleForTest.slots.find(s => s.slotName === 'Morning');
      const eveningSlot = scheduleForTest.slots.find(s => s.slotName === 'Evening');

      if (morningSlot && eveningSlot) {
        const morningAvailable = morningSlot.maxPatients - morningSlot.bookedCount;
        const eveningAvailable = eveningSlot.maxPatients - eveningSlot.bookedCount;

        if (morningAvailable === 10 && eveningAvailable === 8) {
          logTest('AVAILABILITY TEST', true, `Morning: ${morningAvailable}/10, Evening: ${eveningAvailable}/8 available`);
          console.log(`✅ Availability correct:`);
          console.log(`   Morning: ${morningAvailable} slots available (max: ${morningSlot.maxPatients})`);
          console.log(`   Evening: ${eveningAvailable} slots available (max: ${eveningSlot.maxPatients})`);
        } else {
          logTest('AVAILABILITY TEST', false, `Unexpected availability: Morning ${morningAvailable}, Evening ${eveningAvailable}`);
        }
      } else {
        logTest('AVAILABILITY TEST', false, 'Slots not found in database');
      }
    } else {
      logTest('AVAILABILITY TEST', false, 'Schedule not found in database');
    }

    // TEST 4: BOOKING TEST - Book an appointment
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 4: BOOKING TEST');
    console.log('───────────────────────────────────────────────────────────');

    const scheduleToBook = await Schedule.findOne({
      doctorId: testDoctor._id,
      date: new Date(dateStr)
    });

    if (scheduleToBook) {
      const morningSlotIndex = scheduleToBook.slots.findIndex(s => s.slotName === 'Morning');
      
      const bookingRes = await httpRequest('POST', '/appointments/book', {
        doctorId: testDoctor._id.toString(),
        hospitalId: hospital._id.toString(),
        departmentId: department._id.toString(),
        scheduleId: scheduleToBook._id.toString(),
        slotIndex: morningSlotIndex,
        appointmentDate: dateStr,
        notes: 'Test appointment'
      }, patientToken);

      if (bookingRes.status === 201 && bookingRes.data.data?.appointment) {
        const appointment = bookingRes.data.data.appointment;
        
        // Verify bookedCount was incremented
        const updatedSchedule = await Schedule.findById(scheduleToBook._id);
        const updatedSlot = updatedSchedule.slots[morningSlotIndex];
        
        if (updatedSlot.bookedCount === 1) {
          logTest('BOOKING TEST', true, `Booked token #${appointment.tokenNumber}, bookedCount incremented to 1`);
          console.log(`✅ Appointment booked successfully:`);
          console.log(`   Token Number: ${appointment.tokenNumber}`);
          console.log(`   Slot: ${appointment.slotName} (${appointment.slotTime})`);
          console.log(`   Booked Count: ${updatedSlot.bookedCount}/${updatedSlot.maxPatients}`);
          if (bookingRes.data.data.isToday) {
            console.log(`   Token created for today's queue: Yes`);
          }
        } else {
          logTest('BOOKING TEST', false, `BookedCount not incremented (expected 1, got ${updatedSlot.bookedCount})`);
        }
      } else {
        logTest('BOOKING TEST', false, `Status: ${bookingRes.status}, Message: ${bookingRes.data?.message}`);
      }
    } else {
      logTest('BOOKING TEST', false, 'Schedule not found for booking');
    }

    // TEST 5: END TO END FLOW TEST
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('TEST 5: END TO END FLOW TEST');
    console.log('───────────────────────────────────────────────────────────');

    // 1. Doctor creates another schedule for a different date
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDateStr = nextDay.toISOString().split('T')[0];

    const newScheduleRes = await httpRequest('POST', '/schedules', {
      hospitalId: hospital._id.toString(),
      departmentId: department._id.toString(),
      date: nextDateStr,
      slots: [
        { slotName: 'Afternoon', startTime: '14:00', endTime: '17:00', maxPatients: 5 }
      ]
    }, doctorToken);

    if (newScheduleRes.status !== 201 && newScheduleRes.status !== 200) {
      logTest('END TO END FLOW TEST', false, 'Failed to create schedule for E2E test');
    } else {
      // 2. Patient fetches and books
      const fetchRes = await httpRequest(
        'GET',
        `/schedules/doctor/${testDoctor._id}`,
        null,
        patientToken
      );

      if (fetchRes.status !== 200) {
        logTest('END TO END FLOW TEST', false, 'Failed to fetch schedules for E2E test');
      } else {
        const schedules = fetchRes.data.data.schedules;
        const e2eSchedule = schedules.find(s => {
          const sDate = new Date(s.date).toISOString().split('T')[0];
          return sDate === nextDateStr;
        });

        if (!e2eSchedule) {
          logTest('END TO END FLOW TEST', false, 'Schedule not found for E2E test');
        } else {
          // 3. Book the slot
          const e2eBookingRes = await httpRequest('POST', '/appointments/book', {
            doctorId: testDoctor._id.toString(),
            hospitalId: hospital._id.toString(),
            departmentId: department._id.toString(),
            scheduleId: e2eSchedule._id,
            slotIndex: 0,
            appointmentDate: nextDateStr,
            notes: 'E2E test appointment'
          }, patientToken);

          if (e2eBookingRes.status !== 201) {
            logTest('END TO END FLOW TEST', false, `Failed to book: ${e2eBookingRes.data?.message}`);
          } else {
            // 4. Doctor sees patient in queue (fetch appointments)
            const doctorApptRes = await httpRequest(
              'GET',
              `/appointments/doctor/${testDoctor._id}?type=today`,
              null,
              doctorToken
            );

            // Note: For future dates, we check all appointments
            const allApptRes = await httpRequest(
              'GET',
              `/appointments/doctor/${testDoctor._id}?type=all`,
              null,
              doctorToken
            );

            if (allApptRes.status === 200 && allApptRes.data.data?.appointments?.length > 0) {
              const e2eAppointment = allApptRes.data.data.appointments.find(
                a => a.patientId?._id === testPatient._id.toString() && 
                     new Date(a.appointmentDate).toISOString().split('T')[0] === nextDateStr
              );

              if (e2eAppointment) {
                logTest('END TO END FLOW TEST', true, 'Full flow completed: Create → Fetch → Book → Doctor sees patient');
                console.log(`✅ End to end flow successful:`);
                console.log(`   1. Doctor created schedule for ${nextDateStr}`);
                console.log(`   2. Patient fetched available slots`);
                console.log(`   3. Patient booked appointment (Token #${e2eAppointment.tokenNumber})`);
                console.log(`   4. Doctor can see patient in appointments list`);
              } else {
                logTest('END TO END FLOW TEST', false, 'Doctor cannot see patient appointment');
              }
            } else {
              logTest('END TO END FLOW TEST', false, 'Failed to fetch doctor appointments');
            }
          }
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
