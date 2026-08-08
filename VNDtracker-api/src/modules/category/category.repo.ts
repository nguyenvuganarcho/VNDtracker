import sql from 'mssql';
import { getPool } from '../../config/database';
import { Category } from './category.dto';

export class CategoryRepository {
  // Default categories (userId IS NULL) + this user's own custom categories
  async findAllForUser(userId: number): Promise<Category[]> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT categoryId, userId, nameKey, name, icon, color, isDefault, createdAt
          FROM categories
          WHERE userId IS NULL OR userId = @userId
          ORDER BY isDefault DESC, createdAt ASC
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error finding categories:', error);
      throw error;
    }
  }

  async create(userId: number, name: string): Promise<Category> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('name', sql.NVarChar, name)
        .query(`
          INSERT INTO categories (userId, name, isDefault)
          OUTPUT INSERTED.categoryId, INSERTED.userId, INSERTED.nameKey, INSERTED.name, INSERTED.icon, INSERTED.color, INSERTED.isDefault, INSERTED.createdAt
          VALUES (@userId, @name, 0)
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Scoped to userId so default categories (userId NULL) can never match and get "edited"
  async update(categoryId: number, userId: number, name: string): Promise<Category | null> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('categoryId', sql.Int, categoryId)
        .input('userId', sql.Int, userId)
        .input('name', sql.NVarChar, name)
        .query(`
          UPDATE categories
          SET name = @name
          OUTPUT INSERTED.categoryId, INSERTED.userId, INSERTED.nameKey, INSERTED.name, INSERTED.icon, INSERTED.color, INSERTED.isDefault, INSERTED.createdAt
          WHERE categoryId = @categoryId AND userId = @userId
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Scoped to userId so default categories can never be deleted this way
  async delete(categoryId: number, userId: number): Promise<boolean> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('categoryId', sql.Int, categoryId)
        .input('userId', sql.Int, userId)
        .query(`
          DELETE FROM categories
          WHERE categoryId = @categoryId AND userId = @userId
        `);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}
