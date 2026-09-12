import { serve } from '@hono/node-server';
import { databaseUrl, PORT } from './config.js';
import { pool } from './db.js';
import { createApp } from './api.js';

databaseUrl();
const app = createApp(pool);
serve({ fetch: app.fetch, port: PORT });
console.log(`NextRep presence API listening on ${PORT}`);
