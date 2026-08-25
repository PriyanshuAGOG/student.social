#!/usr/bin/env node

const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '.env.local'), quiet: true })

const { Client, Databases, Storage } = require('node-appwrite')
const { collections, buckets } = require('./update-schema')

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID
const apiKey = process.env.APPWRITE_API_KEY

if (!endpoint || !projectId || !databaseId || !apiKey) {
  console.error('Missing Appwrite configuration for verification.')
  process.exit(1)
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const databases = new Databases(client)
const storage = new Storage(client)
const failures = []

function attributeMismatch(expected, actual) {
  if (!actual) return 'missing'
  if (actual.status && actual.status !== 'available') return `status=${actual.status}`
  if (actual.type !== expected.type) return `type=${actual.type}, expected=${expected.type}`
  if (Boolean(actual.array) !== Boolean(expected.array)) return `array=${Boolean(actual.array)}, expected=${Boolean(expected.array)}`
  if (expected.type === 'string' && Number(actual.size) !== Number(expected.size || 255)) return `size=${actual.size}, expected=${expected.size || 255}`
  if (Boolean(actual.required) !== Boolean(expected.required)) return `required=${Boolean(actual.required)}, expected=${Boolean(expected.required)}`
  return null
}

async function main() {
  await databases.get(databaseId)

  let checkedAttributes = 0
  let checkedIndexes = 0
  for (const definition of collections) {
    let remote
    try {
      remote = await databases.getCollection(databaseId, definition.id)
    } catch (error) {
      failures.push(`collection ${definition.id}: ${error.message || error}`)
      continue
    }

    const attributes = new Map(remote.attributes.map((attribute) => [attribute.key, attribute]))
    for (const expected of definition.attrs) {
      checkedAttributes += 1
      const mismatch = attributeMismatch(expected, attributes.get(expected.key))
      if (mismatch) failures.push(`attribute ${definition.id}.${expected.key}: ${mismatch}`)
    }

    const indexes = new Map(remote.indexes.map((index) => [index.key, index]))
    for (const expected of definition.indexes || []) {
      checkedIndexes += 1
      const actual = indexes.get(expected.key)
      if (!actual) failures.push(`index ${definition.id}.${expected.key}: missing`)
      else if (actual.status && actual.status !== 'available') failures.push(`index ${definition.id}.${expected.key}: status=${actual.status}`)
    }
  }

  for (const bucket of buckets) {
    try {
      await storage.getBucket(bucket.id)
    } catch (error) {
      failures.push(`bucket ${bucket.id}: ${error.message || error}`)
    }
  }

  if (failures.length > 0) {
    console.error(`Appwrite verification failed with ${failures.length} issue(s):`)
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(`Appwrite verification passed: ${collections.length} collections, ${checkedAttributes} attributes, ${checkedIndexes} indexes, ${buckets.length} buckets.`)
}

main().catch((error) => {
  console.error(`Appwrite verification failed: ${error.message || error}`)
  process.exit(1)
})
