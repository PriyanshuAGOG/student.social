import "dotenv/config"
import { Client, Databases, Storage, Permission, Role } from "node-appwrite"
import { buckets, collections, databaseId } from "./pod-schema.mjs"

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const key = process.env.APPWRITE_API_KEY

if (!project || !key) {
  throw new Error("APPWRITE_PROJECT_ID/NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY are required.")
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key)
const databases = new Databases(client)
const storage = new Storage(client)

async function exists(fn) {
  try {
    return await fn()
  } catch (error) {
    if (error?.code === 404) return null
    throw error
  }
}

async function createAttributes(collection) {
  for (const [keyName, size, required] of collection.strings || []) {
    await exists(() => databases.getAttribute(databaseId, collection.id, keyName)) ||
      await databases.createStringAttribute(databaseId, collection.id, keyName, size, required)
  }
  for (const [keyName, required] of collection.integers || []) {
    await exists(() => databases.getAttribute(databaseId, collection.id, keyName)) ||
      await databases.createIntegerAttribute(databaseId, collection.id, keyName, required)
  }
  for (const [keyName, required] of collection.floats || []) {
    await exists(() => databases.getAttribute(databaseId, collection.id, keyName)) ||
      await databases.createFloatAttribute(databaseId, collection.id, keyName, required)
  }
  for (const [keyName, required] of collection.booleans || []) {
    await exists(() => databases.getAttribute(databaseId, collection.id, keyName)) ||
      await databases.createBooleanAttribute(databaseId, collection.id, keyName, required)
  }
  for (const [keyName, required] of collection.datetimes || []) {
    await exists(() => databases.getAttribute(databaseId, collection.id, keyName)) ||
      await databases.createDatetimeAttribute(databaseId, collection.id, keyName, required)
  }
  for (const [keyName, size, required] of collection.stringArrays || []) {
    await exists(() => databases.getAttribute(databaseId, collection.id, keyName)) ||
      await databases.createStringAttribute(databaseId, collection.id, keyName, size, required, undefined, true)
  }
}

async function createIndexes(collection) {
  for (const [key, type, attributes] of collection.indexes || []) {
    await exists(() => databases.getIndex(databaseId, collection.id, key)) ||
      await databases.createIndex(databaseId, collection.id, key, type, attributes)
  }
}

for (const collection of collections) {
  const current = await exists(() => databases.getCollection(databaseId, collection.id))
  if (!current) {
    await databases.createCollection(databaseId, collection.id, collection.name, [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
    ])
    console.log(`created collection ${collection.id}`)
  } else {
    console.log(`collection exists ${collection.id}`)
  }
  await createAttributes(collection)
  await createIndexes(collection)
}

for (const bucket of buckets) {
  const current = await exists(() => storage.getBucket(bucket.id))
  if (!current) {
    await storage.createBucket(bucket.id, bucket.name, [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ], false, true, bucket.size, bucket.extensions)
    console.log(`created bucket ${bucket.id}`)
  } else {
    console.log(`bucket exists ${bucket.id}`)
  }
}

console.log("Pod 2.0 Appwrite setup complete.")
