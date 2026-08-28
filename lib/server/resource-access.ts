import 'server-only'
import { Query } from 'node-appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'
const POD_MEMBERSHIPS_COLLECTION_ID = process.env.NEXT_PUBLIC_POD_MEMBERSHIPS_COLLECTION_ID || 'pod_memberships'

export async function canAccessResource(databases: any, userId: string, resource: any): Promise<boolean> {
  if (resource?.visibility === 'public' || resource?.authorId === userId) return true
  const podId = String(resource?.podId || '')
  if (!podId) return false
  try {
    const membership = await databases.listDocuments(DATABASE_ID, POD_MEMBERSHIPS_COLLECTION_ID, [
      Query.equal('podId', podId),
      Query.equal('userId', userId),
      Query.limit(1),
    ])
    return membership.documents.length > 0
  } catch {
    return false
  }
}
