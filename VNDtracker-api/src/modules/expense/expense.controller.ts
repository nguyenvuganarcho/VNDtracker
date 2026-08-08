import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from './expense.service';
import { ApiResponse } from '../../common/apiResponse';
import { ValidationError } from '../../common/errors';
import { createExpenseSchema, updateExpenseSchema, listExpenseQuerySchema } from './expense.validation';

export class ExpenseController {
  private service: ExpenseService;

  constructor() {
    this.service = new ExpenseService();
  }

  // GET /api/expenses?month=YYYY-MM&categoryId=&startDate=&endDate=
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = listExpenseQuerySchema.validate(req.query, {
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

      const expenses = await this.service.getAll(req.user!.userId, value);

      return res.status(200).json(ApiResponse.success('OK', expenses, req.path));
    } catch (err) {
      next(err);
    }
  };

  // POST /api/expenses
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createExpenseSchema.validate(req.body, {
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

      const expense = await this.service.create(req.user!.userId, value);

      return res.status(201).json(
        ApiResponse.success('Expense created', expense, req.path)
      );
    } catch (err) {
      next(err);
    }
  };

  // PUT /api/expenses/:id
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = updateExpenseSchema.validate(req.body, {
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

      const expenseId = parseInt(String(req.params.id), 10);
      const expense = await this.service.update(expenseId, req.user!.userId, value);

      return res.status(200).json(
        ApiResponse.success('Expense updated', expense, req.path)
      );
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/expenses/:id
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expenseId = parseInt(String(req.params.id), 10);
      await this.service.delete(expenseId, req.user!.userId);

      return res.status(200).json(
        ApiResponse.success('Expense deleted', null, req.path)
      );
    } catch (err) {
      next(err);
    }
  };
}
