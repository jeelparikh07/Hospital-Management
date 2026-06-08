const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testTokenCreation() {
  try {
    console.log('=== Testing Token Creation for Patient ===\n');

    // Step 1: Login as patient
    console.log('1. Logging in as patient...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'patient@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user._id;
    console.log(`User ID: ${userId}\n`);

    // Step 2: Get hospitals
    console.log('2. Fetching hospitals...');
    const hospitalsResponse = await axios.get(`${API_URL}/hospitals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const hospitals = hospitalsResponse.data.data.hospitals;
    console.log(`✅ Found ${hospitals.length} hospital(s)`);
    
    if (hospitals.length === 0) {
      console.log('❌ No hospitals available. Please seed the database first.');
      return;
    }
    
    const hospitalId = hospitals[0]._id;
    console.log(`Selected Hospital: ${hospitals[0].name}\n`);

    // Step 3: Get departments for the hospital
    console.log('3. Fetching departments...');
    const departmentsResponse = await axios.get(`${API_URL}/departments/hospital/${hospitalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const departments = departmentsResponse.data.data.departments;
    console.log(`✅ Found ${departments.length} department(s)`);
    
    if (departments.length === 0) {
      console.log('❌ No departments available. Please seed the database first.');
      return;
    }
    
    const departmentId = departments[0]._id;
    console.log(`Selected Department: ${departments[0].name}\n`);

    // Step 4: Get doctors for the department
    console.log('4. Fetching doctors...');
    const doctorsResponse = await axios.get(`${API_URL}/users/doctors?hospitalId=${hospitalId}&department=${departmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const doctors = doctorsResponse.data.data.doctors;
    console.log(`✅ Found ${doctors.length} doctor(s)`);
    
    if (doctors.length === 0) {
      console.log('❌ No doctors available. Please seed the database first.');
      return;
    }
    
    const doctorId = doctors[0]._id;
    console.log(`Selected Doctor: Dr. ${doctors[0].name}\n`);

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
    console.log('\nToken Details:');
    console.log(JSON.stringify(tokenResponse.data.data.token, null, 2));

  } catch (error) {
    console.log('\n❌ ERROR:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Message:', error.message);
      console.log('Tip: Make sure the server is running (npm run server)');
    }
  }
}

testTokenCreation();
