import { Client, Databases, ID, Permission, Query, Role, Storage } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'
const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'peerspark-main-db'
const profilesCollectionId = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

if (!projectId || !apiKey) {
  throw new Error('APPWRITE_PROJECT_ID and APPWRITE_API_KEY are required')
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
const databases = new Databases(client)
const storage = new Storage(client)

const buckets = [
  process.env.NEXT_PUBLIC_AVATARS_BUCKET_ID || 'avatars',
  process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_ID || 'attachments',
  process.env.NEXT_PUBLIC_RESOURCES_BUCKET_ID || 'resources',
]

const profilePage = await databases.listDocuments(databaseId, profilesCollectionId, [Query.limit(1)])
const sampleUserId = profilePage.documents[0]?.$id
if (!sampleUserId) throw new Error('A profile document is required to verify user-scoped upload permissions')

// Valid 1×1 PNG, small enough to exercise every media bucket without leaving
// meaningful data behind. Every created file is deleted in the same run.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nAAAAABJRU5ErkJggg==',
  'base64',
)

for (const bucketId of buckets) {
  const bucket = await storage.getBucket({ bucketId })
  let fileId = ''
  try {
    const created = await storage.createFile({
      bucketId,
      fileId: ID.unique(),
      file: InputFile.fromBuffer(png, 'student-social-upload-check.png'),
      permissions: [
        Permission.read(Role.user(sampleUserId)),
        Permission.update(Role.user(sampleUserId)),
        Permission.delete(Role.user(sampleUserId)),
      ],
    })
    fileId = created.$id
    const viewed = await storage.getFileView({ bucketId, fileId })
    if (!viewed?.byteLength) throw new Error(`Uploaded file in ${bucketId} could not be read back`)
    console.log(`✓ ${bucketId}: create, permission, read, and delete path is healthy (${bucket.maximumFileSize} byte limit)`)
  } finally {
    if (fileId) await storage.deleteFile({ bucketId, fileId }).catch(() => undefined)
  }
}

console.log(`Upload pipeline verification passed for ${buckets.length} buckets.`)
