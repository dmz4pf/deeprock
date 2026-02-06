import { Router, Request, Response } from "express";
import { MonitoringService, HealthCheck } from "../services/monitoring.service";
import { MetricsService } from "../services/metrics.service";

const router = Router();

// These will be injected by the main app
let monitoringService: MonitoringService | null = null;
let metricsService: MetricsService | null = null;

/**
 * Initialize routes with service instances
 */
export function initMonitoringRoutes(
  monitoring: MonitoringService,
  metrics: MetricsService
): Router {
  monitoringService = monitoring;
  metricsService = metrics;
  return router;
}

/**
 * GET /health
 * Overall system health check
 */
router.get("/health", async (req: Request, res: Response) => {
  if (!monitoringService) {
    res.status(503).json({
      status: "unavailable",
      message: "Monitoring service not initialized",
    });
    return;
  }

  try {
    const { status, checks } = await monitoringService.getOverallStatus();

    const httpStatus = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

    res.status(httpStatus).json({
      status,
      timestamp: new Date().toISOString(),
      checks: checks.map((c) => ({
        name: c.name,
        status: c.status,
        value: c.value,
        threshold: c.threshold,
        ...(c.message && { message: c.message }),
      })),
    });
  } catch (error: any) {
    res.status(503).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * GET /health/relayer
 * Relayer-specific health check
 */
router.get("/health/relayer", async (req: Request, res: Response) => {
  if (!monitoringService) {
    res.status(503).json({
      status: "unavailable",
      message: "Monitoring service not initialized",
    });
    return;
  }

  try {
    const check = await monitoringService.checkRelayerBalance();
    const httpStatus = check.status === "healthy" ? 200 : check.status === "warning" ? 200 : 503;

    res.status(httpStatus).json({
      ...check,
      address: monitoringService.getRelayerAddress(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      name: "relayer_balance",
      status: "error",
      message: error.message,
    });
  }
});

/**
 * GET /health/paymaster
 * Paymaster-specific health check
 */
router.get("/health/paymaster", async (req: Request, res: Response) => {
  if (!monitoringService) {
    res.status(503).json({
      status: "unavailable",
      message: "Monitoring service not initialized",
    });
    return;
  }

  try {
    const check = await monitoringService.checkPaymasterDeposit();
    const httpStatus = check.status === "healthy" ? 200 : check.status === "warning" ? 200 : 503;

    res.status(httpStatus).json({
      ...check,
      address: monitoringService.getPaymasterAddress(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      name: "paymaster_deposit",
      status: "error",
      message: error.message,
    });
  }
});

/**
 * GET /health/rpc
 * RPC connectivity health check
 */
router.get("/health/rpc", async (req: Request, res: Response) => {
  if (!monitoringService) {
    res.status(503).json({
      status: "unavailable",
      message: "Monitoring service not initialized",
    });
    return;
  }

  try {
    const check = await monitoringService.checkRpcHealth();
    const httpStatus = check.status === "healthy" ? 200 : 503;

    res.status(httpStatus).json({
      ...check,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      name: "rpc_health",
      status: "error",
      message: error.message,
    });
  }
});

/**
 * GET /metrics
 * Prometheus-compatible metrics endpoint
 */
router.get("/metrics", async (req: Request, res: Response) => {
  if (!metricsService) {
    res.status(503).send("# Metrics service not initialized\n");
    return;
  }

  try {
    // Update balance gauges before returning metrics
    if (monitoringService) {
      const relayerCheck = await monitoringService.checkRelayerBalance();
      const paymasterCheck = await monitoringService.checkPaymasterDeposit();

      // Parse AVAX values from strings like "0.5 AVAX"
      const relayerBalance = parseFloat(relayerCheck.value.replace(" AVAX", "")) || 0;
      const paymasterDeposit = parseFloat(paymasterCheck.value.replace(" AVAX", "")) || 0;

      metricsService.updateBalances(relayerBalance, paymasterDeposit);
    }

    const output = metricsService.getPrometheusOutput();
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(output);
  } catch (error: any) {
    res.status(503).send(`# Error generating metrics: ${error.message}\n`);
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get("/health/live", (req: Request, res: Response) => {
  res.status(200).json({ status: "alive" });
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get("/health/ready", async (req: Request, res: Response) => {
  if (!monitoringService) {
    res.status(503).json({ status: "not_ready", reason: "services_not_initialized" });
    return;
  }

  try {
    // Check RPC connectivity as basic readiness indicator
    const rpcCheck = await monitoringService.checkRpcHealth();

    if (rpcCheck.status === "critical") {
      res.status(503).json({ status: "not_ready", reason: "rpc_unavailable" });
    } else {
      res.status(200).json({ status: "ready" });
    }
  } catch (error) {
    res.status(503).json({ status: "not_ready", reason: "check_failed" });
  }
});

export default router;
