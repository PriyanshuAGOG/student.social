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

if (!ENDPOINT || !PROJECT_ID) {
  console.error('❌ Missing required environment variables in .env.local');
  console.error('Required: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  process.exit(1);
}

if (!API_KEY) {
  console.error('⚠️  Missing APPWRITE_API_KEY in .env.local');
  console.log('\n📍 To get your API key:');
  console.log('   1. Visit: https://cloud.appwrite.io');
  console.log('   2. Go to: Settings → API Keys');
  console.log('   3. Create a new API Key with all scopes');
  console.log('   4. Add to .env.local: APPWRITE_API_KEY=your-key-here\n');
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
          reject({ status: res.statusCode, data });
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

const collections = [
  {
    id: 'profiles',
    name: 'User Profiles',
    attrs: [
      ['userId', 'string', 255, true],
      ['name', 'string', 255, true],
      ['email', 'string', 255, true],
      ['bio', 'string', 1000, false],
      ['avatar', 'string', 500, false],
      ['interests', 'string', 2000, false],
      ['joinedAt', 'string', 255, true],
      ['isOnline', 'boolean', null, false],
      ['lastSeen', 'string', 255, false],
      ['studyStreak', 'integer', null, false],
      ['totalPoints', 'integer', null, false],
      ['level', 'integer', null, false],
      ['badges', 'string', 2000, false],
      // Matching + learning preferences
      ['learningGoals', 'string', 2000, false],
      ['learningPace', 'string', 50, false],
      ['preferredSessionTypes', 'string', 500, false],
      ['availability', 'string', 500, false],
      ['currentFocusAreas', 'string', 2000, false],
    ],
  },
  {
    id: 'posts',
    name: 'Posts',
    attrs: [
      ['authorId', 'string', 255, true],
      ['content', 'string', 5000, true],
      ['type', 'string', 50, true],
      ['podId', 'string', 255, false],
      ['timestamp', 'string', 255, true],
      ['likes', 'integer', null, false],
      ['comments', 'integer', null, false],
      ['imageUrl', 'string', 500, false],
      ['visibility', 'string', 50, false],
      ['tags', 'string', 1000, false],
      ['likedBy', 'string', 5000, false],
    ],
  },
  {
    id: 'messages',
    name: 'Messages',
    attrs: [
      ['roomId', 'string', 255, true],
      ['authorId', 'string', 255, true],
      ['content', 'string', 5000, true],
      ['type', 'string', 50, true],
      ['timestamp', 'string', 255, true],
      ['isEdited', 'boolean', null, false],
      ['replyTo', 'string', 255, false],
      ['fileUrl', 'string', 500, false],
      ['reactions', 'string', 2000, false],
    ],
  },
  {
    id: 'pods',
    name: 'Study Pods',
    attrs: [
      ['teamId', 'string', 255, true],
      ['name', 'string', 255, true],
      ['description', 'string', 2000, true],
      ['creatorId', 'string', 255, true],
      ['members', 'string', 5000, true],
      ['subject', 'string', 100, false],
      ['difficulty', 'string', 50, false],
      ['isActive', 'boolean', null, false],
      ['isPublic', 'boolean', null, false],
      ['createdAt', 'string', 255, true],
      ['memberCount', 'integer', null, false],
      // Matching metadata
      ['idealLearnerType', 'string', 500, false],
      ['sessionType', 'string', 500, false],
      ['averageSessionLength', 'integer', null, false],
      ['commonAvailability', 'string', 500, false],
      ['matchingTags', 'string', 2000, false],
    ],
  },
  {
    id: 'resources',
    name: 'Resources',
    attrs: [
      ['fileId', 'string', 255, true],
      ['fileName', 'string', 255, true],
      ['fileSize', 'integer', null, true],
      ['fileType', 'string', 100, true],
      ['fileUrl', 'string', 500, true],
      ['title', 'string', 255, true],
      ['authorId', 'string', 255, true],
      ['uploadedAt', 'string', 255, true],
      ['description', 'string', 2000, false],
      ['podId', 'string', 255, false],
      ['visibility', 'string', 50, false],
      ['downloads', 'integer', null, false],
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    attrs: [
      ['userId', 'string', 255, true],
      ['title', 'string', 255, true],
      ['message', 'string', 1000, true],
      ['type', 'string', 50, true],
      ['timestamp', 'string', 255, true],
      ['isRead', 'boolean', null, false],
      ['actionUrl', 'string', 500, false],
    ],
  },
  {
    id: 'calendar_events',
    name: 'Calendar Events',
    attrs: [
      ['userId', 'string', 255, true],
      ['title', 'string', 255, true],
      ['startTime', 'string', 255, true],
      ['endTime', 'string', 255, true],
      ['type', 'string', 50, false],
      ['podId', 'string', 255, false],
      ['createdAt', 'string', 255, true],
      ['isCompleted', 'boolean', null, false],
    ],
  },
  {
    id: 'chat_rooms',
    name: 'Chat Rooms',
    attrs: [
      ['type', 'string', 50, true],
      ['podId', 'string', 255, false],
      ['name', 'string', 255, false],
      ['createdAt', 'string', 255, true],
      ['isActive', 'boolean', null, false],
    ],
  },
];

const buckets = [
  { id: 'avatars', name: 'User Avatars' },
  { id: 'resources', name: 'Study Resources' },
  { id: 'attachments', name: 'Message Attachments' },
  { id: 'post_images', name: 'Post Images' },
];

async function setup() {
  try {
    console.log('\n🚀 Starting PeerSpark Appwrite Setup...\n');
    console.log('📍 Configuration:');
    console.log(`   Endpoint: ${ENDPOINT}`);
    console.log(`   Project: ${PROJECT_ID}`);
    console.log(`   Database: ${DATABASE_ID}\n`);

    // Create database
    try {
      await makeRequest('GET', `/databases/${DATABASE_ID}`);
      console.log('✅ Database already exists\n');
    } catch (e) {
      console.log('📦 Creating database...');
      await makeRequest('POST', '/databases', {
        databaseId: DATABASE_ID,
        name: 'PeerSpark Main Database',
      });
      console.log('✅ Database created\n');
    }

    // Create collections
    console.log('📋 Creating collections...\n');
    for (const col of collections) {
      try {
        await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col.id}`);
        console.log(`   ✅ ${col.id}`);
      } catch {
        console.log(`   📦 Creating ${col.id}...`);
        await makeRequest('POST', `/databases/${DATABASE_ID}/collections`, {
          collectionId: col.id,
          name: col.name,
        });

        let attrCount = 0;
        for (const [key, type, size, required] of col.attrs) {
          try {
            const payload = { key, required };
            if (type === 'string') {
              payload.size = size;
              await makeRequest(
                'POST',
                `/databases/${DATABASE_ID}/collections/${col.id}/attributes/string`,
                payload
              );
            } else if (type === 'integer') {
              await makeRequest(
                'POST',
                `/databases/${DATABASE_ID}/collections/${col.id}/attributes/integer`,
                payload
              );
            } else if (type === 'boolean') {
              await makeRequest(
                'POST',
                `/databases/${DATABASE_ID}/collections/${col.id}/attributes/boolean`,
                payload
              );
            }
            attrCount++;
          } catch (e) {
            // Ignore attribute exists error
          }
        }
        console.log(`   ✅ ${col.id} (${attrCount} attributes)`);
      }
    }

    // Create storage buckets
    console.log('\n📦 Creating storage buckets...\n');
    for (const bucket of buckets) {
      try {
        await makeRequest('GET', `/storage/buckets/${bucket.id}`);
        console.log(`   ✅ ${bucket.id}`);
      } catch {
        console.log(`   📦 Creating ${bucket.id}...`);
        await makeRequest('POST', '/storage/buckets', {
          bucketId: bucket.id,
          name: bucket.name,
        });
        console.log(`   ✅ ${bucket.id}`);
      }
    }

    console.log('\n🎉 Setup completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. pnpm dev');
    console.log('   2. Open http://localhost:3000\n');
  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error('Error:', error.message || error.data || error);
    process.exit(1);
  }
}

setup();