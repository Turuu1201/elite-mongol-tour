import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { SCHEMA } from "./schema.js";
import { seed } from "./seed.js";

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
}

// DATABASE_URL байвал жинхэнэ PostgreSQL (Neon, Supabase гэх мэт),
// байхгүй бол компьютер дээр ажиллах PGlite (WASM дээрх PostgreSQL).
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new pg.Pool({ connectionString: url, max: 5 });
    return {
      query: async <T>(text: string, params?: unknown[]) => (await pool.query(text, params)).rows as T[],
      exec: async (text) => {
        await pool.query(text);
      },
    };
  }

  // Serverless орчинд (Netlify/AWS Lambda) файлын систем түр зуурынх тул PGlite ашиглахгүй
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error("Production орчинд DATABASE_URL тохируулах шаардлагатай");
  }

  // Хувьсагчаар импортолснооор Netlify-ийн bundler PGlite (WASM)-ийг функцэд оруулахгүй
  const pgliteModule = "@electric-sql/pglite";
  const { PGlite } = (await import(pgliteModule)) as typeof import("@electric-sql/pglite");
  const dir = resolve(process.env.PGLITE_DIR ?? "./.data/pg");
  mkdirSync(dir, { recursive: true });
  console.log(`DB: PGlite (${dir})`);
  const lite = new PGlite(dir);
  return {
    query: async <T>(text: string, params?: unknown[]) => (await lite.query<T>(text, params)).rows,
    exec: async (text) => {
      await lite.exec(text);
    },
  };
}

let ready: Promise<Db> | undefined;

export function db(): Promise<Db> {
  ready ??= (async () => {
    const conn = await connect();
    await conn.exec(SCHEMA);
    await seed(conn);
    return conn;
  })().catch((err) => {
    ready = undefined;
    throw err;
  });
  return ready;
}
