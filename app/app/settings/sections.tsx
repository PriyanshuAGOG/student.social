import { User, Bell, Shield, Palette, Globe, Smartphone, Database, HelpCircle, CreditCard, Users, Lock, Eye, MessageSquare, Calendar, BookOpen, Zap, Download, Trash2, LogOut } from 'lucide-react'

export interface SettingItem {
  id: string
  title: string
  description: string
  type: 'toggle' | 'select' | 'input' | 'button' | 'range'
  value?: any
  options?: { label: string; value: string }[]
  min?: number
  max?: number
  step?: number
  action?: () => void
  destructive?: boolean
}

export interface SettingSection {
  id: string
  title: string
  description: string
  icon: any
  items: SettingItem[]
}

export const settingsSections: SettingSection[] = [
  {
    id: 'profile',
    title: 'Profile',
    description: 'Manage your personal information and public profile',
    icon: User,
    items: [
      {
        id: 'display-name',
        title: 'Display Name',
        description: 'Your name as it appears to other users',
        type: 'input',
        value: 'John Doe'
      },
      {
        id: 'bio',
        title: 'Bio',
        description: 'Tell others about yourself',
        type: 'input',
        value: 'Computer Science student passionate about AI and machine learning'
      },
      {
        id: 'profile-visibility',
        title: 'Profile Visibility',
        description: 'Control who can see your profile',
        type: 'select',
        value: 'public',
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Friends Only', value: 'friends' },
          { label: 'Private', value: 'private' }
        ]
      },
      {
        id: 'show-online-status',
        title: 'Show Online Status',
        description: 'Let others see when you\'re online',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure how and when you receive notifications',
    icon: Bell,
    items: [
      {
        id: 'push-notifications',
        title: 'Push Notifications',
        description: 'Receive notifications on your device',
        type: 'toggle',
        value: true
      },
      {
        id: 'email-notifications',
        title: 'Email Notifications',
        description: 'Receive notifications via email',
        type: 'toggle',
        value: false
      },
      {
        id: 'notification-frequency',
        title: 'Notification Frequency',
        description: 'How often to receive digest emails',
        type: 'select',
        value: 'daily',
        options: [
          { label: 'Real-time', value: 'realtime' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Never', value: 'never' }
        ]
      },
      {
        id: 'pod-notifications',
        title: 'Pod Activity',
        description: 'Notifications from your study pods',
        type: 'toggle',
        value: true
      },
      {
        id: 'message-notifications',
        title: 'Direct Messages',
        description: 'Notifications for new messages',
        type: 'toggle',
        value: true
      },
      {
        id: 'calendar-reminders',
        title: 'Calendar Reminders',
        description: 'Reminders for upcoming events',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    description: 'Control your privacy settings and account security',
    icon: Shield,
    items: [
      {
        id: 'two-factor-auth',
        title: 'Two-Factor Authentication',
        description: 'Add an extra layer of security to your account',
        type: 'toggle',
        value: false
      },
      {
        id: 'login-alerts',
        title: 'Login Alerts',
        description: 'Get notified of new login attempts',
        type: 'toggle',
        value: true
      },
      {
        id: 'data-sharing',
        title: 'Data Sharing',
        description: 'Allow anonymous usage data collection',
        type: 'toggle',
        value: false
      },
      {
        id: 'search-visibility',
        title: 'Search Visibility',
        description: 'Allow others to find you in search',
        type: 'toggle',
        value: true
      },
      {
        id: 'activity-status',
        title: 'Activity Status',
        description: 'Show your activity status to others',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize the look and feel of your interface',
    icon: Palette,
    items: [
      {
        id: 'theme',
        title: 'Theme',
        description: 'Choose your preferred color scheme',
        type: 'select',
        value: 'system',
        options: [
          { label: 'System', value: 'system' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' }
        ]
      },
      {
        id: 'font-size',
        title: 'Font Size',
        description: 'Adjust text size for better readability',
        type: 'select',
        value: 'medium',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' }
        ]
      },
      {
        id: 'compact-mode',
        title: 'Compact Mode',
        description: 'Show more content in less space',
        type: 'toggle',
        value: false
      },
      {
        id: 'animations',
        title: 'Animations',
        description: 'Enable interface animations',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'language',
    title: 'Language & Region',
    description: 'Set your language and regional preferences',
    icon: Globe,
    items: [
      {
        id: 'language',
        title: 'Language',
        description: 'Choose your preferred language',
        type: 'select',
        value: 'en',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Chinese', value: 'zh' }
        ]
      },
      {
        id: 'timezone',
        title: 'Timezone',
        description: 'Your local timezone for scheduling',
        type: 'select',
        value: 'UTC-5',
        options: [
          { label: 'Eastern Time (UTC-5)', value: 'UTC-5' },
          { label: 'Central Time (UTC-6)', value: 'UTC-6' },
          { label: 'Mountain Time (UTC-7)', value: 'UTC-7' },
          { label: 'Pacific Time (UTC-8)', value: 'UTC-8' }
        ]
      },
      {
        id: 'date-format',
        title: 'Date Format',
        description: 'How dates are displayed',
        type: 'select',
        value: 'MM/DD/YYYY',
        options: [
          { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
          { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
          { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
        ]
      }
    ]
  },
  {
    id: 'mobile',
    title: 'Mobile',
    description: 'Settings specific to mobile app usage',
    icon: Smartphone,
    items: [
      {
        id: 'offline-mode',
        title: 'Offline Mode',
        description: 'Download content for offline access',
        type: 'toggle',
        value: false
      },
      {
        id: 'mobile-data',
        title: 'Use Mobile Data',
        description: 'Allow app to use mobile data',
        type: 'toggle',
        value: true
      },
      {
        id: 'auto-download',
        title: 'Auto-download Resources',
        description: 'Automatically download study materials',
        type: 'toggle',
        value: false
      },
      {
        id: 'haptic-feedback',
        title: 'Haptic Feedback',
        description: 'Vibration feedback for interactions',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'data',
    title: 'Data & Storage',
    description: 'Manage your data usage and storage preferences',
    icon: Database,
    items: [
      {
        id: 'auto-backup',
        title: 'Auto Backup',
        description: 'Automatically backup your data',
        type: 'toggle',
        value: true
      },
      {
        id: 'storage-limit',
        title: 'Storage Limit',
        description: 'Maximum storage for cached content',
        type: 'select',
        value: '1GB',
        options: [
          { label: '500MB', value: '500MB' },
          { label: '1GB', value: '1GB' },
          { label: '2GB', value: '2GB' },
          { label: '5GB', value: '5GB' }
        ]
      },
      {
        id: 'clear-cache',
        title: 'Clear Cache',
        description: 'Remove temporary files and cached data',
        type: 'button',
        action: () => console.log('Clearing cache...')
      },
      {
        id: 'export-data',
        title: 'Export Data',
        description: 'Download a copy of your data',
        type: 'button',
        action: () => console.log('Exporting data...')
      }
    ]
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    description: 'Manage your subscription and payment methods',
    icon: CreditCard,
    items: [
      {
        id: 'current-plan',
        title: 'Current Plan',
        description: 'You are on the Free plan',
        type: 'button',
        action: () => console.log('Manage subscription...')
      },
      {
        id: 'payment-method',
        title: 'Payment Method',
        description: 'Manage your payment methods',
        type: 'button',
        action: () => console.log('Manage payment methods...')
      },
      {
        id: 'billing-history',
        title: 'Billing History',
        description: 'View your past invoices',
        type: 'button',
        action: () => console.log('View billing history...')
      },
      {
        id: 'auto-renew',
        title: 'Auto-renewal',
        description: 'Automatically renew your subscription',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'pods',
    title: 'Study Pods',
    description: 'Configure your study pod preferences',
    icon: Users,
    items: [
      {
        id: 'pod-invites',
        title: 'Pod Invitations',
        description: 'Who can invite you to study pods',
        type: 'select',
        value: 'friends',
        options: [
          { label: 'Anyone', value: 'anyone' },
          { label: 'Friends Only', value: 'friends' },
          { label: 'No One', value: 'none' }
        ]
      },
      {
        id: 'auto-join-public',
        title: 'Auto-join Public Pods',
        description: 'Automatically join relevant public study pods',
        type: 'toggle',
        value: false
      },
      {
        id: 'pod-notifications',
        title: 'Pod Notifications',
        description: 'Receive notifications from your pods',
        type: 'toggle',
        value: true
      },
      {
        id: 'show-pod-activity',
        title: 'Show Pod Activity',
        description: 'Display your pod activity on your profile',
        type: 'toggle',
        value: true
      }
    ]
  },
  {
    id: 'help',
    title: 'Help & Support',
    description: 'Get help and provide feedback',
    icon: HelpCircle,
    items: [
      {
        id: 'help-center',
        title: 'Help Center',
        description: 'Browse our help articles and guides',
        type: 'button',
        action: () => console.log('Opening help center...')
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        description: 'Get in touch with our support team',
        type: 'button',
        action: () => console.log('Contacting support...')
      },
      {
        id: 'send-feedback',
        title: 'Send Feedback',
        description: 'Help us improve PeerSpark',
        type: 'button',
        action: () => console.log('Sending feedback...')
      },
      {
        id: 'report-bug',
        title: 'Report a Bug',
        description: 'Report technical issues',
        type: 'button',
        action: () => console.log('Reporting bug...')
      }
    ]
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Manage your account settings and data',
    icon: Lock,
    items: [
      {
        id: 'change-password',
        title: 'Change Password',
        description: 'Update your account password',
        type: 'button',
        action: () => console.log('Changing password...')
      },
      {
        id: 'change-email',
        title: 'Change Email',
        description: 'Update your email address',
        type: 'button',
        action: () => console.log('Changing email...')
      },
      {
        id: 'download-data',
        title: 'Download Your Data',
        description: 'Get a copy of all your data',
        type: 'button',
        action: () => console.log('Downloading data...')
      },
      {
        id: 'deactivate-account',
        title: 'Deactivate Account',
        description: 'Temporarily deactivate your account',
        type: 'button',
        action: () => console.log('Deactivating account...'),
        destructive: true
      },
      {
        id: 'delete-account',
        title: 'Delete Account',
        description: 'Permanently delete your account and all data',
        type: 'button',
        action: () => console.log('Deleting account...'),
        destructive: true
      },
      {
        id: 'logout',
        title: 'Log Out',
        description: 'Sign out of your account',
        type: 'button',
        action: () => console.log('Logging out...'),
        destructive: true
      }
    ]
  }
]

export type { SettingSection, SettingItem }
