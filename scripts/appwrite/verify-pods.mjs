import "dotenv/config"
import { Client, Databases, Storage } from "node-appwrite"
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
let failures = 0

for (const collection of collections) {
  try {
    await databases.getCollection(databaseId, collection.id)
    console.log(`ok collection ${collection.id}`)
  } catch (error) {
    failures += 1
    console.error(`missing collection ${collection.id}: ${error.message}`)
  }
}

for (const bucket of buckets) {
  try {
    await storage.getBucket(bucket.id)
    console.log(`ok bucket ${bucket.id}`)
  } catch (error) {
    failures += 1
    console.error(`missing bucket ${bucket.id}: ${error.message}`)
  }
}

if (failures) process.exit(1)
console.log("Pod 2.0 Appwrite verification passed.")
