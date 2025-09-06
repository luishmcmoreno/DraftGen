/**
 * Logging utilities for auth package
 */

import { Logger } from '@draft-gen/logger';
import type { AuthUser, AuthProfile } from '../types';

/**
 * Auth-specific logger configuration
 */
export interface AuthLoggerConfig {
  /**
   * Enable verbose logging
   */
  verbose?: boolean;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
  
  /**
   * Mask sensitive data in logs
   */
  maskSensitive?: boolean;
  
  /**
   * Custom prefix for logs
   */
  prefix?: string;
}

/**
 * Create auth-specific logger instance
 */
export function createAuthLogger(config: AuthLoggerConfig = {}): Logger {
  const prefix = config.prefix || '[@draft-gen/auth]';
  const enabled = process.env.NODE_ENV !== 'production' || config.verbose || config.debug;
  
  return new Logger({
    enabled,
    prefix,
  });
}

// Default auth logger instance
export const authLogger = createAuthLogger();

/**
 * Log levels with context
 */
export interface LogContext {
  userId?: string;
  sessionId?: string;
  provider?: string;
  operation?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Mask sensitive data in objects
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  data: T,
  fieldsToMask: string[] = ['password', 'token', 'secret', 'key', 'cookie']
): T {
  const masked = { ...data } as T;
  
  for (const key in masked) {
    const lowerKey = key.toLowerCase();
    
    if (fieldsToMask.some(field => lowerKey.includes(field))) {
      (masked as Record<string, unknown>)[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      (masked as Record<string, unknown>)[key] = maskSensitiveData(
        masked[key] as Record<string, unknown>,
        fieldsToMask
      );
    }
  }
  
  return masked;
}

/**
 * Format user for logging (removes sensitive data)
 */
export function formatUserForLogging(user: AuthUser | null): Record<string, unknown> | null {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    provider: user.app_metadata?.provider,
  };
}

/**
 * Format profile for logging
 */
export function formatProfileForLogging(profile: AuthProfile | null): Record<string, unknown> | null {
  if (!profile) return null;
  
  return {
    id: profile.id,
    user_id: profile.user_id,
    username: profile.username,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  event: string,
  context?: LogContext,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const message = `[Auth Event] ${event}`;
  const logData = {
    event,
    ...context,
    timestamp: new Date().toISOString(),
  };
  
  switch (level) {
    case 'error':
      authLogger.error(message, logData);
      break;
    case 'warn':
      authLogger.warn(message, logData);
      break;
    default:
      authLogger.info(message, logData);
  }
}

/**
 * Log operation with timing
 */
export async function logOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now();
  const requestId = context?.requestId || generateRequestId();
  
  authLogger.debug(`[Operation Start] ${operationName}`, {
    ...context,
    requestId,
  });
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    authLogger.info(`[Operation Success] ${operationName}`, {
      ...context,
      requestId,
      duration,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    authLogger.error(`[Operation Failed] ${operationName}`, {
      ...context,
      requestId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}

/**
 * Generate request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Structured logging for auth operations
 */
export class AuthOperationLogger {
  private readonly logger: Logger;
  private readonly context: LogContext;
  private readonly startTime: number;

  constructor(operationName: string, context?: LogContext) {
    this.logger = authLogger;
    this.context = {
      operation: operationName,
      requestId: context?.requestId || generateRequestId(),
      ...context,
    };
    this.startTime = Date.now();
    
    this.logger.debug(`Starting ${operationName}`, this.context);
  }

  /**
   * Log informational message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.logger.info(message, {
      ...this.context,
      ...metadata,
    });
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logger.warn(message, {
      ...this.context,
      ...metadata,
    });
  }

  /**
   * Log error message
   */
  error(message: string, error?: unknown): void {
    this.logger.error(message, {
      ...this.context,
      error: error instanceof Error ? error.message : error,
    });
  }

  /**
   * Mark operation as successful
   */
  success(metadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    
    this.logger.info(`Completed ${this.context.operation}`, {
      ...this.context,
      ...metadata,
      duration,
      status: 'success',
    });
  }

  /**
   * Mark operation as failed
   */
  failure(error: unknown): void {
    const duration = Date.now() - this.startTime;
    
    this.logger.error(`Failed ${this.context.operation}`, {
      ...this.context,
      duration,
      status: 'failure',
      error: error instanceof Error ? error.message : error,
    });
  }
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  timestamp: Date;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  result: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Audit logger for compliance and security
 */
export class AuditLogger {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger({
      prefix: '[@draft-gen/auth:audit]',
      enabled: true, // Always enabled for audit logs
    });
  }

  /**
   * Log audit entry
   */
  log(entry: AuditLogEntry): void {
    const formattedEntry = {
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    };
    
    // Always log audit entries at info level
    this.logger.info(`[AUDIT] ${entry.action}`, formattedEntry);
  }

  /**
   * Log successful authentication
   */
  logAuthentication(userId: string, provider: string, metadata?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      userId,
      action: 'AUTHENTICATION',
      result: 'success',
      metadata: {
        provider,
        ...metadata,
      },
    });
  }

  /**
   * Log failed authentication attempt
   */
  logAuthenticationFailure(email: string, reason: string, metadata?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      action: 'AUTHENTICATION_FAILED',
      result: 'failure',
      metadata: {
        email,
        reason,
        ...metadata,
      },
    });
  }

  /**
   * Log authorization check
   */
  logAuthorization(
    userId: string,
    resource: string,
    action: string,
    allowed: boolean,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      timestamp: new Date(),
      userId,
      action: `AUTHORIZATION_${action.toUpperCase()}`,
      resource,
      result: allowed ? 'success' : 'failure',
      metadata,
    });
  }

  /**
   * Log profile modification
   */
  logProfileModification(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      timestamp: new Date(),
      userId,
      action: `PROFILE_${action}`,
      resource: 'profile',
      resourceId: userId,
      result: 'success',
      metadata,
    });
  }

  /**
   * Log session event
   */
  logSessionEvent(
    userId: string,
    event: 'CREATE' | 'REFRESH' | 'EXPIRE' | 'REVOKE',
    sessionId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      timestamp: new Date(),
      userId,
      action: `SESSION_${event}`,
      resource: 'session',
      resourceId: sessionId,
      result: 'success',
      metadata,
    });
  }
}

// Export singleton audit logger
export const auditLogger = new AuditLogger();