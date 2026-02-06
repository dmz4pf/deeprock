import { Redis } from "ioredis";

export interface MetricLabels {
  [key: string]: string;
}

export interface CounterMetric {
  name: string;
  help: string;
  type: "counter";
  values: Map<string, number>;
}

export interface GaugeMetric {
  name: string;
  help: string;
  type: "gauge";
  values: Map<string, number>;
}

export interface HistogramBucket {
  le: number;
  count: number;
}

export interface HistogramMetric {
  name: string;
  help: string;
  type: "histogram";
  buckets: number[];
  values: Map<string, { buckets: number[]; sum: number; count: number }>;
}

type Metric = CounterMetric | GaugeMetric | HistogramMetric;

export class MetricsService {
  private counters: Map<string, CounterMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();
  private redis: Redis | null = null;

  constructor(redis?: Redis) {
    this.redis = redis || null;
    this.initializeDefaultMetrics();
  }

  /**
   * Initialize default metrics for the gasless transaction system
   */
  private initializeDefaultMetrics(): void {
    // Transaction counters
    this.registerCounter(
      "gasless_tx_total",
      "Total number of gasless transactions submitted"
    );
    this.registerCounter(
      "gasless_tx_success",
      "Number of successful gasless transactions"
    );
    this.registerCounter(
      "gasless_tx_failed",
      "Number of failed gasless transactions"
    );

    // Permit flow counters
    this.registerCounter(
      "permit_submissions_total",
      "Total permit-based investment submissions"
    );

    // UserOp flow counters
    this.registerCounter(
      "userop_submissions_total",
      "Total UserOperation submissions"
    );

    // Gauges
    this.registerGauge(
      "relayer_balance_avax",
      "Current relayer wallet balance in AVAX"
    );
    this.registerGauge(
      "paymaster_deposit_avax",
      "Current paymaster deposit in EntryPoint in AVAX"
    );

    // Histograms for latency
    this.registerHistogram(
      "tx_latency_seconds",
      "Transaction confirmation latency in seconds",
      [0.5, 1, 2, 5, 10, 30, 60]
    );
    this.registerHistogram(
      "gas_used",
      "Gas used per transaction",
      [50000, 100000, 150000, 200000, 300000, 500000]
    );
  }

