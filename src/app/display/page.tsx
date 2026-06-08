'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Activity, Users, Bell } from 'lucide-react';
import { queueAPI } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

export default function WaitingRoomDisplay() {
  const [currentToken, setCurrentToken] = useState<any>(null);
  const [nextTokens, setNextTokens] = useState<any[]>([]);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [departmentId, setDepartmentId] = useState('demo');

  const { onQueueUpdate } = useSocket();

  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadData();

    // Listen for queue updates
    const unsubscribe = onQueueUpdate((data) => {
      if (data.type === 'token-called') {
        loadData();
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      // In production, get departmentId from URL params
      const response = await queueAPI.getDisplay(departmentId);
      const { currentToken, nextTokens, totalWaiting } = response.data.data;
      
      setCurrentToken(currentToken || null);
      setNextTokens(nextTokens || []);
      setTotalWaiting(totalWaiting || 0);
    } catch (error) {
      console.error('Error loading display data:', error);
      // Use demo data for display purposes
      setDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoData = () => {
    setCurrentToken({
      tokenNumber: 42,
      patientId: { name: 'John Smith' },
      doctorId: { name: 'Dr. Sarah Johnson' },
    });
    setNextTokens([
      { tokenNumber: 43, patientId: { name: 'Emily Davis' } },
      { tokenNumber: 44, patientId: { name: 'Michael Brown' } },
      { tokenNumber: 45, patientId: { name: 'Sarah Wilson' } },
      { tokenNumber: 46, patientId: { name: 'David Lee' } },
      { tokenNumber: 47, patientId: { name: 'Jennifer Garcia' } },
    ]);
    setTotalWaiting(25);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-blue-900 to-teal-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-blue-900 to-teal-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
            delay: 5,
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary-500/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <Activity className="w-10 h-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">Smart Hospital Queue System</h1>
              <p className="text-white/60">Waiting Room Display</p>
            </div>
          </div>

          <div className="text-right">
            <motion.div
              key={currentTime.getSeconds()}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold font-mono"
            >
              {formatTime(currentTime)}
            </motion.div>
            <p className="text-white/60">{formatDate(currentTime)}</p>
          </div>
        </header>

        {/* Main Display */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Current Token */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl" />
            <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Now Serving</p>
                  <h2 className="text-2xl font-bold text-green-400">Current Token</h2>
                </div>
              </div>

              {currentToken ? (
                <motion.div
                  key={currentToken.tokenNumber}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="inline-block"
                  >
                    <p className="text-9xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {String(currentToken.tokenNumber).padStart(3, '0')}
                    </p>
                  </motion.div>
                  
                  <div className="mt-8 space-y-2">
                    <p className="text-2xl text-white">{currentToken.patientId?.name}</p>
                    <p className="text-white/60">
                      {currentToken.doctorId?.name ? `${currentToken.doctorId.name}` : 'Doctor'}
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full"
                  >
                    <Bell className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Please proceed to the consultation room</span>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-2xl text-white/60">No active token</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-white/60">Waiting</span>
              </div>
              <p className="text-5xl font-bold text-blue-400">{totalWaiting}</p>
              <p className="text-white/40 text-sm mt-2">Patients in queue</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-8 h-8 text-purple-400" />
                <span className="text-white/60">Est. Wait</span>
              </div>
              <p className="text-5xl font-bold text-purple-400">~{Math.ceil(totalWaiting * 0.25)}m</p>
              <p className="text-white/40 text-sm mt-2">Average wait time</p>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 mb-2">Today's Progress</p>
                  <div className="flex items-end gap-4">
                    <p className="text-4xl font-bold">{nextTokens.length + (currentToken ? 1 : 0)}</p>
                    <p className="text-white/60 mb-2">tokens processed</p>
                  </div>
                </div>
                <div className="w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="16"
                      fill="none"
                    />
                    <motion.circle
                      initial={{ strokeDashoffset: 352 }}
                      animate={{ strokeDashoffset: 352 - (352 * 0.65) }}
                      transition={{ duration: 2, delay: 0.5 }}
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={352}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Next Tokens */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Up Next</p>
                <h2 className="text-2xl font-bold">Waiting Tokens</h2>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {nextTokens.map((token, index) => (
                <motion.div
                  key={token.tokenNumber}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-2xl p-4 text-center border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <p className="text-4xl font-bold text-white mb-2">
                    {String(token.tokenNumber).padStart(3, '0')}
                  </p>
                  <p className="text-white/60 text-sm truncate">
                    {token.patientId?.name || 'Patient'}
                  </p>
                  {index === 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2 inline-block px-2 py-1 bg-blue-500/20 rounded-full"
                    >
                      <span className="text-xs text-blue-400 font-medium">Next</span>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <footer className="mt-8 text-center text-white/40">
          <p>Thank you for your patience. Please wait for your token to be called.</p>
        </footer>
      </div>
    </div>
  );
}
