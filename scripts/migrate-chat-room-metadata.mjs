import { Client, Databases } from 'node-appwrite'

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const collectionId = process.env.NEXT_PUBLIC_CHAT_ROOMS_COLLECTION_ID || 'chat_rooms'

if (!endpoint || !projectId || !apiKey) {
  throw new Error('Appwrite environment is incomplete')
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const databases = new Databases(client)
const desired = [
  { key: 'description', size: 500 },
  { key: 'access', size: 32 },
  { key: 'updatedAt', size: 255 },
]

const initial = await databases.listAttributes({ databaseId, collectionId })
const existing = new Set(initial.attributes.map((attribute) => attribute.key))

for (const attribute of desired) {
  if (!existing.has(attribute.key)) {
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: attribute.key,
      size: attribute.size,
      required: false,
    })
  }

  let status = 'processing'
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const current = await databases.getAttribute({ databaseId, collectionId, key: attribute.key })
    status = current.status
    if (status === 'available') break
    if (status === 'failed') throw new Error(`Attribute ${attribute.key} failed to provision`)
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }

  if (status !== 'available') throw new Error(`Attribute ${attribute.key} did not become available`)
  console.log(`${attribute.key}: available`)
}

