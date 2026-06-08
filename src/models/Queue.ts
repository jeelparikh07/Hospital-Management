import mongoose, { Document, Schema } from 'mongoose';

export interface IQueue extends Document {
  hospitalId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  date: Date;
  currentToken: number;
  servingToken: number;
  totalTokens: number;
  waitingCount: number;
  completedCount: number;
  skippedCount: number;
  averageConsultationTime: number; // in minutes
  estimatedWaitTime: number; // in minutes
  status: 'active' | 'paused' | 'closed';
  lastUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const queueSchema = new Schema<IQueue>(
  {
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
    currentToken: {
      type: Number,
      default: 0,
    },
    servingToken: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    waitingCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    averageConsultationTime: {
      type: Number,
      default: 15,
    },
    estimatedWaitTime: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
queueSchema.index({ hospitalId: 1, departmentId: 1, doctorId: 1, date: 1 });

const Queue = mongoose.models.Queue || mongoose.model<IQueue>('Queue', queueSchema);

export default Queue;
