import type { LogLevel } from './config';

export interface LogEntry {
  timestamp: string;    // ISO 8601
  level: LogLevel;      // 'debug' | 'info' | 'warn' | 'error'
  source: string;       // Component or module name
  message: string;
}

export interface Logger {
  debug(source: string, message: string): void;
  info(source: string, message: string): void;
  warn(source: string, message: string): void;
  error(source: string, message: string): void;
}

export interface LoggerConfig {
  remoteLoggingEnabled: boolean;
  apiBaseUrl: string;
  minLevel: LogLevel;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Creates a LogEntry with an ISO 8601 timestamp.
 * Exported for testing purposes so property tests can verify the metadata format.
 */
export function createLogEntry(level: LogLevel, source: string, message: string): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
  };
}

function shouldLog(entryLevel: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[entryLevel] >= LOG_LEVEL_ORDER[minLevel];
}

function writeToConsole(entry: LogEntry): void {
  const formatted = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;

  switch (entry.level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

async function sendToRemote(entry: LogEntry, apiBaseUrl: string): Promise<void> {
  try {
    await fetch(`${apiBaseUrl}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    // Silently fall back to console-only if the remote endpoint is unreachable
  }
}

/**
 * Creates a Logger instance configured with the given options.
 *
 * - When remote logging is enabled, entries are POSTed to `{apiBaseUrl}/api/logs`.
 * - When remote logging is disabled, entries are written to the device console only.
 * - If the remote endpoint is unreachable, the logger silently falls back to console-only.
 */
export function createLogger(config: LoggerConfig): Logger {
  function log(level: LogLevel, source: string, message: string): void {
    if (!shouldLog(level, config.minLevel)) {
      return;
    }

    const entry = createLogEntry(level, source, message);
    writeToConsole(entry);

    if (config.remoteLoggingEnabled) {
      sendToRemote(entry, config.apiBaseUrl);
    }
  }

  return {
    debug: (source, message) => log('debug', source, message),
    info: (source, message) => log('info', source, message),
    warn: (source, message) => log('warn', source, message),
    error: (source, message) => log('error', source, message),
  };
}
