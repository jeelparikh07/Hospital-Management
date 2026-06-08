const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function debugTokenBooking() {
  let token;
  let userId;

  try {
    console.log('=== DEBUG: Token Booking Flow ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in as patient...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'patient@example.com',
        password: 'password123'
      });
      console.log('✅ Login successful');
      token = loginResponse.data.data.token;
      userId = loginResponse.data.data.user._id;
      console.log(`   User ID: ${userId}\n`);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      console.log('   Tip: Run "npm run seed" to create test users\n');
      return;
    }

    // Step 2: Get hospitals
    console.log('Step 2: Fetching hospitals...');
    try {
      const hospitalsResponse = await axios.get(`${API_URL}/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const hospitals = hospitalsResponse.data.data.hospitals;
      console.log(`✅ Found ${hospitals.length} hospital(s)`);
      if (hospitals.length === 0) {
        console.log('   ❌ No hospitals - run "npm run seed"\n');
        return;
      }
      const hospitalId = hospitals[0]._id;
      console.log(`   Selected: ${hospitals[0].name} (${hospitalId})\n`);
    } catch (error) {
      console.log('❌ Failed to fetch hospitals:', error.response?.data?.message);
      return;
    }

    // Step 3: Get departments
    console.log('Step 3: Fetching departments...');
    try {
      const deptsResponse = await axios.get(`${API_URL}/departments/hospital/${hospitalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const departments = deptsResponse.data.data.departments;
      console.log(`✅ Found ${departments.length} department(s)`);
      if (departments.length === 0) {
        console.log('   ❌ No departments - run "npm run seed"\n');
        return;
      }
      const departmentId = departments[0]._id;
      console.log(`   Selected: ${departments[0].name} (${departmentId})\n`);
    } catch (error) {
      console.log('❌ Failed to fetch departments:', error.response?.data?.message);
      return;
    }

    // Step 4: Get doctors
    console.log('Step 4: Fetching doctors...');
    try {
      const doctorsResponse = await axios.get(`${API_URL}/users/doctors?hospitalId=${hospitalId}&department=${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const doctors = doctorsResponse.data.data.doctors;
      console.log(`✅ Found ${doctors.length} doctor(s)`);
      if (doctors.length === 0) {
        console.log('   ❌ No doctors found!');
        console.log('   This means the departmentId is not matching.');
        console.log('   Run "npm run seed" to fix doctor-department links\n');
        return;
      }
      const doctorId = doctors[0]._id;
      console.log(`   Selected: Dr. ${doctors[0].name} (${doctorId})`);
      console.log(`   Doctor's departmentId: ${doctors[0].departmentId?._id || doctors[0].departmentId}\n`);
    } catch (error) {
      console.log('❌ Failed to fetch doctors:', error.response?.data?.message);
      return;
    }

    // Step 5: Book token
    console.log('Step 5: Booking token...');
    console.log('   Request:', {
      hospitalId,
      departmentId,
      doctorId,
      type: 'online'
    });
    
    try {
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
      console.log(`   Hospital: ${bookedToken.hospitalId?.name}`);
      console.log(`   Department: ${bookedToken.departmentId?.name}`);
      console.log(`   Doctor: ${bookedToken.doctorId?.name}`);
      
    } catch (error) {
      console.log('❌ Token booking FAILED!');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}`);
        if (error.response.data.errors) {
          console.log('   Validation Errors:', error.response.data.errors);
        }
        console.log('   Full response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`   Error: ${error.message}`);
        console.log('   Tip: Server might not be running');
      }
    }

  } catch (error) {
    console.log('\n❌ UNEXPECTED ERROR:', error.message);
  }
}

debugTokenBooking();
