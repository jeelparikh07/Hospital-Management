'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  getUnreadCount: () => number;
  getFiltered: (filter: 'all' | 'unread' | 'alerts' | 'system') => Notification[];
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },

      getFiltered: (filter) => {
        const notifications = get().notifications;
        switch (filter) {
          case 'unread':
            return notifications.filter((n) => !n.isRead);
          case 'alerts':
            return notifications.filter((n) => n.category === 'Alert');
          case 'system':
            return notifications.filter((n) => n.category === 'System');
          default:
            return notifications;
        }
      },
    }),
    {
      name: 'queuemed-notifications',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper function to create notifications from CRUD actions
export const createNotification = (
  action: 'CREATE' | 'DELETE',
  entityType: 'Hospital' | 'Doctor' | 'User' | 'Department',
  entityName: string
) => {
  const store = useNotificationStore.getState();
  
  if (action === 'CREATE') {
    if (entityType === 'Hospital') {
      store.addNotification({
        title: 'New Hospital Added',
        description: `New hospital added: ${entityName}`,
        category: 'Hospital',
        relatedEntity: entityName,
      });
    } else if (entityType === 'Doctor') {
      store.addNotification({
        title: 'New Doctor Registered',
        description: `New doctor registered: Dr. ${entityName}`,
        category: 'Doctor',
        relatedEntity: entityName,
      });
    } else if (entityType === 'User') {
      store.addNotification({
        title: 'New User Account',
        description: `New user account created: ${entityName}`,
        category: 'User',
        relatedEntity: entityName,
      });
    } else if (entityType === 'Department') {
      store.addNotification({
        title: 'New Department Created',
        description: `New department created: ${entityName}`,
        category: 'Hospital',
        relatedEntity: entityName,
      });
    }
  } else if (action === 'DELETE') {
    store.addNotification({
      title: `${entityType} Deleted`,
      description: `Deleted ${entityType.toLowerCase()}: ${entityName}`,
      category: 'Alert',
      relatedEntity: entityName,
    });
  }
};
