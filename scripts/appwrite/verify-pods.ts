import "dotenv/config"
import { Client, Databases, Storage } from "node-appwrite"

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1"
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ""
const apiKey = process.env.APPWRITE_API_KEY || ""
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_DATABASE_ID || "peerspark-main-db"

const collections = ["pods", "pod_memberships", "pod_roadmap_items", "pod_tasks", "pod_task_submissions", "pod_sessions", "pod_session_attendance", "pod_resources", "pod_checkins", "pod_chat_channels", "pod_messages", "pod_message_reactions", "pod_insights", "pod_invites", "pod_notifications_queue"]
const buckets = ["pod-covers", "pod-resources", "pod-chat-attachments", "pod-session-recordings"]

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey)
const databases = new Databases(client)
const storage = new Storage(client)

async function check(label: string, run: () => Promise<unknown>) {
  try {
    await run()
    console.log(`ok      ${label}`)
    return true
  } catch (error: any) {
    console.log(`missing ${label}: ${error?.message || error}`)
    return false
  }
}

async function main() {
  if (!project || !apiKey) throw new Error("Missing Appwrite project/api key.")
  let ok = true
  ok = await check(`database ${databaseId}`, () => databases.get(databaseId)) && ok
  for (const id of collections) ok = await check(`collection ${id}`, () => databases.getCollection(databaseId, id)) && ok
  for (const id of buckets) ok = await check(`bucket ${id}`, () => storage.getBucket(id)) && ok
  if (!ok) process.exit(1)
  console.log("Pod 2.0 Appwrite verification passed.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
