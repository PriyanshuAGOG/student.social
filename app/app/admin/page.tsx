import { AdminCommandCenter } from '@/components/admin/AdminCommandCenter'
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard'

export default async function AdminPage() {
  return (
    <AdminRouteGuard>
      <AdminCommandCenter />
    </AdminRouteGuard>
  )
}
