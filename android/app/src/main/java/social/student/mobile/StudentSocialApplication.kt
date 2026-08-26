package social.student.mobile

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build

class StudentSocialApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            val ringtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            val callChannel = NotificationChannel(
                CALL_CHANNEL,
                getString(R.string.call_channel_name),
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Incoming and active Student.social calls"
                enableVibration(true)
                setSound(ringtone, AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build())
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            val updateChannel = NotificationChannel(
                UPDATE_CHANNEL,
                getString(R.string.updates_channel_name),
                NotificationManager.IMPORTANCE_DEFAULT,
            )
            manager.createNotificationChannels(listOf(callChannel, updateChannel))
        }
    }

    companion object {
        const val CALL_CHANNEL = "student_social_calls"
        const val UPDATE_CHANNEL = "student_social_updates"
    }
}
