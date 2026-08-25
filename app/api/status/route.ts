import { NextResponse } from 'next/server'
import { getPlatformStatusSnapshot } from '@/lib/server/platform-status'

export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await getPlatformStatusSnapshot()
  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
