/**
 * Metrics Collector for Load Tests
 *
 * Collects, aggregates, and reports performance metrics
 * during load test execution.
 */

export interface MetricSample {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface HistogramBucket {
  le: number; // less than or equal
  count: number;
}

export interface AggregatedMetrics {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  stdDev: number;
  histogram: HistogramBucket[];
}

/**
 * Metrics Collector
 *
 * Collects samples over time and provides aggregation functions
 */
export class MetricsCollector {
  private samples: Map<string, MetricSample[]> = new Map();
  private startTime: number = Date.now();
  private histogramBuckets: number[] = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000];

  constructor(buckets?: number[]) {
    if (buckets) {
      this.histogramBuckets = buckets;
    }
    this.reset();
  }

  /**
   * Reset all collected samples
   */
  reset(): void {
    this.samples.clear();
    this.startTime = Date.now();
  }

  /**
   * Record a sample value
   */
  record(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.samples.has(name)) {
      this.samples.set(name, []);
    }

    this.samples.get(name)!.push({
      timestamp: Date.now(),
      value,
      labels,
    });
  }

  /**
   * Start a timer and return a function to stop it
   */
  startTimer(name: string, labels?: Record<string, string>): () => number {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.record(name, duration, labels);
      return duration;
    };
  }

  /**
   * Get all samples for a metric
   */
  getSamples(name: string): MetricSample[] {
    return this.samples.get(name) || [];
  }

  /**
   * Get aggregated metrics for a metric name
   */
  getAggregated(name: string): AggregatedMetrics | null {
    const samples = this.samples.get(name);
    if (!samples || samples.length === 0) {
      return null;
    }

    const values = samples.map((s) => s.value);
    const sorted = [...values].sort((a, b) => a - b);

    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = sum / count;

    // Calculate standard deviation
    const squaredDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Calculate percentiles
    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    // Build histogram
    const histogram: HistogramBucket[] = this.histogramBuckets.map((le) => ({
      le,
      count: sorted.filter((v) => v <= le).length,
    }));

    // Add infinity bucket
    histogram.push({ le: Infinity, count: count });

    return {
      count,
      sum,
      min,
      max,
      avg,
      p50: percentile(50),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
      stdDev,
      histogram,
    };
  }

  /**
   * Get metrics names
   */
  getMetricNames(): string[] {
    return Array.from(this.samples.keys());
  }

  /**
   * Get elapsed time since collector was created/reset
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get throughput (samples per second) for a metric
   */
  getThroughput(name: string): number {
    const samples = this.samples.get(name);
    if (!samples || samples.length === 0) {
      return 0;
    }

    const elapsed = this.getElapsedTime();
    return samples.length / (elapsed / 1000);
  }

  /**
   * Get success rate for boolean-like metrics
   * Assumes values > 0 are successes
   */
  getSuccessRate(name: string): number {
    const samples = this.samples.get(name);
    if (!samples || samples.length === 0) {
      return 0;
    }

    const successes = samples.filter((s) => s.value > 0).length;
    return successes / samples.length;
  }

  /**
   * Generate a summary report
   */
  generateReport(): string {
    const lines: string[] = [];
    lines.push('═'.repeat(70));
    lines.push('                     METRICS REPORT');
    lines.push('═'.repeat(70));
    lines.push(`  Elapsed Time: ${(this.getElapsedTime() / 1000).toFixed(2)}s`);
    lines.push('');

    for (const name of this.getMetricNames()) {
      const agg = this.getAggregated(name);
      if (!agg) continue;

      lines.push(`  ┌─ ${name}`);
      lines.push(`  │  Count:   ${agg.count}`);
      lines.push(`  │  Min:     ${agg.min.toFixed(2)}`);
      lines.push(`  │  Max:     ${agg.max.toFixed(2)}`);
      lines.push(`  │  Avg:     ${agg.avg.toFixed(2)}`);
      lines.push(`  │  StdDev:  ${agg.stdDev.toFixed(2)}`);
      lines.push(`  │  P50:     ${agg.p50.toFixed(2)}`);
      lines.push(`  │  P95:     ${agg.p95.toFixed(2)}`);
      lines.push(`  │  P99:     ${agg.p99.toFixed(2)}`);
      lines.push(`  │  Rate:    ${this.getThroughput(name).toFixed(2)}/s`);
      lines.push(`  └─`);
      lines.push('');
    }

    lines.push('═'.repeat(70));

    return lines.join('\n');
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheus(prefix: string = 'load_test'): string {
    const lines: string[] = [];

    for (const name of this.getMetricNames()) {
      const agg = this.getAggregated(name);
      if (!agg) continue;

      const metricName = `${prefix}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_');

      // Summary metrics
      lines.push(`# HELP ${metricName} ${name} metrics`);
      lines.push(`# TYPE ${metricName} summary`);
      lines.push(`${metricName}_sum ${agg.sum}`);
      lines.push(`${metricName}_count ${agg.count}`);
      lines.push(`${metricName}{quantile="0.5"} ${agg.p50}`);
      lines.push(`${metricName}{quantile="0.9"} ${agg.p90}`);
      lines.push(`${metricName}{quantile="0.95"} ${agg.p95}`);
      lines.push(`${metricName}{quantile="0.99"} ${agg.p99}`);
      lines.push('');

      // Histogram buckets
      lines.push(`# TYPE ${metricName}_histogram histogram`);
      for (const bucket of agg.histogram) {
        const le = bucket.le === Infinity ? '+Inf' : bucket.le.toString();
        lines.push(`${metricName}_bucket{le="${le}"} ${bucket.count}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Export to JSON for further analysis
   */
  toJSON(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

    for (const name of this.getMetricNames()) {
      metrics[name] = {
        aggregated: this.getAggregated(name),
        samples: this.getSamples(name),
        throughput: this.getThroughput(name),
      };
    }

    return {
      startTime: this.startTime,
      elapsedMs: this.getElapsedTime(),
      metrics,
    };
  }
}

/**
 * Rate limiter for controlled load testing
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(ratePerSecond: number) {
    this.maxTokens = ratePerSecond;
    this.refillRate = ratePerSecond;
    this.tokens = ratePerSecond;
    this.lastRefill = Date.now();
  }

  /**
   * Acquire a token, waiting if necessary
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait for token to become available
    const waitTime = (1 / this.refillRate) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.tokens = 0;
  }

  /**
   * Try to acquire a token without waiting
   */
  tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

/**
 * Progress tracker for load tests
 */
export class ProgressTracker {
  private completed: number = 0;
  private failed: number = 0;
  private readonly total: number;
  private readonly startTime: number;
  private lastLogTime: number = 0;

  constructor(total: number) {
    this.total = total;
    this.startTime = Date.now();
  }

  /**
   * Mark one operation as completed
   */
  complete(success: boolean = true): void {
    if (success) {
      this.completed++;
    } else {
      this.failed++;
    }

    // Log progress every second
    const now = Date.now();
    if (now - this.lastLogTime > 1000) {
      this.logProgress();
      this.lastLogTime = now;
    }
  }

  /**
   * Get current progress percentage
   */
  getProgress(): number {
    return ((this.completed + this.failed) / this.total) * 100;
  }

  /**
   * Get estimated time remaining in ms
   */
  getETA(): number {
    const done = this.completed + this.failed;
    if (done === 0) return Infinity;

    const elapsed = Date.now() - this.startTime;
    const rate = done / elapsed;
    const remaining = this.total - done;

    return remaining / rate;
  }

  /**
   * Log current progress to console
   */
  logProgress(): void {
    const done = this.completed + this.failed;
    const progress = this.getProgress();
    const eta = this.getETA();

    const etaStr = eta === Infinity ? '...' : `${Math.ceil(eta / 1000)}s`;

    console.log(
      `Progress: ${done}/${this.total} (${progress.toFixed(1)}%) ` +
        `| Success: ${this.completed} | Failed: ${this.failed} ` +
        `| ETA: ${etaStr}`
    );
  }

  /**
   * Get summary
   */
  getSummary(): { completed: number; failed: number; total: number; duration: number } {
    return {
      completed: this.completed,
      failed: this.failed,
      total: this.total,
      duration: Date.now() - this.startTime,
    };
  }
}
