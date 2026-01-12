import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell, Check, Trash2, User, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationStore } from '../../store/notificationStore';
import { toast } from 'react-hot-toast';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDesktop } = useResponsive();
  const { logout, user } = useAuth();
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotificationStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'alert': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-gray-900">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="skip-to-content"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar isOpen={isDesktop || sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header with Notification Bell - Always Visible on Desktop, on Mobile */}
        <div className="sticky top-0 z-30 px-4 py-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            {!isDesktop && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 mr-2"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            )}
          </div>

          {/* Right side icons: Notification Bell and User Menu */}
          <div className="flex items-center gap-1">
            {/* Notification Bell */}
            <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              aria-haspopup="menu"
              aria-expanded={showNotifications}
              aria-controls="notifications-menu"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  aria-label={`${unreadCount} unread notifications`}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                id="notifications-menu"
                role="menu"
                aria-label="Notifications menu"
                className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium text-primary-600" aria-live="polite">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto" role="group">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" aria-hidden="true" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        role="menuitem"
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          !notif.read ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                        aria-current={!notif.read ? 'true' : 'false'}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-2 h-2 ${getNotificationIcon(notif.type)} rounded-full mt-1.5 flex-shrink-0`}
                            aria-hidden="true"
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formatTime(notif.timestamp)}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {!notif.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notif.id);
                                    }}
                                    className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                    title="Mark as read"
                                    aria-label={`Mark notification as read: ${notif.title}`}
                                  >
                                    <Check className="w-3 h-3" aria-hidden="true" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notif.id);
                                  }}
                                  className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete notification"
                                  aria-label={`Delete notification: ${notif.title}`}
                                >
                                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <button
                    className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1 transition-colors"
                    aria-label="View all notifications"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              aria-label={`User menu for ${user?.name || 'User'}`}
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
              aria-controls="user-menu"
            >
              <User className="w-5 h-5 text-gray-700 dark:text-gray-200" aria-hidden="true" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div
                id="user-menu"
                role="menu"
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name || 'User'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'user@mycae.com'}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-slate-50 dark:bg-gray-900"
          tabIndex={-1}
        >
          <div className="h-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom navigation (mobile only) */}
        <BottomNav />
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
};
