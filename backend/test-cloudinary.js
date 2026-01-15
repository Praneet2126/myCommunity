require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('=================================================');
console.log('   🧪 CLOUDINARY CONFIGURATION TEST');
console.log('=================================================\n');

// Check if environment variables are set
console.log('📋 Checking Environment Variables:\n');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName) {
  console.log('❌ CLOUDINARY_CLOUD_NAME: NOT SET');
} else {
  console.log('✅ CLOUDINARY_CLOUD_NAME:', cloudName);
}

if (!apiKey) {
  console.log('❌ CLOUDINARY_API_KEY: NOT SET');
} else {
  console.log('✅ CLOUDINARY_API_KEY: ***' + apiKey.slice(-4));
}

if (!apiSecret) {
  console.log('❌ CLOUDINARY_API_SECRET: NOT SET');
} else {
  console.log('✅ CLOUDINARY_API_SECRET: ***' + apiSecret.slice(-4));
}

console.log('\n-------------------------------------------------\n');

// If any credential is missing, exit
if (!cloudName || !apiKey || !apiSecret) {
  console.log('❌ ERROR: Missing Cloudinary credentials!');
  console.log('\n📝 Please add them to your .env file:');
  console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
  console.log('   CLOUDINARY_API_KEY=your-api-key');
  console.log('   CLOUDINARY_API_SECRET=your-api-secret');
  console.log('\n💡 Get credentials from: https://cloudinary.com/console\n');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('🔄 Testing Cloudinary API Connection...\n');

// Test API connection using ping
cloudinary.api.ping()
  .then(result => {
    console.log('=================================================');
    console.log('   ✅ SUCCESS! CLOUDINARY IS WORKING!');
    console.log('=================================================\n');
    console.log('API Response:', result);
    console.log('\n📊 Your Cloudinary Setup:');
    console.log('   Cloud Name:', cloudName);
    console.log('   Status: Active and Connected');
    console.log('   Upload URL: https://api.cloudinary.com/v1_1/' + cloudName + '/image/upload');
    console.log('\n🎉 You can now upload images to Cloudinary!');
    console.log('\n📁 Images will be stored in: myCommunity/profile-photos');
    console.log('🌐 View your media: https://cloudinary.com/console/media_library\n');
    console.log('=================================================\n');
  })
  .catch(error => {
    console.log('=================================================');
    console.log('   ❌ ERROR! CLOUDINARY CONNECTION FAILED');
    console.log('=================================================\n');
    console.log('Error Message:', error.message);
    console.log('\n🔧 Possible Issues:');
    console.log('   1. Invalid credentials (check Cloud Name, API Key, API Secret)');
    console.log('   2. Network connection issues');
    console.log('   3. Cloudinary account not active');
    console.log('   4. Credentials have spaces or special characters');
    console.log('\n💡 Solutions:');
    console.log('   • Verify credentials at: https://cloudinary.com/console');
    console.log('   • Check for typos in .env file');
    console.log('   • Ensure no extra spaces in .env values');
    console.log('   • Test internet connection');
    console.log('   • Restart the server after .env changes\n');
    console.log('=================================================\n');
    process.exit(1);
  });
