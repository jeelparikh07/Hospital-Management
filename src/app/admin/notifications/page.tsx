'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
  Eye,
  X,
  Stethoscope,
  Users,
  Building2,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useNotificationStore } from '@/store/notificationStore';
import { Notification } from '@/types';

type Filter = 'all' | 'unread' | 'alerts' | 'system';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, getFiltered, getUnreadCount } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const filteredNotifications = getFiltered(activeFilter);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Alert':
        return <AlertCircle className="w-5 h-5" />;
      case 'Hospital':
        return <Building2 className="w-5 h-5" />;
      case 'Doctor':
        return <Stethoscope className="w-5 h-5" />;
      case 'User':
        return <Users className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Alert':
        return 'bg-red-100 text-red-600';
      case 'Hospital':
        return 'bg-blue-100 text-blue-600';
      case 'Doctor':
        return 'bg-purple-100 text-purple-600';
      case 'User':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    if (selectedNotification?.id === id) {
      setSelectedNotification({ ...selectedNotification, isRead: true });
    }
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

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
            {getUnreadCount() > 0 && (
              <Button variant="secondary" size="sm" onClick={() => markAllAsRead()}>
                <CheckCircle className="w-4 h-4" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with system activities</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Panel - Notification List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Tabs */}
            <Card glass>
              <div className="flex flex-wrap gap-2">
                {(['all', 'unread', 'alerts', 'system'] as Filter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                      activeFilter === filter
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                    {filter === 'unread' && getUnreadCount() > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                        {getUnreadCount()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Notification List */}
            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <Card glass>
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications</p>
                  </div>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card
                      glass
                      className={`cursor-pointer transition-all ${
                        selectedNotification?.id === notification.id
                          ? 'ring-2 ring-primary-500'
                          : ''
                      } ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setSelectedNotification(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getCategoryColor(notification.category)}`}>
                          {getCategoryIcon(notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">{notification.title}</h3>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{notification.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                              {notification.category}
                            </span>
                            <span className="text-xs text-gray-400">{formatTimestamp(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Notification Detail */}
          <div className="lg:col-span-3">
            <Card glass className="h-full min-h-[500px]">
              {selectedNotification ? (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getCategoryColor(selectedNotification.category)}`}>
                        {getCategoryIcon(selectedNotification.category)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedNotification.category)}`}>
                            {selectedNotification.category}
                          </span>
                          <span className="text-sm text-gray-400">{formatTimestamp(selectedNotification.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className="text-gray-700 text-lg mb-6">{selectedNotification.description}</p>
                    
                    {selectedNotification.relatedEntity && (
                      <div className="p-4 bg-gray-50 rounded-xl mb-6">
                        <p className="text-sm text-gray-500 mb-1">Related Entity</p>
                        <p className="font-medium text-gray-900">{selectedNotification.relatedEntity}</p>
                      </div>
                    )}

                    <div className={`p-4 rounded-xl mb-6 ${selectedNotification.isRead ? 'bg-green-50' : 'bg-blue-50'}`}>
                      <div className="flex items-center gap-2">
                        {selectedNotification.isRead ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">Marked as read</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-700 font-medium">Unread</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    {!selectedNotification.isRead && (
                      <Button onClick={() => handleMarkAsRead(selectedNotification.id)} className="flex-1">
                        <CheckCircle className="w-5 h-5" />
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(selectedNotification.id)}
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a notification to view details</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
