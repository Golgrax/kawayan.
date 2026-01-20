import { DatabaseConfig } from '../config/database.js';

console.log('🧪 Testing Database Configuration...');

try {
  const dbConfig = new DatabaseConfig('./test.db');
  const db = dbConfig.getDatabase();
  
  // Test a simple query
  const result = db.prepare('SELECT 1 as test').get();
  console.log('✓ Database connection successful:', result);
  
  // Test creating a user
  db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, role, business_name)
    VALUES (?, ?, ?, ?, ?)
  `).run('1', 'test@example.com', 'test-hash', 'user', 'Test Business');
  
  // Test querying the user
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get('1');
  console.log('✓ User creation and retrieval successful:', user.email);
  
  // Test cleanup
  db.prepare('DELETE FROM users WHERE id = ?').run('1');
  console.log('✓ Cleanup successful');
  
  dbConfig.close();
  console.log('✅ Database test completed successfully!');
  
} catch (error) {
  console.error('❌ Database test failed:', error);
}