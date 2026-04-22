import mariadb from 'mariadb';

export const db = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 4000,
  ssl: {
    rejectUnauthorized: true,
    // TiDB Cloud uses ISRG Root X1 CA, which is trusted by Node.js built-in store
  },
  connectionLimit: 10,
  acquireTimeout: 30000,
  idleTimeout: 60000,
  connectTimeout: 10000,
});