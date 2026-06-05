# PeerSpark QA Stabilization - 2026-06-04

This stabilization pass targeted the highest-impact issues from the 2026-06-04 QA report and added regression coverage for the implemented fixes.

## Implemented

### Retest follow-up

- Feed suggestions can now be dismissed with outside click, Escape, Enter, or by selecting a suggestion. Loading posts show skeleton cards.
- Global chat and pod chat now expose clearable message search with highlighted matches; pod chat send has an explicit accessible send label and retains Enter-to-send / Shift+Enter behavior.
- Settings keeps Auto-detect as the stored timezone option while showing the effective browser timezone; calendar event dialogs display the effective timezone and include a Today shortcut.
- AI chat now has an offline study fallback when provider keys are unavailable instead of only returning a configuration failure.
- Leaderboard period selection has a higher stacking context and focus ring to avoid overlap/clickability regressions.
- Chat was reworked toward a WhatsApp/Telegram-style experience: theme-aware surfaces replace the black-only UI, DMs/groups/pods filters are functional, voice/video call buttons remain visible, voice/video calls now use the LiveKit-backed session service for DMs, groups, and pod rooms.
- Chat messages now support deduplicated toggle reactions, quick reaction palettes, edit/delete/reply actions, emoji insertion, file/image attachments, and browser voice-message recording with user-friendly microphone errors.
- Follow-up chat overhaul adds a working New chat dialog for DMs/groups, inline message editing with Save/Cancel, delete confirmation, right-click/copy affordances, search next/previous navigation, a richer conversation details panel with call actions, attachment upload status, and audio playback for voice messages.
- Call follow-up replaces pop-out chat call launches with an in-page LiveKit call stage, including a pre-join lobby, mic/camera defaults, invite-link copy, connection/status badges, device selectors, screen-share/chat controls, minimize/end actions, and a session token route that verifies chat membership before issuing LiveKit credentials.


- Feed search now uses fuzzy matching and live suggestions, and post cards render persisted image/file attachment metadata with legacy image fallback.
- Post creation now supports a file picker, inline content/attachment validation, authenticated server-side attachment uploads, stored attachment metadata, and attachment previews/removal before publishing.
- Pod creation now validates required fields inline with blur feedback, helper copy, and character limits.
- Calendar month/week/day views are wired, hourly slots can open event creation, time inputs default to 09:00-10:00 and use 15-minute increments, and end times are validated.
- AI Assistant now exposes file selection for attachment-analysis prompts and replaces API configuration wording with a user-friendly service outage message.
- Notifications now show tab badge counts, an empty-state call to action, and a preferences anchor.
- Resource Vault now has reusable empty states and disables search/sort when there are no resources.
- Settings now auto-detects browser time zone, includes Asia/Kolkata and IANA time zones, applies font size immediately, and documents data export contents.
- Admin page rendering is wrapped with a client-side role guard in addition to the existing admin API authorization.

## Regression coverage

`tests.contract.mjs` now includes static regression checks for the QA fixes above so future changes do not remove these behaviors accidentally.

## Deferred / requires provider configuration

Some QA items require infrastructure or product decisions beyond a single code pass, including real-time collaborative whiteboard syncing, production AI/OCR/STT provider credentials, production LiveKit credentials / TURN-egress configuration, push notification delivery, data export jobs for chats/posts/resources, and database index migrations. Those should be handled as follow-up milestones with staging credentials.
