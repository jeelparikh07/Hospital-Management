'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Building, Stethoscope, ArrowLeft, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { appointmentAPI, tokenAPI } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface Appointment {
  _id: string;
  tokenNumber: number;
  hospitalId: {
    _id: string;
    name: string;
  };
  departmentId: {
    _id: string;
    name: string;
  };
  doctorId: {
    _id: string;
    name: string;
    specialization: string;
  };
  status: string;
  statusLabel?: string;
  appointmentDate: string;
  bookingTimestamp: string;
  slotName: string;
  slotTime: string;
  isToday?: boolean;
  isUpcoming?: boolean;
}

export default function MyTokensPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'today' | 'past'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          router.push('/login');
          return;
        }

        // Decode user from token
        const base64Url = authToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));

        // Load appointments
        const apptRes = await appointmentAPI.getMyAppointments();
        setAppointments(apptRes.data.data.appointments || []);

        // Also load legacy tokens
        const tokenRes = await tokenAPI.getPatientTokens(payload.userId);
        setTokens(tokenRes.data.data.tokens || []);
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast.error('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentAPI.cancel(id);
      toast.success('Appointment cancelled');
      // Refresh data
      const apptRes = await appointmentAPI.getMyAppointments();
      setAppointments(apptRes.data.data.appointments || []);
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Combine appointments and tokens, sort by date
  const allBookings = [
    ...appointments.map(appt => ({
      ...appt,
      type: 'appointment' as const,
    })),
    ...tokens.map(token => ({
      ...token,
      type: 'token' as const,
      statusLabel: token.status.toUpperCase(),
      isToday: new Date(token.date).toDateString() === new Date().toDateString(),
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.appointmentDate || a.date).getTime();
    const dateB = new Date(b.appointmentDate || b.date).getTime();
    return dateB - dateA; // Most recent first
  });

  // Filter based on tab and status
  const filteredBookings = allBookings.filter((booking) => {
    // Tab filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.appointmentDate || booking.date);
    bookingDate.setHours(0, 0, 0, 0);

    if (activeTab === 'upcoming' && !booking.isUpcoming && bookingDate <= today) return false;
    if (activeTab === 'today' && !booking.isToday) return false;
    if (activeTab === 'past' && bookingDate >= today) return false;

    // Status filter
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false;

    return true;
  });

  const getStatusBadge = (status: string, statusLabel?: string) => {
    const label = statusLabel || status;
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      pending: 'warning',
      completed: 'success',
      cancelled: 'danger',
      'no-show': 'danger',
      waiting: 'warning',
      'in-progress': 'info',
      REMAINING: 'warning',
      UPCOMING: 'info',
      TODAY: 'warning',
      DONE: 'success',
    };

    return (
      <Badge variant={variants[status] || variants[label] || 'default'}>
        {label.replace('-', ' ')}
      </Badge>
    );
  };

  const getAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/patient/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-sm text-gray-500">View all your booked appointments and tokens</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Tabs */}
        <Card className="mb-6 p-2">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'today'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'past'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Past
            </button>
          </div>
        </Card>

        {/* Filter */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="waiting">Waiting</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </Card>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {allBookings.length === 0 ? 'No appointments yet' : 'No bookings match the filter'}
              </h3>
              {allBookings.length === 0 && (
                <>
                  <p className="text-gray-500 mb-4">Book your first appointment to get started</p>
                  <Link href="/patient/dashboard">
                    <Button>
                      <Calendar className="w-5 h-5" />
                      Book Appointment
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
                      {booking.tokenNumber}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {booking.doctorId?.name}
                      </h3>
                      <p className="text-sm text-gray-500">{booking.doctorId?.specialization}</p>
                    </div>
                  </div>
                  {getStatusBadge(booking.status, booking.statusLabel)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Hospital</p>
                      <p className="font-medium">{booking.hospitalId?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Stethoscope className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium">{booking.departmentId?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Appointment Date</p>
                      <p className="font-medium">{getAppointmentDate(booking.appointmentDate || booking.date)}</p>
                    </div>
                  </div>
                </div>

                {booking.slotName && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{booking.slotName}</span>
                      <span>({booking.slotTime})</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Booked:</span>{' '}
                    {new Date(booking.bookingTimestamp || booking.bookedAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.type === 'appointment' && booking.status === 'pending' && (
                      <>
                        {booking.isToday && (
                          <Link href={`/patient/queue/${booking._id}`}>
                            <Button size="sm">Track Queue</Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelAppointment(booking._id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {booking.type === 'token' && booking.status === 'waiting' && (
                      <Link href={`/patient/queue/${booking._id}`}>
                        <Button size="sm">Track Queue</Button>
                      </Link>
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
