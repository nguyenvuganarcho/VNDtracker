import { getPool } from '../../config/database';
import { Category } from './category.dto';

export class CategoryRepository {
  // Default categories (userId IS NULL) + this user's own custom categories
  async findAllForUser(userId: number): Promise<Category[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT "categoryId", "userId", "nameKey", "name", "icon", "color", "isDefault", "createdAt"
         FROM "categories"
         WHERE "userId" IS NULL OR "userId" = $1
         ORDER BY "isDefault" DESC, "createdAt" ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error finding categories:', error);
      throw error;
    }
  }

  async create(userId: number, name: string): Promise<Category> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO "categories" ("userId", "name", "isDefault")
         VALUES ($1, $2, FALSE)
         RETURNING "categoryId", "userId", "nameKey", "name", "icon", "color", "isDefault", "createdAt"`,
        [userId, name]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Scoped to userId so default categories (userId NULL) can never match and get "edited"
  async update(categoryId: number, userId: number, name: string): Promise<Category | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `UPDATE "categories"
         SET "name" = $1
         WHERE "categoryId" = $2 AND "userId" = $3
         RETURNING "categoryId", "userId", "nameKey", "name", "icon", "color", "isDefault", "createdAt"`,
        [name, categoryId, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Scoped to userId so default categories can never be deleted this way
  async delete(categoryId: number, userId: number): Promise<boolean> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `DELETE FROM "categories"
         WHERE "categoryId" = $1 AND "userId" = $2`,
        [categoryId, userId]
      );

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}
