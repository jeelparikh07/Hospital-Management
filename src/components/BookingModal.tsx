'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Building2,
  AlertCircle
} from 'lucide-react';
import { scheduleAPI, appointmentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

interface Slot {
  _id?: string;
  slotName: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  bookedCount: number;
  isActive: boolean;
  availableSlots?: number;
  isFull?: boolean;
  isExpired?: boolean;
}

interface Schedule {
  _id: string;
  doctorId: any;
  date: string;
  slots: Slot[];
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHospital: string;
  selectedDepartment: string;
  selectedDoctor: string;
  onSuccess: () => void;
}

// Helper function to get local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to parse YYYY-MM-DD string to Date object
const parseLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function BookingModal({
  isOpen,
  onClose,
  selectedHospital,
  selectedDepartment,
  selectedDoctor,
  onSuccess,
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseLocalDateString(getLocalDateString()));
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [viewMode, setViewMode] = useState<'date' | 'slot'>('date');

  // Load schedules for the selected doctor
  useEffect(() => {
    if (isOpen && selectedDoctor) {
      loadSchedules();
    }
  }, [isOpen, selectedDoctor, selectedDate]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);

      console.log('[BookingModal] Loading schedules for doctor:', selectedDoctor);
      
      // Get availability for next 7 days
      const availRes = await scheduleAPI.getAvailability(selectedDoctor);
      console.log('[BookingModal] Availability:', availRes.data);

      // Load schedules for the selected doctor using the dedicated endpoint
      const scheduleRes = await scheduleAPI.getByDoctor(selectedDoctor);
      console.log('[BookingModal] Schedule response:', scheduleRes.data);

      const schedules = scheduleRes.data?.data?.schedules || [];
      console.log('[BookingModal] Found', schedules.length, 'schedules');
      
      setSchedules(schedules);
    } catch (error: any) {
      console.error('[BookingModal] Error loading schedules:', error);
      toast.error('Failed to load available slots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || selectedSlotIndex < 0) {
      toast.error('Please select a time slot');
      return;
    }

    setIsBooking(true);
    try {
      // Find the schedule for the selected date - use local date string
      const dateStr = getLocalDateString(selectedDate);
      const schedule = schedules.find(s => {
        // s.date is now a string "YYYY-MM-DD"
        return s.date === dateStr;
      });

      if (!schedule) {
        toast.error('Schedule not found');
        return;
      }

      await appointmentAPI.book({
        doctorId: selectedDoctor,
        hospitalId: selectedHospital,
        departmentId: selectedDepartment,
        scheduleId: schedule._id,
        slotIndex: selectedSlotIndex,
        appointmentDate: dateStr,
        notes: notes || '',
      });

      toast.success('Appointment booked successfully!');
      onSuccess();
      onClose();
      setSelectedSlot(null);
      setSelectedSlotIndex(-1);
      setNotes('');
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = getLocalDateString(date);
    return schedules.filter(s => {
      // s.date is now a string "YYYY-MM-DD"
      return s.date === dateStr;
    });
  };

  const hasAvailableSlots = (date: Date) => {
    const daySchedules = getSchedulesForDate(date);
    return daySchedules.some(s => 
      s.slots.some(slot => slot.isActive && slot.bookedCount < slot.maxPatients)
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getDaysInWeek = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    setSelectedDate(newDate);
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{ pointerEvents: 'none' }}
          >
            <div 
              className="w-full max-w-3xl my-8 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 py-4 border-b px-6">
                <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* Week Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateWeek('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                  </h3>
                  <button
                    onClick={() => navigateWeek('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Week View */}
                <div className="grid grid-cols-7 gap-2">
                  {getDaysInWeek().map((date, index) => {
                    const daySchedules = getSchedulesForDate(date);
                    const hasSlots = hasAvailableSlots(date);
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    const isPastDate = isPast(date);

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: isPastDate ? 1 : 1.05 }}
                        onClick={() => !isPastDate && setSelectedDate(date)}
                        disabled={isPastDate}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50'
                            : isPastDate
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            : hasSlots
                            ? 'border-green-300 bg-green-50 hover:border-primary-300'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">
                            {dayNames[date.getDay()]}
                          </div>
                          <div className={`text-lg font-bold ${
                            isToday(date)
                              ? 'text-primary-600'
                              : isPastDate
                              ? 'text-gray-400'
                              : 'text-gray-700'
                          }`}>
                            {date.getDate()}
                          </div>
                          {hasSlots && !isPastDate && (
                            <div className="mt-1">
                              <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                            </div>
                          )}
                          {!hasSlots && !isPastDate && (
                            <div className="mt-1 text-xs text-gray-400">
                              No slots
                            </div>
                          )}
                          {isPastDate && (
                            <div className="mt-1 text-xs text-gray-400">
                              Past
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Available Slots for Selected Date */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Available Slots for {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {isToday(selectedDate) && <Badge variant="warning" className="ml-2">Today</Badge>}
                  </h3>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {(() => {
                        const daySchedules = getSchedulesForDate(selectedDate);
                        const allSlots: Array<{ slot: Slot; index: number }> = [];
                        
                        daySchedules.forEach(schedule => {
                          schedule.slots.forEach((slot, index) => {
                            if (slot.isActive) {
                              allSlots.push({ slot, index });
                            }
                          });
                        });

                        if (allSlots.length === 0) {
                          return (
                            <div className="col-span-full text-center py-8 text-gray-500">
                              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No slots available for this date</p>
                              <p className="text-sm">Please select another date</p>
                            </div>
                          );
                        }

                        return allSlots.map(({ slot, index }) => {
                          const available = Math.max(0, slot.maxPatients - slot.bookedCount);
                          const isFull = available === 0;
                          const SlotIcon = slot.slotName.toLowerCase().includes('morning')
                            ? '🌅'
                            : slot.slotName.toLowerCase().includes('afternoon')
                            ? '☀️'
                            : slot.slotName.toLowerCase().includes('evening')
                            ? '🌆'
                            : '🌙';

                          return (
                            <motion.button
                              key={index}
                              whileHover={{ scale: isFull ? 1 : 1.02 }}
                              whileTap={{ scale: isFull ? 1 : 0.98 }}
                              onClick={() => {
                                if (!isFull) {
                                  setSelectedSlot(slot);
                                  setSelectedSlotIndex(index);
                                }
                              }}
                              disabled={isFull}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                selectedSlot === slot
                                  ? 'border-primary-600 bg-primary-50'
                                  : isFull
                                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                                  : 'border-gray-200 hover:border-primary-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{SlotIcon}</span>
                                    <span className="font-semibold text-gray-900">{slot.slotName}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-2">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {available} / {slot.maxPatients} slots available
                                    </span>
                                  </div>
                                </div>
                                {isFull ? (
                                  <Badge variant="danger">Full</Badge>
                                ) : selectedSlot === slot ? (
                                  <Badge variant="success">Selected</Badge>
                                ) : (
                                  <Badge variant="success">Available</Badge>
                                )}
                              </div>
                            </motion.button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedSlot && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific symptoms or concerns..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </motion.div>
                )}

                {/* Booking Summary & Confirm */}
                {selectedSlot && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 rounded-xl border border-green-200"
                  >
                    <h4 className="font-semibold text-green-900 mb-2">Booking Summary</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <div><strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      <div><strong>Slot:</strong> {selectedSlot.slotName} ({selectedSlot.startTime} - {selectedSlot.endTime})</div>
                      <div><strong>Available:</strong> {Math.max(0, selectedSlot.maxPatients - selectedSlot.bookedCount)} slots remaining</div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBookAppointment}
                    isLoading={isBooking}
                    disabled={!selectedSlot}
                    className="flex-1"
                  >
                    {isBooking ? 'Booking...' : 'Confirm Appointment'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
