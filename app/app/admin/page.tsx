import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { AdminCommandCenter } from '@/components/admin/AdminCommandCenter'
import { ADMIN_OWNER_EMAIL, isOwnerEmail } from '@/lib/admin-access'
import { getAdminUserFromCookies } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const adminUser = await getAdminUserFromCookies(cookieStore)

  if (!adminUser || !isOwnerEmail(adminUser.email)) {
    notFound()
  }

  return <AdminCommandCenter adminEmail={ADMIN_OWNER_EMAIL} />
}