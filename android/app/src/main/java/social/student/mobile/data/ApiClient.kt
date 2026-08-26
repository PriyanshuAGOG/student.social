package social.student.mobile.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import social.student.mobile.BuildConfig
import java.util.concurrent.TimeUnit

class ApiClient(context: Context) {
    private val cookieJar = PersistentCookieJar(context)
    private val jsonType = "application/json; charset=utf-8".toMediaType()
    private val client = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(50, TimeUnit.SECONDS)
        .writeTimeout(50, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    suspend fun get(path: String): JSONObject = request("GET", path)
    suspend fun post(path: String, body: JSONObject = JSONObject()): JSONObject = request("POST", path, body)
    suspend fun patch(path: String, body: JSONObject = JSONObject()): JSONObject = request("PATCH", path, body)

    fun clearSession() = cookieJar.clear()

    private suspend fun request(method: String, path: String, body: JSONObject? = null): JSONObject = withContext(Dispatchers.IO) {
        val url = if (path.startsWith("http")) path else "${BuildConfig.API_BASE_URL}${if (path.startsWith('/')) path else "/$path"}"
        val builder = Request.Builder()
            .url(url)
            .header("Accept", "application/json")
            .header("User-Agent", "StudentSocial-Android/${BuildConfig.VERSION_NAME}")
            .header("X-Student-Social-Client", "android-native")

        if (method != "GET") {
            builder.header("Origin", BuildConfig.API_BASE_URL)
            builder.method(method, (body ?: JSONObject()).toString().toRequestBody(jsonType))
        } else {
            builder.get()
        }

        client.newCall(builder.build()).execute().use { response ->
            val text = response.body.string()
            val json = runCatching { JSONObject(text) }.getOrElse { JSONObject().put("raw", text) }
            if (!response.isSuccessful) {
                val message = json.string("error", "message", "raw").ifBlank { "Request failed (${response.code})" }
                throw ApiException(response.code, message)
            }
            json
        }
    }
}
