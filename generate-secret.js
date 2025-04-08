// generate-secret.js
const crypto = require('crypto');

// Generate a random 64-byte secret key and convert it to a hexadecimal string
const secret = crypto.randomBytes(64).toString('hex');

console.log('Your new JWT Secret is:', secret);
