import fs from 'fs/promises';
import path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  data?: any;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

export class Logger {
  private readonly service: string;
  private readonly logLevel: LogLevel;
  private readonly logDirectory: string;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(
    service: string, 
    logLevel: LogLevel = LogLevel.INFO,
    logDirectory?: string
  ) {
    this.service = service;
    this.logLevel = logLevel;
    this.logDirectory = logDirectory || process.env.LOG_DIR || './logs';
    this.ensureLogDirectory();
    this.startPeriodicFlush();
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, 10000); // Flush every 10 seconds
  }

  debug(message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.DEBUG, message, data, correlationId);
  }

  info(message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.INFO, message, data, correlationId);
  }

  warn(message: string, data?: any, correlationId?: string): void {
    this.log(LogLevel.WARN, message, data, correlationId);
  }

  error(message: string, error?: Error | any, correlationId?: string): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    this.log(LogLevel.ERROR, message, errorData, correlationId);
  }

  fatal(message: string, error?: Error | any, correlationId?: string): void {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    this.log(LogLevel.FATAL, message, errorData, correlationId);
  }

  private log(level: LogLevel, message: string, data?: any, correlationId?: string): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      service: this.service,
      message,
      ...(data && { data }),
      ...(correlationId && { correlationId })
    };

    // Always log to console for immediate visibility
    this.logToConsole(logEntry);

    // Buffer for file logging
    this.logBuffer.push(logEntry);

    // Immediate flush for ERROR and FATAL
    if (level >= LogLevel.ERROR) {
      this.flushLogs();
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp;
    const level = entry.level.padEnd(5);
    const service = entry.service.padEnd(20);
    const message = entry.message;
    
    let logLine = `${timestamp} [${level}] ${service} ${message}`;
    
    if (entry.correlationId) {
      logLine += ` [${entry.correlationId}]`;
    }

    switch (entry.level) {
      case 'DEBUG':
        console.debug(logLine, entry.data || '');
        break;
      case 'INFO':
        console.info(logLine, entry.data || '');
        break;
      case 'WARN':
        console.warn(logLine, entry.data || '');
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(logLine, entry.data || '');
        break;
      default:
        console.log(logLine, entry.data || '');
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const entries = [...this.logBuffer];
      this.logBuffer = [];

      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDirectory, `${this.service}-${today}.jsonl`);

      const logEntries = entries.map(entry => JSON.stringify(entry)).join('\n');
      await fs.appendFile(logFile, logEntries + '\n');
    } catch (error) {
      console.error('Failed to write log entries:', error);
      // Return entries to buffer if write failed
      this.logBuffer.unshift(...this.logBuffer);
    }
  }

  async createChildLogger(childService: string): Promise<Logger> {
    return new Logger(`${this.service}:${childService}`, this.logLevel, this.logDirectory);
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushLogs();
  }

  // Create a correlation context for request tracking
  withCorrelation(correlationId: string): {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, error?: Error | any) => void;
    fatal: (message: string, error?: Error | any) => void;
  } {
    return {
      debug: (message: string, data?: any) => this.debug(message, data, correlationId),
      info: (message: string, data?: any) => this.info(message, data, correlationId),
      warn: (message: string, data?: any) => this.warn(message, data, correlationId),
      error: (message: string, error?: Error | any) => this.error(message, error, correlationId),
      fatal: (message: string, error?: Error | any) => this.fatal(message, error, correlationId)
    };
  }
}