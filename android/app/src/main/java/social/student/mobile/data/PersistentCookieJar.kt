package social.student.mobile.data

import android.content.Context
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import org.json.JSONArray

class PersistentCookieJar(context: Context) : CookieJar {
    private val preferences = context.getSharedPreferences("native_session", Context.MODE_PRIVATE)
    private val sessionCookies = mutableMapOf<String, Cookie>()

    init {
        val stored = runCatching { JSONArray(preferences.getString("cookies", "[]")) }.getOrDefault(JSONArray())
        for (index in 0 until stored.length() step 2) {
            val encoded = stored.optString(index)
            val origin = stored.optString(index + 1)
            val originUrl = origin.toHttpUrlOrNull()
            if (encoded.isNotBlank() && originUrl != null) {
                Cookie.parse(originUrl, encoded)?.let { sessionCookies[it.name] = it }
            }
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        cookies.forEach { cookie ->
            if (cookie.expiresAt <= System.currentTimeMillis()) sessionCookies.remove(cookie.name) else sessionCookies[cookie.name] = cookie
        }
        persist(url)
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        sessionCookies.entries.removeAll { it.value.expiresAt <= now }
        return sessionCookies.values.filter { it.matches(url) }
    }

    fun clear() {
        sessionCookies.clear()
        preferences.edit().clear().apply()
    }

    private fun persist(origin: HttpUrl) {
        val array = JSONArray()
        sessionCookies.values.forEach { cookie ->
            array.put(cookie.toString())
            array.put(origin.toString())
        }
        preferences.edit().putString("cookies", array.toString()).apply()
    }
}
