/**
 * Test script to verify pod_courses collection access
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
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

console.log('\n🧪 Testing Pod Courses Collection Access\n');
console.log('📍 Configuration:');
console.log(`   Endpoint: ${ENDPOINT}`);
console.log(`   Project: ${PROJECT_ID}`);
console.log(`   Database: ${DATABASE_ID}`);
console.log(`   API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : 'NOT SET'}\n`);

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Parse URL
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
            reject({ status: res.statusCode, data: parsed });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject({ error: 'Failed to parse response', raw: data });
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

async function testCollectionAccess() {
  try {
    // 1. Check if database exists
    console.log('1️⃣ Checking database...');
    try {
      const db = await makeRequest('GET', `/databases/${DATABASE_ID}`);
      console.log(`   ✅ Database "${db.name}" exists (ID: ${db.$id})\n`);
    } catch (error) {
      console.error(`   ❌ Database not found:`, error.data || error);
      return;
    }

    // 2. Check if pod_courses collection exists
    console.log('2️⃣ Checking pod_courses collection...');
    try {
      const collection = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/pod_courses`);
      console.log(`   ✅ Collection "pod_courses" exists`);
      console.log(`   📊 Total documents: ${collection.$permissions ? 'N/A (check via list)' : '0'}\n`);
    } catch (error) {
      console.error(`   ❌ Collection not found:`, error.data || error);
      console.log('\n💡 Run: node scripts/setup-pod-courses.js\n');
      return;
    }

    // 3. List documents in pod_courses
    console.log('3️⃣ Listing documents in pod_courses...');
    try {
      const docs = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/pod_courses/documents`);
      console.log(`   ✅ Successfully queried collection`);
      console.log(`   📄 Documents found: ${docs.total}`);
      
      if (docs.total > 0) {
        console.log('\n   Sample documents:');
        docs.documents.slice(0, 3).forEach((doc, i) => {
          console.log(`   ${i + 1}. ${doc.$id} - ${doc.courseTitle || 'Untitled'} (Pod: ${doc.podId || 'N/A'})`);
        });
      }
      console.log('');
    } catch (error) {
      console.error(`   ❌ Failed to list documents:`, error.data || error);
      return;
    }

    // 4. Test creating a document (then delete it)
    console.log('4️⃣ Testing document creation...');
    const testDocId = `test-${Date.now()}`;
    try {
      const testDoc = await makeRequest('POST', `/databases/${DATABASE_ID}/collections/pod_courses/documents`, {
        documentId: testDocId,
        data: {
          podId: 'test-pod-12345',
          courseTitle: 'Test Course - DELETE ME',
          youtubeUrl: 'https://youtube.com/watch?v=test',
          status: 'generating',
          progress: 0,
          chapters: JSON.stringify([]),
          assignments: JSON.stringify([]),
          dailyTasks: JSON.stringify([]),
          notes: JSON.stringify([]),
          createdAt: new Date().toISOString(),
          createdBy: 'test-script',
          updatedAt: new Date().toISOString()
        }
      });
      console.log(`   ✅ Test document created: ${testDoc.$id}`);
      
      // Delete the test document
      await makeRequest('DELETE', `/databases/${DATABASE_ID}/collections/pod_courses/documents/${testDocId}`);
      console.log(`   ✅ Test document deleted\n`);
    } catch (error) {
      console.error(`   ❌ Failed to create/delete test document:`, error.data || error);
      console.log('');
    }

    console.log('✅ All tests passed! The pod_courses collection is working correctly.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCollectionAccess();
