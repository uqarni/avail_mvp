// This file is used to generate valid Stream Chat tokens
// Run this with Node.js to get valid tokens

const { StreamChat } = require('stream-chat');

// Use the exact credentials provided
const API_KEY = 'hac3qkhvfctc';
const API_SECRET = 'dyu77rcnefbyg4ep3r772s3rk9jhj7bbuycvngnaj9yzf222bqtqzvgex8fp5zda';

// Initialize the server-side client
const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);

// Generate tokens for our users
const johnToken = serverClient.createToken('john');
const gepetoToken = serverClient.createToken('gepeto');

console.log('Token for john:', johnToken);
console.log('Token for gepeto:', gepetoToken);

// Output in a format ready to copy into our code
console.log('\nCopy this to your code:\n');
console.log(`const USER_TOKENS = {
  'john': '${johnToken}',
  'gepeto': '${gepetoToken}'
};`); 