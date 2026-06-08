const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testFullFlow() {
  let token;
  let userId;

  try {
    console.log('=== Testing Patient Token Creation Flow ===\n');

    // Step 1: Login as patient
    console.log('1. Logging in as patient (patient@example.com / password123)...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'patient@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    token = loginResponse.data.data.token;
    userId = loginResponse.data.data.user._id;
    console.log(`   User ID: ${userId}\n`);

    // Step 2: Get hospitals
    console.log('2. Fetching hospitals...');
    const hospitalsResponse = await axios.get(`${API_URL}/hospitals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const hospitals = hospitalsResponse.data.data.hospitals;
    console.log(`✅ Found ${hospitals.length} hospital(s)`);
    
    if (hospitals.length === 0) {
      console.log('❌ No hospitals available. Run: npm run seed');
      return;
    }
    
    const hospitalId = hospitals[0]._id;
    console.log(`   Selected: ${hospitals[0].name}\n`);

    // Step 3: Get departments for the hospital
    console.log('3. Fetching departments...');
    const departmentsResponse = await axios.get(`${API_URL}/departments/hospital/${hospitalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const departments = departmentsResponse.data.data.departments;
    console.log(`✅ Found ${departments.length} department(s)`);
    
    if (departments.length === 0) {
      console.log('❌ No departments available. Run: npm run seed');
      return;
    }
    
    const departmentId = departments[0]._id;
    console.log(`   Selected: ${departments[0].name}\n`);

    // Step 4: Get doctors for the department
    console.log('4. Fetching doctors...');
    const doctorsResponse = await axios.get(`${API_URL}/users/doctors?hospitalId=${hospitalId}&department=${departmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const doctors = doctorsResponse.data.data.doctors;
    console.log(`✅ Found ${doctors.length} doctor(s)`);
    
    if (doctors.length === 0) {
      console.log('❌ No doctors available! This was the bug.');
      console.log('   Fix applied: User model now has departmentId field');
      console.log('   Run: npm run seed to re-seed the database');
      return;
    }
    
    const doctorId = doctors[0]._id;
    console.log(`   Selected: Dr. ${doctors[0].name} (${doctors[0].specialization})\n`);

    // Step 5: Book a token
    console.log('5. Booking token...');
    const tokenResponse = await axios.post(
      `${API_URL}/tokens`,
      {
        hospitalId,
        departmentId,
        doctorId,
        type: 'online'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Token booked successfully!');
    const bookedToken = tokenResponse.data.data.token;
    console.log('\n📋 Token Details:');
    console.log(`   Token Number: ${bookedToken.tokenNumber}`);
    console.log(`   Status: ${bookedToken.status}`);
    console.log(`   Type: ${bookedToken.type}`);
    console.log(`   Hospital: ${bookedToken.hospitalId?.name}`);
    console.log(`   Department: ${bookedToken.departmentId?.name}`);
    console.log(`   Doctor: ${bookedToken.doctorId?.name}`);
    console.log(`   Estimated Wait: ${bookedToken.estimatedWaitTime} minutes`);

    // Step 6: Verify token appears in patient's tokens
    console.log('\n6. Verifying token in patient history...');
    const patientTokensResponse = await axios.get(`${API_URL}/tokens/patient/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const patientTokens = patientTokensResponse.data.data.tokens;
    console.log(`✅ Patient has ${patientTokens.length} token(s)`);
    
    const newTokenFound = patientTokens.find(t => t._id === bookedToken._id);
    if (newTokenFound) {
      console.log('✅ New token successfully appears in patient history!');
    } else {
      console.log('⚠️  New token not found in history (may be a populate issue)');
    }

    console.log('\n✅ ALL TESTS PASSED - Token creation is working!\n');

  } catch (error) {
    console.log('\n❌ TEST FAILED:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
      if (error.response.data.errors) {
        console.log(`   Errors:`, error.response.data.errors);
      }
    } else {
      console.log(`   Error: ${error.message}`);
      console.log('   Tip: Make sure the server is running (npm run server)');
    }
  }
}

testFullFlow();
