import { getPool } from '../../config/database';
import { Budget } from './budget.dto';

export class BudgetRepository {
  async findAllForUser(userId: number): Promise<Budget[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT "budgetId", "userId", "categoryId", "limitAmount", "createdAt", "updatedAt"
         FROM "budgets"
         WHERE "userId" = $1
         ORDER BY "categoryId" ASC NULLS FIRST`,
        [userId]
      );

      return result.rows.map((row) => ({ ...row, limitAmount: Number(row.limitAmount) }));
    } catch (error) {
      console.error('Error finding budgets:', error);
      throw error;
    }
  }

  // A category is usable by this user if it's a default (userId NULL) or their own
  async categoryUsableByUser(categoryId: number, userId: number): Promise<boolean> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT "categoryId" FROM "categories"
         WHERE "categoryId" = $1 AND ("userId" IS NULL OR "userId" = $2)`,
        [categoryId, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking category ownership:', error);
      throw error;
    }
  }

  // "IS NOT DISTINCT FROM" matches NULL-to-NULL (unlike "="), so this
  // handles the overall budget (categoryId NULL) and per-category budgets
  // with the same query. Update-then-insert instead of ON CONFLICT since the
  // unique constraint is two separate partial indexes (see schema.sql) and
  // can't be named as a single conflict target.
  async upsert(userId: number, categoryId: number | null, limitAmount: number): Promise<Budget> {
    try {
      const pool = getPool();
      const updateResult = await pool.query(
        `UPDATE "budgets"
         SET "limitAmount" = $1, "updatedAt" = NOW()
         WHERE "userId" = $2 AND "categoryId" IS NOT DISTINCT FROM $3
         RETURNING "budgetId", "userId", "categoryId", "limitAmount", "createdAt", "updatedAt"`,
        [limitAmount, userId, categoryId]
      );

      if (updateResult.rows[0]) {
        return { ...updateResult.rows[0], limitAmount: Number(updateResult.rows[0].limitAmount) };
      }

      const insertResult = await pool.query(
        `INSERT INTO "budgets" ("userId", "categoryId", "limitAmount")
         VALUES ($1, $2, $3)
         RETURNING "budgetId", "userId", "categoryId", "limitAmount", "createdAt", "updatedAt"`,
        [userId, categoryId, limitAmount]
      );

      return { ...insertResult.rows[0], limitAmount: Number(insertResult.rows[0].limitAmount) };
    } catch (error) {
      console.error('Error upserting budget:', error);
      throw error;
    }
  }

  async delete(userId: number, categoryId: number | null): Promise<boolean> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `DELETE FROM "budgets" WHERE "userId" = $1 AND "categoryId" IS NOT DISTINCT FROM $2`,
        [userId, categoryId]
      );

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }
}
