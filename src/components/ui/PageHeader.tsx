import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Breadcrumbs } from './Breadcrumbs';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description/subtitle */
  description?: string;
  /** Icon to display next to the title */
  icon?: React.ReactNode;
  /** Action buttons/elements */
  actions?: React.ReactNode;
  /** Custom breadcrumb items (auto-generates if not provided) */
  breadcrumbs?: BreadcrumbItem[];
  /** Show auto-generated breadcrumbs (default: true) */
  showBreadcrumbs?: boolean;
  /** Additional content below the header */
  children?: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Use compact variant */
  compact?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  actions,
  breadcrumbs,
  showBreadcrumbs = true,
  children,
  className,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        compact ? 'p-4' : 'p-6',
        className
      )}
    >
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="mb-4">
          {breadcrumbs ? (
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm flex-wrap">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && (
                      <span className="text-gray-400 dark:text-gray-500">/</span>
                    )}
                    {crumb.href && index < breadcrumbs.length - 1 ? (
                      <Link
                        to={crumb.href}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          index === breadcrumbs.length - 1
                            ? 'text-gray-900 dark:text-white font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : (
            <Breadcrumbs />
          )}
        </div>
      )}

      {/* Header Content */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title Section */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {icon && (
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                'font-bold text-gray-900 dark:text-white truncate',
                compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
              )}
            >
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Additional content */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default PageHeader;
