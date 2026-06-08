import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
  tokenNumber: number;
  patientId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  date: Date;
  status: 'waiting' | 'in-progress' | 'completed' | 'skipped' | 'cancelled';
  type: 'online' | 'walk-in';
  bookedAt: Date;
  calledAt?: Date;
  consultationStartedAt?: Date;
  consultationEndedAt?: Date;
  estimatedWaitTime?: number; // in minutes
  actualWaitTime?: number; // in minutes
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    tokenNumber: {
      type: Number,
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
    },
    type: {
      type: String,
      enum: ['online', 'walk-in'],
      default: 'online',
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
    },
    consultationStartedAt: {
      type: Date,
    },
    consultationEndedAt: {
      type: Date,
    },
    estimatedWaitTime: {
      type: Number,
      default: 0,
    },
    actualWaitTime: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
tokenSchema.index({ hospitalId: 1, date: 1, tokenNumber: 1 });
tokenSchema.index({ patientId: 1, date: 1 });
tokenSchema.index({ doctorId: 1, date: 1, status: 1 });

const Token = mongoose.models.Token || mongoose.model<IToken>('Token', tokenSchema);

export default Token;
