import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
import { databaseUrl } from './config.js';

databaseUrl();
const sql = await readFile(new URL('../migrations/001_presence.sql', import.meta.url), 'utf8');
await pool.query(sql);
await pool.end();
console.log('Presence migration applied.');
