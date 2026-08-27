package social.student.mobile.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.ChatBubbleOutline
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.CollectionsBookmark
import androidx.compose.material.icons.rounded.Groups
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.MoreHoriz
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.VideoCall
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import social.student.mobile.BuildConfig
import social.student.mobile.R
import social.student.mobile.calls.IncomingCallNotifier
import social.student.mobile.data.NativeItem
import social.student.mobile.update.AppUpdateManager

private val Charcoal = Color(0xFF272521)
private val DeepCharcoal = Color(0xFF1D1C19)
private val Cream = Color(0xFFF2ECE2)
private val WarmWhite = Color(0xFFFFFAF2)
private val Olive = Color(0xFF78815F)
private val Plum = Color(0xFF76556D)
private val Terracotta = Color(0xFFAD5B42)
private val InkMuted = Color(0xFF777168)

private val NativeColors = darkColorScheme(
    primary = Olive,
    onPrimary = WarmWhite,
    secondary = Plum,
    tertiary = Terracotta,
    background = Charcoal,
    onBackground = WarmWhite,
    surface = DeepCharcoal,
    onSurface = WarmWhite,
)

@Composable
fun StudentSocialApp(viewModel: AppViewModel) {
    val state by viewModel.state.collectAsState()
    val snackbar = remember { SnackbarHostState() }
    val context = LocalContext.current
    val updater = remember { AppUpdateManager(context) }

    LaunchedEffect(state.error, state.notice) {
        val message = state.error.ifBlank { state.notice }
        if (message.isNotBlank()) {
            snackbar.showSnackbar(message)
            viewModel.clearMessage()
        }
    }

    LaunchedEffect(state.incomingCall?.sessionId, state.activeCall?.sessionId) {
        val incoming = state.incomingCall
        if (incoming != null && state.activeCall == null) {
            IncomingCallNotifier.show(context, incoming)
        } else {
            IncomingCallNotifier.cancel(context)
        }
    }

    MaterialTheme(colorScheme = NativeColors) {
        Surface(Modifier.fillMaxSize(), color = Charcoal) {
            when {
                state.booting -> LoadingScreen()
                state.user == null -> LoginScreen(state.busy, viewModel::login)
                state.activeCall != null -> NativeCallScreen(
                    credentials = state.activeCall!!,
                    title = state.conversation?.title.orEmpty(),
                    candidates = state.callCandidates,
                    onLoadCandidates = viewModel::loadCallCandidates,
                    onInvite = viewModel::inviteToCall,
                    onFinished = { viewModel.finishCall() },
                )
                state.conversation != null -> ConversationScreen(
                    state = state,
                    onBack = viewModel::closeConversation,
                    onSend = viewModel::sendMessage,
                    onCall = viewModel::startCall,
                )
                else -> MainScreen(
                    state = state,
                    snackbar = snackbar,
                    onSelect = viewModel::select,
                    onSearch = viewModel::search,
                    onRefresh = viewModel::refresh,
                    onCreatePost = viewModel::createPost,
                    onOpenConversation = viewModel::openConversation,
                    onLogout = viewModel::logout,
                    onUpdate = { release -> updater.downloadAndInstall(release) { message ->
                        snackbar.currentSnackbarData?.dismiss()
                        viewModel.clearMessage()
                    } },
                )
            }
            if (state.busy && !state.booting) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
                    CircularProgressIndicator(Modifier.statusBarsPadding().padding(top = 8.dp).size(24.dp), color = Olive, strokeWidth = 3.dp)
                }
            }
            state.incomingCall?.takeIf { state.activeCall == null }?.let { incoming ->
                AlertDialog(
                    onDismissRequest = { },
                    title = { Text("${incoming.callerName} is calling") },
                    text = { Text("Incoming ${if (incoming.mediaType == "video") "video" else "voice"} call") },
                    confirmButton = {
                        Button(onClick = viewModel::acceptIncomingCall, colors = ButtonDefaults.buttonColors(containerColor = Olive)) {
                            Icon(Icons.Rounded.Call, null)
                            Spacer(Modifier.width(8.dp))
                            Text("Answer")
                        }
                    },
                    dismissButton = { TextButton(onClick = viewModel::declineIncomingCall) { Text("Decline", color = Terracotta) } },
                )
            }
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            BrandMark()
            Spacer(Modifier.height(20.dp))
            CircularProgressIndicator(color = Olive)
        }
    }
}

