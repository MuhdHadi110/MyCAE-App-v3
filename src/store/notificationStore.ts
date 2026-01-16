import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category?: 'inventory' | 'maintenance' | 'project' | 'team' | 'system' | 
             'project-assignment' | 'po-received' | 'pc-assignment' | 
             'invoice-approval' | 'invoice-approved' | 'invoice-withdrawn';
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}


export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unread = updated.filter((n) => !n.read).length;
      return {
        notifications: updated,
        unreadCount: unread,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const newUnread = !notification?.read ? state.unreadCount - 1 : state.unreadCount;
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: Math.max(0, newUnread),
      };
    });
  },

  clearAll: () => {
    set(() => ({
      notifications: [],
      unreadCount: 0,
    }));
  },
}));
