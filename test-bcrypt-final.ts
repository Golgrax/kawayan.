import bcrypt from 'bcryptjs';

async function test() {
  const hash = '$2b$12$InfxjD7yXQcBnhPVwPxg/.bdzlWQU4BC/m0Pashp.C/YrPdZIIfi2';
  const password = 'Admin123!';
  const result = await bcrypt.compare(password, hash);
  console.log('Match:', result);
}

test();
