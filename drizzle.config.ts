import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load biến môi trường từ file .env
dotenv.config();

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'file:./local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;