import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  };

  // Blockchain errors
  if (err.code === 'CALL_EXCEPTION' || err.code === 'UNPREDICTABLE_GAS_LIMIT') {
    error = {
      message: 'Blockchain transaction failed',
      status: 400
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: err.message,
      status: 400
    };
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    error = {
      message: 'Resource already exists',
      status: 409
    };
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}