#!/usr/bin/env node

/**
 * Environment Variables Test Script
 * 
 * This script tests if the required environment variables are loaded correctly.
 * Usage: node scripts/test-env.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Test');
console.log('==============================\n');

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const optionalVars = [
  'EMAIL_APP_PASSWORD',
  'EMAIL_SENDER',
  'PAYSTACK_SECRET_KEY',
  'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

console.log('📋 Required Variables:');
let allRequiredPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allRequiredPresent = false;
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (optional)`);
  }
});

console.log('\n📊 Summary:');
if (allRequiredPresent) {
  console.log('✅ All required environment variables are set!');
  console.log('✅ You can now run: npm run register-admin');
} else {
  console.log('❌ Some required environment variables are missing.');
  console.log('❌ Please check your .env.local file.');
}

console.log('\n🔧 To run the admin registration script:');
console.log('npm run register-admin'); 