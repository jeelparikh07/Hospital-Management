'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Building,
  Stethoscope,
  Building2,
  ChevronRight,
  Plus,
  CheckCircle,
  AlertCircle,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hospitalAPI, departmentAPI, tokenAPI, userAPI, appointmentAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import SlotPicker from '@/components/SlotPicker';
import toast from 'react-hot-toast';

interface Hospital {
  _id: string;
  name: string;
  address: string;
  city: string;
}

interface Department {
  _id: string;
  name: string;
  description: string;
  color: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  consultationDuration: number;
}

export default function PatientDashboard() {
  console.log('*** PATIENT DASHBOARD RENDERING ***');
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, token } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myTokens, setMyTokens] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    console.log('useEffect triggered');
    // Check authentication on mount
    const checkAndLoad = async () => {
      console.log('checkAndLoad starting');
      // Get token from localStorage or cookie
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('Token from localStorage:', !!token);

      if (!token) {
        // Try to get from cookie
        if (typeof window !== 'undefined') {
          const cookieValue = document.cookie.split('; ').find(row => row.startsWith('token='));
          token = cookieValue ? cookieValue.split('=')[1] : null;
          console.log('Token from cookie:', !!token);
          // Restore to localStorage
          if (token) {
            localStorage.setItem('token', token);
            console.log('Token restored from cookie to localStorage');
          }
        }
      }

      console.log('Dashboard mount - Token exists:', !!token);

      if (!token) {
        console.log('No token, redirecting to login');
        router.push('/login');
        return;
      }

      // Decode user from token
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        console.log('Decoded payload:', payload);

        // Load data with the userId from token
        await loadData(payload.userId);
        console.log('Data loaded successfully');
      } catch (e) {
        console.error('Failed to decode token:', e);
        toast.error('Invalid token');
        router.push('/login');
      }
    };

    checkAndLoad();
  }, []);

  const loadData = async (userId: string) => {
    try {
      console.log('Loading data for user:', userId);

      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('Fetching hospitals...');
      const hospitalsRes = await hospitalAPI.getAll();
      console.log('Hospitals response status:', hospitalsRes.status);
      console.log('Hospitals data:', hospitalsRes.data);

      console.log('Fetching tokens for patient...');
      const tokensRes = await tokenAPI.getPatientTokens(userId);
      console.log('Tokens response status:', tokensRes.status);
      console.log('Tokens data:', tokensRes.data);

      setHospitals(hospitalsRes.data.data.hospitals);
      setMyTokens(tokensRes.data.data.tokens || []);
      console.log('State updated - hospitals:', hospitalsRes.data.data.hospitals.length);
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = 'Failed to load dashboard data';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Make sure backend is running on port 5000.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHospitalChange = async (hospitalId: string) => {
    console.log('Hospital selected:', hospitalId);
    setSelectedHospital(hospitalId);
    setSelectedDepartment('');
    setSelectedDoctor('');
    setDepartments([]);
    setDoctors([]);

    try {
      console.log('Fetching departments for hospital:', hospitalId);
      const response = await departmentAPI.getByHospital(hospitalId);
      console.log('Departments response:', response.data);
      setDepartments(response.data.data.departments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleDepartmentChange = async (departmentId: string) => {
    console.log('Department selected:', departmentId);
    setSelectedDepartment(departmentId);
    setSelectedDoctor('');
    setDoctors([]);

    try {
      console.log('Fetching doctors for hospital:', selectedHospital, 'department:', departmentId);
      const response = await userAPI.getDoctors(selectedHospital, departmentId);
      console.log('Doctors response:', response.data);
      setDoctors(response.data.data.doctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    console.log('Doctor selected:', doctorId);
    setSelectedDoctor(doctorId);
  };

  const handleBookToken = async () => {
    console.log('=== handleBookToken called ===');
    console.log('Selected values:', { selectedHospital, selectedDepartment, selectedDoctor });

    if (!selectedHospital || !selectedDepartment || !selectedDoctor) {
      console.log('Validation failed - missing selections');
      toast.error('Please select hospital, department, and doctor');
      return;
    }

    setIsBooking(true);

    try {
      console.log('Calling tokenAPI.bookToken with:', {
        hospitalId: selectedHospital,
        departmentId: selectedDepartment,
        doctorId: selectedDoctor,
        type: 'online',
      });

      const response = await tokenAPI.bookToken({
        hospitalId: selectedHospital,
        departmentId: selectedDepartment,
        doctorId: selectedDoctor,
        type: 'online',
      });

      console.log('Token booked successfully:', response.data);
      toast.success('Token booked successfully!');
      setShowBookingModal(false);
      
      // Reload data with user ID
      if (user?.id) {
        loadData(user.id);
      }

      // Redirect to queue tracking
      const newToken = response.data.data.token;
      router.push(`/patient/queue/${newToken._id}`);
    } catch (error: any) {
      console.error('Token booking error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to book token');
    } finally {
      setIsBooking(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Clear cookie
      document.cookie = 'token=; path=/; max-age=0';
      // Hard redirect to home
      window.location.href = '/';
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/patient/dashboard' },
    { icon: Calendar, label: 'My Tokens', href: '/patient/tokens' },
    { icon: Clock, label: 'Queue Status', href: '/patient/queue' },
    { icon: Bell, label: 'Notifications', href: '/patient/notifications' },
    { icon: User, label: 'Profile', href: '/patient/profile' },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      waiting: 'warning',
      'in-progress': 'info',
      completed: 'success',
      cancelled: 'danger',
      skipped: 'danger',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-100 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">QueueMed</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Card glass hover={false} className="mb-4">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name || 'User'} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </Card>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-white/20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <Button onClick={() => setShowBookingModal(true)}>
                <Plus className="w-5 h-5" />
                Book Token
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Tokens', value: myTokens.length, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
              { label: 'Waiting', value: myTokens.filter(t => t.status === 'waiting').length, icon: Clock, color: 'from-orange-500 to-red-500' },
              { label: 'In Progress', value: myTokens.filter(t => t.status === 'in-progress').length, icon: AlertCircle, color: 'from-purple-500 to-pink-500' },
              { label: 'Completed', value: myTokens.filter(t => t.status === 'completed').length, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent Tokens */}
          <Card glass hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Tokens</h2>
              <Link href="/patient/tokens" className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {myTokens.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tokens yet</h3>
                <p className="text-gray-500 mb-4">Book your first token to get started</p>
                <Button onClick={() => setShowBookingModal(true)}>
                  <Plus className="w-5 h-5" />
                  Book Token
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myTokens.slice(0, 5).map((token, index) => (
                  <motion.div
                    key={token._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold">
                        {token.tokenNumber}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {token.doctorId?.name || 'Doctor'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {token.departmentId?.name || 'Department'} • {token.hospitalId?.name || 'Hospital'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(token.status)}
                      <Link href={`/patient/queue/${token._id}`}>
                        <Button variant="ghost" size="sm">
                          Track
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Booking Modal - Single unified modal for entire flow */}
      <AnimatePresence>
        {showBookingModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setShowBookingModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              style={{ pointerEvents: 'none' }}
            >
              <div 
                className="w-full max-w-2xl my-8 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Hospital Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Hospital
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hospitals.map((hospital) => (
                        <motion.button
                          key={hospital._id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleHospitalChange(hospital._id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedHospital === hospital._id
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className={`w-6 h-6 ${selectedHospital === hospital._id ? 'text-primary-600' : 'text-gray-400'}`} />
                            <div>
                              <p className="font-semibold text-gray-900">{hospital.name}</p>
                              <p className="text-sm text-gray-500">{hospital.city}</p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Department Selection */}
                  {selectedHospital && departments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Department
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {departments.map((dept) => (
                          <motion.button
                            key={dept._id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDepartmentChange(dept._id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              selectedDepartment === dept._id
                                ? 'bg-opacity-20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={{
                              backgroundColor: selectedDepartment === dept._id ? `${dept.color}20` : '',
                              borderColor: selectedDepartment === dept._id ? dept.color : '',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Stethoscope className="w-6 h-6" style={{ color: dept.color }} />
                              <div>
                                <p className="font-semibold text-gray-900">{dept.name}</p>
                                <p className="text-sm text-gray-500">{dept.description}</p>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Doctor Selection */}
                  {selectedDepartment && doctors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Doctor
                      </label>
                      <div className="space-y-3">
                        {doctors.map((doctor) => (
                          <motion.button
                            key={doctor._id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleDoctorSelect(doctor._id)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                              selectedDoctor === doctor._id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            <Avatar name={doctor.name} size="lg" />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">Dr. {doctor.name}</p>
                              <p className="text-sm text-gray-500">{doctor.specialization}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{doctor.consultationDuration} min</p>
                              <p className="text-xs text-gray-500">per consultation</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Slot Selection - Shows when doctor is selected */}
                  {selectedDoctor && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-t pt-6"
                    >
                      <SlotPicker
                        selectedHospital={selectedHospital}
                        selectedDepartment={selectedDepartment}
                        selectedDoctor={selectedDoctor}
                        onSuccess={() => {
                          if (user?.id) {
                            loadData(user.id);
                          }
                          setSelectedDoctor('');
                          setShowBookingModal(false);
                        }}
                        onBack={() => {
                          setSelectedDoctor('');
                        }}
                      />
                    </motion.div>
                  )}

                  {!selectedDoctor && (
                    <div className="text-center py-4 text-gray-500">
                      <p>Select a doctor to see available slots</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
