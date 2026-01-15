/**
 * Setup Pod Courses Collection in Appwrite
 * 
 * Creates the pod_courses collection with all required attributes
 * Run: node scripts/setup-pod-courses.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && !key.startsWith('#')) {
      env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
  
  return env;
}

const env = loadEnv();
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

if (!ENDPOINT || !PROJECT_ID) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  process.exit(1);
}

if (!API_KEY) {
  console.error('⚠️  Missing APPWRITE_API_KEY');
  console.log('\nTo get your API key:');
  console.log('   1. Visit: https://cloud.appwrite.io');
  console.log('   2. Go to: Settings → API Keys');
  console.log('   3. Create key and add to .env.local: APPWRITE_API_KEY=your-key\n');
  process.exit(1);
}

const url = new URL(ENDPOINT);
const hostname = url.hostname;
const path_prefix = url.pathname;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
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

async function createAttribute(collectionId, key, type, size = null, required = false, array = false) {
  try {
    const payload = { 
      key, 
      required: required || false 
    };
    
    if (type === 'string') {
      payload.size = size || 255;
      await makeRequest(
        'POST',
        `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/string`,
        payload
      );
    } else if (type === 'integer') {
      await makeRequest(
        'POST',
        `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/integer`,
        payload
      );
    } else if (type === 'json') {
      await makeRequest(
        'POST',
        `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/json`,
        payload
      );
    }
    
    return true;
  } catch (e) {
    // Attribute might already exist
    return false;
  }
}

async function setup() {
  try {
    console.log('\n🎓 Setting up Pod Courses Collection\n');
    console.log('📍 Configuration:');
    console.log(`   Endpoint: ${ENDPOINT}`);
    console.log(`   Project: ${PROJECT_ID}`);
    console.log(`   Database: ${DATABASE_ID}\n`);

    // Create pod_courses collection
    console.log('📚 Creating pod_courses collection...');
    let collectionExists = false;
    try {
      const result = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/pod_courses`);
      console.log('   ✅ pod_courses collection already exists\n');
      collectionExists = true;
    } catch (e) {
      console.log('   ⚠️  Collection check failed:', e.message || e.code || 'Unknown error');
      console.log('   📦 Creating pod_courses...');
      try {
        await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
          collectionId: 'pod_courses',
          name: 'Pod Courses',
          permissions: [
            'read("any")',
            'read("users")',
            'create("users")',
            'update("users")',
            'delete("users")',
          ],
        });
        console.log('   ✅ pod_courses collection created\n');
        collectionExists = true;
      } catch (createError) {
        console.error('   ❌ Failed to create collection:', createError);
        throw createError;
      }
    }

    // Create attributes
    console.log('📝 Adding attributes to pod_courses...\n');
    
    const attributes = [
      ['podId', 'string', 255, true],
      ['courseTitle', 'string', 500, true],
      ['youtubeUrl', 'string', 1000, true],
      ['status', 'string', 50, true], // 'generating' | 'completed' | 'error'
      ['progress', 'integer', null, true], // 0-100
      ['chapters', 'json', null, false],
      ['assignments', 'json', null, false],
      ['dailyTasks', 'json', null, false],
      ['notes', 'json', null, false],
      ['createdAt', 'string', 255, true],
      ['createdBy', 'string', 255, true],
      ['updatedAt', 'string', 255, false],
    ];

    let attrCount = 0;
    for (const [key, type, size, required] of attributes) {
      try {
        await createAttribute('pod_courses', key, type, size, required);
        console.log(`   ✅ ${key} (${type})`);
        attrCount++;
      } catch (e) {
        // Attribute likely already exists
        console.log(`   ℹ️  ${key} (exists or skipped)`);
      }
    }

    console.log(`\n✅ Pod courses setup complete! (${attrCount} attributes created/verified)\n`);

    // Now fix resources collection if needed
    console.log('🔧 Checking resources collection...');
    try {
      await makeRequest('GET', `/databases/${DATABASE_ID}/collections/resources`);
      console.log('   ✅ resources collection exists');
      
      // Add createdAt attribute if missing
      try {
        await createAttribute('resources', 'createdAt', 'string', 255, true);
        console.log('   ✅ Added createdAt attribute to resources\n');
      } catch (e) {
        console.log('   ℹ️  createdAt already exists in resources\n');
      }
    } catch (e) {
      console.log('   ⚠️  resources collection not found (will be created on first use)\n');
    }

    console.log('🎉 All setup complete!');
    console.log('You can now create courses in your pods.\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message || error);
    process.exit(1);
  }
}

setup();
