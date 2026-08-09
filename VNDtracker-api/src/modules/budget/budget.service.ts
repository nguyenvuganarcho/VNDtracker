import { BudgetRepository } from './budget.repo';
import { Budget, UpsertBudgetDto } from './budget.dto';
import { NotFoundError, ValidationError } from '../../common/errors';

export class BudgetService {
  private repo: BudgetRepository;

  constructor() {
    this.repo = new BudgetRepository();
  }

  async getAll(userId: number): Promise<Budget[]> {
    return this.repo.findAllForUser(userId);
  }

  async upsert(userId: number, dto: UpsertBudgetDto): Promise<Budget> {
    if (dto.categoryId !== null) {
      const usable = await this.repo.categoryUsableByUser(dto.categoryId, userId);
      if (!usable) {
        throw new ValidationError([{ field: 'categoryId', message: 'Category not found' }]);
      }
    }

    return this.repo.upsert(userId, dto.categoryId, dto.limitAmount);
  }

  async delete(userId: number, categoryId: number | null): Promise<void> {
    const deleted = await this.repo.delete(userId, categoryId);
    if (!deleted) {
      throw new NotFoundError('Budget');
    }
  }
}
