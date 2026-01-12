import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  /** Custom breadcrumb items (overrides auto-generation) */
  items?: BreadcrumbItem[];
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Custom class name */
  className?: string;
  /** Separator between items */
  separator?: React.ReactNode;
}

// Route to label mapping for auto-generation
const routeLabels: Record<string, string> = {
  '': 'Home',
  'projects': 'Projects',
  'clients': 'Clients',
  'team': 'Team',
  'team-workload': 'Team Workload',
  'timesheets': 'Timesheets',
  'inventory': 'Inventory',
  'equipment': 'Equipment',
  'pcs': 'PC Assignments',
  'maintenance': 'Maintenance',
  'scan': 'Scan',
  'research': 'Research',
  'finance': 'Finance',
  'documents': 'Documents',
  'purchase-orders': 'Purchase Orders',
  'settings': 'Settings',
  'my-dashboard': 'My Dashboard',
  'notifications': 'Notifications',
};

/**
 * Auto-generate breadcrumbs from current path
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];

  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHomeIcon = true,
  className,
  separator = <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />,
}) => {
  const location = useLocation();

  // Use custom items or auto-generate from path
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  // Don't show breadcrumbs if only home
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm', className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {breadcrumbItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.href || index} className="flex items-center gap-1">
              {/* Separator (not before first item) */}
              {!isFirst && separator}

              {/* Breadcrumb item */}
              {isLast ? (
                // Current page (not clickable)
                <span
                  className="font-medium text-gray-900 dark:text-white truncate max-w-[200px] !ring-0 !border-0"
                  aria-current="page"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                // Link to previous page
                <Link
                  to={item.href || '/'}
                  className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors truncate max-w-[150px]"
                >
                  {isFirst && showHomeIcon ? (
                    <>
                      <Home className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </>
                  ) : (
                    <>
                      {item.icon && <span className="mr-1">{item.icon}</span>}
                      {item.label}
                    </>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Hook to get breadcrumb items for the current page
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  return generateBreadcrumbs(location.pathname);
}

export default Breadcrumbs;
