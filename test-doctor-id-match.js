const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/smart-hospital-queue';

async function testDoctorIdMatch() {
  try {
    console.log('=== Testing Doctor ID Matching in Tokens ===\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const TokenSchema = new mongoose.Schema({
      tokenNumber: Number,
      patientId: mongoose.Schema.Types.ObjectId,
      doctorId: mongoose.Schema.Types.ObjectId,
      hospitalId: mongoose.Schema.Types.ObjectId,
      departmentId: mongoose.Schema.Types.ObjectId,
      status: String,
      date: Date,
    }, { timestamps: true });

    const Token = mongoose.model('Token', TokenSchema);
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String,
    });
    const User = mongoose.model('User', UserSchema);

    // Get all doctors
    const doctors = await User.find({ role: 'doctor' });
    console.log(`👨‍⚕️ Found ${doctors.length} doctor(s):\n`);
    doctors.forEach(d => {
      console.log(`   Dr. ${d.name}`);
      console.log(`      _id: ${d._id}`);
      console.log(`      _id type: ${typeof d._id}`);
      console.log(`      _id toString(): ${d._id.toString()}\n`);
    });

    if (doctors.length === 0) {
      console.log('❌ No doctors found. Run: npm run seed\n');
      await mongoose.disconnect();
      return;
    }

    const testDoctorId = doctors[0]._id;
    const testDoctorIdStr = testDoctorId.toString();

    console.log('🔍 Testing different query methods:\n');

    // Test 1: Query with ObjectId
    console.log('Test 1: Query with ObjectId');
    const tokens1 = await Token.find({ doctorId: testDoctorId });
    console.log(`   Found ${tokens1.length} tokens\n`);

    // Test 2: Query with string
    console.log('Test 2: Query with string ID');
    const tokens2 = await Token.find({ doctorId: testDoctorIdStr });
    console.log(`   Found ${tokens2.length} tokens\n`);

    // Test 3: Query with $eq
    console.log('Test 3: Query with $eq');
    const tokens3 = await Token.find({ doctorId: { $eq: testDoctorId } });
    console.log(`   Found ${tokens3.length} tokens\n`);

    // Test 4: Raw find with explicit conversion
    console.log('Test 4: Query with new mongoose.Types.ObjectId()');
    const tokens4 = await Token.find({ doctorId: new mongoose.Types.ObjectId(testDoctorIdStr) });
    console.log(`   Found ${tokens4.length} tokens\n`);

    // Show token details
    if (tokens1.length > 0) {
      console.log('📋 Sample token details:');
      const t = tokens1[0];
      console.log(`   Token #${t.tokenNumber}`);
      console.log(`   _id: ${t._id}`);
      console.log(`   doctorId: ${t.doctorId}`);
      console.log(`   doctorId type: ${typeof t.doctorId}`);
      console.log(`   doctorId is ObjectId: ${t.doctorId instanceof mongoose.Types.ObjectId}`);
      console.log(`   doctorId.toString(): ${t.doctorId.toString()}`);
      console.log(`   Matches test doctor? ${t.doctorId.toString() === testDoctorIdStr}\n`);
    }

    // Test 5: Check all tokens in DB
    console.log('📊 All tokens in database:');
    const allTokens = await Token.find({}).limit(10);
    console.log(`   Total tokens: ${allTokens.length}\n`);
    
    allTokens.forEach(t => {
      console.log(`   Token #${t.tokenNumber}:`);
      console.log(`      doctorId: ${t.doctorId}`);
      console.log(`      doctorId.toString(): ${t.doctorId?.toString?.()}`);
      console.log(`      date: ${t.date}`);
      console.log(`      status: ${t.status}\n`);
    });

    await mongoose.disconnect();
    console.log('✅ Test complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testDoctorIdMatch();
