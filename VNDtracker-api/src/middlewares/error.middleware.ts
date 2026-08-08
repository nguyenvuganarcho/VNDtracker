import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { ApiResponse } from '../common/apiResponse';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      ApiResponse.fail(err.message, err.errorCode, req.path, err.details)
    );
  }

  console.error('Unexpected error:', err);
  return res.status(500).json(
    ApiResponse.fail('Internal server error', 'INTERNAL_ERROR', req.path)
  );
};
