'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Stethoscope,
  ChevronRight,
  Play,
  SkipForward,
  CheckCircle,
  Pause,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { tokenAPI, queueAPI, analyticsAPI } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import toast from 'react-hot-toast';
import { notificationAPI } from '@/lib/api';

export default function DoctorDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, token } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentToken, setCurrentToken] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<'active' | 'paused' | 'closed'>('active');
  const [notificationCount, setNotificationCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  const { joinDoctor, onTokenUpdated } = useSocket();

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
      console.log('No token found, redirecting to login');
      router.push('/login');
      return;
    }

    // Wait for user data to be available
    if (!user?.id) {
      console.log('User ID not available yet, decoding from token...');
      try {
        // Decode user from token
        const base64Url = tokenValue.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        console.log('Decoded payload:', payload);
        
        // Load data with decoded userId
        if (payload.userId) {
          joinDoctor(payload.userId);
          loadDataWithId(payload.userId);
        } else {
          console.error('No userId in token payload');
          router.push('/login');
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
        toast.error('Invalid token');
        router.push('/login');
      }
      return;
    }

    // User data is available from store
    joinDoctor(user.id);
    loadData();

    const unsubscribe = onTokenUpdated(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [token, user, router]);

  const loadData = async () => {
    if (!user?.id) return;
    await loadDataWithId(user.id);
  };

  const loadDataWithId = async (userId: string) => {
    try {
      console.log('=== LOADING DOCTOR DASHBOARD ===');
      console.log('Doctor ID:', userId);

      // Load ALL tokens for this doctor (no date filter)
      const tokensRes = await tokenAPI.getDoctorTokens(userId);
      console.log('API Response status:', tokensRes.status);
      console.log('Total tokens received:', tokensRes.data?.data?.tokens?.length);
      
      const allTokens = tokensRes.data?.data?.tokens || [];
      
      // Log all tokens
      allTokens.forEach((t: any, i: number) => {
        console.log(`\nToken ${i + 1}:`);
        console.log('  Token Number:', t.tokenNumber);
        console.log('  Patient:', t.patientId?.name);
        console.log('  Doctor ID:', t.doctorId?._id);
        console.log('  Status:', t.status);
        console.log('  Date:', t.date);
        console.log('  Matches our ID:', t.doctorId?._id === userId);
      });
      
      // Separate by date - FIXED: Use consistent date comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      console.log('\n=== DATE COMPARISON ===');
      console.log('Today (local):', todayStr);

      // Debug: Log all token dates
      console.log('\n📋 All tokens from API:');
      allTokens.forEach((t: any, idx: number) => {
        const tokenDate = new Date(t.date);
        const tokenDateStr = tokenDate.toISOString().split('T')[0];
        console.log(`  Token ${idx + 1}: #${t.tokenNumber}, date="${t.date}", parsed="${tokenDateStr}", status="${t.status}", matches=${tokenDateStr === todayStr}`);
      });

      // Today's tokens for the queue - FIXED comparison
      const todayTokens = allTokens.filter((t: any) => {
        const tokenDate = new Date(t.date);
        const tokenDateStr = tokenDate.toISOString().split('T')[0];
        return tokenDateStr === todayStr;
      });

      console.log('\n✅ Today\'s tokens count:', todayTokens.length);
      console.log('Today\'s tokens:', todayTokens.map((t: any) => `#${t.tokenNumber} (${t.status})`).join(', '));
      
      // Future upcoming appointments
      const futureTokens = allTokens.filter((t: any) => {
        const tokenDate = new Date(t.date).toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        return tokenDate > todayStr && t.status === 'waiting';
      });
      
      // Sort future by date
      futureTokens.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log('Setting queue with:', todayTokens.filter((t: any) => t.status === 'waiting').length, 'patients');
      
      setQueue(todayTokens.filter((t: any) => t.status === 'waiting'));
      setCurrentToken(todayTokens.find((t: any) => t.status === 'in-progress') || null);
      setUpcomingAppointments(futureTokens.slice(0, 10));

      // Load queue status (optional, don't fail if it errors)
      try {
        const queueRes = await queueAPI.getStatus(userId);
        setQueueStatus(queueRes.data.data.queue?.status || 'active');
      } catch (queueError) {
        console.warn('Could not load queue status:', queueError);
        setQueueStatus('active');
      }

      // Load analytics (optional, don't fail if it errors)
      try {
        const analyticsRes = await analyticsAPI.getDoctorAnalytics(userId);
        console.log('Analytics response:', analyticsRes.data);
        setAnalytics(analyticsRes.data.data || {});
      } catch (analyticsError) {
        console.warn('Could not load analytics:', analyticsError);
        setAnalytics({});
      }

      // Load notification count (optional, don't fail if it errors)
      try {
        const notifRes = await notificationAPI.getUnreadCount(userId);
        setNotificationCount(notifRes.data.data?.count || 0);
      } catch (notifError) {
        console.warn('Could not load notification count:', notifError);
        setNotificationCount(0);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      let errorMessage = 'Failed to load queue data';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Make sure backend is running.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (queue.length === 0) {
      toast.error('No patients waiting');
      return;
    }

    setIsActionLoading('call');
    try {
      const nextToken = queue[0];
      await tokenAPI.callToken(nextToken._id);
      toast.success(`Called token ${String(nextToken.tokenNumber).padStart(3, '0')}`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to call next patient');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleSkipToken = async () => {
    if (!currentToken) {
      toast.error('No active token to skip');
      return;
    }

    setIsActionLoading('skip');
    try {
      await tokenAPI.skipToken(currentToken._id);
      toast.success('Token skipped');
      setCurrentToken(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to skip token');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleCompleteToken = async () => {
    if (!currentToken) {
      toast.error('No active token to complete');
      return;
    }

    setIsActionLoading('complete');
    try {
      await tokenAPI.completeToken(currentToken._id);
      toast.success('Consultation completed');
      setCurrentToken(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete token');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleToggleQueueStatus = async () => {
    try {
      const newStatus = queueStatus === 'active' ? 'paused' : 'active';
      // Update queue status (would need queue ID in production)
      setQueueStatus(newStatus);
      toast.success(`Queue ${newStatus}`);
    } catch (error: any) {
      toast.error('Failed to update queue status');
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
    { icon: LayoutDashboard, label: 'Dashboard', href: '/doctor/dashboard' },
    { icon: Users, label: 'Patients', href: '/doctor/patients' },
    { icon: Clock, label: 'Schedule', href: '/doctor/schedule' },
    { icon: Bell, label: 'Notifications', href: '/doctor/notifications', badge: notificationCount > 0 ? notificationCount : undefined },
    { icon: Settings, label: 'Settings', href: '/doctor/settings' },
  ];

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
                <Stethoscope className="w-6 h-6 text-white" />
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
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
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
              <Avatar name={user?.name || 'Doctor'} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">Dr. {user?.name}</p>
                <p className="text-sm text-gray-500 truncate">{user?.specialization}</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <Button
                variant={queueStatus === 'active' ? 'secondary' : 'primary'}
                onClick={handleToggleQueueStatus}
              >
                {queueStatus === 'active' ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause Queue
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Resume Queue
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Patients', value: analytics?.totalTokens ?? queue.length + (analytics?.completedTokens ?? 0) + (currentToken ? 1 : 0), icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Completed', value: analytics?.completedTokens ?? 0, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
              { label: 'Waiting', value: queue.length, icon: Clock, color: 'from-orange-500 to-red-500' },
              { label: 'Avg Wait Time', value: `${analytics?.avgWaitTime ?? 0}m`, icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
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

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Current Patient */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Current Patient</h2>
                  <Badge variant={queueStatus === 'active' ? 'success' : 'warning'}>
                    {queueStatus === 'active' ? 'Active' : 'Paused'}
                  </Badge>
                </div>

                {currentToken ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-2xl text-white">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                        {currentToken.patientId?.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-bold">
                            {String(currentToken.tokenNumber).padStart(3, '0')}
                          </span>
                          <Badge variant="default" className="bg-white/20 text-white">
                            Token
                          </Badge>
                        </div>
                        <p className="text-lg text-white/90">{currentToken.patientId?.name}</p>
                        <p className="text-sm text-white/70">
                          {currentToken.patientId?.phone} • {currentToken.patientId?.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Wait Time</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {currentToken.actualWaitTime || 0} min
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Booked At</p>
                        <p className="text-lg font-bold text-green-600">
                          {new Date(currentToken.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="danger"
                        onClick={handleSkipToken}
                        isLoading={isActionLoading === 'skip'}
                        className="flex-1"
                      >
                        <SkipForward className="w-5 h-5" />
                        Skip Patient
                      </Button>
                      <Button
                        onClick={handleCompleteToken}
                        isLoading={isActionLoading === 'complete'}
                        className="flex-1"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Complete Consultation
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Patient</h3>
                    <p className="text-gray-500 mb-6">
                      {queue.length > 0 
                        ? 'Call the next patient to start consultation' 
                        : 'No patients waiting in queue'}
                    </p>
                    <Button
                      onClick={handleCallNext}
                      isLoading={isActionLoading === 'call'}
                      disabled={queue.length === 0 || queueStatus !== 'active'}
                      className="mx-auto"
                    >
                      <Play className="w-5 h-5" />
                      {queue.length > 0 ? 'Call Next Patient' : 'No Patients Waiting'}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Queue Controls */}
              {queue.length > 0 && !currentToken && (
                <Card>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <Button
                    onClick={handleCallNext}
                    isLoading={isActionLoading === 'call'}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="w-6 h-6" />
                    Call Next Patient (Token {String(queue[0]?.tokenNumber).padStart(3, '0')})
                  </Button>
                </Card>
              )}
            </div>

            {/* Waiting Queue */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Waiting Queue</h2>
                  <Badge variant="info">{queue.length} patients</Badge>
                </div>

                {queue.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-600">All patients served!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {queue.map((token, index) => (
                      <motion.div
                        key={token._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          index === 0
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-100 hover:border-primary-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String(token.tokenNumber).padStart(2, '0')}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{token.patientId?.name || 'Patient'}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(token.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge variant="info" pulse>Next</Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Upcoming Appointments */}
              {upcomingAppointments.length > 0 && (
                <Card className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
                    <Badge variant="warning">{upcomingAppointments.length} future bookings</Badge>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {upcomingAppointments.map((token, index) => (
                      <motion.div
                        key={token._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                              {String(token.tokenNumber).padStart(2, '0')}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{token.patientId?.name || 'Patient'}</p>
                              <p className="text-sm text-gray-500">
                                {token.patientId?.phone}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="info">
                              {new Date(token.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(token.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
