import { ContentIdea, GeneratedPost, AIResponseSchema } from '../types';

export class ValidationService {
  // Validate AI content ideas response
  static validateContentIdeas(data: any): ContentIdea[] {
    try {
      if (!Array.isArray(data)) {
        throw new Error('Response is not an array');
      }
      
      const validIdeas: ContentIdea[] = [];
      
      for (const item of data) {
        if (AIResponseSchema.contentIdea(item)) {
          // Additional validation
          if (item.day >= 1 && item.day <= 31 &&
              item.title.trim().length > 0 &&
              item.topic.trim().length > 0) {
            validIdeas.push(item);
          } else {
            console.warn('Invalid content idea data:', item);
          }
        } else {
          console.warn('Content idea failed schema validation:', item);
        }
      }
      
      if (validIdeas.length === 0) {
        throw new Error('No valid content ideas found in response');
      }
      
      return validIdeas;
    } catch (error) {
      console.error('Content ideas validation failed:', error);
      throw new Error(`Invalid AI response: ${error.message}`);
    }
  }
  
  // Validate AI post response
  static validatePostResponse(data: any): {
    caption: string;
    imagePrompt: string;
    viralityScore: number;
    viralityReason: string;
  } {
    try {
      if (!AIResponseSchema.postResponse(data)) {
        throw new Error('Response does not match expected schema');
      }
      
      // Additional validation
      if (data.caption.trim().length < 10) {
        throw new Error('Caption is too short');
      }
      
      if (data.imagePrompt.trim().length < 5) {
        throw new Error('Image prompt is too short');
      }
      
      if (data.viralityScore < 0 || data.viralityScore > 100) {
        throw new Error('Virality score must be between 0 and 100');
      }
      
      if (data.viralityReason.trim().length < 5) {
        throw new Error('Virality reason is too short');
      }
      
      return data;
    } catch (error) {
      console.error('Post response validation failed:', error);
      throw new Error(`Invalid AI response: ${error.message}`);
    }
  }
  
  // Validate trending topics response
  static validateTrendingTopics(data: any): string[] {
    try {
      if (!Array.isArray(data)) {
        throw new Error('Response is not an array');
      }
      
      const validTopics: string[] = [];
      
      for (const topic of data) {
        if (typeof topic === 'string' && topic.trim().length > 0) {
          validTopics.push(topic.trim());
        }
      }
      
      if (validTopics.length === 0) {
        throw new Error('No valid trending topics found');
      }
      
      return validTopics;
    } catch (error) {
      console.error('Trending topics validation failed:', error);
      throw new Error(`Invalid AI response: ${error.message}`);
    }
  }
  
  // Sanitize user inputs
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove potential JS protocols
      .replace(/on\w+=/gi, ''); // Remove potential event handlers
  }
  
  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Validate password strength
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Validate brand profile
  static validateBrandProfile(profile: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const fields = [
      { key: 'businessName', name: 'Business name', minLength: 2 },
      { key: 'industry', name: 'Industry', minLength: 2 },
      { key: 'targetAudience', name: 'Target audience', minLength: 2 },
      { key: 'brandVoice', name: 'Brand voice', minLength: 2 },
      { key: 'keyThemes', name: 'Key themes', minLength: 2 }
    ];
    
    for (const field of fields) {
      const value = profile[field.key];
      if (!value || typeof value !== 'string' || value.trim().length < field.minLength) {
        errors.push(`${field.name} must be at least ${field.minLength} characters long`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Create fallback content when AI fails
  static createFallbackContentIdeas(month: string): ContentIdea[] {
    return [
      { day: 1, title: 'New Month Kickoff', topic: 'Start the month right with our products', format: 'Image' },
      { day: 7, title: 'Weekend Special', topic: 'Weekend promotion and deals', format: 'Carousel' },
      { day: 14, title: 'Customer Spotlight', topic: 'Feature customer success stories', format: 'Image' },
      { day: 21, title: 'Product Tips', topic: 'How to get the most from our products', format: 'Video' },
      { day: 28, title: 'Month End Review', topic: 'Thank customers and preview next month', format: 'Carousel' }
    ];
  }
  
  static createFallbackPostResponse(topic: string): {
    caption: string;
    imagePrompt: string;
    viralityScore: number;
    viralityReason: string;
  } {
    return {
      caption: `Check out our amazing ${topic}! 🎉 Perfect for you. #Quality #MustHave`,
      imagePrompt: `Clean product photography of ${topic}, bright lighting, professional style`,
      viralityScore: 65,
      viralityReason: 'Standard product post with good engagement potential'
    };
  }
  
  static createFallbackTrendingTopics(): string[] {
    return ['Sale', 'Weekend', 'Food Trip', 'Payday', 'New Arrival'];
  }
}