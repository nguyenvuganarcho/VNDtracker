import Joi from 'joi';

export const upsertBudgetSchema = Joi.object({
  categoryId: Joi.number().integer().allow(null).required().messages({
    'number.base': 'categoryId must be a number or null',
  }),
  limitAmount: Joi.number().integer().positive().required().messages({
    'number.base': 'Limit amount is required',
    'number.positive': 'Limit amount must be greater than 0',
  }),
});
