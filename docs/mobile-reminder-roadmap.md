# Mobile reminder follow-up

When the native Android application work resumes, calendar reminders must use Android's native alarm and notification APIs instead of depending on a browser tab.

- Schedule and cancel device alarms whenever a calendar event or reminder changes.
- Reconcile alarms after login, app update, device restart, timezone change, and network recovery.
- Use a high-priority notification channel with event title, start time, Snooze, Open, and Join actions.
- Keep server email and in-app reminders as fallbacks and deduplicate them with the native notification.
- Request exact-alarm permission only when the Android version requires it and explain why before opening system settings.
