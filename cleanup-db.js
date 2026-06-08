const { MongoClient } = require('mongodb');

async function cleanupDB() {
  const uri = 'mongodb://localhost:27017/smart-hospital-queue';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db('smart-hospital-queue');
    
    // Check what data we have
    const schedules = await db.collection('schedules').find({}).toArray();
    const appointments = await db.collection('appointments').find({}).toArray();
    
    console.log(`Found ${schedules.length} schedules and ${appointments.length} appointments\n`);
    
    // Identify broken records (dates that are NOT in YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const brokenSchedules = schedules.filter(s => !dateRegex.test(s.date));
    const brokenAppointments = appointments.filter(a => !dateRegex.test(a.appointmentDate));
    
    console.log('Broken schedules (not YYYY-MM-DD format):');
    brokenSchedules.forEach(s => {
      console.log(`  _id: ${s._id}, date: "${s.date}"`);
    });
    
    console.log('\nBroken appointments (not YYYY-MM-DD format):');
    brokenAppointments.forEach(a => {
      console.log(`  _id: ${a._id}, appointmentDate: "${a.appointmentDate}"`);
    });
    
    if (brokenSchedules.length > 0 || brokenAppointments.length > 0) {
      console.log('\n--- DELETING BROKEN RECORDS ---\n');
      
      // Delete broken schedules
      if (brokenSchedules.length > 0) {
        const deleteResult = await db.collection('schedules').deleteMany({
          _id: { $in: brokenSchedules.map(s => s._id) }
        });
        console.log(`Deleted ${deleteResult.deletedCount} broken schedules`);
      }
      
      // Delete broken appointments
      if (brokenAppointments.length > 0) {
        const deleteResult = await db.collection('appointments').deleteMany({
          _id: { $in: brokenAppointments.map(a => a._id) }
        });
        console.log(`Deleted ${deleteResult.deletedCount} broken appointments`);
      }
    } else {
      console.log('\nNo broken records found. All dates are in correct YYYY-MM-DD format.\n');
    }
    
    // Verify remaining data
    const remainingSchedules = await db.collection('schedules').find({}).toArray();
    const remainingAppointments = await db.collection('appointments').find({}).toArray();
    
    console.log('\n=== REMAINING DATA ===\n');
    console.log(`Schedules: ${remainingSchedules.length}`);
    remainingSchedules.forEach(s => {
      console.log(`  _id: ${s._id}, date: "${s.date}", slots: ${s.slots?.length || 0}`);
    });
    
    console.log(`\nAppointments: ${remainingAppointments.length}`);
    remainingAppointments.forEach(a => {
      console.log(`  _id: ${a._id}, appointmentDate: "${a.appointmentDate}", tokenNumber: ${a.tokenNumber}`);
    });
    
    console.log('\n✓ Cleanup complete!\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanupDB();
