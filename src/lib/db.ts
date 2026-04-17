import mariadb from 'mariadb';

export const db = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 4000,
  ssl: {
    rejectUnauthorized: true,
  },
  connectionLimit: 10,
  acquireTimeout: 30000,
  idleTimeout: 60000,
  connectTimeout: 10000,
});