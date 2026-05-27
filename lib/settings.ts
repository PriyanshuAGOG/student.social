export type ThemeMode = 'system' | 'light' | 'dark'
export type FontSize = 'small' | 'medium' | 'large'
export type NotificationFrequency = 'realtime' | 'daily' | 'weekly' | 'never'
export type PrivacyVisibility = 'public' | 'friends' | 'private'
export type StorageLimit = '500MB' | '1GB' | '2GB' | '5GB'
export type PodInvitePolicy = 'anyone' | 'friends' | 'none'

export type PeerSparkSettings = {
  version: 1
  appearance: {
    theme: ThemeMode
    fontSize: FontSize
    compactMode: boolean
    animations: boolean
  }
  notifications: {
    pushNotifications: boolean
    emailNotifications: boolean
    notificationFrequency: NotificationFrequency
    podNotifications: boolean
    messageNotifications: boolean
    calendarReminders: boolean
    weeklyDigest: boolean
    marketingEmails: boolean
    podUpdates: boolean
    directMessages: boolean
    mentions: boolean
    achievements: boolean
  }
  privacy: {
    profileVisibility: PrivacyVisibility
    showOnlineStatus: boolean
    dataSharing: boolean
    searchVisibility: boolean
    activityStatus: boolean
    showEmail: boolean
    showLocation: boolean
    allowMessages: boolean
    showStudyStats: boolean
    allowPodInvites: boolean
    loginAlerts: boolean
    twoFactorEnabled: boolean
  }
  language: {
    language: string
    timezone: string
    dateFormat: string
  }
  mobile: {
    offlineMode: boolean
    mobileData: boolean
    autoDownload: boolean
    hapticFeedback: boolean
  }
  data: {
    autoBackup: boolean
    storageLimit: StorageLimit
  }
  billing: {
    autoRenew: boolean
  }
  pods: {
    podInvites: PodInvitePolicy
    autoJoinPublic: boolean
    podNotifications: boolean
    showPodActivity: boolean
  }
}

export const PEERSPARK_SETTINGS_PREF_KEY = 'peersparkSettings'

