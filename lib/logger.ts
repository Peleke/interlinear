/**
 * Structured logging utility for Cloud Run
 * Outputs JSON logs compatible with Google Cloud Logging
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

interface LogContext {
  [key: string]: any
}

interface StructuredLog {
  severity: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
    name?: string
  }
}

class Logger {
  private context: LogContext = {}

  /**
   * Add persistent context to all logs
   */
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  /**
   * Clear all context
   */
  clearContext() {
    this.context = {}
  }

  private log(severity: LogLevel, message: string, context?: LogContext, error?: Error) {
    const log: StructuredLog = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
    }

    if (error) {
      log.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      }
    }

    // In development, pretty print
    if (process.env.NODE_ENV === 'development') {
      const color = {
        DEBUG: '\x1b[36m',
        INFO: '\x1b[32m',
        WARNING: '\x1b[33m',
        ERROR: '\x1b[31m',
        CRITICAL: '\x1b[35m',
      }[severity]
      const reset = '\x1b[0m'

      console.log(`${color}[${severity}]${reset} ${message}`)
      if (Object.keys(log.context || {}).length > 0) {
        console.log('  Context:', log.context)
      }
      if (error) {
        console.error('  Error:', error)
      }
    } else {
      // In production, output structured JSON for Cloud Logging
      console.log(JSON.stringify(log))
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('DEBUG', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context)
  }

  warning(message: string, context?: LogContext) {
    this.log('WARNING', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('ERROR', message, context, error)
  }

  critical(message: string, error?: Error, context?: LogContext) {
    this.log('CRITICAL', message, context, error)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for context
export type { LogContext }
