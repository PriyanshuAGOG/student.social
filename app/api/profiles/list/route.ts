import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-comprehensive-fixes'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || 'peerspark-main-db'
const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_PROFILES_COLLECTION_ID || 'profiles'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)
    const query = searchParams.get('query')?.trim() || ''

    const { databases } = await createAdminClient()
    const queries = [Query.limit(limit), Query.offset(offset)]

    if (query) {
      queries.unshift(Query.search('name', query))
    }

    const result = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION_ID, queries)

    return NextResponse.json({ success: true, profiles: result.documents, total: result.total })
  } catch (error: any) {
    console.error('Profile list API error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to list profiles' }, { status: 500 })
  }
}