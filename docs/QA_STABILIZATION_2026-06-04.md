# PeerSpark QA Stabilization - 2026-06-04

This stabilization pass targeted the highest-impact issues from the 2026-06-04 QA report and added regression coverage for the implemented fixes.

## Implemented

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

Some QA items require infrastructure or product decisions beyond a single code pass, including real-time collaborative whiteboard syncing, production AI/OCR/STT provider credentials, full video-conference provider setup, push notification delivery, data export jobs for chats/posts/resources, and database index migrations. Those should be handled as follow-up milestones with staging credentials.
