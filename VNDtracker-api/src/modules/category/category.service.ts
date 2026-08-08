import { CategoryRepository } from './category.repo';
import { Category, CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { NotFoundError } from '../../common/errors';

export class CategoryService {
  private repo: CategoryRepository;

  constructor() {
    this.repo = new CategoryRepository();
  }

  async getAll(userId: number): Promise<Category[]> {
    return this.repo.findAllForUser(userId);
  }

  async create(userId: number, dto: CreateCategoryDto): Promise<Category> {
    return this.repo.create(userId, dto.name);
  }

  async update(categoryId: number, userId: number, dto: UpdateCategoryDto): Promise<Category> {
    const updated = await this.repo.update(categoryId, userId, dto.name);
    if (!updated) {
      throw new NotFoundError('Category');
    }
    return updated;
  }

  async delete(categoryId: number, userId: number): Promise<void> {
    const deleted = await this.repo.delete(categoryId, userId);
    if (!deleted) {
      throw new NotFoundError('Category');
    }
  }
}
