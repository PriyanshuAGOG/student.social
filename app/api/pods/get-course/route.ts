// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { Query } from "node-appwrite"
import { createAdminClient } from "@/lib/server/appwrite"
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite-server"
import { ApiError, requireVerifiedUser } from "@/lib/api-security"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireVerifiedUser(request)
    const podId = request.nextUrl.searchParams.get("podId")

    if (!podId) {
      return NextResponse.json(
        { error: "Missing podId query parameter" },
        { status: 400 }
      )
    }

    const { databases } = await createAdminClient()
    const pod = await databases.getDocument(DATABASE_ID, COLLECTIONS.PODS, podId)
    const members = Array.isArray(pod.members) ? pod.members : []
    if (pod.creatorId !== auth.userId && !members.includes(auth.userId)) {
      throw new ApiError(403, "FORBIDDEN", "Join this Pod to view its course")
    }
    
    // Check if POD_COURSES collection exists in COLLECTIONS
    if (!COLLECTIONS.POD_COURSES) {
      console.warn("POD_COURSES collection not configured, returning null")
      return NextResponse.json({ course: null }, { status: 200 })
    }
    
    const courses = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.POD_COURSES,
      [Query.equal('podId', podId)]
    )

    // Each pod can only have one course
    const course = courses.documents[0] || null

    return NextResponse.json({ course }, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    console.error("Error fetching pod course:", error)
    // Return null course instead of error for graceful degradation
    return NextResponse.json(
      { course: null, error: error instanceof Error ? error.message : "Failed to fetch course" },
      { status: 200 }
    )
  }
}
