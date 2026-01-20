import { GeneratedPost } from '../types';

// Types mimicking Facebook/Instagram Graph API responses
export interface SocialMetric {
  date: string;
  value: number;
}

export interface SocialPlatformData {
  platform: 'facebook' | 'instagram' | 'tiktok';
  connected: boolean;
  username?: string; // Added username
  followers: number;
  following?: number;
  likes?: number;
  posts?: number;
  views?: number;
  interactions?: number;
  visits?: number;
  netFollows?: number;
  engagement: number;
  reach: number; // Single value from scraper
  reachData?: SocialMetric[]; // Time series data
  error?: string;
  connectedAt?: string;
  accessToken?: string;
}

// Simulates a real API Service
class SocialMediaService {

  // Helper to check for Sandbox Mode
  private isSandbox(): boolean {
    const isDev = import.meta.env.DEV;
    const tiktokKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || '';
    const fbKey = import.meta.env.VITE_FACEBOOK_APP_ID || '';
    
    // Check if keys are missing or placeholders
    const missingKeys = !tiktokKey || tiktokKey.includes('your_') || !fbKey || fbKey.includes('your_');
    
    return isDev || missingKeys;
  }

  public sandboxMode = this.isSandbox();

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('kawayan_jwt');
    return token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' };
  }

  // 1. Fetch all connections from DB
  async fetchConnections(): Promise<Record<string, any>> {
    try {
      const response = await fetch('/api/social/connections', {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) return {};
      return await response.json();
    } catch (error) {
      console.error('Error fetching connections:', error);
      return {};
    }
  }

  // 2. Connect Account (Now uses Username input instead of OAuth)
  async connectAccount(platform: 'facebook' | 'instagram' | 'tiktok', username: string, extraData: any = {}): Promise<void> {
    console.log(`[SocialService] Connecting to ${platform} as ${username}...`);
    
    const data = {
      username,
      connectedAt: new Date().toISOString(),
      id: `${platform}_${username}`,
      ...extraData
    };

    try {
      await fetch('/api/social/connections', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ platform, data })
      });
      
      // Trigger update
      window.dispatchEvent(new Event('social-connections-updated'));
    } catch (error) {
      console.error('Error connecting account:', error);
      throw error;
    }
  }

  // 3. Disconnect
  async disconnectAccount(platform: string): Promise<boolean> {
    try {
      await fetch(`/api/social/connections/${platform}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      window.dispatchEvent(new Event('social-connections-updated'));
      return true;
    } catch (error) {
      console.error('Error disconnecting account:', error);
      return false;
    }
  }

  // 4. Fetch Insights (Check Cache -> Then Backend Proxy)
  async getInsights(platform: 'facebook' | 'instagram' | 'tiktok'): Promise<SocialPlatformData | null> {
    const connections = await this.fetchConnections();
    const connection = connections[platform];
    
    if (!connection || !connection.connected) {
      return null;
    }

    const username = connection.username;
    // connection.data might contain the "lastStats" or "followers" directly if flattened by getSocialConnections
    // In databaseService.ts getSocialConnections, we flatten: ...JSON.parse(row.data)
    
    // So `connection` has `followers`, `engagement`, `username`.
    // Let's check if we have recent stats or need to refresh?
    // For now, assume DB has latest or we force refresh if explicit.
    // The previous code had a "cache" logic. Let's keep it simple: return what DB has.
    // But if DB has 0 followers, maybe try scraping?
    
    if (connection.followers > 0) {
      return {
        platform,
        connected: true,
        username,
        followers: connection.followers,
        engagement: connection.engagement,
        // Map other fields from connection object (which includes flattened JSON data)
        following: connection.following,
        likes: connection.likes,
        posts: connection.posts,
        views: connection.views,
        interactions: connection.interactions,
        visits: connection.visits,
        netFollows: connection.netFollows,
        reach: connection.reach || 0
      };
    }

    // Try backend scraper if no data
    let stats = { followers: 0, engagement: 0, isReal: false, following: 0, likes: 0 };

    try {
      const response = await fetch(`/api/social/stats/${platform}/${username}`);
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        stats = await response.json();
        
        // Save to DB
        if (stats.followers > 0) {
           await this.updateStats(platform, stats);
        }
      }
    } catch (e) {
      console.error('Error fetching real stats:', e);
    }

    return {
      platform,
      connected: true,
      username: username, 
      followers: stats.followers || 0,
      following: stats.following,
      likes: stats.likes,
      views: (stats as any).views || 0,
      interactions: (stats as any).interactions || 0,
      visits: (stats as any).visits || 0,
      netFollows: (stats as any).netFollows || 0,
      engagement: stats.engagement || 0,
      reach: 0,
      error: (stats.followers > 0) ? undefined : "No data yet"
    };
  }

  // 5. Update Stats (Called by Dashboard when Extension scrapes data or we scrape)
  async updateStats(platform: string, stats: any) {
    // Just call connectAccount which calls POST /api/social/connections which updates/merges
    // But we need to preserve existing username if not in stats
    // Ideally we fetch first
    const connections = await this.fetchConnections();
    const current = connections[platform] || {};
    
    const newData = {
      ...current,
      ...stats,
      followers: stats.followers, // Ensure top level fields update
      engagement: stats.engagement
    };
    
    // Remove "connected" boolean from data payload if it's there, 
    // connectAccount/POST handles it but cleanly:
    
    await this.connectAccount(platform as any, current.username || stats.username, newData);
  }

  // 6. Get All Connected Status
  async fetchConnectionStatus() {
    const conns = await this.fetchConnections();
    return {
      facebook: !!conns.facebook?.connected,
      instagram: !!conns.instagram?.connected,
      tiktok: !!conns.tiktok?.connected
    };
  }
}

export const socialService = new SocialMediaService();
