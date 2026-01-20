import { User, BrandProfile, GeneratedPost } from '../types';

/**
 * StorageService
 * This acts as a wrapper around LocalStorage to simulate a database.
 * In a full production node.js environment, this would be replaced by 
 * actual SQL queries (SQLite/Postgres).
 */

const STORAGE_KEYS = {
  USERS: 'kawayan_users',
  PROFILES: 'kawayan_profiles',
  POSTS: 'kawayan_posts',
  SESSION: 'kawayan_session'
};

// --- Helpers ---
const get = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const save = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Users (Auth) ---
export const createUser = (email: string, password: string, role: 'user' | 'admin' = 'user', businessName?: string): User | null => {
  const users = get<User>(STORAGE_KEYS.USERS);
  if (users.find(u => u.email === email)) return null; // User exists

  const newUser: User = {
    id: Date.now().toString(),
    email,
    passwordHash: btoa(password), // Simple encoding for demo. Do NOT use in real prod.
    role,
    businessName
  };
  
  users.push(newUser);
  save(STORAGE_KEYS.USERS, users);
  return newUser;
};

export const loginUser = (email: string, password: string): User | null => {
  const users = get<User>(STORAGE_KEYS.USERS);
  const user = users.find(u => u.email === email && u.passwordHash === btoa(password));
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(STORAGE_KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

// --- Profiles ---
export const saveProfile = (profile: BrandProfile) => {
  const profiles = get<BrandProfile>(STORAGE_KEYS.PROFILES);
  const existingIndex = profiles.findIndex(p => p.userId === profile.userId);
  
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  save(STORAGE_KEYS.PROFILES, profiles);
};

export const getProfile = (userId: string): BrandProfile | undefined => {
  const profiles = get<BrandProfile>(STORAGE_KEYS.PROFILES);
  return profiles.find(p => p.userId === userId);
};

// --- Posts ---
export const savePost = (post: GeneratedPost) => {
  const posts = get<GeneratedPost>(STORAGE_KEYS.POSTS);
  const existingIndex = posts.findIndex(p => p.id === post.id);
  
  if (existingIndex >= 0) {
    posts[existingIndex] = post;
  } else {
    posts.push(post);
  }
  save(STORAGE_KEYS.POSTS, posts);
};

export const getUserPosts = (userId: string): GeneratedPost[] => {
  const posts = get<GeneratedPost>(STORAGE_KEYS.POSTS);
  return posts.filter(p => p.userId === userId);
};

// --- Admin Stats (Mocked but calculated from "DB") ---
export const getAdminStats = () => {
  const users = get<User>(STORAGE_KEYS.USERS);
  const posts = get<GeneratedPost>(STORAGE_KEYS.POSTS);
  
  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.role === 'user').length,
    totalPostsGenerated: posts.length,
    revenue: users.length * 500 // Mock revenue: 500 PHP per user
  };
};

// Initialize Admin if not exists
if (!loginUser('admin@kawayan.ph', 'admin123')) {
  createUser('admin@kawayan.ph', 'admin123', 'admin', 'Kawayan Admin');
}
