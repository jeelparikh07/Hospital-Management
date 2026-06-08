// Debug Script for Hospital Management System
// Run this in your browser console (F12) on the doctor schedule page

console.log('=== HOSPITAL MANAGEMENT DEBUG ===\n');

// 1. Check Authentication
console.log('1. AUTHENTICATION CHECK');
const authData = JSON.parse(localStorage.getItem('auth-storage'));
console.log('   User ID:', authData?.user?.id);
console.log('   User Name:', authData?.user?.name);
console.log('   User Role:', authData?.user?.role);
console.log('   Token exists:', !!localStorage.getItem('token'));
console.log('');

// 2. Test API Connection
console.log('2. API CONNECTION TEST');
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(data => console.log('   Health Check:', data))
  .catch(e => console.log('   ❌ API Error:', e.message));
console.log('');

// 3. Get All Schedules
console.log('3. ALL SCHEDULES IN DATABASE');
fetch('http://localhost:5000/api/schedules', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(data => {
  const schedules = data.data?.schedules || [];
  console.log('   Total Schedules:', schedules.length);
  
  if (schedules.length === 0) {
    console.log('   ⚠️  No schedules found in database!');
  } else {
    schedules.forEach((s, i) => {
      console.log(`   \n   Schedule ${i + 1}:`);
      console.log(`      ID: ${s._id}`);
      console.log(`      Doctor ID: ${s.doctorId?._id || s.doctorId || 'NULL'}`);
      console.log(`      Doctor Name: ${s.doctorId?.name || 'N/A'}`);
      console.log(`      Date: ${s.date}`);
      console.log(`      Session: ${s.sessionName}`);
      console.log(`      Time: ${s.startTime} - ${s.endTime}`);
      console.log(`      Status: ${s.status}`);
      console.log(`      Slots: ${s.totalSlots} total, ${s.bookedSlots} booked`);
    });
  }
  
  // 4. Check for schedules with null doctorId
  const nullDoctorSchedules = schedules.filter(s => !s.doctorId);
  console.log('\n4. SCHEDULES WITH NULL DOCTOR ID:', nullDoctorSchedules.length);
  if (nullDoctorSchedules.length > 0) {
    console.log('   ⚠️  These schedules have no doctorId and won\'t show up!');
    console.log('   Run this to delete them:');
    console.log('   deleteNullSchedules()');
  }
  
  // 5. Check schedules for current user
  const yourId = authData?.user?.id;
  const yourSchedules = schedules.filter(s => s.doctorId?._id === yourId || s.doctorId === yourId);
  console.log('\n5. YOUR SCHEDULES:', yourSchedules.length);
  yourSchedules.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.sessionName} - ${s.startTime} to ${s.endTime} (${s.status})`);
  });
  
  console.log('\n=== DEBUG COMPLETE ===');
  console.log('\n📋 HELPFUL COMMANDS:');
  console.log('   deleteNullSchedules()     - Delete schedules with null doctorId');
  console.log('   createTestSchedule()      - Create a test schedule');
  console.log('   refreshSchedules()        - Reload the page');
});

// Helper function to delete null schedules
window.deleteNullSchedules = function() {
  fetch('http://localhost:5000/api/schedules', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  })
  .then(r => r.json())
  .then(data => {
    const schedules = data.data?.schedules || [];
    const nullSchedules = schedules.filter(s => !s.doctorId);
    
    if (nullSchedules.length === 0) {
      console.log('✅ No null schedules to delete');
      return;
    }
    
    console.log('Deleting', nullSchedules.length, 'null schedules...');
    Promise.all(nullSchedules.map(s => 
      fetch(`http://localhost:5000/api/schedules/${s._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      })
    )).then(() => {
      console.log('✅ Deleted! Refreshing page...');
      location.reload();
    });
  });
};

// Helper function to create test schedule
window.createTestSchedule = function() {
  const today = new Date().toISOString().split('T')[0];
  fetch('http://localhost:5000/api/schedules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({
      date: today,
      sessionName: 'Test Session',
      startTime: '10:00',
      endTime: '12:00',
      slotDuration: 15,
      status: 'active'
    })
  })
  .then(r => r.json())
  .then(data => {
    console.log('Test schedule created:', data);
    location.reload();
  })
  .catch(e => console.error('Error:', e));
};

window.refreshSchedules = function() {
  location.reload();
};
