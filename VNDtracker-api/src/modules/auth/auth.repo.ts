import sql from 'mssql';
import { getPool } from '../../config/database';
import { User } from './auth.dto';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT userId, email, passwordHash, name, createdAt
          FROM users
          WHERE email = @email
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  async create(email: string, passwordHash: string, name: string): Promise<User> {
    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input('email', sql.NVarChar, email)
        .input('passwordHash', sql.NVarChar, passwordHash)
        .input('name', sql.NVarChar, name)
        .query(`
          INSERT INTO users (email, passwordHash, name)
          OUTPUT INSERTED.userId, INSERTED.email, INSERTED.passwordHash, INSERTED.name, INSERTED.createdAt
          VALUES (@email, @passwordHash, @name)
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}
