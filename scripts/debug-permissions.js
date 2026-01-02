const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [k, ...rest] = line.split('=');
      env[k.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
    }
  });
  return env;
}

const env = loadEnv();
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + path,
      method,
      headers: {
        'X-Appwrite-Key': API_KEY,
        'X-Appwrite-Project': PROJECT_ID,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const targets = [
    `/databases/${DATABASE_ID}/collections/profiles`,
    `/databases/${DATABASE_ID}/collections/posts`,
    `/storage/buckets/avatars`,
    `/storage/buckets/resources`,
  ];

  for (const t of targets) {
    try {
      console.log('\n--- FETCHING', t, '---');
      const res = await makeRequest('GET', t);
      console.log('STATUS:', res.status);
      console.log('BODY:');
      console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error('ERROR fetching', t, e);
    }
  }
})();
