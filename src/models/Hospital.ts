import mongoose, { Document, Schema } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  logo?: string;
  departments: string[];
  totalDoctors: number;
  totalStaff: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSchema = new Schema<IHospital>(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    departments: {
      type: [String],
      default: [],
    },
    totalDoctors: {
      type: Number,
      default: 0,
    },
    totalStaff: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Hospital = mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', hospitalSchema);

export default Hospital;
