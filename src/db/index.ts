import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    const config: any = {
      max: 10,
      connectionTimeoutMillis: 10000,
    };

    if (process.env.SQL_HOST) config.host = process.env.SQL_HOST;
    if (process.env.SQL_USER) config.user = process.env.SQL_USER;
    if (process.env.SQL_PASSWORD) config.password = process.env.SQL_PASSWORD;
    if (process.env.SQL_DB_NAME) config.database = process.env.SQL_DB_NAME;

    global._postgresPool = new Pool(config);

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL idle client warning/error:', err?.message || err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
