package social.student.mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import social.student.mobile.ui.AppViewModel
import social.student.mobile.ui.StudentSocialApp

class MainActivity : ComponentActivity() {
    private var pendingSessionId by mutableStateOf("")
    private val notificationPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        pendingSessionId = sessionIdFrom(intent)
        requestNotificationPermission()
        setContent {
            val appViewModel: AppViewModel = viewModel()
            LaunchedEffect(pendingSessionId) {
                if (pendingSessionId.isNotBlank()) {
                    appViewModel.openCall(pendingSessionId)
                    pendingSessionId = ""
                }
            }
            StudentSocialApp(appViewModel)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingSessionId = sessionIdFrom(intent)
    }

    private fun sessionIdFrom(intent: Intent?): String {
        intent ?: return ""
        intent.getStringExtra(EXTRA_CALL_SESSION_ID)?.takeIf(String::isNotBlank)?.let { return it }
        intent.data?.getQueryParameter("call")?.takeIf(String::isNotBlank)?.let { return it }
        intent.data?.getQueryParameter("callSessionId")?.takeIf(String::isNotBlank)?.let { return it }
        val segments = intent.data?.pathSegments.orEmpty()
        val callIndex = segments.indexOf("calls")
        return if (callIndex >= 0) segments.getOrNull(callIndex + 1).orEmpty() else ""
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    companion object {
        const val EXTRA_CALL_SESSION_ID = "call_session_id"
    }
}
