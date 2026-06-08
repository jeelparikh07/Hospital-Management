'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Stethoscope,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  Search,
  Calendar,
  PieChart,
  Bell,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { analyticsAPI, hospitalAPI, userAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

// Simple bar chart component
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  
  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((item, index) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / maxValue) * 100}%` }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="w-full bg-gradient-to-t from-primary-600 to-secondary-500 rounded-t-lg min-h-[4px]"
          />
          <span className="text-xs text-gray-500 text-center truncate w-full">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Simple donut chart component
function DonutChart({ value, total, color }: { value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="#e5e7eb"
          strokeWidth="12"
          fill="none"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, delay: 0.5 }}
          cx="64"
          cy="64"
          r="45"
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, token } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      const [analyticsRes, hospitalsRes, doctorsRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        hospitalAPI.getAll(),
        userAPI.getDoctors(),
      ]);

      setAnalytics(analyticsRes.data.data);
      setHospitals(hospitalsRes.data.data.hospitals);
      setDoctors(doctorsRes.data.data.doctors);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
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

  const navItems: {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: number;
  }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Building2, label: 'Hospitals', href: '/admin/hospitals' },
    { icon: Stethoscope, label: 'Doctors', href: '/admin/doctors' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: PieChart, label: 'Analytics', href: '/admin/analytics' },
    { icon: Bell, label: 'Notifications', href: '/admin/notifications', badge: getUnreadCount() },
    { icon: FileCheck, label: 'Audit Log', href: '/admin/audit-log' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  const hourlyData = analytics?.hourlyDistribution 
    ? Object.entries(analytics.hourlyDistribution).map(([hour, count]) => ({
        label: `${hour}:00`,
        value: count as number,
      }))
    : Array.from({ length: 12 }, (_, i) => ({ label: `${8 + i}:00`, value: Math.floor(Math.random() * 50) + 10 }));

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
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-100 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
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
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Card glass hover={false} className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">Administrator</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">System overview and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <Button variant="secondary">
                <Calendar className="w-5 h-5" />
                {new Date().toLocaleDateString()}
              </Button>
              <Button onClick={() => router.push('/admin/hospitals')}>
                <Plus className="w-5 h-5" />
                Add Hospital
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { 
                label: 'Total Hospitals', 
                value: analytics?.overview?.totalHospitals || 0, 
                icon: Building2, 
                color: 'from-blue-500 to-cyan-500',
                change: '+12%'
              },
              { 
                label: 'Total Doctors', 
                value: analytics?.overview?.totalDoctors || 0, 
                icon: Stethoscope, 
                color: 'from-purple-500 to-pink-500',
                change: '+8%'
              },
              { 
                label: 'Total Patients', 
                value: analytics?.overview?.totalPatients || 0, 
                icon: Users, 
                color: 'from-orange-500 to-red-500',
                change: '+24%'
              },
              { 
                label: 'Tokens Today', 
                value: analytics?.overview?.totalTokensToday || 0, 
                icon: Activity, 
                color: 'from-green-500 to-emerald-500',
                change: '+18%'
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                    <Badge variant="success" className="text-xs">{stat.change}</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Performance Metrics */}
            <Card glass className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Performance Metrics</h2>
                <Badge variant="info">Today</Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-600">{analytics?.metrics?.avgWaitTime || 0}m</p>
                  <p className="text-sm text-gray-500">Avg. Wait Time</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">{analytics?.metrics?.avgConsultationTime || 15}m</p>
                  <p className="text-sm text-gray-500">Avg. Consultation</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-purple-600">{analytics?.metrics?.completionRate || 0}%</p>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Hourly Token Distribution</h3>
                <BarChart data={hourlyData} />
              </div>
            </Card>

            {/* Queue Status */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Queue Status</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Waiting</p>
                    <p className="text-2xl font-bold text-orange-600">{analytics?.overview?.waitingNow || 0}</p>
                  </div>
                  <DonutChart 
                    value={analytics?.overview?.waitingNow || 0} 
                    total={analytics?.overview?.totalTokensToday || 1} 
                    color="#f97316"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{analytics?.overview?.completedToday || 0}</p>
                  </div>
                  <DonutChart 
                    value={analytics?.overview?.completedToday || 0} 
                    total={analytics?.overview?.totalTokensToday || 1} 
                    color="#22c55e"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Skip Rate</span>
                    <span className="text-sm font-semibold">{analytics?.metrics?.skipRate || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${analytics?.metrics?.skipRate || 0}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Hospitals Overview */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Hospitals Overview</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Hospital</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">City</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Departments</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Doctors</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((hospital, index) => (
                    <motion.tr
                      key={hospital._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white font-semibold">
                            {hospital.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{hospital.name}</p>
                            <p className="text-sm text-gray-500">{hospital.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{hospital.city}, {hospital.state}</td>
                      <td className="py-3 px-4">
                        <Badge variant="info">{hospital.departments?.length || 0}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{hospital.totalDoctors || 0}</td>
                      <td className="py-3 px-4">
                        <Badge variant={hospital.isActive ? 'success' : 'danger'}>
                          {hospital.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/hospitals`)}>
                          Manage
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
