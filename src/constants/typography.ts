/**
 * Typography Constants
 * Standardized typography styles for consistent text hierarchy across the application
 */

export const TYPOGRAPHY = {
  // Page Titles
  pageTitle: 'text-2xl md:text-3xl font-bold text-gray-900',
  pageTitleDark: 'text-2xl md:text-3xl font-bold text-gray-100 dark:text-gray-100',

  // Page Descriptions
  pageDescription: 'text-gray-600 mt-1 text-sm md:text-base leading-relaxed',
  pageDescriptionDark: 'text-gray-400 mt-1 text-sm md:text-base leading-relaxed dark:text-gray-400',

  // Section Titles
  sectionTitle: 'text-lg font-semibold text-gray-900',
  sectionTitleDark: 'text-lg font-semibold text-gray-100 dark:text-gray-100',

  // Card Titles
  cardTitle: 'text-base font-semibold text-gray-900',
  cardTitleDark: 'text-base font-semibold text-gray-100 dark:text-gray-100',

  // Card Descriptions
  cardDescription: 'text-sm text-gray-600',
  cardDescriptionDark: 'text-sm text-gray-400 dark:text-gray-400',

  // Body Text
  body: 'text-sm text-gray-700 leading-relaxed',
  bodyDark: 'text-sm text-gray-300 leading-relaxed dark:text-gray-300',

  // Caption/Helper Text
  caption: 'text-xs text-gray-500',
  captionDark: 'text-xs text-gray-400 dark:text-gray-400',

  // Labels
  label: 'text-sm font-medium text-gray-700',
  labelDark: 'text-sm font-medium text-gray-300 dark:text-gray-300',

  // Links
  link: 'text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors',
  linkDark: 'text-sm text-primary-400 hover:text-primary-300 hover:underline transition-colors dark:text-primary-400',

  // Error Messages
  error: 'text-xs text-red-600',
  errorDark: 'text-xs text-red-400 dark:text-red-400',

  // Success Messages
  success: 'text-xs text-green-600',
  successDark: 'text-xs text-green-400 dark:text-green-400',

  // Breadcrumbs
  breadcrumb: 'text-sm text-gray-600',
  breadcrumbDark: 'text-sm text-gray-400 dark:text-gray-400',

  // Table Headers
  tableHeader: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
  tableHeaderDark: 'text-xs font-medium text-gray-400 uppercase tracking-wider dark:text-gray-400',

  // Table Cell
  tableCell: 'text-sm text-gray-900',
  tableCellDark: 'text-sm text-gray-100 dark:text-gray-100',
} as const;

/**
 * Text size variants
 */
export const TEXT_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
} as const;

/**
 * Font weight variants
 */
export const FONT_WEIGHTS = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
} as const;

/**
 * Text color variants
 */
export const TEXT_COLORS = {
  inherit: 'text-inherit',
  current: 'text-current',
  primary: 'text-primary-600',
  secondary: 'text-gray-600',
  tertiary: 'text-gray-500',
  muted: 'text-gray-400',
  inverse: 'text-white',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
  info: 'text-blue-600',
} as const;

/**
 * Helper function to get typography class with dark mode support
 */
export function getTypographyClass(
  baseClass: string,
  darkClass?: string
): string {
  return darkClass ? `${baseClass} ${darkClass}` : baseClass;
}
