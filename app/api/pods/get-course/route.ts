// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite"
import { Client, Databases, Query } from "node-appwrite"

function getDatabases() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (endpoint && project && apiKey) {
    const adminClient = new Client()
      .setEndpoint(endpoint)
      .setProject(project)
      .setKey(apiKey)

    return new Databases(adminClient)
  }

  return new Databases(client)
}

export async function GET(request: NextRequest) {
  try {
    const podId = request.nextUrl.searchParams.get("podId")

    if (!podId) {
      return NextResponse.json(
        { error: "Missing podId query parameter" },
        { status: 400 }
      )
    }

    const databases = getDatabases()
    
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
    console.error("Error fetching pod course:", error)
    // Return null course instead of error for graceful degradation
    return NextResponse.json(
      { course: null, error: error instanceof Error ? error.message : "Failed to fetch course" },
      { status: 200 }
    )
  }
}
