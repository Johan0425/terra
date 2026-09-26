import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  throw new Error(
    "Missing POSTGRES_URL/DATABASE_URL. Set it in .env.local (see .env.example), " +
      "or provision Postgres in Vercel → Storage and pull it with `vercel env pull`.",
  );
}

const sql = neon(process.env.POSTGRES_URL ?? process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
