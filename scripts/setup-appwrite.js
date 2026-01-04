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
      ['avatarFileId', 'string', 255, false],
      ['location', 'string', 255, false],
      ['website', 'string', 500, false],
      ['interests', 'array-string', 255, false], // Array of strings
      ['identity', 'string', 100, false], // Learning identity
      ['vibes', 'array-string', 100, false], // Array of learning vibes
      ['joinedAt', 'string', 255, true],
      ['updatedAt', 'string', 255, false],
      ['isOnline', 'boolean', null, false],
      ['lastSeen', 'string', 255, false],
      ['studyStreak', 'integer', null, false],
      ['totalPoints', 'integer', null, false],
      ['totalHours', 'integer', null, false],
      ['podsJoined', 'integer', null, false],
      ['resourcesShared', 'integer', null, false],
      ['postsCreated', 'integer', null, false],
      ['helpfulVotes', 'integer', null, false],
      ['followers', 'integer', null, false],
      ['following', 'integer', null, false],
      ['level', 'integer', null, false],
      ['badges', 'array-string', 255, false], // Array of strings
      // Matching + learning preferences
      ['learningGoals', 'array-string', 255, false], // Array of strings
      ['learningPace', 'string', 50, false],
      ['preferredSessionTypes', 'array-string', 100, false], // Array of strings
      ['availability', 'array-string', 100, false], // Array of strings
      ['currentFocusAreas', 'array-string', 255, false], // Array of strings
      // Settings (stored as JSON strings)
      ['privacySettings', 'string', 2000, false], // JSON object for privacy settings
      ['notificationSettings', 'string', 2000, false], // JSON object for notification settings
      ['appearanceSettings', 'string', 2000, false], // JSON object for appearance settings
      ['securitySettings', 'string', 2000, false], // JSON object for security settings
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
      ['updatedAt', 'string', 255, false],
      ['likes', 'integer', null, false],
      ['comments', 'integer', null, false],
      ['shares', 'integer', null, false],
      ['imageUrl', 'string', 500, false],
      ['visibility', 'string', 50, false],
      ['tags', 'array-string', 100, false], // Array of strings
      ['likedBy', 'array-string', 255, false], // Array of user IDs
      ['savedBy', 'array-string', 255, false], // Array of user IDs who bookmarked this post
      ['authorName', 'string', 255, false], // Denormalized author name for display
      ['authorAvatar', 'string', 500, false], // Denormalized author avatar for display
      ['authorUsername', 'string', 255, false], // Denormalized author username for display
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
      ['reactions', 'string', 2000, false], // JSON string for reactions object
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
      ['members', 'array-string', 255, true], // Array of user IDs
      ['subject', 'string', 100, false],
      ['difficulty', 'string', 50, false],
      ['isActive', 'boolean', null, false],
      ['isPublic', 'boolean', null, false],
      ['createdAt', 'string', 255, true],
      ['updatedAt', 'string', 255, false],
      ['memberCount', 'integer', null, false],
      // Matching metadata
      ['idealLearnerType', 'array-string', 100, false], // Array of strings
      ['sessionType', 'array-string', 100, false], // Array of strings
      ['averageSessionLength', 'integer', null, false],
      ['commonAvailability', 'array-string', 100, false], // Array of strings
      ['matchingTags', 'array-string', 100, false], // Array of strings
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
      ['tags', 'array-string', 100, false],
      ['podId', 'string', 255, false],
      ['podName', 'string', 255, false],
      ['visibility', 'string', 50, false],
      ['category', 'string', 100, false],
      ['downloads', 'integer', null, false],
      ['likes', 'integer', null, false],
      ['views', 'integer', null, false],
      ['isApproved', 'boolean', null, false],
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
      ['readAt', 'string', 255, false],
      ['actionUrl', 'string', 500, false],
      ['actionText', 'string', 255, false],
      ['imageUrl', 'string', 500, false],
      ['podId', 'string', 255, false],
      ['podName', 'string', 255, false],
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
      ['participants', 'array-string', 255, false], // Array of user IDs for direct chats
      ['createdAt', 'string', 255, true],
      ['isActive', 'boolean', null, false],
      ['lastMessage', 'string', 500, false],
      ['lastMessageTime', 'string', 255, false],
    ],
  },
  {
    id: 'comments',
    name: 'Post Comments',
    attrs: [
      ['postId', 'string', 255, true], // Post this comment belongs to
      ['authorId', 'string', 255, true], // User who wrote the comment
      ['content', 'string', 2000, true], // Comment text content
      ['timestamp', 'string', 255, true], // When the comment was created
      ['likes', 'integer', null, false], // Number of likes on this comment
      ['likedBy', 'array-string', 255, false], // Array of user IDs who liked
      ['replyTo', 'string', 255, false], // Parent comment ID for replies (null for top-level)
      ['authorName', 'string', 255, false], // Denormalized author name
      ['authorAvatar', 'string', 500, false], // Denormalized author avatar URL
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
      let collectionExists = false;
      try {
        await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col.id}`);
        console.log(`   ✅ ${col.id} (exists)`);
        collectionExists = true;
      } catch {
        console.log(`   📦 Creating ${col.id}...`);
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
      }

      // Create attributes (even for existing collections to add missing ones)
      let attrCount = 0;
      for (const [key, type, size, required] of col.attrs) {
        try {
          const payload = { key, required: required || false };
          
          if (type === 'string') {
            payload.size = size || 255;
            await makeRequest(
              'POST',
              `/databases/${DATABASE_ID}/collections/${col.id}/attributes/string`,
              payload
            );
            attrCount++;
          } else if (type === 'array-string') {
            // Create string array attribute
            payload.size = size || 255;
            await makeRequest(
              'POST',
              `/databases/${DATABASE_ID}/collections/${col.id}/attributes/string`,
              { ...payload, array: true }
            );
            attrCount++;
          } else if (type === 'integer') {
            await makeRequest(
              'POST',
              `/databases/${DATABASE_ID}/collections/${col.id}/attributes/integer`,
              payload
            );
            attrCount++;
          } else if (type === 'boolean') {
            payload.default = false;
            await makeRequest(
              'POST',
              `/databases/${DATABASE_ID}/collections/${col.id}/attributes/boolean`,
              payload
            );
            attrCount++;
          }
        } catch (e) {
          // Ignore if attribute already exists
          if (e?.data?.message && !e.data.message.includes('already exists')) {
            console.log(`      ⚠️  ${key}: ${e?.data?.message || 'error'}`);
          }
        }
      }
      
      if (!collectionExists) {
        console.log(`   ✅ ${col.id} (${attrCount} attributes)`);
      }

      // Update collection permissions if needed
      try {
        await makeRequest('PUT', `/databases/${DATABASE_ID}/collections/${col.id}`, {
          name: col.name,
          permissions: [
            'read("users")',
            'create("users")',
            'update("users")',
            'delete("users")',
          ],
        });
      } catch (e) {
        // Ignore permission update errors
      }
    }

    // Create storage buckets
    console.log('\n📦 Creating storage buckets...\n');
    for (const bucket of buckets) {
      try {
        await makeRequest('GET', `/storage/buckets/${bucket.id}`);
        console.log(`   ✅ ${bucket.id} (exists)`);
        // Update bucket permissions
        try {
          await makeRequest('PUT', `/storage/buckets/${bucket.id}`, {
            name: bucket.name,
            permissions: [
              'read("users")',
              'create("users")',
              'update("users")',
              'delete("users")',
            ],
            fileSecurity: true,
            maximumFileSize: 10485760, // 10MB
          });
        } catch (e) {
          // Ignore permission update errors
        }
      } catch {
        console.log(`   📦 Creating ${bucket.id}...`);
        await makeRequest('POST', '/storage/buckets', {
          bucketId: bucket.id,
          name: bucket.name,
          permissions: [
            'read("users")',
            'create("users")',
            'update("users")',
            'delete("users")',
          ],
          fileSecurity: true,
          maximumFileSize: 10485760, // 10MB
        });
        console.log(`   ✅ ${bucket.id}`);
      }
    }

    console.log('\n🎉 Setup completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Add your domain to Appwrite Platforms (Settings → Platforms)');
    console.log('   2. Run: pnpm dev');
    console.log('   3. Open http://localhost:3000\n');
    console.log('⚠️  IMPORTANT: Add these hostnames to Appwrite Platforms:');
    console.log('   - localhost');
    console.log('   - your-app.vercel.app');
    console.log('   - *.vercel.app (for preview deployments)\n');
  } catch (error) {
    console.error('\n❌ Setup failed:');
    console.error('Error:', error.message || error.data || error);
    process.exit(1);
  }
}

setup();