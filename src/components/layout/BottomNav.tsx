import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, Building2, Users, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/clients', icon: Building2, label: 'Clients' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/inventory', icon: Package, label: 'Equipment' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
      <ul className="flex items-center justify-around">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 px-2 transition-colors touch-target',
                  'hover:bg-gray-50',
                  isActive ? 'text-primary-600' : 'text-gray-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-6 h-6', isActive && 'fill-current')} />
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
