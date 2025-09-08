import { useEffect } from 'react';

interface ErrorLog {
  error_message: string;
  error_stack?: string;
  url: string;
  user_agent: string;
  timestamp: string;
}

class ErrorLoggerService {
  private static instance: ErrorLoggerService;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorLoggerService {
    if (!ErrorLoggerService.instance) {
      ErrorLoggerService.instance = new ErrorLoggerService();
    }
    return ErrorLoggerService.instance;
  }

  private setupGlobalErrorHandlers() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        error_message: event.message,
        error_stack: event.error?.stack || '',
        url: event.filename || window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        error_message: `Unhandled Promise Rejection: ${event.reason}`,
        error_stack: event.reason?.stack || '',
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle React errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('React') || errorMessage.includes('Warning')) {
        this.logError({
          error_message: `React Error: ${errorMessage}`,
          url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  private logError(errorLog: ErrorLog) {
    // For now, just log to console with structured format
    console.error('🚨 Application Error:', {
      message: errorLog.error_message,
      stack: errorLog.error_stack,
      url: errorLog.url,
      timestamp: errorLog.timestamp,
      userAgent: errorLog.user_agent
    });
    
    // TODO: In the future, send to database when types are available
    // this.sendToDatabase(errorLog);
  }

  // Method to manually log custom errors
  static logCustomError(message: string, stack?: string, additionalData?: any) {
    const logger = ErrorLoggerService.getInstance();
    logger.logError({
      error_message: `Custom Error: ${message}${additionalData ? ` | Data: ${JSON.stringify(additionalData)}` : ''}`,
      error_stack: stack || new Error().stack || '',
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }
}

// React component to initialize the error logger
const ErrorLogger = () => {
  useEffect(() => {
    ErrorLoggerService.getInstance();
  }, []);

  return null;
};

export default ErrorLogger;
export { ErrorLoggerService };