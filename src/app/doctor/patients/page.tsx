'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  CalendarDays,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { appointmentAPI, tokenAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

export default function DoctorPatients() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all' | 'completed'>('today');
  const [todayQueue, setTodayQueue] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [activeTab, user]);

  const loadAppointments = async () => {
    try {
      if (!user?.id) return;

      setIsLoading(true);
      
      // Load based on active tab
      if (activeTab === 'today') {
        const res = await appointmentAPI.getDoctorAppointments(user.id, { type: 'today' });
        const appointments = res.data.data.appointments || [];
        // Filter to only pending (remaining) for today's queue
        setTodayQueue(appointments.filter((a: any) => a.status === 'pending'));
      } else if (activeTab === 'upcoming') {
        const res = await appointmentAPI.getDoctorAppointments(user.id, { type: 'upcoming' });
        setAllAppointments(res.data.data.appointments || []);
      } else if (activeTab === 'completed') {
        const res = await appointmentAPI.getDoctorAppointments(user.id, { type: 'completed' });
        setAllAppointments(res.data.data.appointments || []);
      } else {
        // All appointments
        const res = await appointmentAPI.getDoctorAppointments(user.id, { type: 'all' });
        setAllAppointments(res.data.data.appointments || []);
      }
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    setIsCompleting(appointmentId);
    try {
      await appointmentAPI.complete(appointmentId);
      toast.success('Appointment completed');
      loadAppointments();
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setIsCompleting(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentAPI.cancel(appointmentId);
      toast.success('Appointment cancelled');
      loadAppointments();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const filteredAppointments = (activeTab === 'today' ? todayQueue : allAppointments).filter(
    (appt) =>
      appt.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.patientId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, statusLabel?: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      pending: 'warning',
      completed: 'success',
      cancelled: 'danger',
      'no-show': 'danger',
      REMAINING: 'warning',
      UPCOMING: 'info',
      TODAY: 'warning',
    };

    return (
      <Badge variant={variants[status] || variants[statusLabel || ''] || 'default'}>
        {statusLabel || status}
      </Badge>
    );
  };

  const getAppointmentDate = (appointmentDate: string) => {
    const apptDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (apptDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (apptDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
              <h1 className="text-2xl font-bold text-gray-900">Patient Appointments</h1>
              <p className="text-sm text-gray-500">Manage your appointments and patient queue</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-4">
        <Card className="p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'today'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              Today's Queue
              {todayQueue.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'today' ? 'bg-white/20' : 'bg-primary-100 text-primary-600'
                }`}>
                  {todayQueue.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'upcoming'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Completed
            </button>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Search */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                {activeTab === 'today' ? (
                  <CheckCircle className="w-10 h-10 text-gray-400" />
                ) : activeTab === 'upcoming' ? (
                  <CalendarDays className="w-10 h-10 text-gray-400" />
                ) : activeTab === 'completed' ? (
                  <TrendingUp className="w-10 h-10 text-gray-400" />
                ) : (
                  <Users className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === 'today'
                  ? 'No patients in queue'
                  : activeTab === 'upcoming'
                  ? 'No upcoming appointments'
                  : activeTab === 'completed'
                  ? 'No completed appointments'
                  : 'No appointments yet'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'today'
                  ? 'All patients have been seen or no appointments for today'
                  : activeTab === 'upcoming'
                  ? 'Future appointments will appear here'
                  : 'Appointments will appear here'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <motion.div
                key={appointment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar name={appointment.patientId?.name || 'Patient'} size="lg" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {appointment.patientId?.name || 'Unknown Patient'}
                        </h3>
                        {getStatusBadge(appointment.status, appointment.statusLabel)}
                      </div>
                      <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{appointment.patientId?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{appointment.patientId?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {getAppointmentDate(appointment.appointmentDate)}
                            {appointment.isToday && (
                              <Badge variant="warning" className="ml-2">Today</Badge>
                            )}
                            {appointment.isUpcoming && (
                              <Badge variant="info" className="ml-2">Upcoming</Badge>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>Token #{appointment.tokenNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{appointment.slotName} ({appointment.slotTime})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                          <span>
                            Booked: {new Date(appointment.bookingTimestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {activeTab === 'today' && appointment.status === 'pending' && (
                      <Button
                        onClick={() => handleCompleteAppointment(appointment._id)}
                        isLoading={isCompleting === appointment._id}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="w-4 h-4" />
                        Mark Done
                      </Button>
                    )}
                    {activeTab === 'today' && appointment.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                    {(activeTab === 'upcoming' || activeTab === 'all') && appointment.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
