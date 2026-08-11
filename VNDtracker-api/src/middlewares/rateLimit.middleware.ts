import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../common/apiResponse';

// 429 responses use the same envelope as every other error so the frontend
// can handle them uniformly.
const handler = (req: Request, res: Response) => {
  res.status(429).json(
    ApiResponse.fail('Too many requests, please try again later', 'RATE_LIMITED', req.path)
  );
};

const baseOptions = {
  standardHeaders: true as const,
  legacyHeaders: false,
  handler,
};

// Login/reset attempts: brute-force protection, keyed by IP.
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

// Forgot-password: each request can trigger an outbound email, so this is
// tighter than the other auth routes to cap Resend usage and email spam.
export const forgotPasswordLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

// AI scan: each request costs real money (Anthropic vision call), so cap
// per user rather than per IP. Runs after requireAuth, so req.user is set.
export const aiScanLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req: Request) => String(req.user!.userId),
});
