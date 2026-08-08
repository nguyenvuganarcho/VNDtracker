import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Category name is required',
  }),
});

export const updateCategorySchema = createCategorySchema;
