import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ErrorLog {
  id?: string;
  error_message: string;
  error_stack?: string;
  url: string;
  user_agent: string;
  timestamp: string;
  user_id?: string;
}

class ErrorLoggerService {
  private static instance: ErrorLoggerService;
  private errorQueue: ErrorLog[] = [];
  private isProcessing = false;

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

    // Handle React errors (if needed)
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

  async logError(errorLog: Omit<ErrorLog, 'id'>) {
    this.errorQueue.push(errorLog);
    
    if (!this.isProcessing) {
      await this.processErrorQueue();
    }
  }

  private async processErrorQueue() {
    if (this.errorQueue.length === 0) return;
    
    this.isProcessing = true;

    try {
      const errors = [...this.errorQueue];
      this.errorQueue = [];

      // Create the error_logs table if it doesn't exist
      await this.ensureErrorLogsTable();

      // Insert errors into the database
      const { error } = await supabase
        .from('error_logs')
        .insert(errors);

      if (error) {
        console.warn('Failed to log errors to database:', error);
        // Put errors back in queue for retry
        this.errorQueue.unshift(...errors);
      }
    } catch (error) {
      console.warn('Error processing error queue:', error);
    } finally {
      this.isProcessing = false;
      
      // Process any new errors that came in while we were processing
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processErrorQueue(), 5000);
      }
    }
  }

  private async ensureErrorLogsTable() {
    try {
      // Try to create the table if it doesn't exist
      const { error } = await supabase.rpc('create_error_logs_table_if_not_exists');
      
      if (error && !error.message.includes('already exists')) {
        console.warn('Could not ensure error_logs table exists:', error);
      }
    } catch (error) {
      console.warn('Could not ensure error_logs table exists:', error);
    }
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