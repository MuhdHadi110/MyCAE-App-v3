import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';

const router = Router();

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 * No authentication required
 */
router.get('/', async (req, res: Response) => {
  const healthCheck: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    uptimeFormatted: string;
    environment: string;
    version: string;
    checks: {
      database: { status: 'ok' | 'error'; latency?: number; error?: string };
      memory: { heapUsed: string; heapTotal: string; rss: string };
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    uptimeFormatted: formatUptime(Date.now() - startTime),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'ok' },
      memory: getMemoryUsage(),
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await AppDataSource.query('SELECT 1');
    healthCheck.checks.database = {
      status: 'ok',
      latency: Date.now() - dbStart,
    };
  } catch (error: any) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.database = {
      status: 'error',
      error: error.message || 'Database connection failed',
    };
  }

  // Return appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

/**
 * GET /api/health/ready
 * Readiness probe - checks if app is ready to serve traffic
 */
router.get('/ready', async (req, res: Response) => {
  try {
    // Check database is connected
    await AppDataSource.query('SELECT 1');
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, reason: 'Database not ready' });
  }
});

/**
 * GET /api/health/live
 * Liveness probe - checks if app is alive
 */
router.get('/live', (req, res: Response) => {
  res.status(200).json({ alive: true });
});

// Helper functions
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getMemoryUsage(): { heapUsed: string; heapTotal: string; rss: string } {
  const mem = process.memoryUsage();
  const formatBytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;
  return {
    heapUsed: formatBytes(mem.heapUsed),
    heapTotal: formatBytes(mem.heapTotal),
    rss: formatBytes(mem.rss),
  };
}

export default router;
