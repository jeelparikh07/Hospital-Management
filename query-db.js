const { MongoClient } = require('mongodb');

async function queryDB() {
  const uri = 'mongodb://localhost:27017/smart-hospital-queue';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('smart-hospital-queue');
    
    // Query 1: Last 10 schedules
    console.log('=== QUERY 1: Last 10 Schedules ===\n');
    const schedules = await db.collection('schedules').find({}).sort({ _id: -1 }).limit(10).toArray();
    console.log('Raw schedules data:');
    schedules.forEach((s, i) => {
      console.log(`\n[${i}] _id: ${s._id}`);
      console.log(`    doctorId: ${s.doctorId}`);
      console.log(`    date: "${s.date}" (type: ${typeof s.date})`);
      console.log(`    slots: ${JSON.stringify(s.slots, null, 2)}`);
      console.log(`    createdAt: ${s.createdAt}`);
    });

    // Query 2: Just date fields
    console.log('\n\n=== QUERY 2: Date Fields Only ===\n');
    const dateOnly = await db.collection('schedules').find({}, { projection: { date: 1, doctorId: 1, slots: 1 } }).sort({ _id: -1 }).limit(10).toArray();
    dateOnly.forEach((s, i) => {
      console.log(`[${i}] date: "${s.date}" | doctorId: ${s.doctorId} | slots: ${s.slots?.length || 0}`);
    });

    // Query 3: Appointments
    console.log('\n\n=== QUERY 3: Last 5 Appointments ===\n');
    const appointments = await db.collection('appointments').find({}).sort({ _id: -1 }).limit(5).toArray();
    appointments.forEach((a, i) => {
      console.log(`\n[${i}] _id: ${a._id}`);
      console.log(`    patientId: ${a.patientId}`);
      console.log(`    doctorId: ${a.doctorId}`);
      console.log(`    appointmentDate: "${a.appointmentDate}" (type: ${typeof a.appointmentDate})`);
      console.log(`    scheduleId: ${a.scheduleId}`);
      console.log(`    slotIndex: ${a.slotIndex}`);
      console.log(`    tokenNumber: ${a.tokenNumber}`);
      console.log(`    status: ${a.status}`);
      console.log(`    createdAt: ${a.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

queryDB();
