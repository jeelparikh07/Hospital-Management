const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';
const MONGODB_URI = 'mongodb://localhost:27017/smart-hospital-queue';

async function debugDoctorTokens() {
  let patientToken, doctorToken;
  let patientId, doctorId;

  try {
    console.log('=== DEBUG: Doctor Token Visibility Flow ===\n');

    // ========== PART 1: DIRECT DB CHECK ==========
    console.log('=== PART 1: DATABASE CHECK ===');
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB\n');

      const Token = mongoose.model('Token', new mongoose.Schema({
        tokenNumber: Number,
        patientId: mongoose.Schema.Types.ObjectId,
        doctorId: mongoose.Schema.Types.ObjectId,
        hospitalId: mongoose.Schema.Types.ObjectId,
        departmentId: mongoose.Schema.Types.ObjectId,
        status: String,
        date: Date,
      }, { timestamps: true }));

      const User = mongoose.model('User', new mongoose.Schema({
        name: String,
        email: String,
        role: String,
      }));

      // Find all tokens in DB
      const allTokens = await Token.find({}).sort({ createdAt: -1 }).limit(5);
      console.log(`📊 Found ${allTokens.length} recent tokens in database:\n`);
      
      for (const t of allTokens) {
        console.log(`   Token #${t.tokenNumber}:`);
        console.log(`     _id: ${t._id}`);
        console.log(`     patientId: ${t.patientId}`);
        console.log(`     doctorId: ${t.doctorId}`);
        console.log(`     status: ${t.status}`);
        console.log(`     date: ${t.date}`);
        console.log(`     createdAt: ${t.createdAt}\n`);
      }

      // Find doctors
      const doctors = await User.find({ role: 'doctor' });
      console.log(`👨‍⚕️ Found ${doctors.length} doctor(s):\n`);
      doctors.forEach(d => {
        console.log(`   Dr. ${d.name} (${d._id})`);
      });
      console.log('');

      if (doctors.length > 0) {
        doctorId = doctors[0]._id.toString();
        console.log(`🔍 Checking tokens for doctor: ${doctorId}\n`);
        
        const doctorTokens = await Token.find({ doctorId: doctorId }).sort({ createdAt: -1 }).limit(5);
        console.log(`📋 Found ${doctorTokens.length} tokens for this doctor:\n`);
        
        doctorTokens.forEach(t => {
          console.log(`   Token #${t.tokenNumber}:`);
          console.log(`     _id: ${t._id}`);
          console.log(`     patientId: ${t.patientId}`);
          console.log(`     status: ${t.status}`);
          console.log(`     date: ${t.date}\n`);
        });
      }

      await mongoose.disconnect();
      console.log('✅ MongoDB disconnected\n');
    } catch (error) {
      console.log('❌ MongoDB error:', error.message);
      console.log('   Make sure MongoDB is running on localhost:27017\n');
    }

    // ========== PART 2: API TEST ==========
    console.log('=== PART 2: API ENDPOINT TEST ===\n');

    // Step 1: Login as patient
    console.log('Step 1: Logging in as patient...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'patient@example.com',
        password: 'password123'
      });
      console.log('✅ Patient login successful');
      patientToken = loginResponse.data.data.token;
      patientId = loginResponse.data.data.user._id;
      console.log(`   Patient ID: ${patientId}\n`);
    } catch (error) {
      console.log('❌ Patient login failed:', error.response?.data?.message || error.message);
      console.log('   Tip: Run "npm run seed" to create test users\n');
      return;
    }

    // Step 2: Login as doctor
    console.log('Step 2: Logging in as doctor...');
    try {
      const doctorLoginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'doctor@example.com',
        password: 'password123'
      });
      console.log('✅ Doctor login successful');
      doctorToken = doctorLoginResponse.data.data.token;
      doctorId = doctorLoginResponse.data.data.user._id;
      console.log(`   Doctor ID: ${doctorId}\n`);
    } catch (error) {
      console.log('❌ Doctor login failed:', error.response?.data?.message || error.message);
      console.log('   Tip: Run "npm run seed" to create test users\n');
      return;
    }

    // Step 3: Patient books a token
    console.log('Step 3: Getting hospitals...');
    let hospitalId, departmentId;
    try {
      const hospitalsResponse = await axios.get(`${API_URL}/hospitals`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      const hospitals = hospitalsResponse.data.data.hospitals;
      if (hospitals.length === 0) {
        console.log('   ❌ No hospitals - run "npm run seed"\n');
        return;
      }
      hospitalId = hospitals[0]._id;
      console.log(`   Selected: ${hospitals[0].name} (${hospitalId})\n`);

      const deptsResponse = await axios.get(`${API_URL}/departments/hospital/${hospitalId}`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      const departments = deptsResponse.data.data.departments;
      if (departments.length === 0) {
        console.log('   ❌ No departments - run "npm run seed"\n');
        return;
      }
      departmentId = departments[0]._id;
      console.log(`   Selected: ${departments[0].name} (${departmentId})\n`);
    } catch (error) {
      console.log('❌ Failed to fetch hospitals/departments:', error.response?.data?.message);
      return;
    }

    console.log('Step 4: Fetching doctors...');
    try {
      const doctorsResponse = await axios.get(`${API_URL}/users/doctors?hospitalId=${hospitalId}&department=${departmentId}`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      const doctors = doctorsResponse.data.data.doctors;
      if (doctors.length === 0) {
        console.log('   ❌ No doctors found!\n');
        return;
      }
      const selectedDoctorId = doctors[0]._id;
      console.log(`   Selected: Dr. ${doctors[0].name} (${selectedDoctorId})\n`);

      // Book token
      console.log('Step 5: Booking token...');
      const tokenResponse = await axios.post(
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

      const bookedToken = tokenResponse.data.data.token;
      console.log('✅ Token booked successfully!');
      console.log(`   Token ID: ${bookedToken._id}`);
      console.log(`   Token Number: ${bookedToken.tokenNumber}`);
      console.log(`   Doctor ID: ${bookedToken.doctorId?._id || bookedToken.doctorId}`);
      console.log(`   Patient ID: ${bookedToken.patientId?._id || bookedToken.patientId}\n`);
    } catch (error) {
      console.log('❌ Token booking FAILED!');
      console.log('   Message:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('   Response:', JSON.stringify(error.response.data, null, 2));
      }
      return;
    }

    // Step 6: Doctor fetches their tokens
    console.log('Step 6: Doctor fetching their tokens...');
    console.log(`   API Call: GET /tokens/doctor/${doctorId}`);
    
    try {
      const doctorTokensResponse = await axios.get(`${API_URL}/tokens/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });

      console.log('✅ API Response received');
      console.log(`   Status: ${doctorTokensResponse.status}`);
      console.log(`   Success: ${doctorTokensResponse.data.success}`);
      
      const tokens = doctorTokensResponse.data.data?.tokens || [];
      console.log(`   Tokens count: ${tokens.length}\n`);

      if (tokens.length === 0) {
        console.log('❌ PROBLEM: Doctor has NO tokens returned from API!\n');
        console.log('   This is the BUG - tokens are not being returned for the doctor.\n');
        
        // Debug: Check what doctorId is being queried vs what's in DB
        console.log('🔍 Debug info:');
        console.log(`   Query doctorId: ${doctorId}`);
        console.log(`   Expected token doctorId: ${selectedDoctorId}`);
        console.log(`   Do they match? ${doctorId === selectedDoctorId}\n`);
      } else {
        console.log('📋 Tokens returned:');
        tokens.forEach(t => {
          console.log(`   Token #${t.tokenNumber}:`);
          console.log(`     _id: ${t._id}`);
          console.log(`     Patient: ${t.patientId?.name}`);
          console.log(`     Status: ${t.status}`);
          console.log(`     Doctor ID: ${t.doctorId?._id}`);
          console.log(`     Matches query? ${t.doctorId?._id === doctorId}\n`);
        });
        
        console.log('✅ SUCCESS: Doctor can see patient tokens!\n');
      }

    } catch (error) {
      console.log('❌ Doctor token fetch FAILED!');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('   Response:', JSON.stringify(error.response.data, null, 2));
      }
    }

  } catch (error) {
    console.log('\n❌ UNEXPECTED ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

debugDoctorTokens();
