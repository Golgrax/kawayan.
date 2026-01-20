import bcrypt from 'bcryptjs';

async function test() {
  const hash = '$2b$10$E0HK6euPqy3gfWYGiUZw6O.nMUT9..VLRcK0Wg6sp.T94FBGHWJii';
  const password = 'Admin123!';
  const result = await bcrypt.compare(password, hash);
  console.log('Match:', result);
}

test();
