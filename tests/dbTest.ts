// Simple migration and database test script
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

console.log('🧪 Testing Database Migration...');

try {
  // Test database creation
  const dbPath = './kawayan-test.db';
  const db = new Database(dbPath);
  
  console.log('✓ Database created successfully');
  
  // Test schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
      business_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('✓ Users table created');
  
  // Test basic insert
  db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, role, business_name)
    VALUES (?, ?, ?, ?, ?)
  `).run('1', 'admin@kawayan.ph', '$2b$10$test', 'admin', 'Kawayan Admin');
  
  console.log('✓ Admin user created');
  
  // Test query
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get('1') as { email: string };
  console.log('✓ User query successful:', user.email);
  
  // Test profile table
  db.exec(`
    CREATE TABLE IF NOT EXISTS brand_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      business_name TEXT NOT NULL,
      industry TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      brand_voice TEXT NOT NULL,
      key_themes TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  console.log('✓ Brand profiles table created');
  
  // Test posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      topic TEXT NOT NULL,
      caption TEXT NOT NULL,
      image_prompt TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL CHECK (status IN ('Draft', 'Scheduled', 'Published')),
      virality_score INTEGER CHECK (virality_score >= 0 AND virality_score <= 100),
      virality_reason TEXT,
      format TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  console.log('✓ Generated posts table created');
  
  // Test inserting a profile
  db.prepare(`
    INSERT INTO brand_profiles (id, user_id, business_name, industry, target_audience, brand_voice, key_themes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('1', '1', 'Test Business', 'Technology', 'Young professionals', 'Professional', 'Innovation');
  
  console.log('✓ Test profile created');
  
  // Test inserting a post
  db.prepare(`
    INSERT INTO generated_posts (id, user_id, date, topic, caption, image_prompt, status, virality_score, virality_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('1', '1', '2025-01-15', 'Test Topic', 'Test Caption', 'Test Prompt', 'Draft', 75, 'Test Reason');
  
  console.log('✓ Test post created');
  
  // Test foreign key relationships
  const profile = db.prepare('SELECT * FROM brand_profiles WHERE user_id = ?').get('1') as { business_name: string };
  const posts = db.prepare('SELECT * FROM generated_posts WHERE user_id = ?').all('1') as any[];
  
  console.log('✓ Profile retrieved:', profile.business_name);
  console.log('✓ Posts retrieved:', posts.length, 'posts');
  
  // Cleanup
  db.close();
  fs.unlinkSync(dbPath);
  
  console.log('✅ Database test completed successfully!');
  console.log('\n📊 Test Results:');
  console.log('- Database creation: ✅');
  console.log('- Schema creation: ✅');
  console.log('- User operations: ✅');
  console.log('- Profile operations: ✅');
  console.log('- Post operations: ✅');
  console.log('- Foreign key relationships: ✅');
  
} catch (error) {
  console.error('❌ Database test failed:', error);
  process.exit(1);
}