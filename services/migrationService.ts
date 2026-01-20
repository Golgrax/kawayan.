import { DatabaseConfig } from '../config/database';
import { User, BrandProfile, GeneratedPost } from '../types';
import bcrypt from 'bcryptjs';

export class MigrationService {
  private dbConfig: DatabaseConfig;
  
  constructor() {
    this.dbConfig = new DatabaseConfig();
  }
  
  // Export data from LocalStorage
  exportFromLocalStorage() {
    const data = {
      users: this.getFromLocalStorage('kawayan_users'),
      profiles: this.getFromLocalStorage('kawayan_profiles'),
      posts: this.getFromLocalStorage('kawayan_posts'),
      session: this.getFromLocalStorage('kawayan_session')
    };
    
    console.log('Exported data from LocalStorage:', {
      users: data.users.length,
      profiles: data.profiles.length,
      posts: data.posts.length,
      hasSession: !!data.session
    });
    
    return data;
  }
  
  private getFromLocalStorage(key: string): any[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key} from LocalStorage:`, error);
      return [];
    }
  }
  
  // Migrate data to SQLite
  async migrateToSQLite() {
    const data = this.exportFromLocalStorage();
    const db = this.dbConfig.getDatabase();
    
    try {
      // Use transaction for data integrity
      this.dbConfig.transaction(() => {
        // Migrate users
        for (const user of data.users) {
          // Check if user already exists
          const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
          
          if (!existingUser) {
            // Hash password with bcrypt (replacing weak btoa encoding)
            const passwordHash = user.passwordHash.includes('YWRtaW4xMjM=') ? 
              // This is the base64 encoded 'admin123', hash it properly
              bcrypt.hashSync('admin123', 10) :
              // For other users, try to detect if it's base64 and decode first
              this.migratePassword(user.passwordHash);
            
            db.prepare(`
              INSERT INTO users (id, email, password_hash, role, business_name)
              VALUES (?, ?, ?, ?, ?)
            `).run(
              user.id,
              user.email,
              passwordHash,
              user.role,
              user.businessName || null
            );
          }
        }
        
        // Migrate brand profiles
        for (const profile of data.profiles) {
          const existingProfile = db.prepare('SELECT id FROM brand_profiles WHERE id = ?').get(profile.id);
          
          if (!existingProfile) {
            db.prepare(`
              INSERT INTO brand_profiles (id, user_id, business_name, industry, target_audience, brand_voice, key_themes)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
              profile.id || Date.now().toString(),
              profile.userId,
              profile.businessName,
              profile.industry,
              profile.targetAudience,
              profile.brandVoice,
              profile.keyThemes
            );
          }
        }
        
        // Migrate generated posts
        for (const post of data.posts) {
          const existingPost = db.prepare('SELECT id FROM generated_posts WHERE id = ?').get(post.id);
          
          if (!existingPost) {
            db.prepare(`
              INSERT INTO generated_posts (id, user_id, date, topic, caption, image_prompt, image_url, status, virality_score, virality_reason, format)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              post.id,
              post.userId,
              post.date,
              post.topic,
              post.caption,
              post.imagePrompt,
              post.imageUrl || null,
              post.status,
              post.viralityScore || null,
              post.viralityReason || null,
              post.format || null
            );
          }
        }
      });
      
      console.log('Migration completed successfully');
      
      // Verify migration
      const stats = {
        users: (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count,
        profiles: (db.prepare('SELECT COUNT(*) as count FROM brand_profiles').get() as { count: number }).count,
        posts: (db.prepare('SELECT COUNT(*) as count FROM generated_posts').get() as { count: number }).count
      };
      
      console.log('Database statistics after migration:', stats);
      
      return { success: true, stats };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  private migratePassword(encodedPassword: string): string {
    try {
      // Try to decode base64
      const decoded = atob(encodedPassword);
      // Hash the decoded password
      return bcrypt.hashSync(decoded, 10);
    } catch {
      // If decoding fails, hash the encoded string as-is
      return bcrypt.hashSync(encodedPassword, 10);
    }
  }
  
  // Create backup of LocalStorage data
  createBackup() {
    const data = this.exportFromLocalStorage();
    const backup = {
      timestamp: new Date().toISOString(),
      data: data
    };
    
    // Save to LocalStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('kawayan_backup', JSON.stringify(backup));
    }
    
    return backup;
  }
  
  // Clear LocalStorage after successful migration
  clearLocalStorage() {
    if (typeof window !== 'undefined') {
      const keys = ['kawayan_users', 'kawayan_profiles', 'kawayan_posts', 'kawayan_session'];
      keys.forEach(key => localStorage.removeItem(key));
      console.log('LocalStorage cleared');
    }
  }
  
  // Check if migration is needed
  isMigrationNeeded(): boolean {
    if (typeof window === 'undefined') return false;
    
    const hasLocalStorage = ['kawayan_users', 'kawayan_profiles', 'kawayan_posts']
      .some(key => localStorage.getItem(key) !== null);
    
const db = this.dbConfig.getDatabase();
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    
    return hasLocalStorage && userCount === 0;
  }
  
  close() {
    this.dbConfig.close();
  }
}