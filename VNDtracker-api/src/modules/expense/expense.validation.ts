import Joi from 'joi';

export const createExpenseSchema = Joi.object({
  categoryId: Joi.number().integer().positive().required().messages({
    'any.required': 'Category is required',
  }),
  amount: Joi.number().integer().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be greater than 0',
  }),
  expenseDate: Joi.date().iso().required().messages({
    'any.required': 'Date is required',
  }),
  note: Joi.string().max(500).allow('').optional(),
});

export const updateExpenseSchema = createExpenseSchema;

export const listExpenseQuerySchema = Joi.object({
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Month must be in YYYY-MM format',
  }),
  categoryId: Joi.number().integer().positive().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});
