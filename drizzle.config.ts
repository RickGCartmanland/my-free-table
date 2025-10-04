import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "15e8be59-14c3-4e10-82c1-1de77714d0e4",
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});