  /**
   * Format labels into Prometheus label string
   */
  private formatLabels(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return "";
    }
    const pairs = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `{${pairs}}`;
  }

  /**
   * Format labels into a unique key
   */
  private formatKey(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return "__default__";
    }
    return Object.entries(labels)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
  }

  /**
   * Register a counter metric
   */
  registerCounter(name: string, help: string): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, {
        name,
        help,
        type: "counter",
        values: new Map(),
      });
    }
  }

  /**
   * Register a gauge metric
   */
  registerGauge(name: string, help: string): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, {
        name,
        help,
        type: "gauge",
        values: new Map(),
      });
    }
  }

  /**
   * Register a histogram metric
   */
  registerHistogram(name: string, help: string, buckets: number[]): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, {
        name,
        help,
        type: "histogram",
        buckets: buckets.sort((a, b) => a - b),
        values: new Map(),
      });
    }
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels?: MetricLabels, value: number = 1): void {
    const counter = this.counters.get(name);
    if (!counter) {
      console.warn(`[Metrics] Counter ${name} not registered`);
      return;
    }

    const key = this.formatKey(labels);
    const current = counter.values.get(key) || 0;
    counter.values.set(key, current + value);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: MetricLabels): void {
    const gauge = this.gauges.get(name);
    if (!gauge) {
      console.warn(`[Metrics] Gauge ${name} not registered`);
      return;
    }

    const key = this.formatKey(labels);
    gauge.values.set(key, value);
  }

  /**
   * Observe a value for a histogram
   */
  observeHistogram(name: string, value: number, labels?: MetricLabels): void {
    const histogram = this.histograms.get(name);
    if (!histogram) {
      console.warn(`[Metrics] Histogram ${name} not registered`);
      return;
    }

    const key = this.formatKey(labels);
    let data = histogram.values.get(key);

    if (!data) {
      data = {
        buckets: new Array(histogram.buckets.length).fill(0),
        sum: 0,
        count: 0,
      };
      histogram.values.set(key, data);
    }

    // Update buckets
    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        data.buckets[i]++;
      }
    }

    data.sum += value;
    data.count++;
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: MetricLabels): number {
    const counter = this.counters.get(name);
    if (!counter) return 0;
    const key = this.formatKey(labels);
    return counter.values.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: MetricLabels): number {
    const gauge = this.gauges.get(name);
    if (!gauge) return 0;
    const key = this.formatKey(labels);
    return gauge.values.get(key) || 0;
  }

  /**
   * Generate Prometheus-compatible metrics output
   */
  getPrometheusOutput(): string {
    const lines: string[] = [];

    // Counters
    for (const [name, counter] of this.counters) {
      lines.push(`# HELP ${name} ${counter.help}`);
      lines.push(`# TYPE ${name} counter`);

      if (counter.values.size === 0) {
        lines.push(`${name} 0`);
      } else {
        for (const [key, value] of counter.values) {
          const labels = key === "__default__" ? "" : `{${key.replace(/=/g, '="').replace(/,/g, '",') + '"'}}`;
          lines.push(`${name}${labels} ${value}`);
        }
      }
    }

    // Gauges
    for (const [name, gauge] of this.gauges) {
      lines.push(`# HELP ${name} ${gauge.help}`);
      lines.push(`# TYPE ${name} gauge`);

      if (gauge.values.size === 0) {
        lines.push(`${name} 0`);
      } else {
        for (const [key, value] of gauge.values) {
          const labels = key === "__default__" ? "" : `{${key.replace(/=/g, '="').replace(/,/g, '",') + '"'}}`;
          lines.push(`${name}${labels} ${value}`);
        }
      }
    }

    // Histograms
    for (const [name, histogram] of this.histograms) {
      lines.push(`# HELP ${name} ${histogram.help}`);
      lines.push(`# TYPE ${name} histogram`);

      for (const [key, data] of histogram.values) {
        const baseLabels = key === "__default__" ? "" : key;

        // Bucket values
        let cumulativeCount = 0;
        for (let i = 0; i < histogram.buckets.length; i++) {
          cumulativeCount += data.buckets[i];
          const le = histogram.buckets[i];
          const bucketLabels = baseLabels
            ? `{${baseLabels},le="${le}"}`
            : `{le="${le}"}`;
          lines.push(`${name}_bucket${bucketLabels} ${cumulativeCount}`);
        }

        // +Inf bucket
        const infLabels = baseLabels
          ? `{${baseLabels},le="+Inf"}`
          : `{le="+Inf"}`;
        lines.push(`${name}_bucket${infLabels} ${data.count}`);

        // Sum and count
        const suffixLabels = baseLabels ? `{${baseLabels}}` : "";
        lines.push(`${name}_sum${suffixLabels} ${data.sum}`);
        lines.push(`${name}_count${suffixLabels} ${data.count}`);
      }

      // Empty histogram
      if (histogram.values.size === 0) {
        for (const le of histogram.buckets) {
          lines.push(`${name}_bucket{le="${le}"} 0`);
        }
        lines.push(`${name}_bucket{le="+Inf"} 0`);
        lines.push(`${name}_sum 0`);
        lines.push(`${name}_count 0`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Record a transaction result
   */
  recordTransaction(
    flowType: "permit" | "userop",
    success: boolean,
    gasUsed?: number,
    latencySeconds?: number
  ): void {
    // Increment totals
    this.incrementCounter("gasless_tx_total", { flow: flowType });

    if (success) {
      this.incrementCounter("gasless_tx_success", { flow: flowType });
    } else {
      this.incrementCounter("gasless_tx_failed", { flow: flowType });
    }

    // Flow-specific counters
    if (flowType === "permit") {
      this.incrementCounter("permit_submissions_total");
    } else {
      this.incrementCounter("userop_submissions_total");
    }

    // Record gas used
    if (gasUsed) {
      this.observeHistogram("gas_used", gasUsed, { flow: flowType });
    }

    // Record latency
    if (latencySeconds) {
      this.observeHistogram("tx_latency_seconds", latencySeconds, { flow: flowType });
    }
  }

  /**
   * Update balance gauges
   */
  updateBalances(relayerBalance: number, paymasterDeposit?: number): void {
    this.setGauge("relayer_balance_avax", relayerBalance);
    if (paymasterDeposit !== undefined) {
      this.setGauge("paymaster_deposit_avax", paymasterDeposit);
    }
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    for (const counter of this.counters.values()) {
      counter.values.clear();
    }
    for (const gauge of this.gauges.values()) {
      gauge.values.clear();
    }
    for (const histogram of this.histograms.values()) {
      histogram.values.clear();
    }
  }
}
