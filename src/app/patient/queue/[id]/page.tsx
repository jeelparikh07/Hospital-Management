'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Users,
  Activity,
  Bell,
  CheckCircle,
  Timer,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { tokenAPI } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function QueueTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const tokenId = params.id as string;

  const [token, setToken] = useState<any>(null);
  const [queueData, setQueueData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const { onQueueUpdate, onTokenUpdated, onNotification } = useSocket({
    onConnect: () => setIsConnected(true),
    onDisconnect: () => setIsConnected(false),
  });

  useEffect(() => {
    loadTokenData();

    // Set up socket listeners
    const unsubscribeQueue = onQueueUpdate((data) => {
      if (data.type === 'token-called') {
        toast.success(`Token ${data.tokenNumber} is now being served!`);
        loadTokenData();
      }
    });

    const unsubscribeToken = onTokenUpdated((updatedToken) => {
      if (updatedToken._id === tokenId) {
        setToken(updatedToken);
        loadTokenData();
      }
    });

    const unsubscribeNotification = onNotification((data) => {
      const toastType = data.type || 'info';
      if (toastType === 'success') toast.success(data.message);
      else if (toastType === 'error') toast.error(data.message);
      else toast(data.message);
    });

    return () => {
      unsubscribeQueue();
      unsubscribeToken();
      unsubscribeNotification();
    };
  }, [tokenId]);

  // Countdown timer
  useEffect(() => {
    if (!token?.estimatedWaitTime) return;

    const bookedAt = new Date(token.bookedAt).getTime();
    const now = Date.now();
    const elapsed = (now - bookedAt) / 60000; // in minutes
    const remaining = Math.max(0, token.estimatedWaitTime - elapsed);
    setTimeRemaining(remaining);

    const interval = setInterval(() => {
      const newElapsed = (Date.now() - bookedAt) / 60000;
      const newRemaining = Math.max(0, token.estimatedWaitTime - newElapsed);
      setTimeRemaining(newRemaining);
    }, 60000);

    return () => clearInterval(interval);
  }, [token]);

  const loadTokenData = async () => {
    try {
      // Load all tokens for the patient
      const tokensRes = await tokenAPI.getPatientTokens(user?.id || '');
      const tokens = tokensRes.data.data.tokens || [];
      
      // Find the specific token
      const foundToken = tokens.find((t: any) => t._id === tokenId);
      
      if (!foundToken) {
        toast.error('Token not found');
        router.push('/patient/dashboard');
        return;
      }
      
      setToken(foundToken);

      // Load queue data if we have department info
      if (foundToken.departmentId?._id || foundToken.departmentId) {
        const deptId = foundToken.departmentId._id || foundToken.departmentId;
        try {
          const queueRes = await tokenAPI.getQueue(deptId);
          setQueueData(queueRes.data.data);
        } catch (queueError) {
          console.warn('Could not load queue data:', queueError);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load queue data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      waiting: 'from-orange-500 to-red-500',
      'in-progress': 'from-blue-500 to-cyan-500',
      completed: 'from-green-500 to-emerald-500',
      cancelled: 'from-gray-500 to-gray-600',
      skipped: 'from-purple-500 to-pink-500',
    };
    return colors[status] || colors.waiting;
  };

  const getStatusMessage = () => {
    if (!token) return '';
    
    switch (token.status) {
      case 'waiting':
        return 'Please wait for your turn. You will be notified when it\'s your turn.';
      case 'in-progress':
        return 'You are currently being consulted. Please proceed to the doctor\'s cabin.';
      case 'completed':
        return 'Your consultation has been completed. Take care!';
      case 'cancelled':
        return 'This token has been cancelled.';
      case 'skipped':
        return 'This token was skipped. Please contact reception for assistance.';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading queue information...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <Card glass hover={false} className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Not Found</h2>
          <p className="text-gray-500 mb-4">The token you're looking for doesn't exist.</p>
          <Link href="/patient/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const patientsAhead = queueData?.waitingCount || 0;
  const progress = token.status === 'completed' 
    ? 100 
    : token.status === 'in-progress' 
      ? 75 
      : token.status === 'waiting'
        ? Math.max(0, 100 - (patientsAhead * 10))
        : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/20">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/patient/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="success" size="sm" pulse>
                  <Wifi className="w-3 h-3" />
                  Live
                </Badge>
              ) : (
                <Badge variant="danger" size="sm">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Token Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className={`relative overflow-hidden ${token.status === 'in-progress' ? 'animate-pulse' : ''}`}>
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getStatusColor(token.status)}`} />
            
            <div className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Your Token Number</p>
                  <motion.div
                    key={token.tokenNumber}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-bold gradient-text"
                  >
                    {String(token.tokenNumber).padStart(3, '0')}
                  </motion.div>
                </div>
                <Badge variant={token.status === 'waiting' ? 'warning' : token.status === 'in-progress' ? 'info' : token.status === 'completed' ? 'success' : 'danger'} size="lg">
                  {token.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className={`p-4 rounded-xl bg-gradient-to-r ${getStatusColor(token.status)} bg-opacity-10 mb-6`}>
                <p className="text-gray-700">{getStatusMessage()}</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Queue Progress</span>
                  <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${getStatusColor(token.status)} rounded-full`}
                  />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{formatTime(timeRemaining)}</p>
                  <p className="text-sm text-gray-500">Est. Wait Time</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">{patientsAhead}</p>
                  <p className="text-sm text-gray-500">Patients Ahead</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{queueData?.completedCount || 0}</p>
                  <p className="text-sm text-gray-500">Completed Today</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <Timer className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{token.doctorId?.consultationDuration || 15}m</p>
                  <p className="text-sm text-gray-500">Avg. Consultation</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Doctor Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card glass>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-xl font-bold">
                {token.doctorId?.name?.charAt(0) || 'D'}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {token.doctorId?.name ? `Dr. ${token.doctorId.name}` : 'Doctor'}
                </h3>
                <p className="text-gray-500">{token.doctorId?.specialization || 'Specialist'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold text-gray-900">{token.departmentId?.name || 'N/A'}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Queue Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-6 h-6 text-primary-600" />
              <h3 className="text-xl font-bold text-gray-900">Queue Status</h3>
            </div>

            <div className="space-y-4">
              {/* Current Token */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-xl text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Currently Serving</p>
                    <p className="text-2xl font-bold">
                      {queueData?.currentToken ? String(queueData.currentToken).padStart(3, '0') : '--'}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-white/20 text-white">
                  LIVE
                </Badge>
              </div>

              {/* Your Position */}
              {token.status === 'waiting' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 bg-orange-50 border-2 border-orange-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Your Position</p>
                      <p className="text-lg font-bold text-orange-600">#{patientsAhead + 1} in queue</p>
                    </div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </motion.div>
              )}

              {/* Queue Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{queueData?.completedCount || 0}</p>
                  <p className="text-xs text-gray-500">Served</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-xl">
                  <p className="text-2xl font-bold text-orange-600">{queueData?.waitingCount || 0}</p>
                  <p className="text-xs text-gray-500">Waiting</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{queueData?.totalTokens || 0}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notifications CTA */}
        {token.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-primary-600 to-secondary-500 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-1">Get Notified</h4>
                  <p className="text-sm text-white/80">
                    You'll receive a notification when your turn is approaching. Keep your notifications enabled.
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  Enable Alerts
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
