package social.student.mobile.calls

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import social.student.mobile.MainActivity
import social.student.mobile.R
import social.student.mobile.StudentSocialApplication

class NativeCallService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val title = intent?.getStringExtra(EXTRA_TITLE).orEmpty().ifBlank { "Student.social call" }
        val mediaType = intent?.getStringExtra(EXTRA_MEDIA_TYPE).orEmpty().ifBlank { "voice" }
        val openIntent = Intent(this, MainActivity::class.java).apply {
            this.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtras(intent?.extras ?: return@apply)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            4001,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification: Notification = NotificationCompat.Builder(this, StudentSocialApplication.CALL_CHANNEL)
            .setSmallIcon(R.drawable.student_social_icon)
            .setContentTitle(title)
            .setContentText("Native $mediaType call in progress")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
        startForeground(NOTIFICATION_ID, notification)
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val EXTRA_TITLE = "call_title"
        const val EXTRA_MEDIA_TYPE = "call_media_type"
        const val NOTIFICATION_ID = 4107
    }
}
