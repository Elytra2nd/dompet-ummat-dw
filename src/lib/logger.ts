/**
 * Structured Logger
 * =================
 * Replaces raw console.log/error with structured, level-based logging.
 * In production, can be swapped to external service (Datadog, Sentry, etc).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'warn' : 'debug')

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL]
}

function formatMessage(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const base = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
  return meta ? `${base} ${JSON.stringify(meta)}` : base
}

export const logger = {
  debug(context: string, message: string, meta?: Record<string, unknown>) {
    if (shouldLog('debug')) console.debug(formatMessage('debug', context, message, meta))
  },

  info(context: string, message: string, meta?: Record<string, unknown>) {
    if (shouldLog('info')) console.info(formatMessage('info', context, message, meta))
  },

  warn(context: string, message: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) console.warn(formatMessage('warn', context, message, meta))
  },

  error(context: string, message: string, error?: unknown, meta?: Record<string, unknown>) {
    if (shouldLog('error')) {
      const errorMsg = error instanceof Error ? error.message : String(error || '')
      const stack = error instanceof Error ? error.stack : undefined
      console.error(formatMessage('error', context, message, { ...meta, error: errorMsg, stack }))
    }
  },
}
