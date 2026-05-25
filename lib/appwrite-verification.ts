import { Account, Client, Users } from 'node-appwrite'

export type VerificationEmailResult = {
  status: number
  body: unknown
}

export async function sendAppwriteVerificationEmail(options: {
  endpoint: string
  projectId: string
  apiKey: string
  userId: string
  redirectUrl: string
}): Promise<VerificationEmailResult> {
  const client = new Client().setEndpoint(options.endpoint).setProject(options.projectId).setKey(options.apiKey)
  const users = new Users(client)

  const session = await users.createSession({ userId: options.userId })
  const accountClient = new Client().setEndpoint(options.endpoint).setProject(options.projectId).setSession(session.secret)
  const account = new Account(accountClient)

  try {
    const token = await account.createEmailVerification({ url: options.redirectUrl })
    return { status: 200, body: token }
  } finally {
    try {
      await users.deleteSession({ userId: options.userId, sessionId: session.$id })
    } catch {
      // Best-effort cleanup; don't fail the verification flow if session deletion fails.
    }
  }
}