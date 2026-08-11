import Joi from 'joi';

// Emails are normalized to lowercase everywhere they enter the system, so
// Dat@gmail.com and dat@gmail.com are the same account for register, login,
// and forgot-password alike.
export const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be valid',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Name is required',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be valid',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 6 characters',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be valid',
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 6 characters',
  }),
});
