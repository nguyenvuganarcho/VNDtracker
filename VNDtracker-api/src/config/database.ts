import { Pool, types } from 'pg';

// pg's default type parsing converts DATE/TIMESTAMP columns into JS Date
// objects, which then get serialized back to UTC ISO strings -- silently
// shifting the value by whatever timezone offset the parsing step assumed
// (Node process local time for the naive DB value), independent of what was
// actually stored. Caught this by sending expenseDate "2026-08-08" and
// getting back "2026-08-07T14:30:00.000Z". Since the app only ever treats
// these as plain "YYYY-MM-DD" / "YYYY-MM-DD HH:MI:SS" strings and never
// does timezone-aware date math, the correct fix is to disable the Date
// conversion entirely and return exactly what Postgres stored.
types.setTypeParser(types.builtins.DATE, (val) => val);
types.setTypeParser(types.builtins.TIMESTAMP, (val) => val);

// DATABASE_URL is the standard connection format for hosted Postgres
// providers (Supabase, Neon, Railway, ...) used in production. Falls back to
// discrete DB_* vars for local dev, matching the pattern the MSSQL config
// used to have.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'vndtracker',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };

let pool: Pool | null = null;

export const connectDB = async (): Promise<Pool> => {
  try {
    if (pool) {
      return pool;
    }

    pool = new Pool({ ...poolConfig, max: 10, idleTimeoutMillis: 30000 });

    // Fail fast on startup instead of only on the first query.
    const client = await pool.connect();
    client.release();

    console.log('Connected to PostgreSQL database');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return pool;
};

export const closeDB = async (): Promise<void> => {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database:', error);
  }
};
