package social.student.mobile.update

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Environment
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import social.student.mobile.data.AppRelease
import java.io.File

class AppUpdateManager(private val context: Context) {
    private var downloadId: Long = -1
    private var receiver: BroadcastReceiver? = null

    fun downloadAndInstall(release: AppRelease, onStatus: (String) -> Unit) {
        if (release.apkUrl.isBlank()) {
            onStatus("The update URL is missing")
            return
        }
        val fileName = "student-social-${release.versionName}.apk"
        val manager = context.getSystemService(DownloadManager::class.java)
        val request = DownloadManager.Request(Uri.parse(release.apkUrl))
            .setTitle("Student.social ${release.versionName}")
            .setDescription("Downloading the signed native update")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, fileName)
            .setMimeType("application/vnd.android.package-archive")

        downloadId = manager.enqueue(request)
        onStatus("Update download started")
        receiver?.let { runCatching { context.unregisterReceiver(it) } }
        receiver = object : BroadcastReceiver() {
            override fun onReceive(receiveContext: Context, intent: Intent) {
                if (intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) != downloadId) return
                runCatching { receiveContext.unregisterReceiver(this) }
                install(fileName, onStatus)
            }
        }.also {
            ContextCompat.registerReceiver(
                context,
                it,
                IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                ContextCompat.RECEIVER_NOT_EXPORTED,
            )
        }
    }

    private fun install(fileName: String, onStatus: (String) -> Unit) {
        if (!context.packageManager.canRequestPackageInstalls()) {
            onStatus("Allow Student.social to install updates, then retry")
            context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            return
        }
        val file = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), fileName)
        if (!file.exists()) {
            onStatus("The downloaded update could not be found")
            return
        }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        context.startActivity(Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        })
    }
}
