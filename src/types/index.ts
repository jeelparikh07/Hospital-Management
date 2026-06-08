// Enhanced types for QueueMed Admin Panel

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  specialization: string;
  floorNumber?: string;
  roomNumbers?: string;
  maxDailyPatients?: number;
  headDoctorId?: string;
  doctorCount: number;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  hospitalId?: string;
  departmentId?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  availableDays?: string[];
  workingHours?: { start: string; end: string };
  status: 'Active' | 'Inactive' | 'On Leave';
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Doctor' | 'Patient' | 'Receptionist';
  status: 'Active' | 'Inactive';
  linkedDoctorId?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  assignedHospitalId?: string;
  avatar?: string;
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  logo?: string;
  operatingHours?: { open: string; close: string };
  bedCapacity?: number;
  description?: string;
  websiteUrl?: string;
  departments?: string[];
  totalDoctors: number;
  totalStaff: number;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  category: 'System' | 'Hospital' | 'Doctor' | 'User' | 'Alert';
  isRead: boolean;
  timestamp: string;
  relatedEntity?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'Hospital' | 'Doctor' | 'User' | 'Department';
  entityName: string;
  details: string;
  performedBy: string;
}

export interface Settings {
  general: {
    systemName: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
  };
  appearance: {
    darkMode: boolean;
    primaryColor: string;
    sidebarStyle: 'Full' | 'Compact' | 'Icons Only';
    animations: boolean;
  };
  queue: {
    tokenPrefix: string;
    maxTokensPerDay: number;
    tokenResetTime: string;
    allowWalkIns: boolean;
    defaultAppointmentDuration: number;
  };
  security: {
    sessionTimeout: number;
  };
}

export type SpecializationCategory =
  | 'Cardiology'
  | 'Neurology'
  | 'Orthopedics'
  | 'Dermatology'
  | 'Nephrology'
  | 'Pediatrics'
  | 'Oncology'
  | 'Psychiatry'
  | 'Radiology'
  | 'Emergency Medicine'
  | 'General Surgery'
  | 'Internal Medicine'
  | 'Ophthalmology'
  | 'ENT'
  | 'Gynecology'
  | 'Urology'
  | 'Gastroenterology'
  | 'Endocrinology'
  | 'Pulmonology'
  | 'Rheumatology'
  | 'Custom';

export const SPECIALIZATION_CATEGORIES: SpecializationCategory[] = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Dermatology',
  'Nephrology',
  'Pediatrics',
  'Oncology',
  'Psychiatry',
  'Radiology',
  'Emergency Medicine',
  'General Surgery',
  'Internal Medicine',
  'Ophthalmology',
  'ENT',
  'Gynecology',
  'Urology',
  'Gastroenterology',
  'Endocrinology',
  'Pulmonology',
  'Rheumatology',
  'Custom',
];
