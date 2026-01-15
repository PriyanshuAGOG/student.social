/**
 * Verify pod_courses collection attributes
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
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(parsed);
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject({ error: 'Parse failed', raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function verifyAttributes() {
  try {
    console.log('\n🔍 Verifying pod_courses collection attributes\n');
    
    // Get collection details
    const collection = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/pod_courses`);
    console.log(`Collection: ${collection.name} (ID: ${collection.$id})`);
    console.log(`Total attributes: ${collection.attributes ? collection.attributes.length : 0}\n`);
    
    if (!collection.attributes || collection.attributes.length === 0) {
      console.log('❌ No attributes found! Run: node scripts/setup-pod-courses.js\n');
      return;
    }

    console.log('📋 Attributes:\n');
    collection.attributes.forEach((attr, i) => {
      console.log(`${i + 1}. ${attr.key}`);
      console.log(`   Type: ${attr.type}`);
      console.log(`   Required: ${attr.required}`);
      if (attr.size) console.log(`   Size: ${attr.size}`);
      if (attr.array) console.log(`   Array: true`);
      console.log('');
    });

    // Check for required attributes
    const expectedAttributes = [
      'podId', 'courseTitle', 'youtubeUrl', 'status', 'progress',
      'chapters', 'assignments', 'dailyTasks', 'notes',
      'createdAt', 'createdBy', 'updatedAt'
    ];

    const existingKeys = collection.attributes.map(a => a.key);
    const missingAttributes = expectedAttributes.filter(key => !existingKeys.includes(key));

    if (missingAttributes.length > 0) {
      console.log('❌ Missing attributes:', missingAttributes.join(', '));
      console.log('\n💡 Run: node scripts/setup-pod-courses.js\n');
    } else {
      console.log('✅ All expected attributes are present!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

verifyAttributes();
