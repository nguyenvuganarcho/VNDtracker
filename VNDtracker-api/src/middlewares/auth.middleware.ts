import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../common/apiResponse';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        name: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json(
        ApiResponse.fail('No token provided', 'UNAUTHORIZED', req.path)
      );
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json(
        ApiResponse.fail('Invalid token format', 'UNAUTHORIZED', req.path)
      );
    }

    const decoded = jwt.verify(parts[1], JWT_SECRET) as any;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        ApiResponse.fail('Token expired', 'TOKEN_EXPIRED', req.path)
      );
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        ApiResponse.fail('Invalid token', 'INVALID_TOKEN', req.path)
      );
    }

    return res.status(401).json(
      ApiResponse.fail('Authentication failed', 'UNAUTHORIZED', req.path)
    );
  }
};
