import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Custom application error class to distinguish between operational
 * and programmer errors in Express.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Central Express error handling middleware.
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error.message || 'Internal Server Error';

  const logPayload = {
    timestamp: new Date().toISOString(),
    error: error.name || 'Error',
    message: error.message,
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  };

  // Log full error trace for critical issues
  console.error(`[Error Handler] ${JSON.stringify(logPayload)}`);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: config.nodeEnv === 'production' && statusCode === 500 ? 'Internal Server Error' : message,
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  });
};
export default errorHandler;
