const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testFullTokenFlow() {
  let patientToken, doctorToken;
  let patientId, doctorId;
  let hospitalId, departmentId;

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Testing Full Token Flow: Patient → Doctor Dashboard  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========== STEP 1: Login as patient ==========
    console.log('📝 STEP 1: Patient Login');
    try {
      const patientLogin = await axios.post(`${API_URL}/auth/login`, {
        email: 'patient@example.com',
        password: 'password123'
      });
      patientToken = patientLogin.data.data.token;
      patientId = patientLogin.data.data.user._id;
      console.log(`   ✅ Logged in as: ${patientLogin.data.data.user.name}`);
      console.log(`   ID: ${patientId}\n`);
    } catch (error) {
      console.log('   ❌ FAILED - Run: npm run seed\n');
      return;
    }

    // ========== STEP 2: Login as doctor ==========
    console.log('📝 STEP 2: Doctor Login');
    try {
      const doctorLogin = await axios.post(`${API_URL}/auth/login`, {
        email: 'doctor@example.com',
        password: 'password123'
      });
      doctorToken = doctorLogin.data.data.token;
      doctorId = doctorLogin.data.data.user._id;
      console.log(`   ✅ Logged in as: Dr. ${doctorLogin.data.data.user.name}`);
      console.log(`   ID: ${doctorId}\n`);
    } catch (error) {
      console.log('   ❌ FAILED - Run: npm run seed\n');
      return;
    }

    // ========== STEP 3: Get hospitals ==========
    console.log('📝 STEP 3: Fetching Hospitals');
    const hospitalsRes = await axios.get(`${API_URL}/hospitals`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const hospitals = hospitalsRes.data.data.hospitals;
    if (hospitals.length === 0) {
      console.log('   ❌ No hospitals - Run: npm run seed\n');
      return;
    }
    hospitalId = hospitals[0]._id;
    console.log(`   ✅ Selected: ${hospitals[0].name}`);
    console.log(`   ID: ${hospitalId}\n`);

    // ========== STEP 4: Get departments ==========
    console.log('📝 STEP 4: Fetching Departments');
    const deptsRes = await axios.get(`${API_URL}/departments/hospital/${hospitalId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const departments = deptsRes.data.data.departments;
    if (departments.length === 0) {
      console.log('   ❌ No departments - Run: npm run seed\n');
      return;
    }
    departmentId = departments[0]._id;
    console.log(`   ✅ Selected: ${departments[0].name}`);
    console.log(`   ID: ${departmentId}\n`);

    // ========== STEP 5: Get doctors ==========
    console.log('📝 STEP 5: Fetching Doctors');
    const doctorsRes = await axios.get(`${API_URL}/users/doctors?hospitalId=${hospitalId}&department=${departmentId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const doctors = doctorsRes.data.data.doctors;
    if (doctors.length === 0) {
      console.log('   ❌ No doctors found for this department\n');
      return;
    }
    const selectedDoctorId = doctors[0]._id;
    console.log(`   ✅ Selected: Dr. ${doctors[0].name}`);
    console.log(`   ID: ${selectedDoctorId}`);
    console.log(`   Department: ${doctors[0].department}\n`);

    // ========== STEP 6: Patient books token ==========
    console.log('📝 STEP 6: Patient Booking Token');
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
    console.log('   ✅ Token booked successfully!');
    console.log(`   Token Number: ${bookedToken.tokenNumber}`);
    console.log(`   Token ID: ${bookedToken._id}`);
    console.log(`   Doctor ID in token: ${bookedToken.doctorId?._id || bookedToken.doctorId}`);
    console.log(`   Status: ${bookedToken.status}\n`);

    // ========== STEP 7: Doctor fetches tokens ==========
    console.log('📝 STEP 7: Doctor Fetches Their Tokens');
    console.log(`   API: GET /tokens/doctor/${doctorId}`);
    
    try {
      const doctorTokensRes = await axios.get(`${API_URL}/tokens/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      
      const tokens = doctorTokensRes.data.data?.tokens || [];
      console.log(`   ✅ API returned ${tokens.length} token(s)`);
      
      if (tokens.length === 0) {
        console.log('\n   ⚠️  WARNING: No tokens returned!\n');
        console.log('   Debug Info:');
        console.log(`   - Logged in doctor ID: ${doctorId}`);
        console.log(`   - Token was booked for doctor ID: ${selectedDoctorId}`);
        console.log(`   - Do IDs match? ${doctorId === selectedDoctorId}`);
        
        if (doctorId !== selectedDoctorId) {
          console.log('\n   ❌ ROOT CAUSE: Doctor IDs do not match!');
          console.log('   The patient booked a token for a DIFFERENT doctor.\n');
        } else {
          console.log('\n   ❌ ROOT CAUSE: Backend query issue!\n');
        }
      } else {
        console.log('\n   ✅ SUCCESS: Doctor can see patient tokens!\n');
        
        // Verify the booked token is in the list
        const foundToken = tokens.find(t => t._id === bookedToken._id);
        if (foundToken) {
          console.log('   ✅ Booked token found in doctor\'s list!');
          console.log(`   Token #${foundToken.tokenNumber} - Patient: ${foundToken.patientId?.name}`);
        } else {
          console.log('   ⚠️  Booked token not found (might be date filtering)');
        }
        console.log('');
      }

      // Show all tokens
      if (tokens.length > 0) {
        console.log('   📋 Tokens returned:');
        tokens.forEach(t => {
          console.log(`   - Token #${t.tokenNumber}: ${t.patientId?.name} (${t.status})`);
        });
        console.log('');
      }

    } catch (error) {
      console.log('   ❌ FAILED:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('   Response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    // ========== STEP 8: Test with explicit doctor ID ==========
    console.log('📝 STEP 8: Testing with Token\'s Doctor ID');
    const tokenDoctorId = bookedToken.doctorId?._id || bookedToken.doctorId;
    try {
      const testRes = await axios.get(`${API_URL}/tokens/doctor/${tokenDoctorId}`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      const testTokens = testRes.data.data?.tokens || [];
      console.log(`   ✅ Query returned ${testTokens.length} token(s)\n`);
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.response?.data?.message || error.message}\n`);
    }

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    TEST COMPLETE                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.log('\n❌ UNEXPECTED ERROR:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFullTokenFlow();
