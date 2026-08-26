package social.student.mobile.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import social.student.mobile.BuildConfig
import social.student.mobile.data.ApiException
import social.student.mobile.data.AppRelease
import social.student.mobile.data.CallCredentials
import social.student.mobile.data.IncomingCall
import social.student.mobile.data.NativeItem
import social.student.mobile.data.NativeUser
import social.student.mobile.data.StudentSocialRepository

enum class MainSection(val label: String) {
    Feed("Feed"),
    Pods("Pods"),
    Calendar("Calendar"),
    Chat("Chat"),
    Vault("Vault"),
}

data class AppUiState(
    val booting: Boolean = true,
    val busy: Boolean = false,
    val user: NativeUser? = null,
    val section: MainSection = MainSection.Feed,
    val items: List<NativeItem> = emptyList(),
    val search: String = "",
    val conversation: NativeItem? = null,
    val roomId: String = "",
    val messages: List<NativeItem> = emptyList(),
    val activeCall: CallCredentials? = null,
    val incomingCall: IncomingCall? = null,
    val callCandidates: List<NativeItem> = emptyList(),
    val release: AppRelease? = null,
    val error: String = "",
    val notice: String = "",
)

class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = StudentSocialRepository(application)
    private val _state = MutableStateFlow(AppUiState())
    val state: StateFlow<AppUiState> = _state.asStateFlow()
    private var messageRefresh: Job? = null
    private var incomingRefresh: Job? = null

    init {
        viewModelScope.launch {
            val user = runCatching { repository.session() }.getOrNull()
            _state.value = _state.value.copy(booting = false, user = user)
            if (user != null) {
                load(MainSection.Feed)
                checkForUpdate()
                startIncomingCallPolling()
            }
        }
    }

    fun login(email: String, password: String) = launchBusy {
        val user = repository.login(email.trim(), password)
        _state.value = _state.value.copy(user = user, notice = "Welcome back, ${user.name}")
        load(MainSection.Feed)
        checkForUpdate()
        startIncomingCallPolling()
    }

    fun logout() = viewModelScope.launch {
        messageRefresh?.cancel()
        incomingRefresh?.cancel()
        repository.logout()
        _state.value = AppUiState(booting = false)
    }

    fun select(section: MainSection) {
        messageRefresh?.cancel()
        _state.value = _state.value.copy(section = section, conversation = null, roomId = "", messages = emptyList(), search = "")
        load(section)
    }

    fun refresh() = load(_state.value.section)

    fun search(value: String) {
        _state.value = _state.value.copy(search = value)
    }

    fun createPost(content: String) = launchBusy {
        val user = requireNotNull(_state.value.user)
        repository.createPost(user.id, content.trim())
        _state.value = _state.value.copy(notice = "Your post is live")
        load(MainSection.Feed)
    }

    fun openConversation(person: NativeItem) = launchBusy {
        val user = requireNotNull(_state.value.user)
        val recipientId = person.raw.optString("userId").ifBlank { person.id }
        val roomId = repository.directRoom(recipientId)
        val messages = repository.messages(roomId, user.id)
        _state.value = _state.value.copy(conversation = person, roomId = roomId, messages = messages, search = "")
        messageRefresh?.cancel()
        messageRefresh = viewModelScope.launch {
            while (true) {
                delay(2_000)
                val current = _state.value
                if (current.roomId != roomId || current.conversation == null) break
                runCatching { repository.messages(roomId, user.id) }
                    .onSuccess { _state.value = _state.value.copy(messages = it) }
            }
        }
    }

    fun closeConversation() {
        messageRefresh?.cancel()
        _state.value = _state.value.copy(conversation = null, roomId = "", messages = emptyList())
    }

    fun sendMessage(content: String) = launchBusy {
        val current = _state.value
        val user = requireNotNull(current.user)
        if (content.isBlank() || current.roomId.isBlank()) return@launchBusy
        repository.sendMessage(user.id, current.roomId, content.trim())
        _state.value = _state.value.copy(messages = repository.messages(current.roomId, user.id))
    }

    fun startCall(mediaType: String) = launchBusy {
        val current = _state.value
        if (current.roomId.isBlank()) throw IllegalStateException("Open a conversation first")
        val title = current.conversation?.title.orEmpty().ifBlank { "Student.social call" }
        val credentials = repository.startCall(current.roomId, mediaType, title)
        _state.value = _state.value.copy(activeCall = credentials)
    }

    fun openCall(sessionId: String) = launchBusy {
        runCatching { repository.updateCall(sessionId, "accept") }
        _state.value = _state.value.copy(activeCall = repository.callCredentials(sessionId))
    }

    fun acceptIncomingCall() {
        val incoming = _state.value.incomingCall ?: return
        _state.value = _state.value.copy(incomingCall = null)
        openCall(incoming.sessionId)
    }

    fun declineIncomingCall() {
        val incoming = _state.value.incomingCall ?: return
        _state.value = _state.value.copy(incomingCall = null)
        viewModelScope.launch { runCatching { repository.updateCall(incoming.sessionId, "decline") } }
    }

    fun finishCall(action: String = "leave") {
        val call = _state.value.activeCall ?: return
        _state.value = _state.value.copy(activeCall = null)
        viewModelScope.launch { runCatching { repository.updateCall(call.sessionId, action) } }
    }

    fun loadCallCandidates() = launchBusy {
        val call = requireNotNull(_state.value.activeCall)
        _state.value = _state.value.copy(callCandidates = repository.callCandidates(call.sessionId))
    }

    fun inviteToCall(person: NativeItem) = launchBusy {
        val call = requireNotNull(_state.value.activeCall)
        val userId = person.raw.optString("userId").ifBlank { person.id }
        repository.inviteToCall(call.sessionId, userId)
        _state.value = _state.value.copy(
            callCandidates = _state.value.callCandidates.filterNot { it.id == person.id },
            notice = "${person.title} was invited",
        )
    }

    fun clearMessage() {
        _state.value = _state.value.copy(error = "", notice = "")
    }

    private fun load(section: MainSection) = launchBusy {
        val user = requireNotNull(_state.value.user)
        val items = when (section) {
            MainSection.Feed -> repository.posts(user.id)
            MainSection.Pods -> repository.pods()
            MainSection.Calendar -> repository.events(user.id)
            MainSection.Chat -> repository.profiles().filterNot { it.id == user.id || it.raw.optString("userId") == user.id }
            MainSection.Vault -> repository.resources()
        }
        _state.value = _state.value.copy(section = section, items = items)
    }

    private fun checkForUpdate() = viewModelScope.launch {
        runCatching { repository.release() }.onSuccess { release ->
            if (release.versionCode > BuildConfig.VERSION_CODE) {
                _state.value = _state.value.copy(release = release)
            }
        }
    }

    private fun startIncomingCallPolling() {
        incomingRefresh?.cancel()
        incomingRefresh = viewModelScope.launch {
            while (_state.value.user != null) {
                if (_state.value.activeCall == null) {
                    runCatching { repository.incomingCall() }.onSuccess { incoming ->
                        _state.value = _state.value.copy(incomingCall = incoming)
                    }
                }
                delay(3_000)
            }
        }
    }

    private fun launchBusy(block: suspend () -> Unit) = viewModelScope.launch {
        _state.value = _state.value.copy(busy = true, error = "")
        runCatching { block() }
            .onFailure { error ->
                val message = when (error) {
                    is ApiException -> error.message ?: "Request failed (${error.status})"
                    else -> error.message ?: "Something went wrong"
                }
                _state.value = _state.value.copy(error = message)
            }
        _state.value = _state.value.copy(busy = false)
    }
}
