const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testDoctorTokenVisibility() {
  let patientToken, doctorToken;
  let patientId, doctorId;
  let hospitalId, departmentId;

  try {
    console.log('=== Testing Doctor Token Visibility ===\n');

    // Step 1: Login as patient
    console.log('1. Logging in as patient...');
    try {
      const patientLogin = await axios.post(`${API_URL}/auth/login`, {
        email: 'patient@example.com',
        password: 'password123'
      });
      patientToken = patientLogin.data.data.token;
      patientId = patientLogin.data.data.user._id;
      console.log(`   ✅ Patient: ${patientLogin.data.data.user.name} (${patientId})\n`);
    } catch (error) {
      console.log('   ❌ Patient login failed. Run: npm run seed\n');
      return;
    }

    // Step 2: Login as doctor
    console.log('2. Logging in as doctor...');
    try {
      const doctorLogin = await axios.post(`${API_URL}/auth/login`, {
        email: 'doctor@example.com',
        password: 'password123'
      });
      doctorToken = doctorLogin.data.data.token;
      doctorId = doctorLogin.data.data.user._id;
      console.log(`   ✅ Doctor: Dr. ${doctorLogin.data.data.user.name} (${doctorId})\n`);
    } catch (error) {
      console.log('   ❌ Doctor login failed. Run: npm run seed\n');
      return;
    }

    // Step 3: Get hospitals
    console.log('3. Getting hospitals...');
    const hospitalsRes = await axios.get(`${API_URL}/hospitals`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const hospitals = hospitalsRes.data.data.hospitals;
    if (hospitals.length === 0) {
      console.log('   ❌ No hospitals. Run: npm run seed\n');
      return;
    }
    hospitalId = hospitals[0]._id;
    console.log(`   ✅ Hospital: ${hospitals[0].name}\n`);

    // Step 4: Get departments
    console.log('4. Getting departments...');
    const deptsRes = await axios.get(`${API_URL}/departments/hospital/${hospitalId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const departments = deptsRes.data.data.departments;
    if (departments.length === 0) {
      console.log('   ❌ No departments. Run: npm run seed\n');
      return;
    }
    departmentId = departments[0]._id;
    console.log(`   ✅ Department: ${departments[0].name}\n`);

    // Step 5: Get doctors
    console.log('5. Getting doctors...');
    const doctorsRes = await axios.get(`${API_URL}/users/doctors?hospitalId=${hospitalId}&department=${departmentId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const doctors = doctorsRes.data.data.doctors;
    if (doctors.length === 0) {
      console.log('   ❌ No doctors found for this department\n');
      return;
    }
    const selectedDoctorId = doctors[0]._id;
    console.log(`   ✅ Doctor selected: Dr. ${doctors[0].name} (${selectedDoctorId})\n`);

    // Step 6: Patient books token
    console.log('6. Patient booking token...');
    const bookingRes = await axios.post(
      `${API_URL}/tokens`,
      {
        hospitalId,
        departmentId,
        doctorId: selectedDoctorId,
        type: 'online'
      },
      {
        headers: { Authorization: `Bearer ${patientToken}` }
      }
    );
    const bookedToken = bookingRes.data.data.token;
    console.log('   ✅ Token booked!');
    console.log(`      Token ID: ${bookedToken._id}`);
    console.log(`      Token Number: ${bookedToken.tokenNumber}`);
    console.log(`      Doctor ID in token: ${bookedToken.doctorId?._id || bookedToken.doctorId}`);
    console.log(`      Patient ID in token: ${bookedToken.patientId?._id || bookedToken.patientId}\n`);

    // Step 7: Doctor fetches their tokens
    console.log('7. Doctor fetching their tokens...');
    console.log(`   API: GET /tokens/doctor/${doctorId}`);
    
    try {
      const doctorTokensRes = await axios.get(`${API_URL}/tokens/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      
      const tokens = doctorTokensRes.data.data?.tokens || [];
      console.log(`   ✅ API returned ${tokens.length} token(s)\n`);

      if (tokens.length === 0) {
        console.log('   ❌ BUG CONFIRMED: Doctor cannot see patient tokens!\n');
        console.log('   Debug info:');
        console.log(`      Logged in doctor ID: ${doctorId}`);
        console.log(`      Token doctor ID: ${selectedDoctorId}`);
        console.log(`      Do they match? ${doctorId === selectedDoctorId}\n`);
        
        // Try fetching with the selectedDoctorId instead
        console.log('   Trying alternate query with selectedDoctorId...');
        const altRes = await axios.get(`${API_URL}/tokens/doctor/${selectedDoctorId}`, {
          headers: { Authorization: `Bearer ${doctorToken}` }
        });
        const altTokens = altResRes.data.data?.tokens || [];
        console.log(`   Alternate query returned ${altTokens.length} token(s)\n`);
      } else {
        console.log('   ✅ SUCCESS: Doctor can see tokens!\n');
        tokens.forEach(t => {
          console.log(`   Token #${t.tokenNumber}:`);
          console.log(`      Patient: ${t.patientId?.name}`);
          console.log(`      Status: ${t.status}`);
          console.log(`      Doctor ID matches? ${t.doctorId?._id === doctorId}\n`);
        });
      }

    } catch (error) {
      console.log('   ❌ Doctor token fetch failed!');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }

    // Step 8: Also test with the doctor ID from the booked token
    console.log('8. Testing with token\'s doctorId...');
    const tokenDoctorId = bookedToken.doctorId?._id || bookedToken.doctorId;
    try {
      const testRes = await axios.get(`${API_URL}/tokens/doctor/${tokenDoctorId}`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      const testTokens = testRes.data.data?.tokens || [];
      console.log(`   ✅ Query returned ${testTokens.length} token(s)\n`);
      
      if (testTokens.length === 0) {
        console.log('   ❌ Still no tokens - backend query issue!\n');
      } else {
        console.log('   ✅ Tokens found with this doctorId\n');
      }
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.response?.data?.message || error.message}\n`);
    }

  } catch (error) {
    console.log('\n❌ UNEXPECTED ERROR:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDoctorTokenVisibility();
