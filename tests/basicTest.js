console.log('🧪 Basic System Test');

// Test 1: Check if all required files exist
const requiredFiles = [
  'config/database.ts',
  'services/databaseService.ts',
  'services/migrationService.ts',
  'services/validationService.ts',
  'services/geminiService.ts',
  'utils/logger.ts',
  '.env.example'
];

console.log('\n📁 Checking required files...');
for (const file of requiredFiles) {
  try {
    const fs = require('fs');
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - Missing!`);
    }
  } catch (error) {
    console.log(`❌ ${file} - Error checking: ${error.message}`);
  }
}

// Test 2: Check if dependencies are installed
console.log('\n📦 Checking dependencies...');
const requiredDeps = [
  'better-sqlite3',
  'bcryptjs',
  'zod',
  '@google/genai'
];

for (const dep of requiredDeps) {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep}`);
  } catch (error) {
    console.log(`❌ ${dep} - Not installed!`);
  }
}

// Test 3: Check if package.json has correct scripts
console.log('\n⚙️  Checking package.json scripts...');
try {
  const packageJson = require('./package.json');
  const scripts = packageJson.scripts || {};
  
  if (scripts.build) console.log('✅ Build script exists');
  else console.log('❌ Build script missing');
  
  if (scripts.dev) console.log('✅ Dev script exists');
  else console.log('❌ Dev script missing');
  
  if (scripts.test) console.log('✅ Test script exists');
  else console.log('❌ Test script missing');
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Test 4: Check environment configuration
console.log('\n🔧 Checking environment...');
try {
  const fs = require('fs');
  if (fs.existsSync('.env.example')) {
    console.log('✅ .env.example exists');
    const envExample = fs.readFileSync('.env.example', 'utf8');
    if (envExample.includes('GEMINI_API_KEY')) {
      console.log('✅ GEMINI_API_KEY configured');
    } else {
      console.log('❌ GEMINI_API_KEY missing from .env.example');
    }
  } else {
    console.log('❌ .env.example missing');
  }
} catch (error) {
  console.log('❌ Error checking environment:', error.message);
}

console.log('\n🎯 Basic system test completed!');
console.log('\n📋 Next Steps:');
console.log('1. Copy .env.example to .env and add your GEMINI_API_KEY');
console.log('2. Run npm run dev to start development server');
console.log('3. Visit http://localhost:3000 to test the application');
console.log('4. Login with admin@kawayan.ph / admin123');