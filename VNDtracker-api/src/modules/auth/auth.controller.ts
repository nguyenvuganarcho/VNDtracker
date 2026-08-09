import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../common/apiResponse';
import { ValidationError } from '../../common/errors';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  // POST /api/auth/register
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = registerSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        throw new ValidationError(
          error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          }))
        );
      }

      const result = await this.service.register(value);

      return res.status(201).json(
        ApiResponse.success('Registered successfully', result, req.path)
      );
    } catch (err) {
      next(err);
    }
  };

  // POST /api/auth/login
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = loginSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        throw new ValidationError(
          error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          }))
        );
      }

      const result = await this.service.login(value);

      return res.status(200).json(
        ApiResponse.success('Login successful', result, req.path)
      );
    } catch (err) {
      next(err);
    }
  };

  // PUT /api/auth/change-password (requires auth)
  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = changePasswordSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        throw new ValidationError(
          error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          }))
        );
      }

      await this.service.changePassword(req.user!.userId, value);

      return res.status(200).json(
        ApiResponse.success('Password changed successfully', null, req.path)
      );
    } catch (err) {
      next(err);
    }
  };

  // POST /api/auth/forgot-password
  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = forgotPasswordSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        throw new ValidationError(
          error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          }))
        );
      }

      await this.service.forgotPassword(value);

      // Same message regardless of whether the email is registered, so the
      // response never reveals which emails have an account.
      return res.status(200).json(
        ApiResponse.success(
          'If that email is registered, a reset link has been sent',
          null,
          req.path
        )
      );
    } catch (err) {
      next(err);
    }
  };

  // POST /api/auth/reset-password
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = resetPasswordSchema.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        throw new ValidationError(
          error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          }))
        );
      }

      await this.service.resetPassword(value);

      return res.status(200).json(
        ApiResponse.success('Password reset successfully', null, req.path)
      );
    } catch (err) {
      next(err);
    }
  };
}
