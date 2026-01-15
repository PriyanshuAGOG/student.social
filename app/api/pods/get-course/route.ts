import { NextRequest, NextResponse } from "next/server"
import { client, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite"
import { Databases } from "node-appwrite"

export async function GET(request: NextRequest) {
  try {
    const podId = request.nextUrl.searchParams.get("podId")

    if (!podId) {
      return NextResponse.json(
        { error: "Missing podId query parameter" },
        { status: 400 }
      )
    }

    const databases = new Databases(client)
    const courses = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.POD_COURSES,
      [`equal("podId", "${podId}")`]
    )

    // Each pod can only have one course
    const course = courses.documents[0] || null

    return NextResponse.json({ course }, { status: 200 })
  } catch (error) {
    console.error("Error fetching pod course:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch course" },
      { status: 500 }
    )
  }
}
