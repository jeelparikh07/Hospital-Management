// AUTO-FIX SCRIPT - Run this ONCE in browser console (F12)
// This will fix everything automatically

(async function autoFix() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  HOSPITAL MANAGEMENT - AUTO FIX       ║');
  console.log('╚════════════════════════════════════════╝\n');

  const token = localStorage.getItem('token');
  const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  const yourId = authData.user?.id;

  console.log('👤 Your ID:', yourId);
  console.log('👤 Your Name:', authData.user?.name);
  console.log('');

  // Step 1: Get all schedules
  console.log('📋 Step 1: Fetching all schedules...');
  const allSched = await fetch('http://localhost:5000/api/schedules', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json());

  const schedules = allSched.data?.schedules || [];
  console.log('   Found', schedules.length, 'schedules\n');

  // Step 2: Delete schedules with wrong doctorId
  console.log('🗑️  Step 2: Deleting schedules with wrong doctorId...');
  const wrongSchedules = schedules.filter(s => s.doctorId !== yourId);
  
  if (wrongSchedules.length === 0) {
    console.log('   ✅ All schedules have correct doctorId\n');
  } else {
    for (const s of wrongSchedules) {
      await fetch(`http://localhost:5000/api/schedules/${s._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log('   ❌ Deleted:', s._id);
    }
    console.log('   Deleted', wrongSchedules.length, 'wrong schedules\n');
  }

  // Step 3: Create fresh schedules with correct doctorId
  console.log('✨ Step 3: Creating 3 fresh schedules for today...');
  
  const today = new Date().toISOString().split('T')[0];
  
  const newSchedules = [
    { sessionName: 'Morning', startTime: '09:00', endTime: '12:00' },
    { sessionName: 'Afternoon', startTime: '14:00', endTime: '17:00' },
    { sessionName: 'Evening', startTime: '17:00', endTime: '20:00' }
  ];

  for (const sched of newSchedules) {
    try {
      const result = await fetch('http://localhost:5000/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          date: today,
          ...sched,
          slotDuration: 15,
          status: 'active'
        })
      }).then(r => r.json());

      const newSched = result.data?.schedule;
      if (newSched) {
        console.log('   ✅ Created:', newSched.sessionName, '- doctorId:', newSched.doctorId);
      }
    } catch (e) {
      console.log('   ⚠️  Failed to create:', sched.sessionName);
    }
  }

  // Step 4: Verify
  console.log('\n🔍 Step 4: Verifying schedules...');
  const verifySched = await fetch('http://localhost:5000/api/schedules/doctor/' + yourId, {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(r => r.json());

  const yourSchedules = verifySched.data?.schedules || [];
  console.log('   Found', yourSchedules.length, 'schedules for you\n');

  // Done
  console.log('╔════════════════════════════════════════╗');
  console.log('║           ✅  FIX COMPLETE!           ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log('📋 You should now see', yourSchedules.length, 'schedules on the page.');
  console.log('🔄 Refreshing page in 2 seconds...\n');

  setTimeout(() => {
    location.reload();
  }, 2000);

})();
