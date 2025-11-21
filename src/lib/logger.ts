export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.logLevel = LogLevel.DEBUG;
    } else {
      // Production: only log warnings and errors
      this.logLevel = LogLevel.WARN;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('debug-session-id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('debug-session-id', sessionId);
    }
    return sessionId;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogForConsole(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelColors = ['#888', '#007acc', '#ff8c00', '#ff4444'];
    
    const style = `color: ${levelColors[entry.level]}; font-weight: bold;`;
    const prefix = `[${levelNames[entry.level]}] ${entry.category}:`;
    
    if (entry.data || entry.error) {
      console.groupCollapsed(`%c${prefix} ${entry.message}`, style);
      if (entry.data) {
        console.log('Data:', entry.data);
      }
      if (entry.error) {
        console.error('Error:', entry.error);
      }
      console.log('Timestamp:', entry.timestamp);
      if (entry.userId) console.log('User ID:', entry.userId);
      console.log('Session ID:', entry.sessionId);
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${entry.message}`, style);
    }
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  debug(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, data);
    this.formatLogForConsole(entry);
    this.addToHistory(entry);
  }

  info(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, category, message, data);
    this.formatLogForConsole(entry);
    this.addToHistory(entry);
  }

  warn(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, category, message, data);
    this.formatLogForConsole(entry);
    this.addToHistory(entry);
  }

  error(category: string, message: string, error?: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, data, error);
    this.formatLogForConsole(entry);
    this.addToHistory(entry);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by category
  getLogsByCategory(category: string, count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(-count);
  }

  // Export logs as JSON for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear log history
  clearLogs(): void {
    this.logs = [];
  }

  // Set log level dynamically
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info('Logger', `Log level set to ${LogLevel[level]}`);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common categories
export const authLogger = {
  debug: (message: string, data?: any) => logger.debug('AUTH', message, data),
  info: (message: string, data?: any) => logger.info('AUTH', message, data),
  warn: (message: string, data?: any) => logger.warn('AUTH', message, data),
  error: (message: string, error?: Error, data?: any) => logger.error('AUTH', message, error, data)
};

export const dbLogger = {
  debug: (message: string, data?: any) => logger.debug('DATABASE', message, data),
  info: (message: string, data?: any) => logger.info('DATABASE', message, data),
  warn: (message: string, data?: any) => logger.warn('DATABASE', message, data),
  error: (message: string, error?: Error, data?: any) => logger.error('DATABASE', message, error, data)
};

export const rlsLogger = {
  debug: (message: string, data?: any) => logger.debug('RLS', message, data),
  info: (message: string, data?: any) => logger.info('RLS', message, data),
  warn: (message: string, data?: any) => logger.warn('RLS', message, data),
  error: (message: string, error?: Error, data?: any) => logger.error('RLS', message, error, data)
};

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('GLOBAL', 'Unhandled error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('GLOBAL', 'Unhandled promise rejection', event.reason);
  });
}

// Make logger available globally for debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).debugLogger = logger;
}