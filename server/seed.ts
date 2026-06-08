/**
 * Database Seed Script
 * 
 * Populates the database with sample data for testing and demonstration.
 * 
 * Usage: 
 *   node --loader ts-node/esm server/seed.ts
 *   OR
 *   npm run seed (if configured in package.json)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Hospital from '../src/models/Hospital.js';
import Department from '../src/models/Department.js';
import Token from '../src/models/Token.js';
import Queue from '../src/models/Queue.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hospital-queue';

// Sample Data
const hospitals = [
  {
    name: 'City General Hospital',
    address: '123 Healthcare Avenue',
    city: 'New York',
    state: 'NY',
    pincode: '10001',
    phone: '+1 (555) 123-4567',
    email: 'info@citygeneral.com',
    departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine'],
  },
  {
    name: 'Metro Medical Center',
    address: '456 Wellness Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    pincode: '90001',
    phone: '+1 (555) 234-5678',
    email: 'contact@metromedical.com',
    departments: ['Dermatology', 'Oncology', 'Gastroenterology', 'Pulmonology'],
  },
  {
    name: 'Community Health Clinic',
    address: '789 Care Street',
    city: 'Chicago',
    state: 'IL',
    pincode: '60601',
    phone: '+1 (555) 345-6789',
    email: 'hello@communityhealth.com',
    departments: ['Family Medicine', 'Internal Medicine', 'Pediatrics'],
  },
];

const users = [
  // Admin
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0001',
    role: 'admin',
  },
  // Doctors
  {
    name: 'Sarah Johnson',
    email: 'doctor@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0002',
    role: 'doctor',
    specialization: 'Cardiology',
    department: 'Cardiology',
    consultationDuration: 15,
  },
  {
    name: 'Michael Chen',
    email: 'doctor2@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0003',
    role: 'doctor',
    specialization: 'Neurology',
    department: 'Neurology',
    consultationDuration: 20,
  },
  {
    name: 'Emily Rodriguez',
    email: 'doctor3@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0004',
    role: 'doctor',
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    consultationDuration: 15,
  },
  {
    name: 'David Wilson',
    email: 'doctor4@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0005',
    role: 'doctor',
    specialization: 'Orthopedics',
    department: 'Orthopedics',
    consultationDuration: 20,
  },
  // Receptionists
  {
    name: 'Jessica Brown',
    email: 'receptionist@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0006',
    role: 'receptionist',
  },
  {
    name: 'Robert Taylor',
    email: 'receptionist2@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0007',
    role: 'receptionist',
  },
  // Patients
  {
    name: 'John Smith',
    email: 'patient@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0008',
    role: 'patient',
  },
  {
    name: 'Emma Davis',
    email: 'patient2@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0009',
    role: 'patient',
  },
  {
    name: 'James Wilson',
    email: 'patient3@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0010',
    role: 'patient',
  },
  {
    name: 'Olivia Martinez',
    email: 'patient4@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0011',
    role: 'patient',
  },
  {
    name: 'William Anderson',
    email: 'patient5@example.com',
    password: 'password123',
    phone: '+1 (555) 000-0012',
    role: 'patient',
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Department.deleteMany({}),
      Token.deleteMany({}),
      Queue.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared\n');

    // Create Hospitals
    console.log('🏥 Creating hospitals...');
    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`✅ Created ${createdHospitals.length} hospitals\n`);

    // Create Users
    console.log('👥 Creating users...');
    // Hash passwords before inserting (insertMany bypasses pre-save hooks)
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // Categorize users
    const admin = createdUsers.find((u) => u.role === 'admin');
    const doctors = createdUsers.filter((u) => u.role === 'doctor');
    const receptionists = createdUsers.filter((u) => u.role === 'receptionist');
    const patients = createdUsers.filter((u) => u.role === 'patient');

    // Update doctors with hospitalId
    await User.updateMany(
      { role: 'doctor' },
      { hospitalId: createdHospitals[0]._id }
    );

    // Update receptionists with hospitalId
    await User.updateMany(
      { role: 'receptionist' },
      { hospitalId: createdHospitals[0]._id }
    );

    // Create Departments
    console.log('🏛️  Creating departments...');
    const allDepartments = [];
    for (const hospital of createdHospitals) {
      const depts = hospital.departments.map((deptName: string) => ({
        name: deptName,
        description: `${deptName} Department at ${hospital.name}`,
        hospitalId: hospital._id,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        icon: 'stethoscope',
      }));
      const created = await Department.insertMany(depts);
      allDepartments.push(...created);
      console.log(`   Created ${created.length} departments for ${hospital.name}`);
    }
    console.log(`✅ Created ${allDepartments.length} departments total\n`);

    // Assign doctors to departments
    const cardiologyDept = allDepartments.find((d) => d.name === 'Cardiology');
    const neurologyDept = allDepartments.find((d) => d.name === 'Neurology');
    const pediatricsDept = allDepartments.find((d) => d.name === 'Pediatrics');
    const orthopedicsDept = allDepartments.find((d) => d.name === 'Orthopedics');

    if (doctors[0] && cardiologyDept) {
      await User.findByIdAndUpdate(doctors[0]._id, { departmentId: cardiologyDept._id, department: 'Cardiology' });
    }
    if (doctors[1] && neurologyDept) {
      await User.findByIdAndUpdate(doctors[1]._id, { departmentId: neurologyDept._id, department: 'Neurology' });
    }
    if (doctors[2] && pediatricsDept) {
      await User.findByIdAndUpdate(doctors[2]._id, { departmentId: pediatricsDept._id, department: 'Pediatrics' });
    }
    if (doctors[3] && orthopedicsDept) {
      await User.findByIdAndUpdate(doctors[3]._id, { departmentId: orthopedicsDept._id, department: 'Orthopedics' });
    }

    // Create sample tokens for today
    console.log('🎫 Creating sample tokens...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sampleTokens = [];
    let tokenNumber = 1;

    // Create tokens for first doctor
    for (let i = 0; i < 10; i++) {
      const patient = patients[i % patients.length];
      const bookedAt = new Date(today);
      bookedAt.setHours(9 + Math.floor(i / 2), (i % 2) * 30);

      let status = 'waiting';
      if (i < 3) status = 'completed';
      else if (i === 3) status = 'in-progress';

      sampleTokens.push({
        tokenNumber: tokenNumber++,
        patientId: patient._id,
        hospitalId: createdHospitals[0]._id,
        departmentId: cardiologyDept?._id || allDepartments[0]._id,
        doctorId: doctors[0]._id,
        date: today,
        status,
        type: i % 3 === 0 ? 'walk-in' : 'online',
        bookedAt,
        calledAt: status !== 'waiting' ? new Date(bookedAt.getTime() + 300000) : undefined,
        consultationStartedAt: status === 'completed' ? new Date(bookedAt.getTime() + 360000) : undefined,
        consultationEndedAt: status === 'completed' ? new Date(bookedAt.getTime() + 1200000) : undefined,
        estimatedWaitTime: (10 - i) * 15,
        actualWaitTime: status === 'completed' ? Math.floor((bookedAt.getTime() - bookedAt.getTime()) / 60000) + 30 : undefined,
      });
    }

    if (sampleTokens.length > 0) {
      await Token.insertMany(sampleTokens);
      console.log(`✅ Created ${sampleTokens.length} sample tokens\n`);

      // Create queue entry
      await Queue.create({
        hospitalId: createdHospitals[0]._id,
        departmentId: cardiologyDept?._id || allDepartments[0]._id,
        doctorId: doctors[0]._id,
        date: today,
        currentToken: 4,
        servingToken: 4,
        totalTokens: tokenNumber - 1,
        waitingCount: 6,
        completedCount: 3,
        skippedCount: 0,
        averageConsultationTime: 15,
        estimatedWaitTime: 90,
        status: 'active',
      });
      console.log('✅ Created queue entry\n');
    }

    // Summary
    console.log('\n📊 Seed Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Hospitals:     ${createdHospitals.length}`);
    console.log(`   Departments:   ${allDepartments.length}`);
    console.log(`   Users:         ${createdUsers.length}`);
    console.log(`     - Admin:     ${createdUsers.filter((u) => u.role === 'admin').length}`);
    console.log(`     - Doctors:   ${createdUsers.filter((u) => u.role === 'doctor').length}`);
    console.log(`     - Reception: ${createdUsers.filter((u) => u.role === 'receptionist').length}`);
    console.log(`     - Patients:  ${createdUsers.filter((u) => u.role === 'patient').length}`);
    console.log(`   Tokens:        ${sampleTokens.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🔐 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Admin:        admin@example.com / password123');
    console.log('   Doctor:       doctor@example.com / password123');
    console.log('   Receptionist: receptionist@example.com / password123');
    console.log('   Patient:      patient@example.com / password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Database seeded successfully!\n');

    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
