import mariadb from 'mariadb';

export const db = mariadb.createPool({
  host: process.env.TIDB_HOST,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  port: Number(process.env.TIDB_PORT) || 4000,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
  connectionLimit: 10,
  acquireTimeout: 30000,
  idleTimeout: 60000,
});