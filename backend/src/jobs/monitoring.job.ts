import { MonitoringService } from "../services/monitoring.service";
import { AlertService } from "../services/alert.service";
import { MetricsService } from "../services/metrics.service";

export interface MonitoringJobConfig {
  intervalMs?: number;
  enabled?: boolean;
}

export class MonitoringJob {
  private monitoringService: MonitoringService;
  private alertService: AlertService;
  private metricsService: MetricsService;
  private intervalMs: number;
  private enabled: boolean;
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    monitoringService: MonitoringService,
    alertService: AlertService,
    metricsService: MetricsService,
    config?: MonitoringJobConfig
  ) {
    this.monitoringService = monitoringService;
    this.alertService = alertService;
    this.metricsService = metricsService;

    // Default: 5 minutes
    this.intervalMs = config?.intervalMs || parseInt(process.env.MONITORING_INTERVAL_MS || "300000");
    this.enabled = config?.enabled ?? true;
  }

  /**
   * Start the monitoring job
   */
  start(): void {
    if (!this.enabled) {
      console.log("[MonitoringJob] Monitoring disabled, not starting");
      return;
    }

    if (this.intervalHandle) {
      console.log("[MonitoringJob] Already running");
      return;
    }

    console.log(`[MonitoringJob] Starting monitoring job (interval: ${this.intervalMs}ms)`);

    // Run immediately on start
    this.runChecks().catch((err) => {
      console.error("[MonitoringJob] Initial check failed:", err.message);
    });

    // Schedule recurring checks
    this.intervalHandle = setInterval(() => {
      this.runChecks().catch((err) => {
        console.error("[MonitoringJob] Scheduled check failed:", err.message);
      });
    }, this.intervalMs);
  }

  /**
   * Stop the monitoring job
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log("[MonitoringJob] Stopped");
    }
  }

  /**
   * Run all monitoring checks
   */
  async runChecks(): Promise<void> {
    if (this.isRunning) {
      console.log("[MonitoringJob] Check already in progress, skipping");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Run all health checks
      const checks = await this.monitoringService.runAllChecks();
      const duration = Date.now() - startTime;

      // Log summary
      const criticalCount = checks.filter((c) => c.status === "critical").length;
      const warningCount = checks.filter((c) => c.status === "warning").length;
      const healthyCount = checks.filter((c) => c.status === "healthy").length;

      console.log(
        `[MonitoringJob] Checks complete in ${duration}ms: ` +
          `${healthyCount} healthy, ${warningCount} warnings, ${criticalCount} critical`
      );

      // Update metrics with balance info
      const relayerCheck = checks.find((c) => c.name === "relayer_balance");
      const paymasterCheck = checks.find((c) => c.name === "paymaster_deposit");

      if (relayerCheck && paymasterCheck) {
        const relayerBalance = parseFloat(relayerCheck.value.replace(" AVAX", "")) || 0;
        const paymasterDeposit = parseFloat(paymasterCheck.value.replace(" AVAX", "")) || 0;
        this.metricsService.updateBalances(relayerBalance, paymasterDeposit);
      }

      // Process alerts for non-healthy checks
      if (this.alertService.hasChannelsConfigured()) {
        const alertsSent = await this.alertService.processHealthChecks(checks);
        if (alertsSent > 0) {
          console.log(`[MonitoringJob] Sent ${alertsSent} alerts`);
        }
      }
    } catch (error: any) {
      console.error("[MonitoringJob] Error running checks:", error.message);

      // Send alert about monitoring failure itself
      if (this.alertService.hasChannelsConfigured()) {
        await this.alertService.sendAlert({
          severity: "CRITICAL",
          title: "Monitoring Job Failed",
          message: `Health checks could not complete: ${error.message}`,
          source: "Monitoring Job",
        });
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run checks manually (for testing or on-demand)
   */
  async runOnce(): Promise<void> {
    await this.runChecks();
  }

  /**
   * Check if job is currently running
   */
  isActive(): boolean {
    return this.intervalHandle !== null;
  }

  /**
   * Get current interval in milliseconds
   */
  getInterval(): number {
    return this.intervalMs;
  }
}

/**
 * Factory function to create and start monitoring job
 */
export function createMonitoringJob(
  monitoringService: MonitoringService,
  alertService: AlertService,
  metricsService: MetricsService,
  config?: MonitoringJobConfig
): MonitoringJob {
  const job = new MonitoringJob(monitoringService, alertService, metricsService, config);
  job.start();
  return job;
}
