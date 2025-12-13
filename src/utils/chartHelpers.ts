import { GanttTask, HeatmapCell, ProjectMilestone } from '../types/analytics.types';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Get color based on status
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'pre-lim': '#60a5fa', // blue-400
    'ongoing': '#fbbf24', // amber-400
    'completed': '#34d399', // emerald-400
    'pending': '#9ca3af', // gray-400
    'in-progress': '#fbbf24', // amber-400
    'overdue': '#f87171', // red-400
    'active': '#34d399', // emerald-400
    'inactive': '#d1d5db', // gray-300
  };
  return colors[status.toLowerCase()] || '#6b7280';
};

/**
 * Get intensity color for heatmap (blue gradient)
 */
export const getHeatmapColor = (intensity: number): string => {
  // 0-1 scale, blue gradient from light to dark
  if (intensity < 0.2) return '#dbeafe'; // blue-100
  if (intensity < 0.4) return '#93c5fd'; // blue-300
  if (intensity < 0.6) return '#60a5fa'; // blue-400
  if (intensity < 0.8) return '#3b82f6'; // blue-500
  return '#1e40af'; // blue-800
};

/**
 * Format Gantt task to chart data
 */
export const formatGanttData = (tasks: GanttTask[]): any[] => {
  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    start: format(task.start, 'yyyy-MM-dd'),
    end: format(task.end, 'yyyy-MM-dd'),
    progress: task.progress,
    type: task.type,
    color: task.color || getStatusColor(task.type),
    assignee: task.assignee,
  }));
};

/**
 * Format milestone to chart data
 */
export const formatMilestoneData = (milestone: ProjectMilestone): any => {
  return {
    id: milestone.id,
    projectCode: milestone.projectCode,
    projectTitle: milestone.projectTitle,
    milestone: milestone.milestone,
    targetDate: format(milestone.targetDate, 'MMM dd, yyyy'),
    completedDate: milestone.completedDate ? format(milestone.completedDate, 'MMM dd, yyyy') : null,
    phase: milestone.phase,
    percentComplete: milestone.percentComplete,
    color: getStatusColor(milestone.phase),
    status: milestone.completedDate ? 'completed' : 'pending',
  };
};

/**
 * Calculate heatmap intensity (0-1)
 */
export const calculateIntensity = (value: number, min: number, max: number): number => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

/**
 * Format heatmap data for display
 */
export const formatHeatmapData = (cells: HeatmapCell[]): Map<string, HeatmapCell[]> => {
  const grouped = new Map<string, HeatmapCell[]>();

  cells.forEach((cell) => {
    const engineer = grouped.get(cell.engineerId) || [];
    engineer.push(cell);
    grouped.set(cell.engineerId, engineer);
  });

  return grouped;
};

/**
 * Export chart as PNG
 */
export const exportChartAsPNG = async (elementId: string, filename: string = 'chart'): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.png`;
    link.click();
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
  }
};

/**
 * Export chart as PDF
 */
export const exportChartAsPDF = async (
  elementId: string,
  title: string = 'Chart',
  filename: string = 'chart'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 280; // A4 landscape width minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.text(title, 15, 15);
    pdf.addImage(imgData, 'PNG', 15, 25, imgWidth, imgHeight);
    pdf.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error('Error exporting chart as PDF:', error);
  }
};

/**
 * Export data as CSV
 */
export const exportDataAsCSV = (data: any[], filename: string = 'data'): void => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => JSON.stringify(row[header])).join(',')),
  ].join('\n');

  const link = document.createElement('a');
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
};

/**
 * Get contrasting text color for background
 */
export const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#000000' : '#FFFFFF';
};

/**
 * Format percentage change
 */
export const formatPercentageChange = (current: number, previous: number): { value: string; trend: 'up' | 'down' | 'neutral' } => {
  if (previous === 0) {
    return { value: '+100%', trend: current > 0 ? 'up' : 'neutral' };
  }

  const change = ((current - previous) / previous) * 100;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return {
    value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    trend,
  };
};

/**
 * Format large numbers for display
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Get gradient stops for charts
 */
export const getGradientStops = (): any[] => {
  return [
    { offset: '0%', color: '#dbeafe' },
    { offset: '25%', color: '#93c5fd' },
    { offset: '50%', color: '#60a5fa' },
    { offset: '75%', color: '#3b82f6' },
    { offset: '100%', color: '#1e40af' },
  ];
};