@Composable
private fun LoginScreen(busy: Boolean, onLogin: (String, String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    LazyColumn(
        modifier = Modifier.fillMaxSize().imePadding().statusBarsPadding().padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        item {
            BrandMark()
            Spacer(Modifier.height(38.dp))
            Text("Welcome back.", fontSize = 38.sp, lineHeight = 40.sp, fontWeight = FontWeight.SemiBold, color = WarmWhite)
            Text("Your people, pods, and progress—together.", color = Color.White.copy(alpha = .62f), modifier = Modifier.padding(top = 10.dp, bottom = 28.dp))
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                singleLine = true,
                shape = RoundedCornerShape(18.dp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                shape = RoundedCornerShape(18.dp),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { if (email.isNotBlank() && password.isNotBlank()) onLogin(email, password) }),
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                onClick = { onLogin(email, password) },
                enabled = !busy && email.isNotBlank() && password.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Olive),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth().padding(top = 20.dp).height(56.dp),
            ) {
                Text("Sign in", fontWeight = FontWeight.SemiBold)
            }
            Text("Native Android · ${BuildConfig.API_BASE_URL.removePrefix("https://")}", color = Color.White.copy(alpha = .34f), fontSize = 12.sp, modifier = Modifier.padding(top = 22.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScreen(
    state: AppUiState,
    snackbar: SnackbarHostState,
    onSelect: (MainSection) -> Unit,
    onSearch: (String) -> Unit,
    onRefresh: () -> Unit,
    onCreatePost: (String) -> Unit,
    onOpenConversation: (NativeItem) -> Unit,
    onLogout: () -> Unit,
    onUpdate: (social.student.mobile.data.AppRelease) -> Unit,
) {
    var createPost by remember { mutableStateOf(false) }
    var showAccount by remember { mutableStateOf(false) }
    val filtered = remember(state.items, state.search) {
        if (state.search.isBlank()) state.items else state.items.filter { item ->
            listOf(item.title, item.subtitle, item.body, item.meta).any { it.contains(state.search, ignoreCase = true) }
        }
    }

    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = Charcoal,
        topBar = {
            Column(Modifier.statusBarsPadding().padding(horizontal = 18.dp, vertical = 10.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(greeting(), color = Color.White.copy(alpha = .54f), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Text(state.user?.name.orEmpty(), color = WarmWhite, fontSize = 23.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                    }
                    IconButton(onClick = onRefresh) { Icon(Icons.Rounded.Refresh, "Refresh") }
                    Box(
                        Modifier.size(42.dp).background(Plum, CircleShape).clickable { showAccount = true },
                        contentAlignment = Alignment.Center,
                    ) { Text(state.user?.name?.take(1)?.uppercase().orEmpty(), fontWeight = FontWeight.Bold) }
                }
                AnimatedVisibility(state.release != null, enter = slideInVertically() + fadeIn(), exit = fadeOut()) {
                    state.release?.let { release ->
                        Row(
                            Modifier.fillMaxWidth().padding(top = 10.dp).background(Cream, RoundedCornerShape(16.dp)).clickable { onUpdate(release) }.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text("Native update ${release.versionName}", color = Charcoal, fontWeight = FontWeight.Bold)
                                Text("Tap to download and install", color = InkMuted, fontSize = 12.sp)
                            }
                            Text("Update", color = Plum, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                OutlinedTextField(
                    value = state.search,
                    onValueChange = onSearch,
                    leadingIcon = { Icon(Icons.Rounded.Search, null) },
                    trailingIcon = if (state.search.isNotBlank()) ({ IconButton(onClick = { onSearch("") }) { Icon(Icons.Rounded.Close, "Clear") } }) else null,
                    placeholder = { Text(searchHint(state.section)) },
                    singleLine = true,
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                )
            }
        },
        bottomBar = {
            NavigationBar(containerColor = DeepCharcoal, modifier = Modifier.navigationBarsPadding()) {
                MainSection.entries.forEach { section ->
                    NavigationBarItem(
                        selected = state.section == section,
                        onClick = { onSelect(section) },
                        icon = { Icon(section.icon(), section.label) },
                        label = { Text(section.label, fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = WarmWhite, selectedTextColor = WarmWhite, indicatorColor = Olive),
                    )
                }
            }
        },
        floatingActionButton = {
            if (state.section == MainSection.Feed) {
                FloatingActionButton(onClick = { createPost = true }, containerColor = Olive, contentColor = WarmWhite, shape = CircleShape) {
                    Icon(Icons.Rounded.Add, "Create post")
                }
            }
        },
    ) { padding ->
        AnimatedContent(state.section, label = "section") { visibleSection ->
            ContentList(
                modifier = Modifier.fillMaxSize().padding(padding),
                section = visibleSection,
                items = filtered,
                onItem = { if (state.section == MainSection.Chat) onOpenConversation(it) },
            )
        }
    }

    if (createPost) CreatePostDialog(onDismiss = { createPost = false }) {
        onCreatePost(it)
        createPost = false
    }
    if (showAccount) {
        AlertDialog(
            onDismissRequest = { showAccount = false },
            title = { Text(state.user?.name.orEmpty()) },
            text = { Text("@${state.user?.username.orEmpty()}\n${state.user?.email.orEmpty()}") },
            confirmButton = { TextButton(onClick = onLogout) { Icon(Icons.AutoMirrored.Rounded.Logout, null); Spacer(Modifier.width(8.dp)); Text("Sign out") } },
            dismissButton = { TextButton(onClick = { showAccount = false }) { Text("Close") } },
        )
    }
}

@Composable
private fun ContentList(modifier: Modifier, section: MainSection, items: List<NativeItem>, onItem: (NativeItem) -> Unit) {
    LazyColumn(modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Row(Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 2.dp), verticalAlignment = Alignment.Bottom) {
                Text(sectionTitle(section), color = WarmWhite, fontSize = 29.sp, lineHeight = 32.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                Text("${items.size}", color = Color.White.copy(alpha = .42f), fontSize = 13.sp)
            }
        }
        if (items.isEmpty()) {
            item { EmptyState(section) }
        } else {
            items(items, key = { "${section.name}-${it.id}-${it.title}" }) { item ->
                NativeItemCard(item, section, onItem)
            }
        }
        item { Spacer(Modifier.height(90.dp)) }
    }
}

@Composable
private fun NativeItemCard(item: NativeItem, section: MainSection, onItem: (NativeItem) -> Unit) {
    val accent = when (section) {
        MainSection.Feed -> Terracotta
        MainSection.Pods -> Olive
        MainSection.Calendar -> Plum
        MainSection.Chat -> Olive
        MainSection.Vault -> Plum
    }
    Card(
        modifier = Modifier.fillMaxWidth().clickable(enabled = section == MainSection.Chat) { onItem(item) },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Cream),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(Modifier.padding(17.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(if (section == MainSection.Chat) 46.dp else 12.dp).background(accent, CircleShape), contentAlignment = Alignment.Center) {
                    if (section == MainSection.Chat) Text(item.title.take(1).uppercase(), color = WarmWhite, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(item.title, color = Charcoal, fontWeight = FontWeight.Bold, fontSize = 16.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    if (item.subtitle.isNotBlank()) Text(item.subtitle, color = InkMuted, fontSize = 12.sp, maxLines = 1)
                }
                if (section == MainSection.Chat) Icon(Icons.Rounded.ChatBubbleOutline, null, tint = Charcoal.copy(alpha = .65f))
                else Icon(Icons.Rounded.MoreHoriz, null, tint = Charcoal.copy(alpha = .45f))
            }
            if (item.body.isNotBlank()) Text(item.body, color = Charcoal.copy(alpha = .88f), lineHeight = 21.sp, maxLines = if (section == MainSection.Feed) 8 else 4, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 13.dp))
            if (item.meta.isNotBlank()) Text(item.meta, color = InkMuted, fontSize = 11.sp, modifier = Modifier.padding(top = 12.dp))
        }
    }
}

@Composable
private fun EmptyState(section: MainSection) {
    Column(
        Modifier.fillMaxWidth().padding(top = 56.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(Modifier.size(64.dp).background(Color.White.copy(alpha = .07f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(section.icon(), null, tint = Olive, modifier = Modifier.size(28.dp))
        }
        Text("Nothing here yet", color = WarmWhite, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 16.dp))
        Text("Pull your learning circle together and start something.", color = Color.White.copy(alpha = .48f), fontSize = 13.sp, modifier = Modifier.padding(top = 5.dp))
    }
}

@Composable
private fun ConversationScreen(state: AppUiState, onBack: () -> Unit, onSend: (String) -> Unit, onCall: (String) -> Unit) {
    var composer by remember { mutableStateOf("") }
    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
        containerColor = Charcoal,
        topBar = {
            Row(Modifier.statusBarsPadding().fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Back") }
                Box(Modifier.size(40.dp).background(Plum, CircleShape), contentAlignment = Alignment.Center) { Text(state.conversation?.title?.take(1)?.uppercase().orEmpty(), fontWeight = FontWeight.Bold) }
                Column(Modifier.weight(1f).padding(horizontal = 11.dp)) {
                    Text(state.conversation?.title.orEmpty(), fontWeight = FontWeight.Bold, maxLines = 1)
                    Text("Direct message", color = Color.White.copy(alpha = .45f), fontSize = 11.sp)
                }
                IconButton(onClick = { onCall("audio") }) { Icon(Icons.Rounded.Call, "Voice call") }
                IconButton(onClick = { onCall("video") }) { Icon(Icons.Rounded.VideoCall, "Video call") }
            }
        },
        bottomBar = {
            Row(Modifier.fillMaxWidth().imePadding().navigationBarsPadding().padding(10.dp), verticalAlignment = Alignment.Bottom) {
                OutlinedTextField(
                    value = composer,
                    onValueChange = { composer = it },
                    placeholder = { Text("Message ${state.conversation?.title.orEmpty()}") },
                    shape = RoundedCornerShape(22.dp),
                    maxLines = 5,
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = { if (composer.isNotBlank()) { onSend(composer); composer = "" } }),
                )
                Spacer(Modifier.width(8.dp))
                FloatingActionButton(
                    onClick = { if (composer.isNotBlank()) { onSend(composer); composer = "" } },
                    modifier = Modifier.size(52.dp),
                    shape = CircleShape,
                    containerColor = Olive,
                ) { Icon(Icons.AutoMirrored.Rounded.Send, "Send") }
            }
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 12.dp),
            reverseLayout = true,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(state.messages.reversed(), key = { "message-${it.id}" }) { message ->
                val mine = message.raw.optString("senderId") == state.user?.id
                Row(Modifier.fillMaxWidth(), horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start) {
                    Column(
                        Modifier.fillMaxWidth(.82f).background(if (mine) Plum else Cream, RoundedCornerShape(20.dp)).padding(13.dp),
                    ) {
                        if (!mine) Text(message.title, color = Charcoal, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text(message.body.ifBlank { message.title }, color = if (mine) WarmWhite else Charcoal)
                        if (message.meta.isNotBlank()) Text(message.meta, color = if (mine) Color.White.copy(alpha = .5f) else InkMuted, fontSize = 9.sp, modifier = Modifier.align(Alignment.End).padding(top = 4.dp))
                    }
                }
            }
            if (state.messages.isEmpty()) item { Text("Start the conversation.", color = Color.White.copy(alpha = .45f), modifier = Modifier.padding(24.dp)) }
        }
    }
}

@Composable
private fun CreatePostDialog(onDismiss: () -> Unit, onCreate: (String) -> Unit) {
    var content by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Share what you’re learning") },
        text = {
            OutlinedTextField(value = content, onValueChange = { content = it }, minLines = 5, maxLines = 12, placeholder = { Text("An insight, question, or small win…") }, shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth())
        },
        confirmButton = { Button(onClick = { onCreate(content) }, enabled = content.isNotBlank(), colors = ButtonDefaults.buttonColors(containerColor = Olive)) { Text("Post") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun BrandMark() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Image(
            painter = painterResource(R.drawable.student_social_icon),
            contentDescription = null,
            modifier = Modifier.size(44.dp),
        )
        Text(
            "student.social",
            color = WarmWhite,
            fontWeight = FontWeight.Bold,
            fontSize = 20.sp,
            modifier = Modifier.padding(start = 10.dp),
        )
    }
}

private fun MainSection.icon(): ImageVector = when (this) {
    MainSection.Feed -> Icons.Rounded.Home
    MainSection.Pods -> Icons.Rounded.Groups
    MainSection.Calendar -> Icons.Rounded.CalendarMonth
    MainSection.Chat -> Icons.Rounded.ChatBubbleOutline
    MainSection.Vault -> Icons.Rounded.CollectionsBookmark
}

private fun sectionTitle(section: MainSection): String = when (section) {
    MainSection.Feed -> "Learning, together."
    MainSection.Pods -> "Your study circles"
    MainSection.Calendar -> "Your learning rhythm"
    MainSection.Chat -> "People you learn with"
    MainSection.Vault -> "Saved knowledge"
}

private fun searchHint(section: MainSection): String = when (section) {
    MainSection.Feed -> "Search posts and ideas"
    MainSection.Pods -> "Search pods, topics, or skills"
    MainSection.Calendar -> "Search sessions"
    MainSection.Chat -> "Search people"
    MainSection.Vault -> "Search your resources"
}

private fun greeting(): String {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return when (hour) {
        in 5..11 -> "GOOD MORNING"
        in 12..16 -> "GOOD AFTERNOON"
        else -> "GOOD EVENING"
    }
}
