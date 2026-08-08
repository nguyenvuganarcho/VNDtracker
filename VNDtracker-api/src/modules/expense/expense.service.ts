import { ExpenseRepository } from './expense.repo';
import { Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseFilterQuery } from './expense.dto';
import { NotFoundError, ValidationError } from '../../common/errors';

export class ExpenseService {
  private repo: ExpenseRepository;

  constructor() {
    this.repo = new ExpenseRepository();
  }

  async getAll(userId: number, filters: ExpenseFilterQuery): Promise<Expense[]> {
    return this.repo.findAllForUser(userId, filters);
  }

  private async assertCategoryUsable(categoryId: number, userId: number): Promise<void> {
    const usable = await this.repo.categoryUsableByUser(categoryId, userId);
    if (!usable) {
      throw new ValidationError([{ field: 'categoryId', message: 'Category not found' }]);
    }
  }

  async create(userId: number, dto: CreateExpenseDto): Promise<Expense> {
    await this.assertCategoryUsable(dto.categoryId, userId);
    return this.repo.create(userId, dto);
  }

  async update(expenseId: number, userId: number, dto: UpdateExpenseDto): Promise<Expense> {
    await this.assertCategoryUsable(dto.categoryId, userId);
    const updated = await this.repo.update(expenseId, userId, dto);
    if (!updated) {
      throw new NotFoundError('Expense');
    }
    return updated;
  }

  async delete(expenseId: number, userId: number): Promise<void> {
    const deleted = await this.repo.delete(expenseId, userId);
    if (!deleted) {
      throw new NotFoundError('Expense');
    }
  }
}
