package social.student.mobile.data

import android.content.Context
import org.json.JSONObject
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.UUID

class StudentSocialRepository(context: Context) {
    private val api = ApiClient(context)

    suspend fun session(): NativeUser? {
        val response = api.get("/api/auth/session")
        if (!response.optBoolean("authenticated")) return null
        val user = response.optJSONObject("user") ?: JSONObject()
        val profile = response.optJSONObject("profile") ?: JSONObject()
        return NativeUser(
            id = user.string("\$id", "id", "userId").ifBlank { profile.string("\$id", "userId") },
            name = profile.string("name").ifBlank { user.string("name").ifBlank { "Student" } },
            username = profile.string("username").ifBlank { user.string("email").substringBefore('@') },
            email = user.string("email").ifBlank { profile.string("email") },
        )
    }

    suspend fun login(email: String, password: String): NativeUser {
        api.post("/api/auth/login", JSONObject().put("email", email).put("password", password))
        return session() ?: throw ApiException(401, "The session could not be established")
    }

    suspend fun logout() {
        runCatching { api.post("/api/auth/logout") }
        api.clearSession()
    }

    suspend fun posts(userId: String): List<NativeItem> = api
        .get("/api/posts?userId=${encode(userId)}&limit=30&offset=0")
        .arrayAt("posts", "documents")
        .objects()
        .map { it.toNativeItem("post") }

    suspend fun createPost(userId: String, content: String) {
        api.post("/api/posts", JSONObject()
            .put("authorId", userId)
            .put("content", content)
            .put("metadata", JSONObject()))
    }

    suspend fun pods(): List<NativeItem> = api
        .get("/api/pods?limit=50&offset=0")
        .arrayAt("pods", "documents")
        .objects()
        .map { it.toNativeItem("pod") }

    suspend fun events(userId: String): List<NativeItem> = api
        .get("/api/calendar/events?userId=${encode(userId)}&limit=100&offset=0")
        .arrayAt("events", "documents")
        .objects()
        .map { it.toNativeItem("event") }

    suspend fun profiles(): List<NativeItem> = api
        .get("/api/profiles/list?limit=200&offset=0")
        .arrayAt("profiles", "documents")
        .objects()
        .map { it.toNativeItem("profile") }

    suspend fun resources(): List<NativeItem> = api
        .get("/api/resources?limit=100&offset=0")
        .arrayAt("documents", "resources")
        .objects()
        .map { it.toNativeItem("resource") }

    suspend fun directRoom(recipientId: String): String {
        val response = api.post("/api/messages/direct-room", JSONObject().put("recipientId", recipientId))
        return response.objectAt("room")?.string("\$id", "id")
            ?: throw ApiException(500, "Conversation could not be opened")
    }

    suspend fun messages(roomId: String, userId: String): List<NativeItem> = api
        .get("/api/messages/room/${encode(roomId)}?userId=${encode(userId)}&limit=100&offset=0")
        .arrayAt("messages", "documents")
        .objects()
        .map { it.toNativeItem("message") }

    suspend fun sendMessage(userId: String, roomId: String, content: String) {
        api.post("/api/messages/send", JSONObject()
            .put("senderId", userId)
            .put("roomId", roomId)
            .put("content", content)
            .put("type", "text")
            .put("clientMessageId", "android-${UUID.randomUUID()}")
            .put("metadata", JSONObject()))
    }

    suspend fun startCall(roomId: String, mediaType: String, title: String): CallCredentials {
        val created = api.post("/api/calls/sessions", JSONObject()
            .put("roomId", roomId)
            .put("mediaType", if (mediaType == "audio") "voice" else "video")
            .put("roomTitle", title))
        val sessionId = created.objectAt("session")?.string("\$id", "id")
            ?: throw ApiException(500, "Call session could not be created")
        return callCredentials(sessionId)
    }

    suspend fun callCredentials(sessionId: String): CallCredentials {
        val response = api.post("/api/calls/sessions/${encode(sessionId)}/token")
        return CallCredentials(
            sessionId = sessionId,
            serverUrl = response.string("url"),
            token = response.string("token"),
            roomName = response.string("roomName"),
            mediaType = response.objectAt("session")?.string("mediaType").ifNullOrBlank("video"),
        ).also {
            if (it.serverUrl.isBlank() || it.token.isBlank()) throw ApiException(500, "Call credentials are incomplete")
        }
    }

    suspend fun incomingCall(): IncomingCall? {
        val call = api.get("/api/calls/active").arrayAt("calls").objects().firstOrNull {
            it.string("direction") == "incoming" && it.string("state", "status") == "ringing"
        } ?: return null
        return IncomingCall(
            sessionId = call.string("\$id", "id"),
            callerName = call.optJSONObject("caller")?.string("name").orEmpty().ifBlank { "Someone" },
            mediaType = call.string("mediaType", "callType").ifBlank { "video" },
        )
    }

    suspend fun updateCall(sessionId: String, action: String) {
        api.patch("/api/calls/sessions/${encode(sessionId)}", JSONObject().put("action", action))
    }

    suspend fun callCandidates(sessionId: String): List<NativeItem> = api
        .get("/api/calls/sessions/${encode(sessionId)}/invite")
        .arrayAt("candidates")
        .objects()
        .map { it.toNativeItem("profile") }

    suspend fun inviteToCall(sessionId: String, userId: String) {
        api.post("/api/calls/sessions/${encode(sessionId)}/invite", JSONObject().put("userId", userId))
    }

    suspend fun release(): AppRelease {
        val response = api.get("/mobile/app-release.json")
        val notes = response.optJSONArray("notes")
            ?.let { array -> (0 until array.length()).joinToString("\n") { array.optString(it) } }
            .orEmpty()
        return AppRelease(
            versionCode = response.optInt("versionCode"),
            versionName = response.string("versionName"),
            apkUrl = response.string("apkUrl"),
            notes = notes,
        )
    }

    private fun encode(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8.toString())
}

private fun String?.ifNullOrBlank(fallback: String): String = if (this.isNullOrBlank()) fallback else this
