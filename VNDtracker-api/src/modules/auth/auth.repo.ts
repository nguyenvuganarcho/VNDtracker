import { getPool } from '../../config/database';
import { User } from './auth.dto';

// "passwordResetExpiry" is a naive TIMESTAMP column storing UTC wall-clock
// digits with no timezone attached (same convention as expenseDate -- see
// config/database.ts). SQL's NOW() returns a timestamptz, and comparing it
// against a naive column forces Postgres to cast NOW() through the *session*
// timezone (found to be Asia/Bangkok here, unrelated to the app's UTC
// convention or the Node process's own OS timezone) -- silently comparing
// against the wrong "now" and making valid tokens look expired. Passing the
// current time as a JS-computed naive-UTC string sidesteps that entirely.
const toNaiveUtcString = (date: Date): string => date.toISOString().replace('Z', '');

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT "userId", "email", "passwordHash", "name",
                "passwordResetTokenHash", "passwordResetExpiry", "createdAt"
         FROM "users"
         WHERE "email" = $1`,
        [email]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async create(email: string, passwordHash: string, name: string): Promise<User> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO "users" ("email", "passwordHash", "name")
         VALUES ($1, $2, $3)
         RETURNING "userId", "email", "passwordHash", "name",
                   "passwordResetTokenHash", "passwordResetExpiry", "createdAt"`,
        [email, passwordHash, name]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async findById(userId: number): Promise<User | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT "userId", "email", "passwordHash", "name",
                "passwordResetTokenHash", "passwordResetExpiry", "createdAt"
         FROM "users"
         WHERE "userId" = $1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(`UPDATE "users" SET "passwordHash" = $1 WHERE "userId" = $2`, [
        passwordHash,
        userId,
      ]);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async setResetToken(userId: number, tokenHash: string, expiry: Date): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE "users" SET "passwordResetTokenHash" = $1, "passwordResetExpiry" = $2 WHERE "userId" = $3`,
        [tokenHash, toNaiveUtcString(expiry), userId]
      );
    } catch (error) {
      console.error('Error setting reset token:', error);
      throw error;
    }
  }

  // Expiry check happens here in SQL (not in JS after fetching) so an
  // expired token is indistinguishable from a nonexistent one to the caller.
  async findByValidResetTokenHash(tokenHash: string): Promise<User | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT "userId", "email", "passwordHash", "name",
                "passwordResetTokenHash", "passwordResetExpiry", "createdAt"
         FROM "users"
         WHERE "passwordResetTokenHash" = $1 AND "passwordResetExpiry" > $2`,
        [tokenHash, toNaiveUtcString(new Date())]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  async resetPassword(userId: number, passwordHash: string): Promise<void> {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE "users"
         SET "passwordHash" = $1, "passwordResetTokenHash" = NULL, "passwordResetExpiry" = NULL
         WHERE "userId" = $2`,
        [passwordHash, userId]
      );
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}
