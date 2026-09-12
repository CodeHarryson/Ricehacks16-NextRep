import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
import { databaseUrl } from './config.js';

databaseUrl();
for (const migration of ['001_presence.sql', '002_challenges.sql', '003_challenge_config.sql', '004_challenge_results.sql']) {
  const sql = await readFile(new URL(`../migrations/${migration}`, import.meta.url), 'utf8');
  await pool.query(sql);
}
await pool.end();
console.log('Tiger Data migrations applied.');
