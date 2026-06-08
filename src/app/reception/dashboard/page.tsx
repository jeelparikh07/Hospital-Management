'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hospitalAPI, departmentAPI, userAPI, tokenAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

export default function ReceptionDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, token } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [walkInData, setWalkInData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    // Get token from localStorage or cookie
    let tokenValue = token;
    
    if (!tokenValue) {
      const cookieValue = document.cookie.split('; ').find(row => row.startsWith('token='));
      tokenValue = cookieValue ? cookieValue.split('=')[1] : null;
      if (tokenValue) {
        localStorage.setItem('token', tokenValue);
      }
    }
    
    if (!tokenValue) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const hospitalsRes = await hospitalAPI.getAll();
      setHospitals(hospitalsRes.data.data.hospitals);
      
      if (hospitalsRes.data.data.hospitals.length > 0) {
        const firstHospital = hospitalsRes.data.data.hospitals[0]._id;
        setSelectedHospital(firstHospital);
        await loadDepartments(firstHospital);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async (hospitalId: string) => {
    try {
      const response = await departmentAPI.getByHospital(hospitalId);
      setDepartments(response.data.data.departments);
      if (response.data.data.departments.length > 0) {
        setSelectedDepartment(response.data.data.departments[0]._id);
        await loadDoctors(hospitalId, response.data.data.departments[0]._id);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadDoctors = async (hospitalId: string, departmentId: string) => {
    try {
      const response = await userAPI.getDoctors(hospitalId, departmentId);
      setDoctors(response.data.data.doctors);
      if (response.data.data.doctors.length > 0) {
        setSelectedDoctor(response.data.data.doctors[0]._id);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleHospitalChange = async (hospitalId: string) => {
    setSelectedHospital(hospitalId);
    setSelectedDepartment('');
    setSelectedDoctor('');
    setDepartments([]);
    setDoctors([]);
    await loadDepartments(hospitalId);
  };

  const handleDepartmentChange = async (departmentId: string) => {
    setSelectedDepartment(departmentId);
    setSelectedDoctor('');
    setDoctors([]);
    await loadDoctors(selectedHospital, departmentId);
  };

  const handleCreateToken = async () => {
    if (!walkInData.name || !walkInData.phone) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!selectedHospital || !selectedDepartment || !selectedDoctor) {
      toast.error('Please select hospital, department, and doctor');
      return;
    }

    setIsCreating(true);

    try {
      // First, check if patient exists or create walk-in
      // For simplicity, we'll book token directly
      // In production, you'd create/register the patient first
      
      await tokenAPI.bookToken({
        hospitalId: selectedHospital,
        departmentId: selectedDepartment,
        doctorId: selectedDoctor,
        type: 'walk-in',
        notes: walkInData.notes,
      });

      toast.success('Walk-in token created successfully!');
      setShowModal(false);
      setWalkInData({ name: '', phone: '', email: '', notes: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create token');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    // Clear cookie
    document.cookie = 'token=; path=/; max-age=0';
    // Hard redirect to home
    window.location.href = '/';
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/reception/dashboard' },
    { icon: UserPlus, label: 'Walk-In', href: '/reception/walkin' },
    { icon: ClipboardList, label: 'Queue', href: '/reception/queue' },
    { icon: Users, label: 'Patients', href: '/reception/patients' },
    { icon: Settings, label: 'Settings', href: '/reception/settings' },
  ];

  const filteredQueue = queue.filter((item) =>
    item.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.tokenNumber).includes(searchQuery)
  );

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
      {/* Sidebar */}
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

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-100 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">Receptionist</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
                <p className="text-sm text-gray-500">Manage patient queue and walk-ins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-5 h-5" />
                Add Walk-In
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Tokens Today', value: queue.length, icon: ClipboardList, color: 'from-blue-500 to-cyan-500' },
              { label: 'Waiting', value: queue.filter(t => t.status === 'waiting').length, icon: Clock, color: 'from-orange-500 to-red-500' },
              { label: 'In Progress', value: queue.filter(t => t.status === 'in-progress').length, icon: AlertCircle, color: 'from-purple-500 to-pink-500' },
              { label: 'Completed', value: queue.filter(t => t.status === 'completed').length, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
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

          {/* Quick Actions */}
          <Card glass className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="secondary" onClick={() => setShowModal(true)}>
                <Plus className="w-5 h-5" />
                New Walk-In
              </Button>
              <Button variant="secondary">
                <Search className="w-5 h-5" />
                Search Patient
              </Button>
              <Button variant="secondary">
                <ClipboardList className="w-5 h-5" />
                View All Tokens
              </Button>
              <Button variant="secondary">
                <Users className="w-5 h-5" />
                Patient List
              </Button>
            </div>
          </Card>

          {/* Queue Management */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Today's Queue</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tokens yet</h3>
                <p className="text-gray-500 mb-4">Add walk-in patients or wait for online bookings</p>
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-5 h-5" />
                  Add Walk-In
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Token</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Patient</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQueue.map((token, index) => (
                      <motion.tr
                        key={token._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-primary-600">
                            {String(token.tokenNumber).padStart(3, '0')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-sm font-semibold">
                              {token.patientId?.name?.charAt(0) || 'P'}
                            </div>
                            <span className="font-medium text-gray-900">{token.patientId?.name || 'Patient'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">{token.patientId?.phone || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={token.type === 'online' ? 'info' : 'warning'}>
                            {token.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            token.status === 'waiting' ? 'warning' :
                            token.status === 'in-progress' ? 'info' :
                            token.status === 'completed' ? 'success' : 'danger'
                          }>
                            {token.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(token.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Walk-In Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Card glass hover={false} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add Walk-In Patient</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-5">
                  <Input
                    label="Patient Name *"
                    placeholder="John Doe"
                    value={walkInData.name}
                    onChange={(e) => setWalkInData({ ...walkInData, name: e.target.value })}
                  />

                  <Input
                    label="Phone Number *"
                    placeholder="+1 (555) 000-0000"
                    icon={<Phone className="w-5 h-5" />}
                    value={walkInData.phone}
                    onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                  />

                  <Input
                    label="Email (Optional)"
                    type="email"
                    placeholder="patient@example.com"
                    icon={<Mail className="w-5 h-5" />}
                    value={walkInData.email}
                    onChange={(e) => setWalkInData({ ...walkInData, email: e.target.value })}
                  />

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hospital</label>
                      <Select
                        options={hospitals.map((h) => ({ value: h._id, label: h.name }))}
                        value={selectedHospital}
                        onChange={handleHospitalChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <Select
                        options={departments.map((d) => ({ value: d._id, label: d.name }))}
                        value={selectedDepartment}
                        onChange={handleDepartmentChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
                      <Select
                        options={doctors.map((d) => ({ value: d._id, label: `Dr. ${d.name}` }))}
                        value={selectedDoctor}
                        onChange={setSelectedDoctor}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      rows={3}
                      placeholder="Any additional notes..."
                      value={walkInData.notes}
                      onChange={(e) => setWalkInData({ ...walkInData, notes: e.target.value })}
                    />
                  </div>

                  <Button
                    onClick={handleCreateToken}
                    isLoading={isCreating}
                    className="w-full"
                  >
                    {isCreating ? 'Creating Token...' : 'Create Token'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
