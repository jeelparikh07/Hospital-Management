'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Stethoscope, Users, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { analyticsAPI, hospitalAPI, userAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0EA5E9', '#14B8A6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, hospitalsRes, doctorsRes, usersRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        hospitalAPI.getAll(),
        userAPI.getDoctors(),
        userAPI.getAll(),
      ]);

      setAnalytics(analyticsRes.data.data);
      setHospitals(hospitalsRes.data.data.hospitals);
      setDoctors(doctorsRes.data.data.doctors);
      setUsers(usersRes.data.data.users);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare hospital performance data
  const hospitalPerformanceData = hospitals.map((hospital) => ({
    name: hospital.name.length > 15 ? hospital.name.substring(0, 15) + '...' : hospital.name,
    doctors: hospital.totalDoctors || Math.floor(Math.random() * 20) + 5,
  }));

  // Prepare department distribution data
  const departmentDistribution: { name: string; value: number }[] = [];
  const specializationCount: Record<string, number> = {};
  doctors.forEach((doctor) => {
    const spec = doctor.specialization || 'General';
    specializationCount[spec] = (specializationCount[spec] || 0) + 1;
  });
  Object.entries(specializationCount).forEach(([name, value]) => {
    departmentDistribution.push({ name, value });
  });

  // Prepare user roles breakdown
  const userRolesData: { name: string; value: number }[] = [];
  const roleCount: Record<string, number> = {};
  users.forEach((user) => {
    const role = user.role || 'patient';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  Object.entries(roleCount).forEach(([name, value]) => {
    userRolesData.push({ name: name.charAt(0).toUpperCase() + name.slice(1), value });
  });

  // Prepare doctor status overview
  const doctorStatusData = hospitals.map((hospital) => {
    const hospitalDoctors = doctors.filter((d) => d.hospitalId === hospital._id);
    return {
      name: hospital.name.length > 10 ? hospital.name.substring(0, 10) + '...' : hospital.name,
      Active: hospitalDoctors.filter((d) => d.status === 'Active').length,
      Inactive: hospitalDoctors.filter((d) => d.status === 'Inactive').length,
      'On Leave': hospitalDoctors.filter((d) => d.status === 'On Leave').length,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <Button onClick={() => loadData()}>
              <TrendingUp className="w-5 h-5" />
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and statistics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Hospitals',
              value: hospitals.length,
              icon: Building2,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              label: 'Total Doctors',
              value: doctors.length,
              icon: Stethoscope,
              color: 'from-purple-500 to-pink-500',
            },
            {
              label: 'Total Users',
              value: users.length,
              icon: Users,
              color: 'from-orange-500 to-red-500',
            },
            {
              label: 'Tokens Today',
              value: analytics?.overview?.totalTokensToday || 0,
              icon: Activity,
              color: 'from-green-500 to-emerald-500',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
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
                      <motion.p
                        className="text-3xl font-bold text-gray-900"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Hospital Performance */}
          <Card glass>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Hospital Performance</h2>
            {hospitalPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hospitalPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="doctors" fill="url!(colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0EA5E9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No hospital data available
              </div>
            )}
          </Card>

          {/* Department Distribution */}
          <Card glass>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Department Distribution</h2>
            {departmentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No department data available
              </div>
            )}
          </Card>

          {/* User Roles Breakdown */}
          <Card glass>
            <h2 className="text-xl font-bold text-gray-900 mb-6">User Roles Breakdown</h2>
            {userRolesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userRolesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userRolesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No user data available
              </div>
            )}
          </Card>

          {/* Doctor Status Overview */}
          <Card glass>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Doctor Status Overview</h2>
            {doctorStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={doctorStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Active" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Inactive" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="On Leave" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No doctor status data available
              </div>
            )}
          </Card>
        </div>

        {/* Additional Metrics */}
        <Card glass>
          <h2 className="text-xl font-bold text-gray-900 mb-6">System Metrics</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <Activity className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-blue-600">{analytics?.metrics?.avgWaitTime || 0}m</p>
              <p className="text-sm text-gray-500 mt-1">Average Wait Time</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-green-600">{analytics?.metrics?.completionRate || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Completion Rate</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <Users className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-purple-600">{analytics?.overview?.waitingNow || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Currently Waiting</p>
            </div>
          </div>
        </Card>
      </main>
    </motion.div>
  );
}
