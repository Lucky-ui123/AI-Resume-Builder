/**
 * Telemetry and Monitoring Helper for Production Resume Operations
 * Logs structured metrics in JSON format for automated log ingestors (e.g., Datadog, Logstash, GCP Logging).
 */

export interface MetricEvent {
  metricName: string;
  value: number; // The measured value (e.g., count, duration in ms, rate)
  status: 'success' | 'failure' | 'warning';
  tags?: Record<string, string | number | boolean>;
}

export class Telemetry {
  /**
   * Record a structured metric event
   */
  static recordMetric(event: MetricEvent) {
    const logPayload = {
      timestamp: new Date().toISOString(),
      type: 'METRIC',
      ...event
    };
    
    if (event.status === 'failure') {
      console.error(`[METRIC_FAILURE] ${JSON.stringify(logPayload)}`);
    } else if (event.status === 'warning') {
      console.warn(`[METRIC_WARNING] ${JSON.stringify(logPayload)}`);
    } else {
      console.log(`[METRIC_SUCCESS] ${JSON.stringify(logPayload)}`);
    }
  }

  /**
   * Track latency of a database or network operation
   */
  static recordLatency(
    metricName: string, 
    durationMs: number, 
    status: 'success' | 'failure', 
    tags?: Record<string, string | number | boolean>
  ) {
    this.recordMetric({
      metricName: `${metricName}.latency`,
      value: durationMs,
      status,
      tags: {
        unit: 'ms',
        ...tags
      }
    });
  }

  /**
   * Record a counter event
   */
  static recordCounter(
    metricName: string,
    value: number,
    status: 'success' | 'failure' | 'warning',
    tags?: Record<string, string | number | boolean>
  ) {
    this.recordMetric({
      metricName: `${metricName}.count`,
      value,
      status,
      tags
    });
  }
}
