import { AdminCommandCenter } from '@/components/admin/AdminCommandCenter'
import { getAdminUserFromCookies } from '@/lib/admin-session'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function AdminPage() {
  const admin = await getAdminUserFromCookies(await cookies())
  if (!admin) notFound()

  return <AdminCommandCenter />
}
