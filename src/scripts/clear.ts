import { clearDatabase } from '../lib/migration';

// Xóa dữ liệu trong database
clearDatabase()
  .then(() => {
    console.log('Database cleared successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Clearing failed:', error);
    process.exit(1);
  });