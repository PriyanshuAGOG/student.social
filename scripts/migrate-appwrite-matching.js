const https = require('https')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    process.exit(1)
  }
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const envVars = {}
  envContent.split('\n').forEach((line) => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      if (key && value) envVars[key.trim()] = value.trim()
    }
  })
  return envVars
}

const env = loadEnv()
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const API_KEY = env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Missing Appwrite envs. Need NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY')
  process.exit(1)
}

const url = new URL(ENDPOINT)
const hostname = url.hostname
const pathPrefix = url.pathname

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path: pathPrefix + path,
      method,
      headers: {
        'X-Appwrite-Key': API_KEY,
        'X-Appwrite-Project': PROJECT_ID,
        'Content-Type': 'application/json',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}')
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, data: parsed })
          } else {
            resolve(parsed)
          }
        } catch (e) {
          reject({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function ensureStringAttr(collectionId, key, size = 2000, array = false, required = false) {
  try {
    await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/string`, {
      key,
      size,
      required,
      array,
    })
    console.log(`✅ Added string attr ${collectionId}.${key} (array=${array})`)
  } catch (e) {
    if (e?.data?.message?.includes('already exists')) {
      console.log(`↪️  ${collectionId}.${key} already exists (skipped)`) // idempotent
    } else {
      console.warn(`⚠️  Could not add ${collectionId}.${key}:`, e?.data || e)
    }
  }
}

async function ensureIntegerAttr(collectionId, key, required = false) {
  try {
    await makeRequest('POST', `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/integer`, {
      key,
      required,
    })
    console.log(`✅ Added integer attr ${collectionId}.${key}`)
  } catch (e) {
    if (e?.data?.message?.includes('already exists')) {
      console.log(`↪️  ${collectionId}.${key} already exists (skipped)`) // idempotent
    } else {
      console.warn(`⚠️  Could not add ${collectionId}.${key}:`, e?.data || e)
    }
  }
}

async function run() {
  console.log('\n🚀 Migrating Appwrite collections for matching metadata...')
  console.log(`Endpoint: ${ENDPOINT}`)
  console.log(`Project: ${PROJECT_ID}`)
  console.log(`Database: ${DATABASE_ID}\n`)

  // Profiles additions
  await ensureStringAttr('profiles', 'learningGoals', 2000, true)
  await ensureStringAttr('profiles', 'learningPace', 50, false)
  await ensureStringAttr('profiles', 'preferredSessionTypes', 500, true)
  await ensureStringAttr('profiles', 'availability', 500, true)
  await ensureStringAttr('profiles', 'currentFocusAreas', 2000, true)

  // Pods additions
  await ensureStringAttr('pods', 'idealLearnerType', 500, true)
  await ensureStringAttr('pods', 'sessionType', 500, true)
  await ensureIntegerAttr('pods', 'averageSessionLength', false)
  await ensureStringAttr('pods', 'commonAvailability', 500, true)
  await ensureStringAttr('pods', 'matchingTags', 2000, true)

  console.log('\n🎉 Migration completed (idempotent).')
}

run().catch((e) => {
  console.error('\n❌ Migration failed:', e)
  process.exit(1)
})
