/**
 * Pod Video Meetings & Whiteboard Schema Setup
 * 
 * Adds collections for video meeting state and whiteboard persistence
 * Completes PHASE 2.2 and 2.3 backend support
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
const API_KEY = env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Parse URL
function parseUrl(url) {
  const urlObj = new URL(url);
  return {
    hostname: urlObj.hostname,
    port: urlObj.port || 443,
    path: urlObj.pathname,
  };
}

// Make HTTP request
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = parseUrl(ENDPOINT);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: `/v1${path}`,
      method,
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
          if (res.statusCode >= 400 && res.statusCode < 500) {
            reject(parsed);
          } else {
            resolve(parsed);
          }
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// New collections for video meetings and whiteboard
const newCollections = [
  {
    id: 'pod_meetings',
    name: 'Pod Meetings',
    attrs: [
      ['podId', 'string', 255, true],
      ['meetingId', 'string', 255, true], // Jitsi room name
      ['title', 'string', 255, true],
      ['creatorId', 'string', 255, true],
      ['startTime', 'string', 255, true],
      ['endTime', 'string', 255, false],
      ['duration', 'integer', null, false], // in seconds
      ['isActive', 'boolean', null, true],
      ['status', 'string', 50, false], // 'pending', 'active', 'ended', 'cancelled'
      ['maxParticipants', 'integer', null, false],
      ['currentParticipants', 'integer', null, false],
      ['participantIds', 'array-string', 255, false], // Array of user IDs who attended
      ['recordingUrl', 'string', 500, false],
      ['jitsiDomain', 'string', 255, false], // e.g., 'meet.jit.si'
      ['features', 'array-string', 100, false], // e.g., ['recording', 'screenshare', 'chat']
      ['notes', 'string', 5000, false], // Session summary/notes
      ['tags', 'array-string', 100, false], // Topics covered
      ['createdAt', 'string', 255, true],
      ['updatedAt', 'string', 255, false],
    ],
  },
  {
    id: 'pod_whiteboards',
    name: 'Pod Whiteboards',
    attrs: [
      ['podId', 'string', 255, true],
      ['meetingId', 'string', 255, true], // Associated meeting
      ['creatorId', 'string', 255, true],
      ['state', 'string', 50000, false], // Canvas JSON data (base64 encoded)
      ['title', 'string', 255, false],
      ['description', 'string', 1000, false],
      ['isShared', 'boolean', null, false],
      ['lastModifiedBy', 'string', 255, false],
      ['lastModifiedAt', 'string', 255, false],
      ['version', 'integer', null, false], // Version control for collaborative editing
      ['exportUrl', 'string', 500, false], // URL to exported PNG/SVG
      ['collaborators', 'array-string', 255, false], // User IDs who edited this
      ['isArchived', 'boolean', null, false],
      ['createdAt', 'string', 255, true],
      ['updatedAt', 'string', 255, false],
    ],
  },
  {
    id: 'pod_meeting_participants',
    name: 'Pod Meeting Participants',
    attrs: [
      ['meetingId', 'string', 255, true],
      ['podId', 'string', 255, true],
      ['userId', 'string', 255, true],
      ['joinedAt', 'string', 255, true],
      ['leftAt', 'string', 255, false],
      ['duration', 'integer', null, false], // in seconds
      ['cameraOn', 'boolean', null, false],
      ['microphoneOn', 'boolean', null, false],
      ['screenShareDuration', 'integer', null, false], // in seconds
      ['status', 'string', 50, false], // 'active', 'disconnected', 'reconnecting'
      ['notes', 'string', 2000, false], // Personal notes from this user
    ],
  },
];

async function setup() {
  try {
    console.log('\n🎓 Pod Video & Whiteboard Schema Setup\n');
    console.log('📍 Appwrite Endpoint:', ENDPOINT);
    console.log('📍 Database:', DATABASE_ID);

    // Create collections
    console.log('\n📚 Creating new collections...\n');
    for (const col of newCollections) {
      try {
        await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col.id}`);
        console.log(`   ✅ ${col.id} (exists)`);
      } catch {
        console.log(`   📚 Creating ${col.id}...`);
        try {
          await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
            collectionId: col.id,
            name: col.name,
            permissions: [
              'read("users")',
              'create("users")',
              'update("users")',
              'delete("users")',
            ],
          });

          // Add attributes
          let attrCount = 0;
          for (const [attrName, type, size, required] of col.attrs) {
            try {
              if (type === 'array-string') {
                await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${col.id}/attributes/string-set`, {
                  key: attrName,
                  required: required || false,
                  size: size || 255,
                });
              } else if (type === 'boolean') {
                await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${col.id}/attributes/boolean`, {
                  key: attrName,
                  required: required || false,
                });
              } else if (type === 'integer') {
                await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${col.id}/attributes/integer`, {
                  key: attrName,
                  required: required || false,
                });
              } else {
                // string or large string
                await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${col.id}/attributes/string`, {
                  key: attrName,
                  required: required || false,
                  size: size || 255,
                });
              }
              attrCount++;
            } catch (e) {
              if (e?.data?.message && !e.data.message.includes('already exists')) {
                console.log(`      ⚠️  ${attrName}: ${e?.data?.message || 'error'}`);
              }
            }
          }

          console.log(`   ✅ ${col.id} (${attrCount} attributes)`);
        } catch (e) {
          console.error(`   ❌ Failed to create ${col.id}:`, e?.data?.message || e);
        }
      }
    }

    console.log('\n🎉 Pod Video & Whiteboard setup completed!\n');
    console.log('✅ New collections created:');
    console.log('   • pod_meetings - Track active and past video sessions');
    console.log('   • pod_whiteboards - Store whiteboard states and exports');
    console.log('   • pod_meeting_participants - Track attendance and engagement\n');
    console.log('🔗 Ready for PHASE 2.2 (Video) and PHASE 2.3 (Whiteboard)!\n');
  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error('Error:', error.message || error.data || error);
    process.exit(1);
  }
}

setup();
