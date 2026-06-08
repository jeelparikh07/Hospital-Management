import mongoose, { Document, Schema } from 'mongoose';

// Slot sub-schema - each schedule can have multiple slots per day
export interface IScheduleSlot {
  slotName: string; // e.g., "Morning", "Afternoon", "Evening"
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "12:00"
  maxPatients: number; // Maximum patients for this slot
  bookedCount: number; // Current bookings for this slot
  isActive: boolean; // Whether this slot is active
}

const scheduleSlotSchema = new Schema<IScheduleSlot>({
  slotName: {
    type: String,
    required: true,
    default: 'General',
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  maxPatients: {
    type: Number,
    required: true,
    default: 10,
  },
  bookedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

export interface ISchedule extends Document {
  doctorId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  date: string; // Store as "YYYY-MM-DD" string to avoid timezone issues
  slots: IScheduleSlot[]; // Array of slots for this date
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ISchedule>(
  {
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
    date: {
      type: String,
      required: true,
      index: true,
    },
    slots: {
      type: [scheduleSlotSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
scheduleSchema.index({ doctorId: 1, date: 1 });
scheduleSchema.index({ doctorId: 1, date: 1, status: 1 });
scheduleSchema.index({ hospitalId: 1, departmentId: 1, date: 1 });

// Helper method to compare date strings
scheduleSchema.methods.isDateEqualTo = function(compareDate: Date | string): boolean {
  const thisDate = this.date as string;
  const compareStr = typeof compareDate === 'string' ? compareDate : compareDate.toISOString().split('T')[0];
  return thisDate === compareStr;
};

// Helper method to get available slots for a specific slot
scheduleSchema.methods.getAvailableSlots = function(slotIndex: number) {
  if (!this.slots[slotIndex] || !this.slots[slotIndex].isActive) {
    return 0;
  }
  return Math.max(0, this.slots[slotIndex].maxPatients - this.slots[slotIndex].bookedCount);
};

// Helper method to check if a slot is full
scheduleSchema.methods.isSlotFull = function(slotIndex: number) {
  if (!this.slots[slotIndex] || !this.slots[slotIndex].isActive) {
    return true;
  }
  return this.slots[slotIndex].bookedCount >= this.slots[slotIndex].maxPatients;
};

// Helper method to increment booked count
scheduleSchema.methods.incrementBookedCount = async function(slotIndex: number) {
  if (this.slots[slotIndex]) {
    this.slots[slotIndex].bookedCount += 1;
    await this.save();
  }
};

// Helper method to decrement booked count (for cancellations)
scheduleSchema.methods.decrementBookedCount = async function(slotIndex: number) {
  if (this.slots[slotIndex] && this.slots[slotIndex].bookedCount > 0) {
    this.slots[slotIndex].bookedCount -= 1;
    await this.save();
  }
};

const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', scheduleSchema);

export default Schedule;
