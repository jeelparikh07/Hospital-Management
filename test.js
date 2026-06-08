const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with patient@example.com...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'patient@example.com',
      password: 'password123'
    });
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('FAILED:', error.response?.data || error.message);
  }
}

testLogin();
