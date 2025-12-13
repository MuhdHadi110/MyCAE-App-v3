import { NavLink } from 'react-router-dom';
import {
  Home,
  Package,
  Scan,
  Wrench,
  Settings,
  X,
  ClipboardList,
  Monitor,
  FolderOpen,
  Users,
  Building2,
  FlaskConical,
  Clock,
  DollarSign,
  FileText,
  BarChart3,
  MapPin,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { getPermissions, getRoleInfo } from '../../lib/permissions';
import { UserRole } from '../../types/auth.types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', section: 'main' },
  { to: '/my-dashboard', icon: BarChart3, label: 'My Dashboard', section: 'main' },
  { to: '/projects', icon: FolderOpen, label: 'Projects', section: 'projects' },
  { to: '/research', icon: FlaskConical, label: 'Research', section: 'projects' },
  { to: '/timesheets', icon: Clock, label: 'Timesheets', section: 'projects' },
  { to: '/team-workload', icon: Users, label: 'Team Workload', section: 'projects' },
  { to: '/team', icon: Users, label: 'Team Members', section: 'people' },
  { to: '/clients', icon: Building2, label: 'Business Contacts', section: 'people' },
  { to: '/finance', icon: DollarSign, label: 'Finance Overview', section: 'finance', requiresPermission: 'canAccessFinance' },
  { to: '/finance/project-analytics', icon: BarChart3, label: 'Project Analytics', section: 'finance', requiresPermission: 'canAccessFinance' },
  { to: '/finance/documents', icon: FileText, label: 'Finance Documents', section: 'finance', requiresPermission: 'canAccessFinance' },
  { to: '/inventory', icon: Package, label: 'Inventory', section: 'equipment' },
  { to: '/equipment', icon: ClipboardList, label: 'Equipment Management', section: 'equipment' },
  { to: '/pcs', icon: Monitor, label: 'PC Assignment', section: 'equipment' },
  { to: '/scan', icon: Scan, label: 'Scan', section: 'equipment' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', section: 'equipment' },
  { to: '/settings', icon: Settings, label: 'Settings', section: 'system' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, onLogout }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const permissions = getPermissions(user.role as UserRole);
  const roleInfo = getRoleInfo(user.role as UserRole);

  // Filter nav items based on permissions
  const getFilteredNavItems = (section: string) => {
    return navItems
      .filter((item) => item.section === section)
      .filter((item) => {
        if (item.requiresPermission) {
          return permissions[item.requiresPermission as keyof typeof permissions];
        }
        return true;
      });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 shadow-lg border-r border-slate-200 dark:border-gray-700',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-lg">MC</span>
                </div>
                <span className="text-slate-900 dark:text-gray-100 font-bold text-xl tracking-tight">MYCAE</span>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Main Section */}
              <div>
                <ul className="space-y-1">
                  {getFilteredNavItems('main')
                    .map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 touch-target group',
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
                            )
                          }
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Projects Section */}
              <div>
                <h3 className="px-3 text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Projects
                </h3>
                <ul className="space-y-1">
                  {getFilteredNavItems('projects')
                    .map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 touch-target group',
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
                            )
                          }
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>

              {/* People & Contacts Section */}
              <div>
                <h3 className="px-3 text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  People & Contacts
                </h3>
                <ul className="space-y-1">
                  {getFilteredNavItems('people')
                    .map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 touch-target group',
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
                            )
                          }
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Finance Section */}
              {getFilteredNavItems('finance').length > 0 && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Finance
                  </h3>
                  <ul className="space-y-1">
                    {getFilteredNavItems('finance')
                      .map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            end={item.to === '/finance'}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 touch-target group',
                                isActive
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                                  : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
                              )
                            }
                          >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Equipment Section */}
              <div>
                <h3 className="px-3 text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Equipment
                </h3>
                <ul className="space-y-1">
                  {getFilteredNavItems('equipment')
                    .map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 touch-target group',
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
                            )
                          }
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>

              {/* System Section */}
              <div>
                <ul className="space-y-1">
                  {getFilteredNavItems('system')
                    .map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 touch-target group',
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md'
                                : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300'
                            )
                          }
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-slate-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-800 space-y-3">
            {/* Role Badge */}
            <div className="px-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              <div className="flex items-center gap-2">
                <span className="text-base">{roleInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-slate-900 dark:text-gray-100">{roleInfo.label}</p>
                  <p className="text-[10px] text-slate-600 dark:text-gray-400">Level {roleInfo.level} Access</p>
                </div>
              </div>
            </div>
            {/* Version Info */}
            <div className="text-xs text-slate-600 dark:text-gray-400">
              <p>Version 1.0.0</p>
              <p className="mt-1">© 2025 MYCAE Tracker</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
