package social.student.mobile.calls

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import social.student.mobile.MainActivity
import social.student.mobile.R
import social.student.mobile.StudentSocialApplication
import social.student.mobile.data.IncomingCall

object IncomingCallNotifier {
    private const val NOTIFICATION_ID = 4106

    fun show(context: Context, call: IncomingCall) {
        val open = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(MainActivity.EXTRA_CALL_SESSION_ID, call.sessionId)
        }
        val pending = PendingIntent.getActivity(
            context,
            call.sessionId.hashCode(),
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(context, StudentSocialApplication.CALL_CHANNEL)
            .setSmallIcon(R.drawable.student_social_icon)
            .setContentTitle("${call.callerName} is calling")
            .setContentText("Incoming ${if (call.mediaType == "video") "video" else "voice"} call")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(pending)
            .setFullScreenIntent(pending, true)
            .build()
        context.getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
    }

    fun cancel(context: Context) {
        context.getSystemService(NotificationManager::class.java).cancel(NOTIFICATION_ID)
    }
}
