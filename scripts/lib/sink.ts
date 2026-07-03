import fs from 'node:fs';
import path from 'node:path';

/**
 * Output sink for the seed pipeline. Two modes:
 *  - SqlFileSink: writes numbered .sql files (applied via the Supabase MCP /
 *    SQL editor). Default when no service key is configured.
 *  - SupabaseSink: applies directly with the service role key
 *    (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local) — the path n8n
 *    or a cron job uses later.
 */

export type Row = Record<string, unknown>;

export interface Sink {
  raw(sql: string, label: string): Promise<void>;
  insert(table: string, rows: Row[], batchSize?: number): Promise<void>;
  flush(): Promise<void>;
}

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

export class SqlFileSink implements Sink {
  private dir: string;
  private fileIndex = 0;
  private statements: string[] = [];
  private currentLabel = 'seed';

  constructor(dir: string) {
    this.dir = dir;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }

  private writeFile(label: string) {
    if (!this.statements.length) return;
    const name = `${String(this.fileIndex).padStart(3, '0')}-${label}.sql`;
    fs.writeFileSync(path.join(this.dir, name), this.statements.join('\n'));
    this.fileIndex++;
    this.statements = [];
  }

  async raw(sql: string, label: string) {
    if (label !== this.currentLabel) {
      this.writeFile(this.currentLabel);
      this.currentLabel = label;
    }
    this.statements.push(sql.trim().endsWith(';') ? sql.trim() : `${sql.trim()};`);
  }

  async insert(table: string, rows: Row[], batchSize = 200) {
    if (!rows.length) return;
    const label = table.replace(/^public\./, '');
    const cols = Object.keys(rows[0]);
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch.map((r) => `(${cols.map((c) => sqlLiteral(r[c])).join(',')})`).join(',\n');
      // one INSERT per file chunk so each file stays applyable independently
      if (label !== this.currentLabel) {
        this.writeFile(this.currentLabel);
        this.currentLabel = label;
      }
      this.statements.push(`insert into ${table} (${cols.join(',')}) values\n${values};`);
      this.writeFile(this.currentLabel);
    }
  }

  async flush() {
    this.writeFile(this.currentLabel);
  }
}

export class SupabaseSink implements Sink {
  // Lazily import so the repo builds without the dependency configured.
  private client: import('@supabase/supabase-js').SupabaseClient;

  constructor(url: string, serviceKey: string) {
    const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');
    this.client = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  async raw(sql: string, label: string) {
    throw new Error(
      `SupabaseSink cannot run raw SQL (${label}). Apply the emitted SQL files via the Supabase SQL editor, or add an exec_sql RPC.`,
    );
  }

  async insert(table: string, rows: Row[], batchSize = 500) {
    const name = table.replace(/^public\./, '');
    for (let i = 0; i < rows.length; i += batchSize) {
      const { error } = await this.client.from(name).insert(rows.slice(i, i + batchSize) as never);
      if (error) throw new Error(`insert ${name}: ${error.message}`);
    }
  }

  async flush() {}
}
