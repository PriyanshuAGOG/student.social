import { ID, Query } from 'node-appwrite'
import { z } from 'zod'
import { adminJson, ADMIN_COLLECTIONS, DATABASE_ID, safeListDocuments, withAdminApi, writeAdminAudit } from '@/lib/admin-server'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'
import { parseJsonBody } from '@/lib/api-security'

const flagSchema = z.object({
  key: z.string().min(2).max(120),
  enabled: z.boolean(),
  description: z.string().max(1000).optional().default(''),
  rollout: z.number().min(0).max(100).optional().default(100),
  reason: z.string().min(4).max(1000),
})

export const GET = withAdminApi('feature_flags.manage', async ({ correlationId }) => {
  const flags = await safeListDocuments(ADMIN_COLLECTIONS.featureFlags, [Query.orderAsc('key'), Query.limit(100)])
  return adminJson({ documents: flags.documents, total: flags.total }, correlationId)
})

export const PATCH = withAdminApi('feature_flags.manage', async ({ request, admin, correlationId }) => {
  const payload = await parseJsonBody(request, flagSchema)
  const { databases } = await createAdminClient()
  const existing = await safeListDocuments(ADMIN_COLLECTIONS.featureFlags, [Query.equal('key', payload.key), Query.limit(1)])
  const body = {
    key: payload.key,
    enabled: payload.enabled,
    description: payload.description,
    rollout: payload.rollout,
    updatedBy: admin.userId,
    updatedAt: new Date().toISOString(),
  }
  const flag = existing.documents[0]
    ? await databases.updateDocument(DATABASE_ID, ADMIN_COLLECTIONS.featureFlags, existing.documents[0].$id, body)
    : await databases.createDocument(DATABASE_ID, ADMIN_COLLECTIONS.featureFlags, ID.unique(), { ...body, createdAt: new Date().toISOString() })

  await writeAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: 'feature_flags.update',
    targetType: 'feature_flag',
    targetId: payload.key,
    reason: payload.reason,
    after: flag,
    correlationId,
  })

  return adminJson({ flag }, correlationId)
})
