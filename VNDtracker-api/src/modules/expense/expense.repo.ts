import { getPool } from '../../config/database';
import { Expense, ExpenseFilterQuery } from './expense.dto';

export class ExpenseRepository {
  // The pg driver returns BIGINT columns as strings to avoid silent
  // precision loss on very large values (same reasoning the mssql driver
  // had). VND amounts never come close to that range, so it's safe (and
  // much less error-prone downstream) to convert to a real number here.
  private mapRow(row: any): Expense {
    return { ...row, amount: Number(row.amount) };
  }

  async findAllForUser(userId: number, filters: ExpenseFilterQuery): Promise<Expense[]> {
    try {
      const pool = getPool();
      const conditions: string[] = ['"userId" = $1'];
      const params: unknown[] = [userId];

      if (filters.month) {
        params.push(filters.month);
        conditions.push(`TO_CHAR("expenseDate", 'YYYY-MM') = $${params.length}`);
      }
      if (filters.categoryId) {
        params.push(filters.categoryId);
        conditions.push(`"categoryId" = $${params.length}`);
      }
      if (filters.startDate) {
        params.push(filters.startDate);
        conditions.push(`"expenseDate" >= $${params.length}`);
      }
      if (filters.endDate) {
        params.push(filters.endDate);
        conditions.push(`"expenseDate" <= $${params.length}`);
      }

      const result = await pool.query(
        `SELECT "expenseId", "userId", "categoryId", "amount", "expenseDate", "note",
                "receiptImagePath", "source", "inputType", "createdAt", "updatedAt"
         FROM "expenses"
         WHERE ${conditions.join(' AND ')}
         ORDER BY "expenseDate" DESC, "createdAt" DESC`,
        params
      );

      return result.rows.map((row) => this.mapRow(row));
    } catch (error) {
      console.error('Error finding expenses:', error);
      throw error;
    }
  }

  async create(
    userId: number,
    dto: {
      categoryId: number;
      amount: number;
      expenseDate: string;
      note?: string;
      source?: string;
      inputType?: string;
      receiptImagePath?: string;
    }
  ): Promise<Expense> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO "expenses"
           ("userId", "categoryId", "amount", "expenseDate", "note", "source", "inputType", "receiptImagePath")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING "expenseId", "userId", "categoryId", "amount", "expenseDate", "note",
                   "receiptImagePath", "source", "inputType", "createdAt", "updatedAt"`,
        [
          userId,
          dto.categoryId,
          dto.amount,
          dto.expenseDate,
          dto.note || null,
          dto.source || 'manual',
          dto.inputType || null,
          dto.receiptImagePath || null,
        ]
      );

      return this.mapRow(result.rows[0]);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // Scoped to userId so an expense can never be edited by someone else
  async update(
    expenseId: number,
    userId: number,
    dto: { categoryId: number; amount: number; expenseDate: string; note?: string }
  ): Promise<Expense | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `UPDATE "expenses"
         SET "categoryId" = $1, "amount" = $2, "expenseDate" = $3, "note" = $4, "updatedAt" = NOW()
         WHERE "expenseId" = $5 AND "userId" = $6
         RETURNING "expenseId", "userId", "categoryId", "amount", "expenseDate", "note",
                   "receiptImagePath", "source", "inputType", "createdAt", "updatedAt"`,
        [dto.categoryId, dto.amount, dto.expenseDate, dto.note || null, expenseId, userId]
      );

      return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async delete(expenseId: number, userId: number): Promise<boolean> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `DELETE FROM "expenses" WHERE "expenseId" = $1 AND "userId" = $2`,
        [expenseId, userId]
      );

      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting expense:', error);
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
}
