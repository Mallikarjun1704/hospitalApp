const { v4: uuidv4 } = require('uuid');

const generateSecret = () => {
  return uuidv4() + uuidv4();
};

console.log('ACCESS_TOKEN_SECRET:', generateSecret());
console.log('REFRESH_TOKEN_SECRET:', generateSecret());

//node generateSecrets.js 
/** The ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET values are static and should not be regenerated for each API call. These secrets are used to sign and verify the tokens, ensuring their integrity and authenticity.*/