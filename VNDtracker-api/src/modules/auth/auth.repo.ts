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
}
