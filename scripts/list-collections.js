/**
 * List all collections in the database
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) envVars[key.trim()] = value.trim();
    }
  });
  return envVars;
}

const env = loadEnv();
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

const url = new URL(ENDPOINT);
const hostname = url.hostname;
const path_prefix = url.pathname;

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path: path_prefix + path,
      method,
      headers: {
        'X-Appwrite-Key': API_KEY,
        'X-Appwrite-Project': PROJECT_ID,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject({ error: 'Parse failed', raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function listCollections() {
  try {
    console.log('\n📋 Listing all collections in database:', DATABASE_ID, '\n');
    const result = await makeRequest('GET', `/databases/${DATABASE_ID}/collections`);
    
    if (result.total === 0) {
      console.log('❌ No collections found in database!\n');
      return;
    }
    
    console.log(`✅ Found ${result.total} collections:\n`);
    result.collections.forEach((col, i) => {
      console.log(`${i + 1}. ${col.name} (ID: ${col.$id})`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

listCollections();
