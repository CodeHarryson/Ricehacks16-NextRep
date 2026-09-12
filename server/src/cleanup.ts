import { pool, cleanupExpiredPresence } from './db.js';

const deleted = await cleanupExpiredPresence();
await pool.end();
console.log(`Expired presence rows removed: ${deleted}`);
