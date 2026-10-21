import bcrypt from 'bcryptjs';

const hashPassword = async () => {
  const plainPassword = process.argv[2];

  if (!plainPassword) {
    console.error('Usage: node src/scripts/hashPassword.js <plain_password>');
    console.error('Example: node src/scripts/hashPassword.js myStrongStaffPassword123!');
    console.error('\nNote: The plain password will not be stored. Paste the generated hash into server/.env as ADMIN_PASSWORD_HASH.');
    process.exit(1);
  }

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(plainPassword, salt);

    console.log('\n======================================================');
    console.log('FoundIt Staff Password Hash Generated:');
    console.log('======================================================');
    console.log(hash);
    console.log('======================================================');
    console.log('\nCopy the line below into your server/.env file:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  } catch (error) {
    console.error('Failed to hash password:', error.message);
    process.exit(1);
  }
};

hashPassword();
