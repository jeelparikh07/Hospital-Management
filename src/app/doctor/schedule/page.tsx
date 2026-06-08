'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  CheckCircle,
  X,
  Save,
  AlertCircle,
  Stethoscope,
  Sun,
  Moon,
  Coffee
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { scheduleAPI, appointmentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Schedule {
  _id: string;
  doctorId: any;
  hospitalId: any;
  departmentId: any;
  date: string;
  slots: Slot[];
  status: string;
}

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

// Helper function to get today's date as YYYY-MM-DD string in local timezone
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to parse YYYY-MM-DD string to Date object (local timezone)
const parseLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function DoctorSchedule() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => parseLocalDateString(getLocalDateString()));
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  // Form state
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSchedules();
    }
  }, [user, selectedDate]);

  const loadSchedules = async () => {
    try {
      if (!user?.id) return;

      // Get all schedules (no date filter - load everything)
      const res = await scheduleAPI.getAll({ doctorId: user.id });

      setSchedules(res.data.data.schedules || []);
    } catch (error: any) {
      console.error('Error loading schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = () => {
    setSelectedSlots([
      ...selectedSlots,
      {
        slotName: 'Morning',
        startTime: '09:00',
        endTime: '12:00',
        maxPatients: 10,
        isActive: true,
        bookedCount: 0,
      },
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setSelectedSlots(selectedSlots.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: keyof Slot, value: any) => {
    const updated = [...selectedSlots];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedSlots(updated);
  };

  const handleSaveSchedule = async () => {
    if (selectedSlots.length === 0) {
      toast.error('Please add at least one slot');
      return;
    }

    setIsSaving(true);
    try {
      // Check if schedule exists for this date - use local date string
      const dateStr = getLocalDateString(selectedDate);
      const existingSchedule = schedules.find(s => {
        // s.date is now a string "YYYY-MM-DD"
        return s.date === dateStr;
      });

      if (existingSchedule) {
        // Update existing
        await scheduleAPI.update(existingSchedule._id, {
          slots: selectedSlots,
        });
        toast.success('Schedule updated successfully');
      } else {
        // Create new
        await scheduleAPI.create({
          date: dateStr,
          slots: selectedSlots,
        });
        toast.success('Schedule created successfully');
      }

      setShowAddModal(false);
      setSelectedSlots([]);
      loadSchedules();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    // schedule.date is now a string "YYYY-MM-DD"
    setSelectedDate(parseLocalDateString(schedule.date));
    setSelectedSlots(schedule.slots.map(slot => ({ ...slot })));
    setShowAddModal(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This cannot be undone.')) {
      return;
    }

    try {
      await scheduleAPI.delete(scheduleId);
      toast.success('Schedule deleted successfully');
      loadSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const handleDeleteSlot = async (scheduleId: string, slotIndex: number) => {
    if (!confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      await scheduleAPI.deleteSlot(scheduleId, slotIndex);
      toast.success('Slot deleted successfully');
      loadSchedules();
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      toast.error(error.response?.data?.message || 'Failed to delete slot');
    }
  };

  const getSlotIcon = (slotName: string) => {
    const name = slotName.toLowerCase();
    if (name.includes('morning')) return Sun;
    if (name.includes('afternoon')) return Coffee;
    if (name.includes('evening') || name.includes('night')) return Moon;
    return Clock;
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = getLocalDateString(date);
    return schedules.filter(s => {
      // s.date is now a string "YYYY-MM-DD"
      return s.date === dateStr;
    });
  };

  const getTotalSlots = (schedules: Schedule[]) => {
    return schedules.reduce((sum, s) => sum + s.slots.length, 0);
  };

  const getTotalBookings = (schedules: Schedule[]) => {
    return schedules.reduce((sum, s) => 
      sum + s.slots.reduce((slotSum, slot) => slotSum + slot.bookedCount, 0), 0
    );
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/doctor/dashboard">
              <ChevronLeft className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
              <p className="text-sm text-gray-500">Create and manage your appointment slots</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'month' ? 'list' : 'month')}
            >
              {viewMode === 'month' ? 'List View' : 'Calendar View'}
            </Button>
            <Button onClick={() => {
              setSelectedDate(parseLocalDateString(getLocalDateString()));
              setSelectedSlots([]);
              setShowAddModal(true);
            }}>
              <Plus className="w-5 h-5" />
              Add Schedule
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
                <p className="text-sm text-gray-500">Scheduled Days</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{getTotalSlots(schedules)}</p>
                <p className="text-sm text-gray-500">Total Slots</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{getTotalBookings(schedules)}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : viewMode === 'month' ? (
          /* Calendar View */
          <Card>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(selectedDate).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const daySchedules = getSchedulesForDate(date);
                const hasSchedule = daySchedules.length > 0;
                const totalSlots = getTotalSlots(daySchedules);
                const totalBookings = getTotalBookings(daySchedules);
                const isPastDate = isPast(date);

                return (
                  <motion.div
                    key={date.toISOString()}
                    whileHover={{ scale: 1.02 }}
                    className={`aspect-square p-2 border rounded-lg cursor-pointer transition-all ${
                      isToday(date)
                        ? 'border-primary-600 bg-primary-50'
                        : isPastDate
                        ? 'border-gray-200 bg-gray-50'
                        : hasSchedule
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => {
                      if (!isPastDate) {
                        setSelectedDate(date);
                        const existing = daySchedules[0];
                        if (existing) {
                          handleEditSchedule(existing);
                        } else {
                          setSelectedSlots([]);
                          setShowAddModal(true);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${
                        isToday(date)
                          ? 'text-primary-600'
                          : isPastDate
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }`}>
                        {date.getDate()}
                      </span>
                      {hasSchedule && !isPastDate && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    {hasSchedule && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          {totalSlots} slot{totalSlots > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {totalBookings} booked
                        </div>
                      </div>
                    )}
                    {!hasSchedule && !isPastDate && (
                      <div className="text-xs text-gray-400 text-center mt-2">
                        No slots
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </Card>
        ) : (
          /* List View */
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No schedules yet</h3>
                  <p className="text-gray-500 mb-6">Create your first schedule to start accepting appointments</p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-5 h-5" />
                    Create Schedule
                  </Button>
                </div>
              </Card>
            ) : (
              schedules.map((schedule) => (
                <Card key={schedule._id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {new Date(schedule.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {schedule.slots.length} slot(s) • {getTotalBookings([schedule])} booking(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {schedule.slots.map((slot, index) => {
                      const SlotIcon = getSlotIcon(slot.slotName);
                      return (
                        <div
                          key={slot._id || index}
                          className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <SlotIcon className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-900">{slot.slotName}</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant={slot.bookedCount >= slot.maxPatients ? 'danger' : 'success'}>
                              {slot.maxPatients - slot.bookedCount} / {slot.maxPatients} available
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSlot(schedule._id, index)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Schedule Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="w-full max-w-[580px] my-8 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                style={{ pointerEvents: 'auto' }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {schedules.find(s => s.date === getLocalDateString(selectedDate)) ? 'Edit Schedule' : 'Create Schedule'}
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-all duration-200"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                  {/* Date Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Select Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={getLocalDateString(selectedDate)}
                        onChange={(e) => {
                          const newDate = parseLocalDateString(e.target.value);
                          const today = parseLocalDateString(getLocalDateString());
                          if (newDate < today) {
                            toast.error('Cannot create schedule for past dates');
                            return;
                          }
                          setSelectedDate(newDate);
                        }}
                        min={getLocalDateString()}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-700 font-medium"
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Time Slots Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Time Slots
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddSlot}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" />
                        Add Slot
                      </motion.button>
                    </div>

                    {selectedSlots.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
                      >
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No slots added yet</p>
                        <p className="text-sm mt-1">Click "Add Slot" to create your first time slot</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence>
                          {selectedSlots.map((slot, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: -20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              {/* Slot Header */}
                              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Slot {index + 1}
                                </h4>
                                <motion.button
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveSlot(index)}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-100 p-2 rounded-full transition-all duration-200"
                                  aria-label="Remove slot"
                                >
                                  <X className="w-5 h-5" />
                                </motion.button>
                              </div>

                              {/* Slot Fields Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Name Field */}
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                    Name
                                  </label>
                                  <select
                                    value={slot.slotName}
                                    onChange={(e) => handleUpdateSlot(index, 'slotName', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer"
                                  >
                                    <option value="Morning">🌅 Morning</option>
                                    <option value="Afternoon">☀️ Afternoon</option>
                                    <option value="Evening">🌆 Evening</option>
                                    <option value="Night">🌙 Night</option>
                                    <option value="General">📋 General</option>
                                  </select>
                                </div>

                                {/* Start Time Field */}
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                    Start
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => handleUpdateSlot(index, 'startTime', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                  />
                                </div>

                                {/* End Time Field */}
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                    End
                                  </label>
                                  <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => handleUpdateSlot(index, 'endTime', e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                  />
                                </div>

                                {/* Max Patients Field */}
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                    Max Patients
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={slot.maxPatients}
                                    onChange={(e) => handleUpdateSlot(index, 'maxPatients', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-12 px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveSchedule}
                    disabled={selectedSlots.length === 0 || isSaving}
                    className="flex-1 h-12 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Schedule
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
