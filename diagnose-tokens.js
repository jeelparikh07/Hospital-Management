const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/smart-hospital-queue';

async function diagnoseTokenVisibility() {
  try {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     TOKEN VISIBILITY DIAGNOSTIC TOOL                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

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
    
    for (const doctor of doctors) {
      const doctorIdStr = doctor._id.toString();
      console.log(`═══════════════════════════════════════════════════════════`);
      console.log(`Doctor: Dr. ${doctor.name}`);
      console.log(`ID: ${doctorIdStr}\n`);

      // Query 1: Using ObjectId
      const tokensObjectId = await Token.find({ doctorId: doctor._id });
      console.log(`  Query with ObjectId: ${tokensObjectId.length} tokens`);

      // Query 2: Using string
      const tokensString = await Token.find({ doctorId: doctorIdStr });
      console.log(`  Query with string:   ${tokensString.length} tokens`);

      // Query 3: Using $eq
      const tokensEq = await Token.find({ doctorId: { $eq: doctor._id } });
      console.log(`  Query with $eq:      ${tokensEq.length} tokens`);

      // Show token details if any found
      const allTokens = tokensObjectId.length > 0 ? tokensObjectId : 
                        tokensString.length > 0 ? tokensString : 
                        tokensEq;
      
      if (allTokens.length > 0) {
        console.log(`\n  📋 Tokens found (${allTokens.length} total):`);
        allTokens.forEach(t => {
          const tokenDoctorIdStr = t.doctorId?.toString?.();
          const matches = tokenDoctorIdStr === doctorIdStr;
          console.log(`    - Token #${t.tokenNumber}:`);
          console.log(`        Status: ${t.status}`);
          console.log(`        Date: ${t.date}`);
          console.log(`        Token's doctorId: ${tokenDoctorIdStr}`);
          console.log(`        Matches doctor? ${matches ? '✅ YES' : '❌ NO'}`);
        });
      } else {
        console.log(`  ❌ No tokens found for this doctor\n`);
      }
      console.log('');
    }

    // Show all tokens in database
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ALL TOKENS IN DATABASE:');
    const allTokens = await Token.find({}).sort({ createdAt: -1 }).limit(20);
    console.log(`   Total tokens (recent 20): ${allTokens.length}\n`);
    
    allTokens.forEach((t, i) => {
      console.log(`   ${i + 1}. Token #${t.tokenNumber}:`);
      console.log(`      doctorId: ${t.doctorId?.toString?.() || 'NULL'}`);
      console.log(`      patientId: ${t.patientId?.toString?.() || 'NULL'}`);
      console.log(`      status: ${t.status}`);
      console.log(`      date: ${t.date}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Diagnostic complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

diagnoseTokenVisibility();
