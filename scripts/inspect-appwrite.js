const { Client, Account } = require('appwrite');

console.log('Client:', typeof Client);
try {
  const client = new Client();
  const account = new Account(client);
  console.log('Account prototype methods:');
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(account)).sort());
} catch (e) {
  console.error('Error creating account:', e.message);
  console.error(e);
}
