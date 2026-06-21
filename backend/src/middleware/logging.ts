import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Once the response headers are sent, calculate duration and log the request
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // Structured log format
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get('user-agent') || 'unknown',
    };

    if (statusCode >= 500) {
      console.error(`[HTTP ERROR] ${JSON.stringify(logData)}`);
    } else if (statusCode >= 400) {
      console.warn(`[HTTP WARN] ${JSON.stringify(logData)}`);
    } else {
      console.log(`[HTTP INFO] ${JSON.stringify(logData)}`);
    }
  });

  next();
};
