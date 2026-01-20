import bcrypt from 'bcryptjs';

async function test() {
  const password = 'Admin123!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
  const result = await bcrypt.compare(password, hash);
  console.log('Match:', result);
}

test();
