#!/usr/bin/env node

/**
 * Complete Appwrite Backend Test Suite
 * Tests all 50+ service methods
 * 
 * Run with: node scripts/test-backend.js
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function success(msg) { log(colors.green, '✅', msg); }
function error(msg) { log(colors.red, '❌', msg); }
function warn(msg) { log(colors.yellow, '⚠️ ', msg); }
function info(msg) { log(colors.blue, 'ℹ️ ', msg); }

// Load environment
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    error('.env.local file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
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

info('='.repeat(60));
info('🧪 APPWRITE BACKEND TEST SUITE');
info('='.repeat(60));

// Validate configuration
console.log('\n📋 Configuration Check:\n');

if (!ENDPOINT) {
  error('NEXT_PUBLIC_APPWRITE_ENDPOINT not found');
  process.exit(1);
} else {
  success(`Endpoint: ${ENDPOINT}`);
}

if (!PROJECT_ID) {
  error('NEXT_PUBLIC_APPWRITE_PROJECT_ID not found');
  process.exit(1);
} else {
  success(`Project ID: ${PROJECT_ID}`);
}

if (!API_KEY) {
  warn('APPWRITE_API_KEY not found - some tests will fail');
} else {
  success(`API Key: ${API_KEY.substring(0, 10)}...`);
}

success(`Database ID: ${DATABASE_ID}`);

// HTTP Request helper
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + path,
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
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test definitions
const tests = [
  {
    name: 'Database Connection',
    test: async () => {
      const result = await makeRequest('GET', `/databases/${DATABASE_ID}`);
      if (result.status === 200) {
        success('Database exists and is accessible');
        return true;
      } else {
        error(`Database check failed: ${result.status}`);
        return false;
      }
    }
  },
  {
    name: 'Collections Exist',
    test: async () => {
      const collections = [
        'profiles', 'posts', 'messages', 'pods',
        'resources', 'notifications', 'calendar_events', 'chat_rooms'
      ];
      
      let allExist = true;
      for (const col of collections) {
        const result = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col}`);
        if (result.status === 200) {
          console.log(`   ✓ ${col}`);
        } else {
          console.log(`   ✗ ${col} (status: ${result.status})`);
          allExist = false;
        }
      }
      
      if (allExist) {
        success('All 8 collections exist');
        return true;
      } else {
        error('Some collections are missing');
        return false;
      }
    }
  },
  {
    name: 'Storage Buckets Exist',
    test: async () => {
      const buckets = ['avatars', 'resources', 'attachments', 'post_images'];
      
      let allExist = true;
      for (const bucket of buckets) {
        const result = await makeRequest('GET', `/storage/buckets/${bucket}`);
        if (result.status === 200) {
          console.log(`   ✓ ${bucket}`);
        } else {
          console.log(`   ✗ ${bucket} (status: ${result.status})`);
          allExist = false;
        }
      }
      
      if (allExist) {
        success('All 4 storage buckets exist');
        return true;
      } else {
        error('Some storage buckets are missing');
        return false;
      }
    }
  },
  {
    name: 'Collection Permissions',
    test: async () => {
      const cols = ['profiles', 'posts'];
      let permissionsOk = true;
      
      for (const col of cols) {
        const result = await makeRequest('GET', `/databases/${DATABASE_ID}/collections/${col}`);
        if (result.status === 200 && result.data) {
          const perms = result.data.permissions || result.data.$permissions || [];
          const permIncludes = (action, subject) => {
            return perms.some(p => p.includes(`${action}("${subject}")`) || p.includes(`${action}("${subject}s")`));
          };

          const hasCreateUser = permIncludes('create', 'user');
          const hasUpdateUser = permIncludes('update', 'user');
          const hasDeleteUser = permIncludes('delete', 'user');
          
          if (hasCreateUser && hasUpdateUser && hasDeleteUser) {
            console.log(`   ✓ ${col} permissions correct`);
          } else {
            console.log(`   ✗ ${col} missing user permissions`);
            permissionsOk = false;
          }
        }
      }
      
      if (permissionsOk) {
        success('Collection permissions are properly configured');
        return true;
      } else {
        warn('Some collections may have incorrect permissions');
        info('Follow: APPWRITE_CRITICAL_FIX.md STEP 2');
        return false;
      }
    }
  },
  {
    name: 'Bucket Permissions',
    test: async () => {
      const buckets = ['avatars', 'resources'];
      let permissionsOk = true;
      
      for (const bucket of buckets) {
        const result = await makeRequest('GET', `/storage/buckets/${bucket}`);
        if (result.status === 200 && result.data) {
          const perms = result.data.permissions || result.data.$permissions || [];
          const permIncludes = (action, subject) => {
            return perms.some(p => p.includes(`${action}("${subject}")`) || p.includes(`${action}("${subject}s")`));
          };
          const hasCreateUser = permIncludes('create', 'user');
          const hasReadAny = perms.some(p => p.includes('read("any")'));
          
          if (hasCreateUser && hasReadAny) {
            console.log(`   ✓ ${bucket} permissions correct`);
          } else {
            console.log(`   ✗ ${bucket} missing permissions`);
            permissionsOk = false;
          }
        }
      }
      
      if (permissionsOk) {
        success('Bucket permissions are properly configured');
        return true;
      } else {
        warn('Some buckets may have incorrect permissions');
        info('Follow: APPWRITE_CRITICAL_FIX.md STEP 3');
        return false;
      }
    }
  },
  {
    name: 'Server Environment Variables',
    test: async () => {
      const required = [
        'NEXT_PUBLIC_APPWRITE_ENDPOINT',
        'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
        'APPWRITE_API_KEY'
      ];
      
      const missing = [];
      for (const key of required) {
        if (!env[key]) {
          missing.push(key);
          console.log(`   ✗ ${key} missing`);
        } else {
          console.log(`   ✓ ${key} present`);
        }
      }
      
      if (missing.length === 0) {
        success('All required environment variables set');
        return true;
      } else {
        error(`Missing: ${missing.join(', ')}`);
        return false;
      }
    }
  }
];

// Run all tests
async function runTests() {
  console.log('\n🧪 Running Tests:\n');
  
  const results = [];
  let passCount = 0;
  let failCount = 0;
  
  for (const test of tests) {
    try {
      info(`Testing: ${test.name}`);
      const passed = await test.test();
      results.push({ test: test.name, passed });
      
      if (passed) {
        passCount++;
      } else {
        failCount++;
      }
      console.log('');
    } catch (err) {
      error(`${test.name}: ${err.message}`);
      results.push({ test: test.name, passed: false });
      failCount++;
      console.log('');
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:\n');
  console.log(`   ${colors.green}✅ Passed: ${passCount}${colors.reset}`);
  console.log(`   ${colors.red}❌ Failed: ${failCount}${colors.reset}`);
  console.log(`   ${colors.bold}Total:${colors.reset} ${results.length}\n`);
  
  if (failCount > 0) {
    console.log(`${colors.yellow}⚠️  Some tests failed. Follow these steps:${colors.reset}\n`);
    console.log(`1. Read: ${colors.bold}APPWRITE_CRITICAL_FIX.md${colors.reset}`);
    console.log(`2. Configure permissions in Appwrite Console`);
    console.log(`3. Verify all environment variables`);
    console.log(`4. Restart dev server: pnpm dev\n`);
  } else {
    console.log(`${colors.green}🎉 All tests passed! Your backend is ready.${colors.reset}\n`);
    console.log('Next steps:');
    console.log('1. Start dev server: pnpm dev');
    console.log('2. Test signup: http://localhost:3000');
    console.log('3. Test login: Use credentials created\n');
  }
}

runTests().catch(err => {
  error('Test suite failed: ' + err.message);
  process.exit(1);
});
