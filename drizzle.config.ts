import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./api/db/drizzle/schema.ts",
  out: "./api/db/drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  introspect: {
    casing: "preserve",
  },
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config;
