package social.student.mobile.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CallEnd
import androidx.compose.material.icons.rounded.Cameraswitch
import androidx.compose.material.icons.rounded.Mic
import androidx.compose.material.icons.rounded.MicOff
import androidx.compose.material.icons.rounded.PersonAdd
import androidx.compose.material.icons.rounded.Videocam
import androidx.compose.material.icons.rounded.VideocamOff
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import io.livekit.android.LiveKit
import io.livekit.android.events.RoomEvent
import io.livekit.android.events.collect
import io.livekit.android.room.Room
import io.livekit.android.room.track.LocalVideoTrack
import io.livekit.android.room.track.VideoTrack
import kotlinx.coroutines.launch
import livekit.org.webrtc.RendererCommon
import livekit.org.webrtc.SurfaceViewRenderer
import social.student.mobile.calls.NativeCallService
import social.student.mobile.data.CallCredentials
import social.student.mobile.data.NativeItem

@Composable
fun NativeCallScreen(
    credentials: CallCredentials,
    title: String,
    candidates: List<NativeItem>,
    onLoadCandidates: () -> Unit,
    onInvite: (NativeItem) -> Unit,
    onFinished: () -> Unit,
) {
    val context = LocalContext.current
    val room = remember(credentials.sessionId) { LiveKit.create(context) }
    val scope = rememberCoroutineScope()
    val isVideo = credentials.mediaType.equals("video", ignoreCase = true)
    var connected by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var microphoneEnabled by remember { mutableStateOf(true) }
    var cameraEnabled by remember { mutableStateOf(isVideo) }
    var remoteTrack by remember { mutableStateOf<VideoTrack?>(null) }
    var localTrack by remember { mutableStateOf<LocalVideoTrack?>(null) }
    var permissionGranted by remember { mutableStateOf(hasCallPermissions(context, isVideo)) }
    var showInvite by remember { mutableStateOf(false) }
    val permissions = buildList {
        add(Manifest.permission.RECORD_AUDIO)
        if (isVideo) add(Manifest.permission.CAMERA)
    }.toTypedArray()
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { results ->
        permissionGranted = results.values.all { it }
        if (!permissionGranted) error = "Microphone${if (isVideo) " and camera" else ""} permission is required"
    }

    LaunchedEffect(Unit) {
        if (!permissionGranted) permissionLauncher.launch(permissions)
    }

    LaunchedEffect(permissionGranted, credentials.sessionId) {
        if (!permissionGranted) return@LaunchedEffect
        val service = Intent(context, NativeCallService::class.java)
            .putExtra(NativeCallService.EXTRA_TITLE, title.ifBlank { "Student.social call" })
            .putExtra(NativeCallService.EXTRA_MEDIA_TYPE, credentials.mediaType)
        ContextCompat.startForegroundService(context, service)
        runCatching {
            launch {
                room.events.collect { event ->
                    when (event) {
                        is RoomEvent.TrackSubscribed -> if (event.track is VideoTrack) remoteTrack = event.track as VideoTrack
                        is RoomEvent.TrackUnsubscribed -> if (event.track == remoteTrack) remoteTrack = null
                        is RoomEvent.Disconnected -> onFinished()
                        else -> Unit
                    }
                }
            }
            room.connect(credentials.serverUrl, credentials.token)
            room.localParticipant.setMicrophoneEnabled(true)
            if (isVideo) {
                room.localParticipant.setCameraEnabled(true)
                localTrack = room.localParticipant.videoTrackPublications.firstOrNull()?.second as? LocalVideoTrack
            }
            connected = true
        }.onFailure { error = it.message ?: "The call could not connect" }
    }

    DisposableEffect(room) {
        onDispose {
            room.disconnect()
            context.stopService(Intent(context, NativeCallService::class.java))
            restoreAudio(context)
        }
    }

    Box(Modifier.fillMaxSize().background(Color(0xFF181714))) {
        if (isVideo && remoteTrack != null) {
            VideoRenderer(room, remoteTrack!!, fit = true, mirror = false, modifier = Modifier.fillMaxSize())
        } else {
            Column(Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                Box(Modifier.size(108.dp).background(Color(0xFF76556D), CircleShape), contentAlignment = Alignment.Center) {
                    Text(title.take(1).uppercase().ifBlank { "S" }, fontSize = 42.sp, color = Color.White)
                }
                Text(title.ifBlank { "Student.social call" }, color = Color.White, fontSize = 22.sp, modifier = Modifier.padding(top = 18.dp))
                Text(if (connected) "Connected" else if (error.isBlank()) "Connecting…" else error, color = Color.White.copy(alpha = .55f), modifier = Modifier.padding(top = 7.dp))
                if (!connected && error.isBlank()) CircularProgressIndicator(color = Color(0xFF78815F), modifier = Modifier.padding(top = 20.dp))
            }
        }

        if (isVideo && cameraEnabled && localTrack != null) {
            VideoRenderer(
                room = room,
                track = localTrack!!,
                fit = false,
                mirror = true,
                modifier = Modifier.align(Alignment.TopEnd).padding(top = 58.dp, end = 14.dp).size(width = 108.dp, height = 164.dp),
            )
        }

        Row(
            Modifier.align(Alignment.BottomCenter).padding(bottom = 44.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CallControl(if (microphoneEnabled) Icons.Rounded.Mic else Icons.Rounded.MicOff, "Microphone") {
                microphoneEnabled = !microphoneEnabled
                scope.launch { room.localParticipant.setMicrophoneEnabled(microphoneEnabled) }
            }
            if (isVideo) {
                CallControl(if (cameraEnabled) Icons.Rounded.Videocam else Icons.Rounded.VideocamOff, "Camera") {
                    cameraEnabled = !cameraEnabled
                    scope.launch {
                        room.localParticipant.setCameraEnabled(cameraEnabled)
                        localTrack = room.localParticipant.videoTrackPublications.firstOrNull()?.second as? LocalVideoTrack
                    }
                }
                CallControl(Icons.Rounded.Cameraswitch, "Switch camera") {
                    localTrack?.switchCamera()
                }
            }
            CallControl(Icons.Rounded.PersonAdd, "Add a person") {
                showInvite = true
                onLoadCandidates()
            }
            IconButton(
                onClick = {
                    room.disconnect()
                    context.stopService(Intent(context, NativeCallService::class.java))
                    onFinished()
                },
                modifier = Modifier.size(62.dp).background(Color(0xFFC85049), CircleShape),
            ) { Icon(Icons.Rounded.CallEnd, "End call", tint = Color.White) }
        }

        if (showInvite) {
            AlertDialog(
                onDismissRequest = { showInvite = false },
                title = { Text("Add people to this call") },
                text = {
                    if (candidates.isEmpty()) {
                        Text("No additional people are available to invite.")
                    } else {
                        LazyColumn(Modifier.fillMaxWidth().heightIn(max = 360.dp)) {
                            items(candidates, key = { "invite-${it.id}" }) { person ->
                                Row(
                                    Modifier.fillMaxWidth().clickable { onInvite(person) }.padding(vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Box(Modifier.size(40.dp).background(Color(0xFF76556D), CircleShape), contentAlignment = Alignment.Center) {
                                        Text(person.title.take(1).uppercase(), color = Color.White)
                                    }
                                    Text(person.title, modifier = Modifier.padding(start = 12.dp), color = Color.White)
                                }
                            }
                        }
                    }
                },
                confirmButton = { androidx.compose.material3.TextButton(onClick = { showInvite = false }) { Text("Done") } },
            )
        }
    }
}

@Composable
private fun VideoRenderer(room: Room, track: VideoTrack, fit: Boolean, mirror: Boolean, modifier: Modifier) {
    key(track) {
        AndroidView(
            factory = { context ->
                SurfaceViewRenderer(context).apply {
                    room.initVideoRenderer(this)
                    setScalingType(if (fit) RendererCommon.ScalingType.SCALE_ASPECT_FIT else RendererCommon.ScalingType.SCALE_ASPECT_FILL)
                    setMirror(mirror)
                    setEnableHardwareScaler(true)
                    track.addRenderer(this)
                }
            },
            modifier = modifier,
            update = { renderer ->
                renderer.setScalingType(if (fit) RendererCommon.ScalingType.SCALE_ASPECT_FIT else RendererCommon.ScalingType.SCALE_ASPECT_FILL)
                renderer.setMirror(mirror)
            },
            onRelease = { renderer ->
                track.removeRenderer(renderer)
                renderer.release()
            },
        )
    }
}

@Composable
private fun CallControl(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    IconButton(onClick = onClick, modifier = Modifier.size(54.dp).background(Color.White.copy(alpha = .14f), CircleShape)) {
        Icon(icon, label, tint = Color.White)
    }
}

private fun hasCallPermissions(context: Context, video: Boolean): Boolean {
    val microphone = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
    val camera = !video || ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    return microphone && camera
}

@Suppress("DEPRECATION")
private fun restoreAudio(context: Context) {
    val audio = context.getSystemService(AudioManager::class.java)
    audio.mode = AudioManager.MODE_NORMAL
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) audio.clearCommunicationDevice()
    else audio.isSpeakerphoneOn = false
}
