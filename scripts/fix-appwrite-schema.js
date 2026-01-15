#!/usr/bin/env node
/**
 * Fix Appwrite Collection Schema Issues
 * 
 * Adds missing attributes to collections:
 * - posts: imageUrls
 * - pods: teamId
 * - pod_study_sessions: status, notes, recordingUrl
 * 
 * Run: node scripts/fix-appwrite-schema.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });

  return envVars;
}

const env = loadEnv();
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

console.log('\n🔧 Fixing Appwrite Collection Schema\n');
console.log('📍 Configuration:');
console.log(`   Endpoint: ${ENDPOINT}`);
console.log(`   Project: ${PROJECT_ID}`);
console.log(`   Database: ${DATABASE_ID}\n`);

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const url = new URL(ENDPOINT);
const hostname = url.hostname;
const path_prefix = url.pathname;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path_prefix + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(parsed);
          } else {
            resolve(parsed);
          }
        } catch {
          if (res.statusCode >= 400) {
            reject({ error: data });
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function addAttribute(collectionId, key, type, size = null, required = false) {
  const payload = { 
    key, 
    required: required || false 
  };
  
  let endpoint = '';
  
  if (type === 'string') {
    payload.size = size || 255;
    endpoint = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/string`;
  } else if (type === 'integer') {
    endpoint = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/integer`;
  } else if (type === 'boolean') {
    endpoint = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/boolean`;
  } else if (type === 'json') {
    payload.size = 1000000; // 1MB
    endpoint = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/string`;
  }
  
  try {
    const result = await makeRequest('POST', endpoint, payload);
    return result;
  } catch (e) {
    throw e;
  }
}

async function fix() {
  try {
    console.log('📋 Fixing Collection Schemas...\n');

    // 1. Fix posts collection - add imageUrls
    console.log('1️⃣  Fixing posts collection...');
    try {
      await addAttribute('posts', 'imageUrls', 'json', null, false);
      console.log('   ✅ Added imageUrls (JSON)');
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log('   ✅ imageUrls already exists');
      } else {
        console.error('   ❌ Failed:', e.message || e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    // 2. Fix pods collection - add teamId as required
    console.log('\n2️⃣  Fixing pods collection...');
    try {
      await addAttribute('pods', 'teamId', 'string', 255, false);
      console.log('   ✅ Added teamId (string)');
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log('   ✅ teamId already exists');
      } else {
        console.error('   ❌ Failed:', e.message || e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    // 3. Fix pod_study_sessions collection
    console.log('\n3️⃣  Fixing pod_study_sessions collection...');
    
    try {
      await addAttribute('pod_study_sessions', 'status', 'string', 50, false);
      console.log('   ✅ Added status (string)');
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log('   ✅ status already exists');
      } else {
        console.error('   ❌ Failed:', e.message || e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      await addAttribute('pod_study_sessions', 'notes', 'json', null, false);
      console.log('   ✅ Added notes (JSON)');
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log('   ✅ notes already exists');
      } else {
        console.error('   ❌ Failed:', e.message || e);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      await addAttribute('pod_study_sessions', 'recordingUrl', 'string', 500, false);
      console.log('   ✅ Added recordingUrl (string)');
    } catch (e) {
      if (e.message && e.message.includes('already exists')) {
        console.log('   ✅ recordingUrl already exists');
      } else {
        console.error('   ❌ Failed:', e.message || e);
      }
    }

    console.log('\n✅ Schema fixes complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message || error);
    process.exit(1);
  }
}

fix();
