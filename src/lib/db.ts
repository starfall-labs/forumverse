import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Khởi tạo client kết nối đến Turso
const client = createClient({
  // Sử dụng biến môi trường cho URL và token
  // Trong môi trường phát triển, có thể sử dụng URL local
  url: process.env.TURSO_DATABASE_URL || 'file:./local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Khởi tạo Drizzle ORM với client và schema đã định nghĩa
export const db = drizzle(client, { schema });

// Export schema để sử dụng ở các file khác
export { schema };