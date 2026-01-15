#!/usr/bin/env node
/**
 * Fix Appwrite Collection Schema Issues
 * 
 * Adds missing attributes to collections:
 * - posts: imageUrls
 * - pods: teamId
 * 
 * Usage: node scripts/fix-appwrite-schema-simple.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  }
});

const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

console.log('\n🔧 Appwrite Schema Fix\n');
console.log('Configuration:');
console.log(`  Endpoint: ${ENDPOINT}`);
console.log(`  Project: ${PROJECT_ID}`);
console.log(`  Database: ${DATABASE_ID}\n`);

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const https = require('https');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function addAttribute(collectionId, attributeKey, type = 'string', required = false) {
  const payload = {
    key: attributeKey,
    type: type,
    required: required,
    ...(type === 'string' && { size: 1000000 })
  };

  try {
    const result = await makeRequest(
      'POST',
      `/v1/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${type}`,
      payload
    );
    return result;
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  try {
    console.log('📋 Adding missing attributes...\n');

    // 1. Add imageUrls to posts
    console.log('1️⃣  Adding imageUrls to posts collection...');
    const result1 = await addAttribute('posts', 'imageUrls', 'string', false);
    if (result1.status === 201 || result1.data?.key === 'imageUrls') {
      console.log('   ✅ imageUrls added');
    } else if (result1.status === 400 && result1.data?.message?.includes('already exists')) {
      console.log('   ✅ imageUrls already exists');
    } else {
      console.log('   ℹ️ Response:', result1.status, result1.data?.message || result1.error);
    }

    // 2. Add teamId to pods
    console.log('\n2️⃣  Adding teamId to pods collection...');
    const result2 = await addAttribute('pods', 'teamId', 'string', false);
    if (result2.status === 201 || result2.data?.key === 'teamId') {
      console.log('   ✅ teamId added');
    } else if (result2.status === 400 && result2.data?.message?.includes('already exists')) {
      console.log('   ✅ teamId already exists');
    } else {
      console.log('   ℹ️ Response:', result2.status, result2.data?.message || result2.error);
    }

    console.log('\n✅ Schema attributes processed!\n');
    console.log('Note: If attributes already exist in Appwrite, you may see 400 errors.');
    console.log('This is expected and not an issue.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
