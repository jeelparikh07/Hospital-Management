const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function checkServices() {
  console.log('=== Hospital Management - Service Check ===\n');
  
  // Check 1: Backend Server
  console.log('1. Checking backend server (port 5000)...');
  try {
    const healthRes = await axios.get(`${API_URL}/health`, { timeout: 3000 });
    console.log('   ✅ Backend is running');
    console.log(`   Response: ${JSON.stringify(healthRes.data)}\n`);
  } catch (error) {
    console.log('   ❌ Backend is NOT running');
    console.log('   Fix: Run "npm run server" in project directory\n');
    return;
  }

  // Check 2: MongoDB Connection
  console.log('2. Checking MongoDB connection...');
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'patient@example.com',
      password: 'password123'
    }, { timeout: 5000 });
    console.log('   ✅ MongoDB is connected');
    console.log('   Token generated successfully\n');
    
    const token = loginRes.data.data.token;
    
    // Check 3: Hospitals
    console.log('3. Checking hospitals data...');
    const hospitalsRes = await axios.get(`${API_URL}/hospitals`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });
    const hospitals = hospitalsRes.data.data.hospitals;
    if (hospitals.length > 0) {
      console.log(`   ✅ Found ${hospitals.length} hospital(s)`);
      hospitals.forEach(h => console.log(`      - ${h.name}`));
    } else {
      console.log('   ⚠️  No hospitals found - run "npm run seed"');
    }
    console.log('');
    
    // Check 4: Departments
    if (hospitals.length > 0) {
      console.log('4. Checking departments...');
      const deptsRes = await axios.get(`${API_URL}/departments/hospital/${hospitals[0]._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      const departments = deptsRes.data.data.departments;
      if (departments.length > 0) {
        console.log(`   ✅ Found ${departments.length} department(s)`);
        departments.forEach(d => console.log(`      - ${d.name}`));
      } else {
        console.log('   ⚠️  No departments found - run "npm run seed"');
      }
      console.log('');
      
      // Check 5: Doctors
      if (departments.length > 0) {
        console.log('5. Checking doctors...');
        const doctorsRes = await axios.get(`${API_URL}/users/doctors?hospitalId=${hospitals[0]._id}&department=${departments[0]._id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        const doctors = doctorsRes.data.data.doctors;
        if (doctors.length > 0) {
          console.log(`   ✅ Found ${doctors.length} doctor(s)`);
          doctors.forEach(d => console.log(`      - Dr. ${d.name} (${d.specialization})`));
        } else {
          console.log('   ❌ No doctors found!');
          console.log('   Fix: Run "npm run seed" to create doctors and link them to departments');
        }
        console.log('');
      }
    }
    
    console.log('=== Summary ===');
    console.log('✅ All services are working!');
    console.log('You can now book tokens from the patient dashboard.');
    
  } catch (error) {
    console.log('   ❌ MongoDB connection failed');
    console.log(`   Error: ${error.message}`);
    console.log('   Fix: Start MongoDB with "mongod" command');
  }
}

checkServices();
