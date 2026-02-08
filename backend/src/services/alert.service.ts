import { HealthCheck } from "./monitoring.service.js";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp?: Date;
  source?: string;
}

export interface AlertConfig {
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  cooldownMs?: number; // Prevent alert spam
}

export class AlertService {
  private slackWebhookUrl: string | null;
  private discordWebhookUrl: string | null;
  private cooldownMs: number;
  private lastAlerts: Map<string, number> = new Map();

  constructor(config?: AlertConfig) {
    this.slackWebhookUrl = config?.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL || null;
    this.discordWebhookUrl = config?.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL || null;
    this.cooldownMs = config?.cooldownMs || 15 * 60 * 1000; // 15 minutes default
  }

  /**
   * Check if we're within cooldown period for an alert
   */
  private isInCooldown(alertKey: string): boolean {
    const lastSent = this.lastAlerts.get(alertKey);
    if (!lastSent) return false;
    return Date.now() - lastSent < this.cooldownMs;
  }

  /**
   * Record that an alert was sent
   */
  private recordAlert(alertKey: string): void {
    this.lastAlerts.set(alertKey, Date.now());
  }

  /**
   * Generate a unique key for deduplication
   */
  private getAlertKey(alert: Alert): string {
    return `${alert.severity}:${alert.title}`;
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case "CRITICAL":
        return "\u{1F6A8}"; // Rotating light
      case "WARNING":
        return "\u{26A0}\u{FE0F}"; // Warning
      case "INFO":
        return "\u{2139}\u{FE0F}"; // Info
      default:
        return "\u{1F4E2}"; // Loudspeaker
    }
  }

  /**
   * Send alert to Slack
   */
  async sendSlackAlert(alert: Alert): Promise<boolean> {
    if (!this.slackWebhookUrl) {
      console.log("[AlertService] Slack webhook not configured, skipping");
      return false;
    }

    const alertKey = this.getAlertKey(alert);
    if (this.isInCooldown(alertKey)) {
      console.log(`[AlertService] Alert ${alertKey} in cooldown, skipping`);
      return false;
    }

    try {
      const emoji = this.getSeverityEmoji(alert.severity);
      const timestamp = alert.timestamp || new Date();

      const response = await fetch(this.slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `${emoji} ${alert.severity}: ${alert.title}`,
                emoji: true,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: alert.message,
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Source: ${alert.source || "RWA Gateway"} | ${timestamp.toISOString()}`,
                },
              ],
            },
          ],
        }),
      });

      if (response.ok) {
        this.recordAlert(alertKey);
        console.log(`[AlertService] Slack alert sent: ${alert.title}`);
        return true;
      } else {
        console.error(`[AlertService] Slack webhook failed: ${response.status}`);
        return false;
      }
    } catch (error: any) {
      console.error(`[AlertService] Slack alert error: ${error.message}`);
      return false;
    }
  }

  /**
   * Send alert to Discord
   */
  async sendDiscordAlert(alert: Alert): Promise<boolean> {
    if (!this.discordWebhookUrl) {
      console.log("[AlertService] Discord webhook not configured, skipping");
      return false;
    }

    const alertKey = this.getAlertKey(alert);
    if (this.isInCooldown(alertKey)) {
      console.log(`[AlertService] Alert ${alertKey} in cooldown, skipping`);
      return false;
    }

    try {
      const timestamp = alert.timestamp || new Date();

      // Discord embed colors
      const colors: Record<AlertSeverity, number> = {
        CRITICAL: 0xff0000, // Red
        WARNING: 0xffa500, // Orange
        INFO: 0x0099ff, // Blue
      };

      const response = await fetch(this.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: `${this.getSeverityEmoji(alert.severity)} ${alert.severity}: ${alert.title}`,
              description: alert.message,
              color: colors[alert.severity],
              footer: {
                text: alert.source || "RWA Gateway",
              },
              timestamp: timestamp.toISOString(),
            },
          ],
        }),
      });

      if (response.ok) {
        this.recordAlert(alertKey);
        console.log(`[AlertService] Discord alert sent: ${alert.title}`);
        return true;
      } else {
        console.error(`[AlertService] Discord webhook failed: ${response.status}`);
        return false;
      }
    } catch (error: any) {
      console.error(`[AlertService] Discord alert error: ${error.message}`);
      return false;
    }
  }

  /**
   * Send alert to all configured channels
   */
  async sendAlert(alert: Alert): Promise<{ slack: boolean; discord: boolean }> {
    const [slack, discord] = await Promise.all([
      this.sendSlackAlert(alert),
      this.sendDiscordAlert(alert),
    ]);

    return { slack, discord };
  }

  /**
   * Create alert from health check result
   */
  alertFromHealthCheck(check: HealthCheck): Alert | null {
    if (check.status === "healthy") {
      return null;
    }

    const severity: AlertSeverity = check.status === "critical" ? "CRITICAL" : "WARNING";

    return {
      severity,
      title: `${check.name} is ${check.status}`,
      message: [
        `**Current Value:** ${check.value}`,
        `**Threshold:** ${check.threshold}`,
        check.message ? `\n${check.message}` : "",
      ].join("\n"),
      source: "Monitoring Service",
      timestamp: new Date(),
    };
  }

  /**
   * Process health checks and send alerts for non-healthy checks
   */
  async processHealthChecks(checks: HealthCheck[]): Promise<number> {
    let alertsSent = 0;

    for (const check of checks) {
      const alert = this.alertFromHealthCheck(check);
      if (alert) {
        const result = await this.sendAlert(alert);
        if (result.slack || result.discord) {
          alertsSent++;
        }
      }
    }

    return alertsSent;
  }

  /**
   * Check if any alert channels are configured
   */
  hasChannelsConfigured(): boolean {
    return !!(this.slackWebhookUrl || this.discordWebhookUrl);
  }

  /**
   * Clear cooldown cache (for testing)
   */
  clearCooldowns(): void {
    this.lastAlerts.clear();
  }
}
