const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

console.log('🔑 Generating RSA 2048-bit Key Pair...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
    },
});

// Base64 Encode to avoid multi-line issues in .env
const privateKeyBase64 = Buffer.from(privateKey).toString('base64');
const publicKeyBase64 = Buffer.from(publicKey).toString('base64');

let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

// Helper to update or append env var
const updateEnv = (key, value) => {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
        envContent += `\n${key}="${value}"`;
    }
};

updateEnv('JWT_PRIVATE_KEY', privateKeyBase64);
updateEnv('JWT_PUBLIC_KEY', publicKeyBase64);

// Ensure default variables exist if not present
if (!envContent.includes('APP_ID=')) {
    updateEnv('APP_ID', 'my-auth-app');
}
if (!envContent.includes('ISSUER=')) {
    updateEnv('ISSUER', 'http://localhost:3000');
}
if (!envContent.includes('JWT_RT_SECRET=')) {
    updateEnv('JWT_RT_SECRET', crypto.randomBytes(32).toString('hex'));
}

fs.writeFileSync(envPath, envContent.trim() + '\n');

console.log('✅ Keys generated and saved to .env!');
console.log('🔒 Private Key saved as Base64');
console.log('🌍 Public Key saved as Base64');
