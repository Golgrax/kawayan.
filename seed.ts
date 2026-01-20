import { DatabaseService } from './services/databaseService';
import { BrandProfile, GeneratedPost } from './types';
import { logger } from './utils/logger';

async function seed() {
  console.log('🌱 Seeding database...');
  const dbService = new DatabaseService();

  try {
    // 1. Create Users
    const users = [
      { email: 'admin@kawayan.ph', password: 'Admin123!', role: 'admin' as const, businessName: 'Kawayan Admin' },
      { email: 'support@kawayan.ph', password: 'Support123!', role: 'support' as const, businessName: 'Kawayan Support' },
      { email: 'cafe@kawayan.ph', password: 'Password123!', role: 'user' as const, businessName: 'Kapihan sa Nayon' },
      { email: 'bakery@kawayan.ph', password: 'Password123!', role: 'user' as const, businessName: 'Panaderia de Manila' },
      { email: 'tech@kawayan.ph', password: 'Password123!', role: 'user' as const, businessName: 'Gadget Hub PH' }
    ];

    const createdUsers = [];
    for (const u of users) {
      try {
        const user = await dbService.createUser(u.email, u.password, u.role, u.businessName);
        if (user) {
          console.log(`✓ Created user: ${u.email}`);
          createdUsers.push(user);
        } else {
          // If user exists, fetch it
          const db = (dbService as any).dbConfig.getDatabase();
          const existing = db.prepare('SELECT id, email, role, business_name FROM users WHERE email = ?').get(u.email);
          console.log(`- User already exists: ${u.email}`);
          createdUsers.push({
            id: existing.id,
            email: existing.email,
            role: existing.role,
            businessName: existing.business_name
          });
        }
      } catch (e) {
        // If it failed due to validation or something else, but user exists, fetch it
        const db = (dbService as any).dbConfig.getDatabase();
        const existing = db.prepare('SELECT id, email, role, business_name FROM users WHERE email = ?').get(u.email);
        if (existing) {
          console.log(`- User already exists (after error): ${u.email}`);
          createdUsers.push({
            id: existing.id,
            email: existing.email,
            role: existing.role,
            businessName: existing.business_name
          });
        } else {
          throw e;
        }
      }
    }

    // 2. Create Brand Profiles for Users
    const profiles = [
      {
        id: 'prof-cafe',
        userId: createdUsers[2].id, // cafe
        businessName: 'Kapihan sa Nayon',
        industry: 'Food & Beverage',
        targetAudience: 'Locals, students, and remote workers looking for a cozy place.',
        brandVoice: 'Warm, welcoming, and community-focused.',
        keyThemes: 'Freshly brewed coffee, local pastries, cozy ambiance, community.'
      },
      {
        id: 'prof-bakery',
        userId: createdUsers[3].id, // bakery
        businessName: 'Panaderia de Manila',
        industry: 'Bakery',
        targetAudience: 'Families and commuters who love traditional Filipino bread.',
        brandVoice: 'Nostalgic, authentic, and appetizing.',
        keyThemes: 'Hot pandesal, traditional recipes, family traditions, morning energy.'
      },
      {
        id: 'prof-tech',
        userId: createdUsers[4].id, // tech
        businessName: 'Gadget Hub PH',
        industry: 'Electronics',
        targetAudience: 'Tech enthusiasts and value-conscious gadget seekers.',
        brandVoice: 'Expert, trendy, and helpful.',
        keyThemes: 'Latest tech, value for money, expert reviews, digital lifestyle.'
      }
    ];

    for (const p of profiles) {
      await dbService.saveProfile(p as BrandProfile);
      console.log(`✓ Created profile for: ${p.businessName}`);
    }

    // 3. Create Generated Posts (Past, Present, Future)
    const today = new Date();
    const months = [-2, -1, 0, 1]; // Last two months, current month, next month
    
    for (const user of createdUsers.slice(2)) { // Only for regular users
      console.log(`Generating posts for ${user.email}...`);
      for (const m of months) {
        const date = new Date(today);
        date.setMonth(today.getMonth() + m);
        
        const postsCount = m < 0 ? 8 : 4; // More posts in the past
        for (let i = 0; i < postsCount; i++) {
          const postDate = new Date(date);
          postDate.setDate(1 + i * 3);
          
          const status = postDate < today ? 'Published' : (i % 2 === 0 ? 'Scheduled' : 'Draft');
          
          const post: GeneratedPost = {
            id: `seed-post-${user.id}-${m}-${i}`,
            userId: user.id,
            date: postDate.toISOString().split('T')[0],
            topic: `Topic ${i+1} for month ${m}`,
            caption: `This is a sample caption for ${user.businessName}. We are excited to share this update about ${m === 0 ? 'this month' : 'our journey'}. #KawayanAI #SMEPH`,
            imagePrompt: `A high quality photo of ${user.businessName} products, professional lighting, social media style`,
            imageUrl: `https://picsum.photos/seed/${user.id}${m}${i}/800/800`,
            status: status as any,
            viralityScore: Math.floor(Math.random() * 40) + 50, // 50-90
            viralityReason: 'Strong emotional hook and trending keywords.',
            format: i % 2 === 0 ? 'Image' : 'Carousel',
            regenCount: 0,
            history: []
          };
          
          await dbService.savePost(post);
        }
      }
      console.log(`✓ Created sample posts for: ${user.email}`);
    }

    // 4. Create Content Plans
    for (const user of createdUsers.slice(2)) {
      const currentMonthName = today.toLocaleString('default', { month: 'long' });
      const ideas = [
        { day: 5, title: 'Morning Special', topic: 'Highlighting our morning bestsellers', format: 'Image' },
        { day: 12, title: 'Behind the Scenes', topic: 'How we prepare our signature products', format: 'Video' },
        { day: 20, title: 'Customer Spotlight', topic: 'Featuring a happy customer of the week', format: 'Carousel' },
        { day: 28, title: 'Weekend Promo', topic: 'Upcoming weekend discount announcement', format: 'Image' }
      ];
      
      await dbService.savePlan(user.id, currentMonthName, ideas);
      console.log(`✓ Created content plan for: ${user.email} (${currentMonthName})`);
    }

    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await dbService.close();
  }
}

seed();
