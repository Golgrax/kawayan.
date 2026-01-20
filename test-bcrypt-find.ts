import bcrypt from 'bcryptjs';

async function test() {
  const hash = '$2b$10$E0HK6euPqy3gfWYGiUZw6O.nMUT9..VLRcK0Wg6sp.T94FBGHWJii';
  const passwords = ['admin123', 'Admin123', 'Admin123!', 'password123'];
  for (const p of passwords) {
    const result = await bcrypt.compare(p, hash);
    console.log(`${p}: ${result}`);
  }
}

test();
