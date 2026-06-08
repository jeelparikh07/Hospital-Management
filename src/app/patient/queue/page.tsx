'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, Users, TrendingUp, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { tokenAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface Token {
  _id: string;
  tokenNumber: number;
  status: string;
  departmentId: {
    _id: string;
    name: string;
  };
  doctorId: {
    _id: string;
    name: string;
  };
  hospitalId: {
    _id: string;
    name: string;
  };
  estimatedWaitTime: number;
  bookedAt: string;
}

export default function QueueStatusPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeToken, setActiveToken] = useState<Token | null>(null);

  useEffect(() => {
    const loadQueueStatus = async () => {
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
        
        const response = await tokenAPI.getPatientTokens(payload.userId);
        const allTokens = response.data.data.tokens || [];

        // Filter waiting and in-progress tokens
        const activeTokens = allTokens.filter((t: any) => t.status === 'waiting' || t.status === 'in-progress');
        setTokens(activeTokens);
        
        // Set the most recent active token
        if (activeTokens.length > 0) {
          setActiveToken(activeTokens[0]);
        }
      } catch (error: any) {
        console.error('Error loading queue status:', error);
        toast.error('Failed to load queue status');
      } finally {
        setIsLoading(false);
      }
    };

    loadQueueStatus();
  }, [router]);

  const refreshQueue = () => {
    setIsLoading(true);
    // Reload the page data
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading queue status...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Queue Status</h1>
              <p className="text-sm text-gray-500">Track your position in the queue</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshQueue}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {tokens.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active appointments</h3>
            <p className="text-gray-500 mb-4">You don't have any upcoming appointments</p>
            <Link href="/patient/dashboard">
              <Button>
                <Clock className="w-5 h-5" />
                Book Token
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Token Status */}
            {activeToken && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-primary-500 shadow-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Current Status</p>
                        <h2 className="text-3xl font-bold text-gray-900">
                          {activeToken.status === 'in-progress' ? "🎉 Your turn!" : "⏳ Waiting"}
                        </h2>
                      </div>
                      <Badge variant={activeToken.status === 'in-progress' ? 'success' : 'warning'}>
                        Token #{activeToken.tokenNumber}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Department</p>
                          <p className="font-semibold text-gray-900">{activeToken.departmentId?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-secondary-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Doctor</p>
                          <p className="font-semibold text-gray-900">{activeToken.doctorId?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Est. Wait</p>
                          <p className="font-semibold text-gray-900">{activeToken.estimatedWaitTime} mins</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* All Active Tokens */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Appointments</h3>
              <div className="grid gap-4">
                {tokens.map((token) => (
                  <motion.div
                    key={token._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card glass>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
                              {token.tokenNumber}
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {token.doctorId?.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {token.departmentId?.name} • {token.hospitalId?.name}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              token.status === 'in-progress'
                                ? 'info'
                                : token.status === 'waiting'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {token.status.replace('-', ' ')}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Booked:</span>{' '}
                            {new Date(token.bookedAt).toLocaleString()}
                          </div>
                          <Link href={`/patient/queue/${token._id}`}>
                            <Button size="sm">Track Queue</Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
