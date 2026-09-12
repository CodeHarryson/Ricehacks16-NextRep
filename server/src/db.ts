import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
export interface DbClient {
  query<T = unknown>(text: string, values?: readonly unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
}

function normalizedConnectionString(): string | undefined {
  const value = process.env.TIGER_DATABASE_URL;
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.searchParams.get('sslmode') === 'require' && !url.searchParams.has('uselibpqcompat')) {
      url.searchParams.set('uselibpqcompat', 'true');
      return url.toString();
    }
  } catch {
    return value;
  }
  return value;
}

export const pool = new Pool({ connectionString: normalizedConnectionString() });

export async function cleanupExpiredPresence(db: DbClient = pool): Promise<number> {
  const result = await db.query('DELETE FROM presence_events WHERE expires_at <= NOW()');
  return result.rowCount ?? 0;
}
