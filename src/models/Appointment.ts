import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  scheduleId: mongoose.Types.ObjectId;
  slotIndex: number; // Index of the slot in the schedule's slots array
  slotName: string; // e.g., "Morning", "Evening"
  slotTime: string; // e.g., "09:00-12:00"
  appointmentDate: string; // Store as "YYYY-MM-DD" string to avoid timezone issues
  tokenNumber: number; // Auto-generated token number for the day
  bookingTimestamp: Date; // When the booking was made
  status: 'pending' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Static method types
interface IAppointmentModel extends Model<IAppointment> {
  getNextTokenNumber(doctorId: mongoose.Types.ObjectId, appointmentDate: Date): Promise<number>;
  hasExistingBooking(patientId: mongoose.Types.ObjectId, doctorId: mongoose.Types.ObjectId, appointmentDate: Date): Promise<boolean>;
}

interface IAppointmentInstance extends IAppointment {
  markCompleted(): Promise<void>;
  markCancelled(): Promise<void>;
}

const appointmentSchema = new Schema<IAppointmentInstance>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
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
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    slotIndex: {
      type: Number,
      required: true,
    },
    slotName: {
      type: String,
      required: true,
    },
    slotTime: {
      type: String,
      required: true,
    },
    appointmentDate: {
      type: String,
      required: true,
      index: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    bookingTimestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ scheduleId: 1, slotIndex: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });

// Static method to get next token number for a doctor on a specific date
appointmentSchema.statics.getNextTokenNumber = async function(doctorId: mongoose.Types.ObjectId, appointmentDate: Date | string) {
  // Convert to string for comparison
  const dateStr = typeof appointmentDate === 'string' ? appointmentDate : appointmentDate.toISOString().split('T')[0];
  const tomorrow = new Date(dateStr + 'T00:00:00');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const lastAppointment = await this.findOne({
    doctorId,
    appointmentDate: dateStr,
  }).sort({ tokenNumber: -1 });

  return lastAppointment ? lastAppointment.tokenNumber + 1 : 1;
};

// Static method to check if patient already booked for same doctor and date
appointmentSchema.statics.hasExistingBooking = async function(
  patientId: mongoose.Types.ObjectId,
  doctorId: mongoose.Types.ObjectId,
  appointmentDate: Date | string
) {
  // Convert to string for comparison
  const dateStr = typeof appointmentDate === 'string' ? appointmentDate : appointmentDate.toISOString().split('T')[0];

  const existing = await this.findOne({
    patientId,
    doctorId,
    appointmentDate: dateStr,
    status: { $in: ['pending', 'completed'] },
  });

  return !!existing;
};

// Helper method to mark appointment as completed
appointmentSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
};

// Helper method to mark appointment as cancelled
appointmentSchema.methods.markCancelled = async function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  await this.save();
};

const Appointment = (mongoose.models.Appointment || mongoose.model<IAppointmentInstance, IAppointmentModel>('Appointment', appointmentSchema)) as IAppointmentModel;

export default Appointment;
