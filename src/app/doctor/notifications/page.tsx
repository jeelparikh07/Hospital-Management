'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, Check, Trash2, AlertCircle, Info, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function DoctorNotifications() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // Mock notifications data - replace with actual API call when backend is ready
      const mockNotifications = [
        {
          _id: '1',
          type: 'appointment',
          title: 'New Appointment',
          message: 'Patient John Doe booked an appointment for tomorrow',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          isRead: false,
        },
        {
          _id: '2',
          type: 'reminder',
          title: 'Upcoming Appointment',
          message: 'You have an appointment in 30 minutes with Jane Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          isRead: false,
        },
        {
          _id: '3',
          type: 'cancellation',
          title: 'Appointment Cancelled',
          message: 'Patient Mike Johnson cancelled their appointment',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          isRead: true,
        },
        {
          _id: '4',
          type: 'system',
          title: 'System Update',
          message: 'The system will undergo maintenance tonight at 2 AM',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          isRead: false,
        },
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    toast.success('Notification marked as read');
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const deleteNotification = async (id: string) => {
    setNotifications(notifications.filter(n => n._id !== id));
    toast.success('Notification deleted');
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5" />;
      case 'reminder':
        return <AlertCircle className="w-5 h-5" />;
      case 'cancellation':
        return <Info className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'from-green-500 to-emerald-500';
      case 'reminder':
        return 'from-orange-500 to-red-500';
      case 'cancellation':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-white/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/doctor/dashboard">
              <ChevronLeft className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-5 h-5" />
              Mark All Read
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Filter Tabs */}
        <Card className="mb-6">
          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-500">
                {filter === 'all'
                  ? "You're all caught up!"
                  : `No ${filter} notifications`}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification._id}
                className={`hover:shadow-lg transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-l-primary-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getNotificationColor(
                        notification.type
                      )} flex items-center justify-center text-white flex-shrink-0`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.isRead && (
                          <Badge variant="info" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification._id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteNotification(notification._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
