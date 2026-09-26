import { defineConfig } from "drizzle-kit";

if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  throw new Error("Missing POSTGRES_URL/DATABASE_URL for drizzle-kit.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
