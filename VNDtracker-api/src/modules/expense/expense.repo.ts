import sql from 'mssql';
import { getPool } from '../../config/database';
import { Expense, ExpenseFilterQuery } from './expense.dto';

export class ExpenseRepository {
  // The mssql driver returns BIGINT columns as strings to avoid silent
  // precision loss on very large values. VND amounts never come close to
  // that range, so it's safe (and much less error-prone downstream) to
  // convert to a real number here.
  private mapRow(row: any): Expense {
    return { ...row, amount: Number(row.amount) };
  }

  async findAllForUser(userId: number, filters: ExpenseFilterQuery): Promise<Expense[]> {
    try {
      const pool = getPool();
      const request = pool.request().input('userId', sql.Int, userId);

      const conditions: string[] = ['userId = @userId'];

      if (filters.month) {
        request.input('month', sql.VarChar, filters.month);
        conditions.push(`FORMAT(expenseDate, 'yyyy-MM') = @month`);
      }
      if (filters.categoryId) {
        request.input('categoryId', sql.Int, filters.categoryId);
        conditions.push('categoryId = @categoryId');
      }
      if (filters.startDate) {
        request.input('startDate', sql.Date, filters.startDate);
        conditions.push('expenseDate >= @startDate');
      }
      if (filters.endDate) {
        request.input('endDate', sql.Date, filters.endDate);
        conditions.push('expenseDate <= @endDate');
      }

      const result = await request.query(`
        SELECT expenseId, userId, categoryId, amount, expenseDate, note,
               receiptImagePath, source, inputType, createdAt, updatedAt
        FROM expenses
        WHERE ${conditions.join(' AND ')}
        ORDER BY expenseDate DESC, createdAt DESC
      `);

      return result.recordset.map((row) => this.mapRow(row));
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
      const result = await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('categoryId', sql.Int, dto.categoryId)
        .input('amount', sql.BigInt, dto.amount)
        .input('expenseDate', sql.Date, dto.expenseDate)
        .input('note', sql.NVarChar, dto.note || null)
        .input('source', sql.VarChar, dto.source || 'manual')
        .input('inputType', sql.VarChar, dto.inputType || null)
        .input('receiptImagePath', sql.NVarChar, dto.receiptImagePath || null)
        .query(`
          INSERT INTO expenses (userId, categoryId, amount, expenseDate, note, source, inputType, receiptImagePath)
          OUTPUT INSERTED.expenseId, INSERTED.userId, INSERTED.categoryId, INSERTED.amount, INSERTED.expenseDate,
                 INSERTED.note, INSERTED.receiptImagePath, INSERTED.source, INSERTED.inputType, INSERTED.createdAt, INSERTED.updatedAt
          VALUES (@userId, @categoryId, @amount, @expenseDate, @note, @source, @inputType, @receiptImagePath)
        `);

      return this.mapRow(result.recordset[0]);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // Scoped to userId so an expense can never be edited by someone else
  async update(expenseId: number, userId: number, dto: { categoryId: number; amount: number; expenseDate: string; note?: string }): Promise<Expense | null> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('expenseId', sql.Int, expenseId)
        .input('userId', sql.Int, userId)
        .input('categoryId', sql.Int, dto.categoryId)
        .input('amount', sql.BigInt, dto.amount)
        .input('expenseDate', sql.Date, dto.expenseDate)
        .input('note', sql.NVarChar, dto.note || null)
        .query(`
          UPDATE expenses
          SET categoryId = @categoryId, amount = @amount, expenseDate = @expenseDate, note = @note, updatedAt = GETDATE()
          OUTPUT INSERTED.expenseId, INSERTED.userId, INSERTED.categoryId, INSERTED.amount, INSERTED.expenseDate,
                 INSERTED.note, INSERTED.receiptImagePath, INSERTED.source, INSERTED.inputType, INSERTED.createdAt, INSERTED.updatedAt
          WHERE expenseId = @expenseId AND userId = @userId
        `);

      return result.recordset[0] ? this.mapRow(result.recordset[0]) : null;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async delete(expenseId: number, userId: number): Promise<boolean> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('expenseId', sql.Int, expenseId)
        .input('userId', sql.Int, userId)
        .query(`DELETE FROM expenses WHERE expenseId = @expenseId AND userId = @userId`);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // A category is usable by this user if it's a default (userId NULL) or their own
  async categoryUsableByUser(categoryId: number, userId: number): Promise<boolean> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('categoryId', sql.Int, categoryId)
        .input('userId', sql.Int, userId)
        .query(`
          SELECT categoryId FROM categories
          WHERE categoryId = @categoryId AND (userId IS NULL OR userId = @userId)
        `);

      return result.recordset.length > 0;
    } catch (error) {
      console.error('Error checking category ownership:', error);
      throw error;
    }
  }
}
