import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes.js';
import relayerRoutes from './routes/relayer.routes.js';
import poolsRoutes from './routes/pools.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import indexerRoutes from './routes/indexer.routes.js';
import useropRoutes from './routes/userop.routes.js';
import monitoringRoutes, { initMonitoringRoutes } from './routes/monitoring.routes.js';
import { startIndexer, stopIndexer } from './jobs/indexer.job.js';
import { csrfProtection } from './middleware/csrf.middleware.js';
import { MonitoringService } from './services/monitoring.service.js';
import { AlertService } from './services/alert.service.js';
import { MetricsService } from './services/metrics.service.js';
import { createMonitoringJob, MonitoringJob } from './jobs/monitoring.job.js';
import { createNavJob, NavJob } from './jobs/nav.job.js';

// Initialize logger
const logger = pino.default({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Monitoring job reference
let monitoringJob: MonitoringJob | null = null;
// NAV simulation job reference
let navJob: NavJob | null = null;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// CSRF protection (SEC-002) - after cookieParser, before routes
app.use(csrfProtection);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    logger.error(error, 'Health check failed');
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'RWA Gateway API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      relayer: '/api/relayer/*',
      pools: '/api/pools/*',
      portfolio: '/api/portfolio/*',
      indexer: '/api/indexer/*',
      userop: '/api/userop/*',
      monitoring: '/api/monitoring/*',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/relayer', relayerRoutes);
app.use('/api/pools', poolsRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/indexer', indexerRoutes);
app.use('/api/userop', useropRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  if (monitoringJob) {
    monitoringJob.stop();
  }
  if (navJob) {
    navJob.stop();
  }
  await stopIndexer();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function main() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`RWA Gateway API running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Start indexer if configured
    if (process.env.ENABLE_INDEXER === 'true') {
      logger.info('Starting blockchain event indexer...');
      const indexer = await startIndexer();
      if (indexer) {
        const status = await indexer.getStatus();
        logger.info(`Indexer started - last block: ${status.lastIndexedBlock}, current: ${status.currentBlock}`);
      } else {
        logger.warn('Indexer not started - check BIOMETRIC_REGISTRY_ADDRESS configuration');
      }
    }

    // Initialize monitoring services
    if (process.env.RELAYER_ADDRESS || process.env.RELAYER_PRIVATE_KEY) {
      logger.info('Initializing monitoring services...');

      const rpcUrl = process.env.AVALANCHE_RPC_URL || process.env.AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';
      const chainId = parseInt(process.env.CHAIN_ID || '43113');

      // Get relayer address from env or derive from private key
      let relayerAddress = process.env.RELAYER_ADDRESS;
      if (!relayerAddress && process.env.RELAYER_PRIVATE_KEY) {
        const { ethers } = await import('ethers');
        const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY);
        relayerAddress = wallet.address;
      }

      if (relayerAddress) {
        const monitoringService = new MonitoringService({
          rpcUrl,
          chainId,
          relayerAddress,
          paymasterAddress: process.env.RWA_PAYMASTER_ADDRESS,
        });

        const alertService = new AlertService();
        const metricsService = new MetricsService();

        // Initialize routes with services
        initMonitoringRoutes(monitoringService, metricsService);

        // Start monitoring job if enabled
        if (process.env.ENABLE_MONITORING !== 'false') {
          monitoringJob = createMonitoringJob(monitoringService, alertService, metricsService);
          logger.info('Monitoring job started');
        }

        logger.info('Monitoring services initialized');
      } else {
        logger.warn('Monitoring not started - RELAYER_ADDRESS not configured');
      }
    }

    // Start NAV simulation job for demo
    if (process.env.ENABLE_NAV_SIMULATION !== 'false') {
      navJob = createNavJob(prisma);
      navJob.start();
      logger.info('NAV simulation job started');
    }
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

main();

export { app, prisma, logger };
