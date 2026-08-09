import { getPool } from '../../config/database';
import { User } from './auth.dto';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT "userId", "email", "passwordHash", "name", "createdAt"
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
         RETURNING "userId", "email", "passwordHash", "name", "createdAt"`,
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
        `SELECT "userId", "email", "passwordHash", "name", "createdAt"
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
}
