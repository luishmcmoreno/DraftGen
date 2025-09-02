type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enabled: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    // Default: enable logging only in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    this.config = {
      enabled: config?.enabled ?? isDevelopment,
      prefix: config?.prefix ?? '[App]',
    };
  }

  private shouldLog(): boolean {
    return this.config.enabled;
  }

  private formatMessage(level: LogLevel, ...args: unknown[]): unknown[] {
    const timestamp = new Date().toISOString();
    const prefix = `${this.config.prefix} [${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, ...args];
  }

  log(...args: unknown[]): void {
    if (this.shouldLog()) {
      // eslint-disable-next-line no-console
      console.log(...this.formatMessage('log', ...args));
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog()) {
      // eslint-disable-next-line no-console
      console.info(...this.formatMessage('info', ...args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog()) {
      // eslint-disable-next-line no-console
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog()) {
      // eslint-disable-next-line no-console
      console.error(...this.formatMessage('error', ...args));
    }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog()) {
      // eslint-disable-next-line no-console
      console.debug(...this.formatMessage('debug', ...args));
    }
  }

  // Create a child logger with a different prefix
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix} ${prefix}`,
    });
  }

  // Enable/disable logging at runtime
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Export singleton instance for easy use
export const logger = new Logger();

// Also export the class for custom instances
export { Logger };

// Export types
export type { LogLevel, LoggerConfig };