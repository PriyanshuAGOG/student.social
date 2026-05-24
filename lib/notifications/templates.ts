/**
 * Notification Template Management
 */

import { databases } from '@/lib/appwrite'
import { Query, ID } from 'appwrite'
import { getEnv } from '@/lib/env'
import { NotificationTemplate, NotificationChannel, NotificationCategory } from './schema'
import { renderTemplate } from './utils'

const env = getEnv()
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || ''
const COLLECTION_ID = 'notification_templates'

/**
 * Get a template by key, channel, and locale
 */
export async function getTemplate(
  templateKey: string,
  channel: NotificationChannel,
  locale: string = 'en'
): Promise<NotificationTemplate | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('templateKey', templateKey),
        Query.equal('channel', channel),
        Query.equal('locale', locale),
        Query.equal('status', 'active'),
      ]
    )

    if (response.documents.length > 0) {
      return response.documents[0] as NotificationTemplate
    }

    // Fallback to English if requested locale not available
    if (locale !== 'en') {
      const enResponse = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal('templateKey', templateKey),
        Query.equal('channel', channel),
        Query.equal('locale', 'en'),
        Query.equal('status', 'active'),
      ])

      return enResponse.documents.length > 0 ? (enResponse.documents[0] as NotificationTemplate) : null
    }

    return null
  } catch (error) {
    console.error('[Templates] Failed to get template:', error)
    return null
  }
}

/**
 * Render template with variables
 */
export async function renderNotificationTemplate(
  templateKey: string,
  channel: NotificationChannel,
  variables: Record<string, any>,
  locale: string = 'en'
): Promise<{
  title?: string
  subject?: string
  body: string
  html?: string
  ctaLabel?: string
  ctaUrl?: string
} | null> {
  try {
    const template = await getTemplate(templateKey, channel, locale)

    if (!template) {
      console.warn(`[Templates] Template not found: ${templateKey}/${channel}/${locale}`)
      return null
    }

    return {
      title: template.titleTemplate ? renderTemplate(template.titleTemplate, variables) : undefined,
      subject: template.subjectTemplate ? renderTemplate(template.subjectTemplate, variables) : undefined,
      body: renderTemplate(template.bodyTemplate, variables),
      html: template.htmlTemplate ? renderTemplate(template.htmlTemplate, variables) : undefined,
      ctaLabel: template.ctaLabelTemplate ? renderTemplate(template.ctaLabelTemplate, variables) : undefined,
      ctaUrl: template.ctaUrlTemplate ? renderTemplate(template.ctaUrlTemplate, variables) : undefined,
    }
  } catch (error) {
    console.error('[Templates] Error rendering template:', error)
    return null
  }
}

/**
 * Create or update a template
 */
export async function upsertTemplate(
  templateKey: string,
  channel: NotificationChannel,
  category: NotificationCategory,
  data: Partial<NotificationTemplate>
): Promise<NotificationTemplate | null> {
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal('templateKey', templateKey),
        Query.equal('channel', channel),
        Query.equal('locale', data.locale || 'en'),
      ]
    )

    const templateData = {
      templateKey,
      channel,
      category,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    if (existing.documents.length > 0) {
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, existing.documents[0].$id, templateData)
      return updated as NotificationTemplate
    } else {
      const created = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        ...templateData,
        createdAt: new Date().toISOString(),
      })
      return created as NotificationTemplate
    }
  } catch (error) {
    console.error('[Templates] Failed to upsert template:', error)
    return null
  }
}

/**
 * Default templates for common notification types
 */
export const DEFAULT_TEMPLATES: Record<string, NotificationTemplate> = {
  study_session_starting: {
    templateKey: 'study_session_starting',
    channel: 'push',
    category: 'study',
    titleTemplate: 'Study Time!',
    bodyTemplate: 'Your study session "{{sessionName}}" starts in {{minutesUntilStart}} minutes.',
    status: 'active',
    version: 1,
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  deadline_approaching: {
    templateKey: 'deadline_approaching',
    channel: 'email',
    category: 'deadline',
    subjectTemplate: 'Deadline Alert: {{assignmentName}}',
    bodyTemplate: `
Your assignment "{{assignmentName}}" is due in {{hoursRemaining}} hours.
Subject: {{subjectName}}
Due Date: {{dueDate}}

Don't miss this deadline!
    `.trim(),
    htmlTemplate: `
<h2>Deadline Alert</h2>
<p>Your assignment <strong>{{assignmentName}}</strong> is due in <strong>{{hoursRemaining}} hours</strong>.</p>
<p><strong>Subject:</strong> {{subjectName}}</p>
<p><strong>Due Date:</strong> {{dueDate}}</p>
<p>Don't miss this deadline!</p>
    `.trim(),
    status: 'active',
    version: 1,
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  streak_milestone: {
    templateKey: 'streak_milestone',
    channel: 'push',
    category: 'streak',
    titleTemplate: 'Amazing Progress!',
    bodyTemplate: 'You\'ve maintained a {{streakDays}}-day streak! Keep it up!',
    status: 'active',
    version: 1,
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  progress_update: {
    templateKey: 'progress_update',
    channel: 'in_app',
    category: 'progress',
    titleTemplate: 'Progress Update',
    bodyTemplate: 'You\'ve completed {{percentage}}% of your goals this week!',
    status: 'active',
    version: 1,
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  class_announcement: {
    templateKey: 'class_announcement',
    channel: 'push',
    category: 'class',
    titleTemplate: 'New Class Announcement',
    bodyTemplate: '{{professorName}} posted: {{announcementTitle}}',
    status: 'active',
    version: 1,
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  security_alert: {
    templateKey: 'security_alert',
    channel: 'email',
    category: 'security',
    subjectTemplate: 'Security Alert',
    bodyTemplate: `
We detected {{alertType}} on your account.

Details:
Location: {{location}}
Time: {{timestamp}}
Device: {{deviceName}}

If this wasn't you, please secure your account immediately.
    `.trim(),
    status: 'active',
    version: 1,
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  weekly_digest: {
    templateKey: 'weekly_digest',
    channel: 'email',
    category: 'digest',
    subjectTemplate: 'Your Weekly Summary - {{weekStartDate}} to {{weekEndDate}}',
    bodyTemplate: `
Here's your week in review:

Study Sessions: {{sessionsCompleted}}
Total Study Time: {{totalStudyMinutes}} minutes
Assignments Completed: {{assignmentsCompleted}}
Current Streak: {{currentStreak}} days

Keep up the great work!
    `.trim(),
    status: 'active',
    version: 1,
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

/**
 * Seed default templates in database
 */
export async function seedDefaultTemplates(): Promise<void> {
  try {
    for (const [key, template] of Object.entries(DEFAULT_TEMPLATES)) {
      await upsertTemplate(template.templateKey, template.channel, template.category, template)
    }
    console.log('[Templates] Default templates seeded')
  } catch (error) {
    console.error('[Templates] Failed to seed templates:', error)
  }
}

/**
 * Get all templates for a category
 */
export async function getTemplatesByCategory(category: NotificationCategory): Promise<NotificationTemplate[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('category', category), Query.equal('status', 'active')]
    )

    return response.documents as NotificationTemplate[]
  } catch (error) {
    console.error('[Templates] Failed to get templates by category:', error)
    return []
  }
}
