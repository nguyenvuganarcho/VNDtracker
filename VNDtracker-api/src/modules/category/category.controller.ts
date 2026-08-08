import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { ApiResponse } from '../../common/apiResponse';
import { ValidationError } from '../../common/errors';
import { createCategorySchema, updateCategorySchema } from './category.validation';

export class CategoryController {
  private service: CategoryService;

  constructor() {
    this.service = new CategoryService();
  }

  // GET /api/categories
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.service.getAll(req.user!.userId);
      return res.status(200).json(ApiResponse.success('OK', categories, req.path));
    } catch (err) {
      next(err);
    }
  };

  // POST /api/categories
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createCategorySchema.validate(req.body, {
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

      const category = await this.service.create(req.user!.userId, value);

      return res.status(201).json(
        ApiResponse.success('Category created', category, req.path)
      );
    } catch (err) {
      next(err);
    }
  };

  // PUT /api/categories/:id
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = updateCategorySchema.validate(req.body, {
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

      const categoryId = parseInt(String(req.params.id), 10);
      const category = await this.service.update(categoryId, req.user!.userId, value);

      return res.status(200).json(
        ApiResponse.success('Category updated', category, req.path)
      );
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/categories/:id
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = parseInt(String(req.params.id), 10);
      await this.service.delete(categoryId, req.user!.userId);

      return res.status(200).json(
        ApiResponse.success('Category deleted', null, req.path)
      );
    } catch (err) {
      next(err);
    }
  };
}
