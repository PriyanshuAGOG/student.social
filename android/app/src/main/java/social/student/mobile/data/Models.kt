package social.student.mobile.data

import org.json.JSONArray
import org.json.JSONObject

data class NativeUser(
    val id: String,
    val name: String,
    val username: String,
    val email: String,
)

data class NativeItem(
    val id: String,
    val title: String,
    val subtitle: String = "",
    val body: String = "",
    val meta: String = "",
    val raw: JSONObject,
)

data class CallCredentials(
    val sessionId: String,
    val serverUrl: String,
    val token: String,
    val roomName: String,
    val mediaType: String,
)

data class IncomingCall(
    val sessionId: String,
    val callerName: String,
    val mediaType: String,
)

data class AppRelease(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val notes: String,
)

class ApiException(val status: Int, message: String) : Exception(message)

internal fun JSONObject.string(vararg keys: String): String {
    for (key in keys) {
        val value = opt(key)
        if (value != null && value != JSONObject.NULL) {
            val text = value.toString().trim()
            if (text.isNotEmpty()) return text
        }
    }
    return ""
}

internal fun JSONObject.objectAt(vararg keys: String): JSONObject? {
    for (key in keys) optJSONObject(key)?.let { return it }
    optJSONObject("data")?.let { nested ->
        for (key in keys) nested.optJSONObject(key)?.let { return it }
    }
    return null
}

internal fun JSONObject.arrayAt(vararg keys: String): JSONArray {
    for (key in keys) optJSONArray(key)?.let { return it }
    optJSONObject("data")?.let { nested ->
        for (key in keys) nested.optJSONArray(key)?.let { return it }
        nested.optJSONArray("documents")?.let { return it }
    }
    optJSONArray("documents")?.let { return it }
    return JSONArray()
}

internal fun JSONArray.objects(): List<JSONObject> = buildList {
    for (index in 0 until length()) optJSONObject(index)?.let(::add)
}

internal fun JSONObject.toNativeItem(kind: String): NativeItem {
    val id = string("\$id", "id", "userId")
    val title = when (kind) {
        "post" -> string("authorName", "name", "username").ifBlank { "Student" }
        "message" -> string("senderName", "authorName", "name").ifBlank { "Message" }
        else -> string("title", "name", "username", "fileName").ifBlank { kind.replaceFirstChar(Char::uppercase) }
    }
    val body = string("content", "description", "message", "text", "summary")
    val subtitle = string("username", "topic", "category", "type", "email")
    val meta = when (kind) {
        "post" -> listOf(string("likesCount", "likes"), string("commentsCount", "comments")).filter(String::isNotBlank).joinToString(" · ")
        "pod" -> listOf(string("memberCount", "membersCount"), string("difficulty", "level")).filter(String::isNotBlank).joinToString(" · ")
        "event" -> string("startTime", "date", "timestamp")
        "message" -> string("timestamp", "createdAt", "\$createdAt")
        "resource" -> listOf(string("fileType", "type"), string("downloads")).filter(String::isNotBlank).joinToString(" · ")
        else -> ""
    }
    return NativeItem(id, title, subtitle, body, meta, this)
}
