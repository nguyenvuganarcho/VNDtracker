import { Request, Response, NextFunction } from 'express';
import { BudgetService } from './budget.service';
import { ApiResponse } from '../../common/apiResponse';
import { ValidationError } from '../../common/errors';
import { upsertBudgetSchema } from './budget.validation';

export class BudgetController {
  private service: BudgetService;

  constructor() {
    this.service = new BudgetService();
  }

  // GET /api/budgets
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const budgets = await this.service.getAll(req.user!.userId);
      return res.status(200).json(ApiResponse.success('OK', budgets, req.path));
    } catch (err) {
      next(err);
    }
  };

  // PUT /api/budgets (upsert by categoryId, null = overall budget)
  upsert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = upsertBudgetSchema.validate(req.body, {
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

      const budget = await this.service.upsert(req.user!.userId, value);

      return res.status(200).json(ApiResponse.success('Budget saved', budget, req.path));
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/budgets/overall
  deleteOverall = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.user!.userId, null);
      return res.status(200).json(ApiResponse.success('Budget deleted', null, req.path));
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/budgets/category/:categoryId
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categoryId = parseInt(String(req.params.categoryId), 10);
      await this.service.delete(req.user!.userId, categoryId);
      return res.status(200).json(ApiResponse.success('Budget deleted', null, req.path));
    } catch (err) {
      next(err);
    }
  };
}
