# Story 7.7: Monitoring & Logging

## Summary
Set up Cloud Monitoring, logging, and alerting for production observability.

## Acceptance Criteria
- Centralized logging via Cloud Logging
- Key metrics dashboards
- Error rate alerting
- Performance monitoring

## Logging Setup

### Structured Logging in Next.js

#### lib/logger.ts
```typescript
type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  severity: LogLevel
  message: string
  timestamp: string
  [key: string]: any
}

export const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    log('info', message, metadata)
  },

  warn: (message: string, metadata?: Record<string, any>) => {
    log('warn', message, metadata)
  },

  error: (message: string, error?: Error, metadata?: Record<string, any>) => {
    log('error', message, {
      ...metadata,
      error: error?.message,
      stack: error?.stack,
    })
  },
}

function log(severity: LogLevel, message: string, metadata?: Record<string, any>) {
  const entry: LogEntry = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  }

  // Cloud Logging expects JSON on stdout
  console.log(JSON.stringify(entry))
}
```

### Usage in API Routes
```typescript
// app/api/dictionary/[word]/route.ts
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const word = params.word

  logger.info('Dictionary lookup', { word })

  try {
    const definition = await fetchDefinition(word)
    return NextResponse.json(definition)
  } catch (error) {
    logger.error('Dictionary lookup failed', error as Error, { word })
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
```

## Metrics & Dashboards

### Key Metrics to Monitor
1. **Request metrics**
   - Request count
   - Request latency (p50, p95, p99)
   - Error rate

2. **Resource metrics**
   - CPU utilization
   - Memory usage
   - Instance count

3. **Application metrics**
   - TTS generation time
   - Dictionary API success rate
   - Vocabulary save operations

### Custom Metrics (Optional)

#### middleware.ts
```typescript
export function middleware(request: NextRequest) {
  const start = Date.now()

  // ... existing middleware logic

  const duration = Date.now() - start

  logger.info('Request completed', {
    path: request.nextUrl.pathname,
    method: request.method,
    duration_ms: duration,
  })
}
```

## Alerting Policies

### Create Alert via Terraform

#### terraform/monitoring.tf
```hcl
# Error rate alert
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "High Error Rate - Interlinear"
  combiner     = "OR"

  conditions {
    display_name = "Error rate > 5%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"interlinear\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "1800s"
  }
}

# Notification channel
resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }
}
```

### Create Alerts via Console
1. Go to Cloud Monitoring > Alerting
2. Create Policy:
   - **Name**: High Error Rate
   - **Resource**: Cloud Run Service
   - **Metric**: Request count (5xx)
   - **Threshold**: > 5%
   - **Duration**: 5 minutes
   - **Notification**: Email

## Dashboards

### Cloud Run Default Dashboard
Access at: https://console.cloud.google.com/run/detail/REGION/interlinear/metrics

Shows:
- Request count & latency
- Container instance count
- CPU & memory utilization
- Billable container time

### Custom Dashboard (Optional)

#### Create via Console
1. Go to Cloud Monitoring > Dashboards
2. Create Dashboard: "Interlinear Application"
3. Add charts:
   - Request latency (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Active instances
   - Memory usage

## Log-Based Metrics

### Create Custom Metrics from Logs
```bash
# Create metric for TTS generation time
gcloud logging metrics create tts_generation_time \
  --description="TTS audio generation time" \
  --log-filter='jsonPayload.message="TTS generation completed"' \
  --value-extractor='EXTRACT(jsonPayload.duration_ms)'
```

## Viewing Logs

### Via gcloud
```bash
# Recent logs
gcloud run services logs read interlinear \
  --region=us-central1 \
  --limit=100

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=50 \
  --format=json

# Live tail
gcloud run services logs tail interlinear \
  --region=us-central1
```

### Via Console
https://console.cloud.google.com/logs/query

Query examples:
```
# All errors
resource.type="cloud_run_revision"
resource.labels.service_name="interlinear"
severity="ERROR"

# Slow requests
resource.type="cloud_run_revision"
jsonPayload.duration_ms > 1000

# Specific API
resource.type="cloud_run_revision"
jsonPayload.path="/api/dictionary/*"
```

## Expected Effort
⏱️ **1 hour** - Set up logging, create alerts, configure dashboards