export function getDefaultPeerSparkSettings(): PeerSparkSettings {
  return {
    version: 1,
    appearance: {
      theme: 'system',
      fontSize: 'medium',
      compactMode: false,
      animations: true,
    },
    notifications: {
      pushNotifications: true,
      emailNotifications: false,
      notificationFrequency: 'daily',
      podNotifications: true,
      messageNotifications: true,
      calendarReminders: true,
      weeklyDigest: false,
      marketingEmails: false,
      podUpdates: true,
      directMessages: true,
      mentions: true,
      achievements: true,
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      dataSharing: false,
      searchVisibility: true,
      activityStatus: true,
      showEmail: false,
      showLocation: true,
      allowMessages: true,
      showStudyStats: true,
      allowPodInvites: true,
      loginAlerts: true,
      twoFactorEnabled: false,
    },
    language: {
      language: 'en',
      timezone: 'UTC-5',
      dateFormat: 'MM/DD/YYYY',
    },
    mobile: {
      offlineMode: false,
      mobileData: true,
      autoDownload: false,
      hapticFeedback: true,
    },
    data: {
      autoBackup: true,
      storageLimit: '1GB',
    },
    billing: {
      autoRenew: true,
    },
    pods: {
      podInvites: 'friends',
      autoJoinPublic: false,
      podNotifications: true,
      showPodActivity: true,
    },
  }
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function mergeSection<T extends Record<string, any>>(defaults: T, overrides: unknown): T {
  if (!isRecord(overrides)) {
    return { ...defaults }
  }

  return Object.entries(defaults).reduce((acc, [key, defaultValue]) => {
    const overrideValue = overrides[key]

    if (isRecord(defaultValue)) {
      acc[key as keyof T] = mergeSection(defaultValue, overrideValue) as T[keyof T]
      return acc
    }

    if (overrideValue !== undefined) {
      acc[key as keyof T] = overrideValue as T[keyof T]
      return acc
    }

    acc[key as keyof T] = defaultValue
    return acc
  }, { ...defaults })
}

export function normalizePeerSparkSettings(value: unknown): PeerSparkSettings {
  return mergeSection(getDefaultPeerSparkSettings(), value)
}

export function flattenPeerSparkSettings(settings: PeerSparkSettings) {
  return {
    'notifications.push-notifications': settings.notifications.pushNotifications,
    'notifications.email-notifications': settings.notifications.emailNotifications,
    'notifications.notification-frequency': settings.notifications.notificationFrequency,
    'notifications.pod-notifications': settings.notifications.podNotifications,
    'notifications.message-notifications': settings.notifications.messageNotifications,
    'notifications.calendar-reminders': settings.notifications.calendarReminders,
    'privacy.login-alerts': settings.privacy.loginAlerts,
    'privacy.data-sharing': settings.privacy.dataSharing,
    'privacy.search-visibility': settings.privacy.searchVisibility,
    'privacy.activity-status': settings.privacy.activityStatus,
    'privacy.show-email': settings.privacy.showEmail,
    'privacy.show-location': settings.privacy.showLocation,
    'privacy.allow-messages': settings.privacy.allowMessages,
    'privacy.show-study-stats': settings.privacy.showStudyStats,
    'privacy.allow-pod-invites': settings.privacy.allowPodInvites,
    'privacy.two-factor-auth': settings.privacy.twoFactorEnabled,
    'appearance.theme': settings.appearance.theme,
    'appearance.font-size': settings.appearance.fontSize,
    'appearance.compact-mode': settings.appearance.compactMode,
    'appearance.animations': settings.appearance.animations,
    'language.language': settings.language.language,
    'language.timezone': settings.language.timezone,
    'language.date-format': settings.language.dateFormat,
    'mobile.offline-mode': settings.mobile.offlineMode,
    'mobile.mobile-data': settings.mobile.mobileData,
    'mobile.auto-download': settings.mobile.autoDownload,
    'mobile.haptic-feedback': settings.mobile.hapticFeedback,
    'data.auto-backup': settings.data.autoBackup,
    'data.storage-limit': settings.data.storageLimit,
    'billing.auto-renew': settings.billing.autoRenew,
    'pods.pod-invites': settings.pods.podInvites,
    'pods.auto-join-public': settings.pods.autoJoinPublic,
    'pods.pod-notifications': settings.pods.podNotifications,
    'pods.show-pod-activity': settings.pods.showPodActivity,
  }
}

export function buildPeerSparkSettingsFromFlat(flat: Record<string, any>): PeerSparkSettings {
  const defaults = getDefaultPeerSparkSettings()

  return {
    ...defaults,
    appearance: {
      ...defaults.appearance,
      theme: flat['appearance.theme'] || defaults.appearance.theme,
      fontSize: flat['appearance.font-size'] || defaults.appearance.fontSize,
      compactMode: flat['appearance.compact-mode'] ?? defaults.appearance.compactMode,
      animations: flat['appearance.animations'] ?? defaults.appearance.animations,
    },
    notifications: {
      ...defaults.notifications,
      pushNotifications: flat['notifications.push-notifications'] ?? defaults.notifications.pushNotifications,
      emailNotifications: flat['notifications.email-notifications'] ?? defaults.notifications.emailNotifications,
      notificationFrequency: flat['notifications.notification-frequency'] || defaults.notifications.notificationFrequency,
      podNotifications: flat['notifications.pod-notifications'] ?? defaults.notifications.podNotifications,
      messageNotifications: flat['notifications.message-notifications'] ?? defaults.notifications.messageNotifications,
      calendarReminders: flat['notifications.calendar-reminders'] ?? defaults.notifications.calendarReminders,
      weeklyDigest: flat['notifications.weekly-digest'] ?? defaults.notifications.weeklyDigest,
      marketingEmails: flat['notifications.marketing-emails'] ?? defaults.notifications.marketingEmails,
      podUpdates: flat['notifications.pod-updates'] ?? defaults.notifications.podUpdates,
      directMessages: flat['notifications.direct-messages'] ?? defaults.notifications.directMessages,
      mentions: flat['notifications.mentions'] ?? defaults.notifications.mentions,
      achievements: flat['notifications.achievements'] ?? defaults.notifications.achievements,
    },
    privacy: {
      ...defaults.privacy,
      profileVisibility: flat['profile.profile-visibility'] || defaults.privacy.profileVisibility,
      showOnlineStatus: flat['profile.show-online-status'] ?? defaults.privacy.showOnlineStatus,
      dataSharing: flat['privacy.data-sharing'] ?? defaults.privacy.dataSharing,
      searchVisibility: flat['privacy.search-visibility'] ?? defaults.privacy.searchVisibility,
      activityStatus: flat['privacy.activity-status'] ?? defaults.privacy.activityStatus,
      showEmail: flat['privacy.show-email'] ?? defaults.privacy.showEmail,
      showLocation: flat['privacy.show-location'] ?? defaults.privacy.showLocation,
      allowMessages: flat['privacy.allow-messages'] ?? defaults.privacy.allowMessages,
      showStudyStats: flat['privacy.show-study-stats'] ?? defaults.privacy.showStudyStats,
      allowPodInvites: flat['privacy.allow-pod-invites'] ?? defaults.privacy.allowPodInvites,
      loginAlerts: flat['privacy.login-alerts'] ?? defaults.privacy.loginAlerts,
      twoFactorEnabled: flat['privacy.two-factor-auth'] ?? defaults.privacy.twoFactorEnabled,
    },
    language: {
      ...defaults.language,
      language: flat['language.language'] || defaults.language.language,
      timezone: flat['language.timezone'] || defaults.language.timezone,
      dateFormat: flat['language.date-format'] || defaults.language.dateFormat,
    },
    mobile: {
      ...defaults.mobile,
      offlineMode: flat['mobile.offline-mode'] ?? defaults.mobile.offlineMode,
      mobileData: flat['mobile.mobile-data'] ?? defaults.mobile.mobileData,
      autoDownload: flat['mobile.auto-download'] ?? defaults.mobile.autoDownload,
      hapticFeedback: flat['mobile.haptic-feedback'] ?? defaults.mobile.hapticFeedback,
    },
    data: {
      ...defaults.data,
      autoBackup: flat['data.auto-backup'] ?? defaults.data.autoBackup,
      storageLimit: flat['data.storage-limit'] || defaults.data.storageLimit,
    },
    billing: {
      ...defaults.billing,
      autoRenew: flat['billing.auto-renew'] ?? defaults.billing.autoRenew,
    },
    pods: {
      ...defaults.pods,
      podInvites: flat['pods.pod-invites'] || defaults.pods.podInvites,
      autoJoinPublic: flat['pods.auto-join-public'] ?? defaults.pods.autoJoinPublic,
      podNotifications: flat['pods.pod-notifications'] ?? defaults.pods.podNotifications,
      showPodActivity: flat['pods.show-pod-activity'] ?? defaults.pods.showPodActivity,
    },
  }
}

export function buildPeerSparkSettingsPatch<T extends keyof PeerSparkSettings>(
  settings: PeerSparkSettings,
  section: T,
  key: string,
  value: unknown,
): PeerSparkSettings {
  return {
    ...settings,
    [section]: {
      ...settings[section],
      [key]: value,
    },
  }
}