# PeerSpark Platform - Complete Appwrite Integration Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Appwrite Setup](#appwrite-setup)
3. [Database Schema](#database-schema)
4. [Authentication System](#authentication-system)
5. [Real-time Chat System](#real-time-chat-system)
6. [Push Notifications](#push-notifications)
7. [File Storage](#file-storage)
8. [Cloud Functions](#cloud-functions)
9. [Security Rules](#security-rules)
10. [Frontend Integration](#frontend-integration)
11. [Backend Services](#backend-services)
12. [Deployment Guide](#deployment-guide)
13. [Testing & Monitoring](#testing--monitoring)
14. [Performance Optimization](#performance-optimization)
15. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview

PeerSpark is a comprehensive social learning platform that connects students, professionals, and educators. The platform includes:

- **User Management**: Registration, authentication, profiles, and social connections
- **Content Sharing**: Posts, resources, and multimedia content
- **Real-time Communication**: Chat system with AI integration
- **Learning Pods**: Study groups and collaborative spaces
- **Resource Vault**: Document sharing and management
- **Event Management**: Calendar and scheduling system
- **Analytics Dashboard**: User engagement and performance metrics
- **Notification System**: Real-time updates and alerts

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Appwrite (BaaS)
- **Database**: Appwrite Database (NoSQL)
- **Authentication**: Appwrite Auth
- **Real-time**: Appwrite Realtime
- **Storage**: Appwrite Storage
- **Functions**: Appwrite Functions (Node.js)
- **Notifications**: Web Push API + Appwrite Functions

---

## 2. Appwrite Setup

### 2.1 Initial Setup

1. **Create Appwrite Account**
   \`\`\`bash
   # Visit https://cloud.appwrite.io
   # Create new account or sign in
   # Create new project: "PeerSpark Platform"
   \`\`\`

2. **Install Appwrite CLI**
   \`\`\`bash
   npm install -g appwrite-cli
   appwrite login
   \`\`\`

3. **Project Configuration**
   \`\`\`bash
   # Initialize project
   appwrite init project
   # Select existing project: PeerSpark Platform
   # Set project ID: peerspark-platform-prod
   \`\`\`

### 2.2 Environment Variables Setup

Create `.env.local` file:

\`\`\`env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=peerspark-platform-prod
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
NEXT_PUBLIC_APPWRITE_STORAGE_ID=peerspark-storage

# Collections
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users-collection
NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID=posts-collection
NEXT_PUBLIC_APPWRITE_PODS_COLLECTION_ID=pods-collection
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages-collection
NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION_ID=resources-collection
NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=events-collection
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications-collection
NEXT_PUBLIC_APPWRITE_FOLLOWS_COLLECTION_ID=follows-collection
NEXT_PUBLIC_APPWRITE_LIKES_COLLECTION_ID=likes-collection
NEXT_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID=comments-collection
NEXT_PUBLIC_APPWRITE_BOOKMARKS_COLLECTION_ID=bookmarks-collection
NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID=chat-rooms-collection
NEXT_PUBLIC_APPWRITE_ANALYTICS_COLLECTION_ID=analytics-collection

# Functions
NEXT_PUBLIC_APPWRITE_CHAT_FUNCTION_ID=chat-ai-function
NEXT_PUBLIC_APPWRITE_NOTIFICATION_FUNCTION_ID=notification-function
NEXT_PUBLIC_APPWRITE_ANALYTICS_FUNCTION_ID=analytics-function

# Server-side (Functions)
APPWRITE_FUNCTION_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=peerspark-platform-prod
APPWRITE_API_KEY=your-api-key-here
APPWRITE_DATABASE_ID=peerspark-main-db

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# External Services
SENDGRID_API_KEY=your-sendgrid-api-key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
OPENAI_API_KEY=your-openai-api-key
\`\`\`

---

## 3. Database Schema

### 3.1 Database Creation

\`\`\`bash
# Create main database
appwrite databases create \
  --databaseId "peerspark-main-db" \
  --name "PeerSpark Main Database"
\`\`\`

### 3.2 Collections Schema

#### 3.2.1 Users Collection

\`\`\`bash
# Create users collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --name "Users" \
  --permissions "read(\"any\")" "write(\"users\")"
\`\`\`

**Users Collection Attributes:**

\`\`\`bash
# Basic Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "userId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "email" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "username" \
  --size 50 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "displayName" \
  --size 100 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "firstName" \
  --size 50 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "lastName" \
  --size 50 \
  --required true

# Profile Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "bio" \
  --size 500 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "avatar" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "coverImage" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "location" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "website" \
  --size 255 \
  --required false

# Academic/Professional Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "institution" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "major" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "graduationYear" \
  --size 4 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "jobTitle" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "company" \
  --size 100 \
  --required false

# Skills and Interests (JSON arrays)
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "skills" \
  --size 1000 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "interests" \
  --size 1000 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "subjects" \
  --size 1000 \
  --required false

# Social Stats
appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "followersCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "followingCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "postsCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "reputationScore" \
  --required false \
  --default 0

# Account Settings
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "isVerified" \
  --required false \
  --default false

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "isPrivate" \
  --required false \
  --default false

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "emailNotifications" \
  --required false \
  --default true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "pushNotifications" \
  --required false \
  --default true

# Timestamps
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "lastActive" \
  --required false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "joinedAt" \
  --required true
\`\`\`

**Users Collection Indexes:**

\`\`\`bash
# Create indexes for efficient querying
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "username_index" \
  --type "key" \
  --attributes "username"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "email_index" \
  --type "key" \
  --attributes "email"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "userId_index" \
  --type "key" \
  --attributes "userId"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "institution_index" \
  --type "key" \
  --attributes "institution"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "lastActive_index" \
  --type "key" \
  --attributes "lastActive" \
  --orders "desc"
\`\`\`

#### 3.2.2 Posts Collection

\`\`\`bash
# Create posts collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --name "Posts" \
  --permissions "read(\"any\")" "write(\"users\")"
\`\`\`

**Posts Collection Attributes:**

\`\`\`bash
# Basic Post Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "postId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "authorId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "title" \
  --size 200 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "content" \
  --size 5000 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "type" \
  --size 50 \
  --required true
  # Types: "text", "image", "video", "link", "poll", "question", "resource"

# Media and Attachments
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "mediaUrls" \
  --size 2000 \
  --required false
  # JSON array of media URLs

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "thumbnailUrl" \
  --size 255 \
  --required false

# Categorization
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "tags" \
  --size 1000 \
  --required false
  # JSON array of tags

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "category" \
  --size 50 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "subject" \
  --size 100 \
  --required false

# Pod Association
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "podId" \
  --size 255 \
  --required false

# Engagement Metrics
appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "likesCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "commentsCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "sharesCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "bookmarksCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "viewsCount" \
  --required false \
  --default 0

# Post Settings
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "isPublic" \
  --required false \
  --default true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "allowComments" \
  --required false \
  --default true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "isPinned" \
  --required false \
  --default false

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "isEdited" \
  --required false \
  --default false

# Timestamps
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "updatedAt" \
  --required false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "scheduledAt" \
  --required false
\`\`\`

**Posts Collection Indexes:**

\`\`\`bash
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "postId_index" \
  --type "key" \
  --attributes "postId"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "authorId_index" \
  --type "key" \
  --attributes "authorId"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "createdAt_index" \
  --type "key" \
  --attributes "createdAt" \
  --orders "desc"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "podId_index" \
  --type "key" \
  --attributes "podId"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "category_index" \
  --type "key" \
  --attributes "category"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "type_index" \
  --type "key" \
  --attributes "type"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "likesCount_index" \
  --type "key" \
  --attributes "likesCount" \
  --orders "desc"
\`\`\`

#### 3.2.3 Pods Collection

\`\`\`bash
# Create pods collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --name "Pods" \
  --permissions "read(\"any\")" "write(\"users\")"
\`\`\`

**Pods Collection Attributes:**

\`\`\`bash
# Basic Pod Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "podId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "name" \
  --size 100 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "description" \
  --size 1000 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "creatorId" \
  --size 255 \
  --required true

# Pod Branding
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "avatar" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "coverImage" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "color" \
  --size 7 \
  --required false
  # Hex color code

# Categorization
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "category" \
  --size 50 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "subject" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "tags" \
  --size 1000 \
  --required false
  # JSON array of tags

# Pod Settings
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "privacy" \
  --size 20 \
  --required true
  # "public", "private", "invite-only"

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "joinPolicy" \
  --size 20 \
  --required true
  # "open", "approval", "invite-only"

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "maxMembers" \
  --required false \
  --default 100

# Pod Rules and Guidelines
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "rules" \
  --size 2000 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "guidelines" \
  --size 2000 \
  --required false

# Membership Stats
appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "membersCount" \
  --required false \
  --default 1

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "postsCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "activeMembers" \
  --required false \
  --default 1

# Pod Status
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "isActive" \
  --required false \
  --default true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "isFeatured" \
  --required false \
  --default false

# Timestamps
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "updatedAt" \
  --required false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "pods-collection" \
  --key "lastActivity" \
  --required false
\`\`\`

#### 3.2.4 Messages Collection (Chat System)

\`\`\`bash
# Create messages collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --name "Messages" \
  --permissions "read(\"users\")" "write(\"users\")"
\`\`\`

**Messages Collection Attributes:**

\`\`\`bash
# Basic Message Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "messageId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "roomId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "senderId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "content" \
  --size 5000 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "type" \
  --size 20 \
  --required true
  # "text", "image", "file", "voice", "system", "ai"

# Message Metadata
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "replyToId" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "attachments" \
  --size 2000 \
  --required false
  # JSON array of attachment objects

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "mentions" \
  --size 1000 \
  --required false
  # JSON array of mentioned user IDs

# AI Integration
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "isAI" \
  --required false \
  --default false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "aiModel" \
  --size 50 \
  --required false

# Message Status
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "isEdited" \
  --required false \
  --default false

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "isDeleted" \
  --required false \
  --default false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "readBy" \
  --size 2000 \
  --required false
  # JSON array of user IDs who read the message

# Timestamps
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "updatedAt" \
  --required false
\`\`\`

#### 3.2.5 Chat Rooms Collection

\`\`\`bash
# Create chat rooms collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --name "Chat Rooms" \
  --permissions "read(\"users\")" "write(\"users\")"
\`\`\`

**Chat Rooms Collection Attributes:**

\`\`\`bash
# Basic Room Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "roomId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "name" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "type" \
  --size 20 \
  --required true
  # "direct", "group", "pod", "ai"

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "participants" \
  --size 2000 \
  --required true
  # JSON array of participant user IDs

# Room Settings
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "avatar" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "description" \
  --size 500 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "createdBy" \
  --size 255 \
  --required true

# Associated Pod (if applicable)
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "podId" \
  --size 255 \
  --required false

# Room Activity
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "lastMessageId" \
  --size 255 \
  --required false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "lastActivity" \
  --required false

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "messageCount" \
  --required false \
  --default 0

# Room Status
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "isActive" \
  --required false \
  --default true

# Timestamps
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "updatedAt" \
  --required false
\`\`\`

#### 3.2.6 Resources Collection

\`\`\`bash
# Create resources collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --name "Resources" \
  --permissions "read(\"any\")" "write(\"users\")"
\`\`\`

**Resources Collection Attributes:**

\`\`\`bash
# Basic Resource Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "resourceId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "title" \
  --size 200 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "description" \
  --size 1000 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "uploaderId" \
  --size 255 \
  --required true

# Resource Type and Format
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "type" \
  --size 50 \
  --required true
  # "document", "video", "audio", "image", "link", "presentation", "dataset"

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "format" \
  --size 20 \
  --required false
  # "pdf", "docx", "pptx", "mp4", "mp3", etc.

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "fileUrl" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "thumbnailUrl" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "externalUrl" \
  --size 255 \
  --required false

# File Metadata
appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "fileSize" \
  --required false
  # Size in bytes

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "fileName" \
  --size 255 \
  --required false

# Categorization
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "category" \
  --size 50 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "subject" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "tags" \
  --size 1000 \
  --required false
  # JSON array of tags

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "difficulty" \
  --size 20 \
  --required false
  # "beginner", "intermediate", "advanced"

# Pod Association
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "podId" \
  --size 255 \
  --required false

# Engagement Metrics
appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "likesCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "downloadsCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "viewsCount" \
  --required false \
  --default 0

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "bookmarksCount" \
  --required false \
  --default 0

# Resource Settings
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "isPublic" \
  --required false \
  --default true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "allowDownload" \
  --required false \
  --default true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "isFeatured" \
  --required false \
  --default false

# Timestamps
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "updatedAt" \
  --required false
\`\`\`

#### 3.2.7 Events Collection

\`\`\`bash
# Create events collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --name "Events" \
  --permissions "read(\"any\")" "write(\"users\")"
\`\`\`

**Events Collection Attributes:**

\`\`\`bash
# Basic Event Information
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "eventId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "title" \
  --size 200 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "description" \
  --size 2000 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "organizerId" \
  --size 255 \
  --required true

# Event Timing
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "startTime" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "endTime" \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "timezone" \
  --size 50 \
  --required true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "isAllDay" \
  --required false \
  --default false

# Event Location
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "location" \
  --size 200 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "venue" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "meetingUrl" \
  --size 255 \
  --required false

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "isVirtual" \
  --required false \
  --default false

# Event Categorization
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "category" \
  --size 50 \
  --required true
  # "study-session", "workshop", "seminar", "social", "exam", "deadline"

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "subject" \
  --size 100 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "tags" \
  --size 1000 \
  --required false

# Pod Association
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "podId" \
  --size 255 \
  --required false

# Event Capacity and Registration
appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "maxAttendees" \
  --required false

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "attendeesCount" \
  --required false \
  --default 0

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "requiresRegistration" \
  --required false \
  --default false

# Event Settings
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "isPublic" \
  --required false \
  --default true

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "allowGuests" \
  --required false \
  --default true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "status" \
  --size 20 \
  --required true
  # "scheduled", "ongoing", "completed", "cancelled"

# Recurrence
appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "isRecurring" \
  --required false \
  --default false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "recurrenceRule" \
  --size 200 \
  --required false

# Timestamps
appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "updatedAt" \
  --required false
\`\`\`

#### 3.2.8 Follows Collection

\`\`\`bash
# Create follows collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --name "Follows" \
  --permissions "read(\"users\")" "write(\"users\")"
\`\`\`

**Follows Collection Attributes:**

\`\`\`bash
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --key "followId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --key "followerId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --key "followingId" \
  --size 255 \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --key "createdAt" \
  --required true
\`\`\`

#### 3.2.9 Likes Collection

\`\`\`bash
# Create likes collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --name "Likes" \
  --permissions "read(\"users\")" "write(\"users\")"
\`\`\`

**Likes Collection Attributes:**

\`\`\`bash
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --key "likeId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --key "userId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --key "targetId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --key "targetType" \
  --size 20 \
  --required true
  # "post", "comment", "resource"

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --key "createdAt" \
  --required true
\`\`\`

#### 3.2.10 Comments Collection

\`\`\`bash
# Create comments collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --name "Comments" \
  --permissions "read(\"any\")" "write(\"users\")"
\`\`\`

**Comments Collection Attributes:**

\`\`\`bash
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "commentId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "postId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "authorId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "content" \
  --size 2000 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "parentId" \
  --size 255 \
  --required false

appwrite databases createIntegerAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "likesCount" \
  --required false \
  --default 0

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "isEdited" \
  --required false \
  --default false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "comments-collection" \
  --key "updatedAt" \
  --required false
\`\`\`

#### 3.2.11 Bookmarks Collection

\`\`\`bash
# Create bookmarks collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "bookmarks-collection" \
  --name "Bookmarks" \
  --permissions "read(\"users\")" "write(\"users\")"
\`\`\`

**Bookmarks Collection Attributes:**

\`\`\`bash
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "bookmarks-collection" \
  --key "bookmarkId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "bookmarks-collection" \
  --key "userId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "bookmarks-collection" \
  --key "targetId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "bookmarks-collection" \
  --key "targetType" \
  --size 20 \
  --required true
  # "post", "resource", "event"

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "bookmarks-collection" \
  --key "notes" \
  --size 500 \
  --required false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "bookmarks-collection" \
  --key "createdAt" \
  --required true
\`\`\`

#### 3.2.12 Notifications Collection

\`\`\`bash
# Create notifications collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --name "Notifications" \
  --permissions "read(\"users\")" "write(\"users\")"
\`\`\`

**Notifications Collection Attributes:**

\`\`\`bash
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "notificationId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "userId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "type" \
  --size 50 \
  --required true
  # "like", "comment", "follow", "mention", "message", "event", "system"

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "title" \
  --size 200 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "message" \
  --size 500 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "actionUrl" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "actorId" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "targetId" \
  --size 255 \
  --required false

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "isRead" \
  --required false \
  --default false

appwrite databases createBooleanAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "isPush" \
  --required false \
  --default false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "createdAt" \
  --required true

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "readAt" \
  --required false
\`\`\`

#### 
  --collectionId "notifications-collection" \
  --key "readAt" \
  --required false
\`\`\`

#### 3.2.13 Analytics Collection

\`\`\`bash
# Create analytics collection
appwrite databases createCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --name "Analytics" \
  --permissions "read(\"users\")" "write(\"users\")"
\`\`\`

**Analytics Collection Attributes:**

\`\`\`bash
appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "analyticsId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "userId" \
  --size 255 \
  --required true

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "eventType" \
  --size 50 \
  --required true
  # "page_view", "post_view", "resource_download", "chat_message", "search", "login"

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "eventData" \
  --size 2000 \
  --required false
  # JSON object with event-specific data

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "sessionId" \
  --size 255 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "userAgent" \
  --size 500 \
  --required false

appwrite databases createStringAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "ipAddress" \
  --size 45 \
  --required false

appwrite databases createDatetimeAttribute \
  --databaseId "peerspark-main-db" \
  --collectionId "analytics-collection" \
  --key "timestamp" \
  --required true
\`\`\`

### 3.3 Database Indexes for Performance

\`\`\`bash
# Users Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --key "search_users" \
  --type "fulltext" \
  --attributes "displayName" "username" "bio"

# Posts Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "feed_posts" \
  --type "key" \
  --attributes "createdAt" "isPublic" \
  --orders "desc" "asc"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "user_posts" \
  --type "key" \
  --attributes "authorId" "createdAt" \
  --orders "asc" "desc"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "pod_posts" \
  --type "key" \
  --attributes "podId" "createdAt" \
  --orders "asc" "desc"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --key "search_posts" \
  --type "fulltext" \
  --attributes "title" "content"

# Messages Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "room_messages" \
  --type "key" \
  --attributes "roomId" "createdAt" \
  --orders "asc" "desc"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --key "user_messages" \
  --type "key" \
  --attributes "senderId" "createdAt" \
  --orders "asc" "desc"

# Chat Rooms Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --key "user_rooms" \
  --type "key" \
  --attributes "participants" "lastActivity" \
  --orders "asc" "desc"

# Resources Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "popular_resources" \
  --type "key" \
  --attributes "likesCount" "downloadsCount" \
  --orders "desc" "desc"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "resources-collection" \
  --key "search_resources" \
  --type "fulltext" \
  --attributes "title" "description"

# Events Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "events-collection" \
  --key "upcoming_events" \
  --type "key" \
  --attributes "startTime" "isPublic" \
  --orders "asc" "asc"

# Follows Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --key "follower_following" \
  --type "key" \
  --attributes "followerId" "followingId"

appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --key "user_followers" \
  --type "key" \
  --attributes "followingId" "createdAt" \
  --orders "asc" "desc"

# Likes Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --key "user_target_like" \
  --type "key" \
  --attributes "userId" "targetId" "targetType"

# Notifications Collection Indexes
appwrite databases createIndex \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --key "user_notifications" \
  --type "key" \
  --attributes "userId" "createdAt" "isRead" \
  --orders "asc" "desc" "asc"
\`\`\`

---

## 4. Authentication System

### 4.1 Appwrite Auth Configuration

\`\`\`bash
# Configure OAuth providers
appwrite teams createMembership \
  --teamId "auth-providers" \
  --email "admin@peerspark.com" \
  --roles "owner"

# Enable email/password authentication
appwrite account createEmailSession \
  --email "test@peerspark.com" \
  --password "securepassword123"
\`\`\`

### 4.2 Authentication Service Implementation

Create `lib/auth.ts`:

\`\`\`typescript
import { Client, Account, ID, Models } from 'appwrite'
import { databases } from './appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)

export interface UserProfile extends Models.Document {
  userId: string
  email: string
  username: string
  displayName: string
  firstName: string
  lastName: string
  bio?: string
  avatar?: string
  coverImage?: string
  location?: string
  website?: string
  institution?: string
  major?: string
  graduationYear?: string
  jobTitle?: string
  company?: string
  skills: string[]
  interests: string[]
  subjects: string[]
  followersCount: number
  followingCount: number
  postsCount: number
  reputationScore: number
  isVerified: boolean
  isPrivate: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  lastActive?: string
  joinedAt: string
}

export class AuthService {
  // Register new user
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) {
    try {
      // Create account
      const user = await account.create(
        ID.unique(),
        email,
        password,
        `${firstName} ${lastName}`
      )

      // Create email session
      await account.createEmailSession(email, password)

      // Create user profile in database
      const userProfile = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        ID.unique(),
        {
          userId: user.$id,
          email,
          username,
          displayName: `${firstName} ${lastName}`,
          firstName,
          lastName,
          bio: '',
          avatar: '',
          coverImage: '',
          location: '',
          website: '',
          institution: '',
          major: '',
          graduationYear: '',
          jobTitle: '',
          company: '',
          skills: JSON.stringify([]),
          interests: JSON.stringify([]),
          subjects: JSON.stringify([]),
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          reputationScore: 0,
          isVerified: false,
          isPrivate: false,
          emailNotifications: true,
          pushNotifications: true,
          joinedAt: new Date().toISOString(),
        }
      )

      return { user, profile: userProfile }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Login user
  async login(email: string, password: string) {
    try {
      const session = await account.createEmailSession(email, password)
      const user = await account.get()
      const profile = await this.getUserProfile(user.$id)
      
      return { user, profile, session }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout user
  async logout() {
    try {
      await account.deleteSession('current')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const user = await account.get()
      const profile = await this.getUserProfile(user.$id)
      return { user, profile }
    } catch (error) {
      return null
    }
  }

  // Get user profile from database
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        [
          Query.equal('userId', userId)
        ]
      )

      if (response.documents.length > 0) {
        const profile = response.documents[0] as UserProfile
        // Parse JSON fields
        profile.skills = JSON.parse(profile.skills as any) || []
        profile.interests = JSON.parse(profile.interests as any) || []
        profile.subjects = JSON.parse(profile.subjects as any) || []
        return profile
      }
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      // Find user document
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        [
          Query.equal('userId', userId)
        ]
      )

      if (response.documents.length === 0) {
        throw new Error('User profile not found')
      }

      const documentId = response.documents[0].$id

      // Stringify array fields if they exist
      const processedUpdates = { ...updates }
      if (processedUpdates.skills) {
        processedUpdates.skills = JSON.stringify(processedUpdates.skills) as any
      }
      if (processedUpdates.interests) {
        processedUpdates.interests = JSON.stringify(processedUpdates.interests) as any
      }
      if (processedUpdates.subjects) {
        processedUpdates.subjects = JSON.stringify(processedUpdates.subjects) as any
      }

      const updatedProfile = await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        documentId,
        processedUpdates
      )

      return updatedProfile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Change password
  async changePassword(oldPassword: string, newPassword: string) {
    try {
      await account.updatePassword(newPassword, oldPassword)
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  }

  // Send password recovery email
  async sendPasswordRecovery(email: string) {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      )
    } catch (error) {
      console.error('Error sending password recovery:', error)
      throw error
    }
  }

  // Complete password recovery
  async completePasswordRecovery(
    userId: string,
    secret: string,
    newPassword: string
  ) {
    try {
      await account.updateRecovery(userId, secret, newPassword, newPassword)
    } catch (error) {
      console.error('Error completing password recovery:', error)
      throw error
    }
  }

  // Email verification
  async sendEmailVerification() {
    try {
      await account.createVerification(
        `${window.location.origin}/verify-email`
      )
    } catch (error) {
      console.error('Error sending email verification:', error)
      throw error
    }
  }

  // Complete email verification
  async completeEmailVerification(userId: string, secret: string) {
    try {
      await account.updateVerification(userId, secret)
    } catch (error) {
      console.error('Error completing email verification:', error)
      throw error
    }
  }

  // OAuth login
  async loginWithOAuth(provider: string) {
    try {
      account.createOAuth2Session(
        provider as any,
        `${window.location.origin}/app/dashboard`,
        `${window.location.origin}/login?error=oauth_failed`
      )
    } catch (error) {
      console.error('OAuth login error:', error)
      throw error
    }
  }

  // Check username availability
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        [
          Query.equal('username', username)
        ]
      )
      return response.documents.length === 0
    } catch (error) {
      console.error('Error checking username availability:', error)
      return false
    }
  }

  // Update last active timestamp
  async updateLastActive(userId: string) {
    try {
      await this.updateProfile(userId, {
        lastActive: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating last active:', error)
    }
  }
}

export const authService = new AuthService()
\`\`\`

### 4.3 Authentication Context

Create `contexts/auth-context.tsx`:

\`\`\`typescript
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Models } from 'appwrite'
import { authService, UserProfile } from '@/lib/auth'

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  profile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser.user)
        setProfile(currentUser.profile)
        
        // Update last active
        if (currentUser.user) {
          authService.updateLastActive(currentUser.user.$id)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login(email, password)
      setUser(result.user)
      setProfile(result.profile)
      
      // Update last active
      authService.updateLastActive(result.user.$id)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) => {
    try {
      const result = await authService.register(
        email,
        password,
        firstName,
        lastName,
        username
      )
      setUser(result.user)
      setProfile(result.profile as UserProfile)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    try {
      const updatedProfile = await authService.updateProfile(user.$id, updates)
      setProfile(updatedProfile as UserProfile)
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const userProfile = await authService.getUserProfile(user.$id)
      setProfile(userProfile)
    } catch (error) {
      console.error('Profile refresh error:', error)
    }
  }

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
\`\`\`

---

## 5. Real-time Chat System

### 5.1 Chat Service Implementation

Create `lib/chat.ts`:

\`\`\`typescript
import { Client, Databases, ID, Query, RealtimeResponseEvent } from 'appwrite'
import { databases } from './appwrite'

export interface ChatRoom {
  $id: string
  roomId: string
  name?: string
  type: 'direct' | 'group' | 'pod' | 'ai'
  participants: string[]
  avatar?: string
  description?: string
  createdBy: string
  podId?: string
  lastMessageId?: string
  lastActivity?: string
  messageCount: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface ChatMessage {
  $id: string
  messageId: string
  roomId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'file' | 'voice' | 'system' | 'ai'
  replyToId?: string
  attachments?: any[]
  mentions?: string[]
  isAI: boolean
  aiModel?: string
  isEdited: boolean
  isDeleted: boolean
  readBy?: string[]
  createdAt: string
  updatedAt?: string
}

export class ChatService {
  private client: Client
  private databases: Databases
  private subscriptions: Map<string, () => void> = new Map()

  constructor() {
    this.client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    
    this.databases = new Databases(this.client)
  }

  // Create or get direct message room
  async createDirectRoom(userId1: string, userId2: string): Promise<ChatRoom> {
    try {
      // Check if room already exists
      const participants = [userId1, userId2].sort()
      const existingRooms = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
        [
          Query.equal('type', 'direct'),
          Query.contains('participants', participants[0]),
          Query.contains('participants', participants[1])
        ]
      )

      if (existingRooms.documents.length > 0) {
        return existingRooms.documents[0] as ChatRoom
      }

      // Create new room
      const roomId = ID.unique()
      const room = await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
        ID.unique(),
        {
          roomId,
          type: 'direct',
          participants: JSON.stringify(participants),
          createdBy: userId1,
          messageCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      )

      return room as ChatRoom
    } catch (error) {
      console.error('Error creating direct room:', error)
      throw error
    }
  }

  // Create group chat room
  async createGroupRoom(
    name: string,
    participants: string[],
    createdBy: string,
    description?: string
  ): Promise<ChatRoom> {
    try {
      const roomId = ID.unique()
      const room = await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
        ID.unique(),
        {
          roomId,
          name,
          type: 'group',
          participants: JSON.stringify(participants),
          description: description || '',
          createdBy,
          messageCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      )

      return room as ChatRoom
    } catch (error) {
      console.error('Error creating group room:', error)
      throw error
    }
  }

  // Create AI chat room
  async createAIRoom(userId: string): Promise<ChatRoom> {
    try {
      const roomId = ID.unique()
      const room = await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
        ID.unique(),
        {
          roomId,
          name: 'AI Assistant',
          type: 'ai',
          participants: JSON.stringify([userId, 'ai-assistant']),
          createdBy: userId,
          messageCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      )

      return room as ChatRoom
    } catch (error) {
      console.error('Error creating AI room:', error)
      throw error
    }
  }

  // Get user's chat rooms
  async getUserRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
        [
          Query.contains('participants', userId),
          Query.equal('isActive', true),
          Query.orderDesc('lastActivity')
        ]
      )

      return response.documents.map(doc => {
        const room = doc as ChatRoom
        room.participants = JSON.parse(room.participants as any)
        return room
      })
    } catch (error) {
      console.error('Error fetching user rooms:', error)
      return []
    }
  }

  // Send message
  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    replyToId?: string,
    attachments?: any[],
    mentions?: string[]
  ): Promise<ChatMessage> {
    try {
      const messageId = ID.unique()
      const message = await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        ID.unique(),
        {
          messageId,
          roomId,
          senderId,
          content,
          type,
          replyToId: replyToId || '',
          attachments: JSON.stringify(attachments || []),
          mentions: JSON.stringify(mentions || []),
          isAI: false,
          isEdited: false,
          isDeleted: false,
          readBy: JSON.stringify([senderId]),
          createdAt: new Date().toISOString()
        }
      )

      // Update room's last message and activity
      await this.updateRoomActivity(roomId, messageId)

      // Check for AI mentions and trigger AI response
      if (mentions?.includes('ai') || mentions?.includes('@ai')) {
        this.triggerAIResponse(roomId, content, messageId)
      }

      return message as ChatMessage
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Get room messages
  async getRoomMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        [
          Query.equal('roomId', roomId),
          Query.equal('isDeleted', false),
          Query.orderDesc('createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      )

      return response.documents.map(doc => {
        const message = doc as ChatMessage
        message.attachments = JSON.parse(message.attachments as any) || []
        message.mentions = JSON.parse(message.mentions as any) || []
        message.readBy = JSON.parse(message.readBy as any) || []
        return message
      }).reverse()
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string, userId: string) {
    try {
      // Get current message
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        [
          Query.equal('messageId', messageId)
        ]
      )

      if (response.documents.length === 0) return

      const message = response.documents[0] as ChatMessage
      const readBy = JSON.parse(message.readBy as any) || []

      if (!readBy.includes(userId)) {
        readBy.push(userId)
        
        await this.databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
          message.$id,
          {
            readBy: JSON.stringify(readBy)
          }
        )
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Update room activity
  private async updateRoomActivity(roomId: string, lastMessageId: string) {
    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
        [
          Query.equal('roomId', roomId)
        ]
      )

      if (response.documents.length > 0) {
        const room = response.documents[0]
        await this.databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
          room.$id,
          {
            lastMessageId,
            lastActivity: new Date().toISOString(),
            messageCount: room.messageCount + 1
          }
        )
      }
    } catch (error) {
      console.error('Error updating room activity:', error)
    }
  }

  // Trigger AI response
  private async triggerAIResponse(roomId: string, userMessage: string, replyToId: string) {
    try {
      // Call AI function
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId,
          message: userMessage,
          replyToId
        })
      })

      if (!response.ok) {
        throw new Error('AI response failed')
      }

      const aiResponse = await response.json()
      
      // Send AI message
      await this.sendAIMessage(roomId, aiResponse.content, replyToId)
    } catch (error) {
      console.error('Error triggering AI response:', error)
    }
  }

  // Send AI message
  async sendAIMessage(
    roomId: string,
    content: string,
    replyToId?: string
  ): Promise<ChatMessage> {
    try {
      const messageId = ID.unique()
      const message = await this.databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        ID.unique(),
        {
          messageId,
          roomId,
          senderId: 'ai-assistant',
          content,
          type: 'ai',
          replyToId: replyToId || '',
          attachments: JSON.stringify([]),
          mentions: JSON.stringify([]),
          isAI: true,
          aiModel: 'gpt-4',
          isEdited: false,
          isDeleted: false,
          readBy: JSON.stringify(['ai-assistant']),
          createdAt: new Date().toISOString()
        }
      )

      // Update room activity
      await this.updateRoomActivity(roomId, messageId)

      return message as ChatMessage
    } catch (error) {
      console.error('Error sending AI message:', error)
      throw error
    }
  }

  // Subscribe to room messages
  subscribeToRoom(
    roomId: string,
    onMessage: (message: ChatMessage) => void,
    onUpdate: (message: ChatMessage) => void,
    onDelete: (messageId: string) => void
  ) {
    const subscriptionKey = `room-${roomId}`
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey)!()
    }

    const unsubscribe = this.client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<ChatMessage>) => {
        const message = response.payload
        
        // Only handle messages for this room
        if (message.roomId !== roomId) return

        // Parse JSON fields
        message.attachments = JSON.parse(message.attachments as any) || []
        message.mentions = JSON.parse(message.mentions as any) || []
        message.readBy = JSON.parse(message.readBy as any) || []

        switch (response.events[0]) {
          case 'databases.*.collections.*.documents.*.create':
            onMessage(message)
            break
          case 'databases.*.collections.*.documents.*.update':
            onUpdate(message)
            break
          case 'databases.*.collections.*.documents.*.delete':
            onDelete(message.messageId)
            break
        }
      }
    )

    this.subscriptions.set(subscriptionKey, unsubscribe)
    return unsubscribe
  }

  // Unsubscribe from room
  unsubscribeFromRoom(roomId: string) {
    const subscriptionKey = `room-${roomId}`
    const unsubscribe = this.subscriptions.get(subscriptionKey)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  // Edit message
  async editMessage(messageId: string, newContent: string) {
    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        [
          Query.equal('messageId', messageId)
        ]
      )

      if (response.documents.length === 0) {
        throw new Error('Message not found')
      }

      const message = response.documents[0]
      await this.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        message.$id,
        {
          content: newContent,
          isEdited: true,
          updatedAt: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  }

  // Delete message
  async deleteMessage(messageId: string) {
    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        [
          Query.equal('messageId', messageId)
        ]
      )

      if (response.documents.length === 0) {
        throw new Error('Message not found')
      }

      const message = response.documents[0]
      await this.databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        message.$id,
        {
          content: 'This message was deleted',
          isDeleted: true,
          updatedAt: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  // Search messages
  async searchMessages(
    roomId: string,
    query: string,
    limit: number = 20
  ): Promise<ChatMessage[]> {
    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        [
          Query.equal('roomId', roomId),
          Query.search('content', query),
          Query.equal('isDeleted', false),
          Query.limit(limit),
          Query.orderDesc('createdAt')
        ]
      )

      return response.documents.map(doc => {
        const message = doc as ChatMessage
        message.attachments = JSON.parse(message.attachments as any) || []
        message.mentions = JSON.parse(message.mentions as any) || []
        message.readBy = JSON.parse(message.readBy as any) || []
        return message
      })
    } catch (error) {
      console.error('Error searching messages:', error)
      return []
    }
  }

  // Get unread message count
  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    try {
      const response = await this.databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        [
          Query.equal('roomId', roomId),
          Query.equal('isDeleted', false),
          Query.notEqual('senderId', userId)
        ]
      )

      let unreadCount = 0
      for (const doc of response.documents) {
        const message = doc as ChatMessage
        const readBy = JSON.parse(message.readBy as any) || []
        if (!readBy.includes(userId)) {
          unreadCount++
        }
      }

      return unreadCount
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }
}

export const chatService = new ChatService()
\`\`\`

### 5.2 AI Chat Integration

Create `app/api/ai-chat/route.ts`:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { chatService } from '@/lib/chat'

export async function POST(request: NextRequest) {
  try {
    const { roomId, message, replyToId } = await request.json()

    // Get recent conversation context
    const recentMessages = await chatService.getRoomMessages(roomId, 10)
    
    // Build conversation context
    const conversationContext = recentMessages
      .map(msg => `${msg.isAI ? 'Assistant' : 'User'}: ${msg.content}`)
      .join('\n')

    // Generate AI response
    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: `You are a helpful AI assistant for PeerSpark, a social learning platform. 
      You help students and professionals with their questions, provide study guidance, 
      explain concepts, and facilitate learning discussions. Be friendly, encouraging, 
      and educational in your responses.`,
      prompt: `Recent conversation:
${conversationContext}

User's latest message: ${message}

Please provide a helpful response.`,
    })

    return NextResponse.json({ content: text })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
\`\`\`

---

## 6. Push Notifications

### 6.1 Web Push Setup

Create `lib/push-notifications.ts`:

\`\`\`typescript
import { databases } from './appwrite'
import { ID, Query } from 'appwrite'

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushNotificationService {
  private vapidPublicKey: string

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported')
      }

      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Push notification permission denied')
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      }

      // Save subscription to database
      await this.saveSubscription(userId, pushSubscription)

      return pushSubscription
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return null
    }
  }

  // Save subscription to database
  private async saveSubscription(userId: string, subscription: PushSubscription) {
    try {
      // Check if subscription already exists
      const existing = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'push-subscriptions-collection',
        [
          Query.equal('userId', userId),
          Query.equal('endpoint', subscription.endpoint)
        ]
      )

      if (existing.documents.length === 0) {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'push-subscriptions-collection',
          ID.unique(),
          {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            createdAt: new Date().toISOString()
          }
        )
      }
    } catch (error) {
      console.error('Error saving push subscription:', error)
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId: string): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          
          // Remove from database
          await this.removeSubscription(userId, subscription.endpoint)
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
    }
  }

  // Remove subscription from database
  private async removeSubscription(userId: string, endpoint: string) {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        'push-subscriptions-collection',
        [
          Query.equal('userId', userId),
          Query.equal('endpoint', endpoint)
        ]
      )

      for (const doc of response.documents) {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          'push-subscriptions-collection',
          doc.$id
        )
      }
    } catch (error) {
      console.error('Error removing push subscription:', error)
    }
  }

  // Send notification (called from server)
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          data
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

export const pushNotificationService = new PushNotificationService()
\`\`\`

### 6.2 Service Worker

Create `public/sw.js`:

\`\`\`javascript
// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: '/icon-open.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-close.png'
        }
      ],
      requireInteraction: true,
      tag: data.tag || 'default'
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data.url || '/'
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
    )
  }
})

// Background sync for offline functionality
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  // Implement background sync logic
  return Promise.resolve()
}

// Cache management
const CACHE_NAME = 'peerspark-v1'
const urlsToCache = [
  '/',
  '/app/dashboard',
  '/app/feed',
  '/app/chat',
  '/offline.html'
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(function() {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
      })
  )
})
\`\`\`

### 6.3 Push Notification API Route

Create `app/api/send-notification/route.ts`:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { databases } from '@/lib/appwrite'
import { Query } from 'appwrite'

// Configure web-push
webpush.setVapidDetails(
  'mailto:admin@peerspark.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json()

    // Get user's push subscriptions
    const subscriptions = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      'push-subscriptions-collection',
      [
        Query.equal('userId', userId)
      ]
    )

    const payload = JSON.stringify({
      title,
      body,
      data: {
        url: data?.url || '/app/notifications',
        ...data
      },
      tag: data?.tag || 'notification'
    })

    // Send notification to all user's devices
    const promises = subscriptions.documents.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        await webpush.sendNotification(pushSubscription, payload)
      } catch (error) {
        console.error('Error sending to subscription:', error)
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          await databases.deleteDocument(
            process.env.APPWRITE_DATABASE_ID!,
            'push-subscriptions-collection',
            sub.$id
          )
        }
      }
    })

    await Promise.allSettled(promises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
\`\`\`

---

## 7. File Storage

### 7.1 Storage Configuration

\`\`\`bash
# Create storage bucket
appwrite storage createBucket \
  --bucketId "peerspark-storage" \
  --name "PeerSpark Storage" \
  --permissions "read(\"any\")" "write(\"users\")" \
  --fileSecurity true \
  --enabled true \
  --maximumFileSize 50000000 \
  --allowedFileExtensions "jpg" "jpeg" "png" "gif" "webp" "pdf" "doc" "docx" "ppt" "pptx" "xls" "xlsx" "txt" "mp4" "mp3" "wav"
\`\`\`

### 7.2 File Upload Service

Create `lib/storage.ts`:

\`\`\`typescript
import { Client, Storage, ID } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const storage = new Storage(client)

export interface FileUpload {
  file: File
  onProgress?: (progress: number) => void
}

export class StorageService {
  private bucketId: string

  constructor() {
    this.bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!
  }

  // Upload file
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const fileId = ID.unique()
      
      const response = await storage.createFile(
        this.bucketId,
        fileId,
        file,
        undefined,
        onProgress
      )

      return response.$id
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  // Upload multiple files
  async uploadFiles(
    files: FileUpload[]
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map(({ file, onProgress }) =>
        this.uploadFile(file, onProgress)
      )

      const fileIds = await Promise.all(uploadPromises)
      return fileIds
    } catch (error) {
      console.error('Multiple file upload error:', error)
      throw error
    }
  }

  // Get file URL
  getFileUrl(fileId: string): string {
    return storage.getFileView(this.bucketId, fileId).href
  }

  // Get file download URL
  getFileDownloadUrl(fileId: string): string {
    return storage.getFileDownload(this.bucketId, fileId).href
  }

  // Get file preview URL
  getFilePreviewUrl(
    fileId: string,
    width?: number,
    height?: number,
    quality?: number
  ): string {
    return storage.getFilePreview(
      this.bucketId,
      fileId,
      width,
      height,
      'center',
      quality || 80,
      0,
      'ffffff',
      0,
      1,
      0,
      'webp'
    ).href
  }

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    try {
      await storage.deleteFile(this.bucketId, fileId)
    } catch (error) {
      console.error('File deletion error:', error)
      throw error
    }
  }

  // Get file info
  async getFileInfo(fileId: string) {
    try {
      return await storage.getFile(this.bucketId, fileId)
    } catch (error) {
      console.error('Get file info error:', error)
      throw error
    }
  }

  // Validate file type
  validateFileType(file: File, allowedTypes: string[]): boolean {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    return allowedTypes.includes(fileExtension || '')
  }

  // Validate file size
  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    return file.size <= maxSizeInBytes
  }

  // Generate thumbnail for images
  async generateThumbnail(
    fileId: string,
    width: number = 300,
    height: number = 300
  ): Promise<string> {
    return this.getFilePreviewUrl(fileId, width, height, 80)
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<string> {
    // Validate file
    if (!this.validateFileType(file, ['jpg', 'jpeg', 'png', 'webp'])) {
      throw new Error('Invalid file type for avatar')
    }

    if (!this.validateFileSize(file, 5)) {
      throw new Error('Avatar file size must be less than 5MB')
    }

    return await this.uploadFile(file)
  }

  // Upload document
  async uploadDocument(file: File): Promise<string> {
    // Validate file
    const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt']
    if (!this.validateFileType(file, allowedTypes)) {
      throw new Error('Invalid document file type')
    }

    if (!this.validateFileSize(file, 50)) {
      throw new Error('Document file size must be less than 50MB')
    }

    return await this.uploadFile(file)
  }

  // Upload media (images/videos)
  async uploadMedia(file: File): Promise<string> {
    // Validate file
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mp3', 'wav']
    if (!this.validateFileType(file, allowedTypes)) {
      throw new Error('Invalid media file type')
    }

    if (!this.validateFileSize(file, 100)) {
      throw new Error('Media file size must be less than 100MB')
    }

    return await this.uploadFile(file)
  }

  // Batch delete files
  async deleteFiles(fileIds: string[]): Promise<void> {
    try {
      const deletePromises = fileIds.map(fileId => this.deleteFile(fileId))
      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Batch file deletion error:', error)
      throw error
    }
  }

  // Get file metadata
  async getFileMetadata(fileId: string) {
    try {
      const file = await this.getFileInfo(fileId)
      return {
        id: file.$id,
        name: file.name,
        size: file.sizeOriginal,
        mimeType: file.mimeType,
        createdAt: file.$createdAt,
        updatedAt: file.$updatedAt
      }
    } catch (error) {
      console.error('Get file metadata error:', error)
      throw error
    }
  }
}

export const storageService = new StorageService()
\`\`\`

---

## 8. Cloud Functions

### 8.1 Notification Function

Create `functions/notifications/src/main.js`:

\`\`\`javascript
const sdk = require('node-appwrite')

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client()
  const databases = new sdk.Databases(client)
  const users = new sdk.Users(client)

  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  try {
    const { type, userId, actorId, targetId, data } = JSON.parse(req.body)

    // Get user preferences
    const userProfile = await getUserProfile(databases, userId)
    if (!userProfile || !userProfile.pushNotifications) {
      return res.json({ success: false, message: 'User has disabled notifications' })
    }

    // Get actor information
    const actor = actorId ? await getUserProfile(databases, actorId) : null

    // Generate notification content based on type
    const notification = generateNotificationContent(type, actor, data)

    // Create notification in database
    const notificationDoc = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        notificationId: sdk.ID.unique(),
        userId,
        type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        actorId: actorId || '',
        targetId: targetId || '',
        isRead: false,
        isPush: true,
        createdAt: new Date().toISOString()
      }
    )

    // Send push notification
    await sendPushNotification(databases, userId, notification)

    // Send email notification if enabled
    if (userProfile.emailNotifications) {
      await sendEmailNotification(userId, notification)
    }

    return res.json({ 
      success: true, 
      notificationId: notificationDoc.$id 
    })

  } catch (err) {
    error('Notification function error: ' + err.message)
    return res.json({ success: false, error: err.message }, 500)
  }
}

async function getUserProfile(databases, userId) {
  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
      [
        sdk.Query.equal('userId', userId)
      ]
    )
    return response.documents[0] || null
  } catch (error) {
    return null
  }
}

function generateNotificationContent(type, actor, data) {
  const actorName = actor ? actor.displayName : 'Someone'
  
  switch (type) {
    case 'like':
      return {
        title: 'New Like',
        message: `${actorName} liked your post`,
        actionUrl: `/app/feed?post=${data.postId}`
      }
    
    case 'comment':
      return {
        title: 'New Comment',
        message: `${actorName} commented on your post`,
        actionUrl: `/app/feed?post=${data.postId}`
      }
    
    case 'follow':
      return {
        title: 'New Follower',
        message: `${actorName} started following you`,
        actionUrl: `/app/profile/${actor.username}`
      }
    
    case 'mention':
      return {
        title: 'You were mentioned',
        message: `${actorName} mentioned you in a ${data.type}`,
        actionUrl: data.url || '/app/notifications'
      }
    
    case 'message':
      return {
        title: 'New Message',
        message: `${actorName} sent you a message`,
        actionUrl: `/app/chat?room=${data.roomId}`
      }
    
    case 'event':
      return {
        title: 'Event Reminder',
        message: `${data.eventTitle} starts in ${data.timeUntil}`,
        actionUrl: `/app/calendar?event=${data.eventId}`
      }
    
    case 'pod_invite':
      return {
        title: 'Pod Invitation',
        message: `${actorName} invited you to join ${data.podName}`,
        actionUrl: `/app/pods/${data.podId}`
      }
    
    case 'resource_shared':
      return {
        title: 'Resource Shared',
        message: `${actorName} shared a resource with you`,
        actionUrl: `/app/vault?resource=${data.resourceId}`
      }
    
    default:
      return {
        title: 'Notification',
        message: data.message || 'You have a new notification',
        actionUrl: '/app/notifications'
      }
  }
}

async function sendPushNotification(databases, userId, notification) {
  try {
    // Get user's push subscriptions
    const subscriptions = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'push-subscriptions-collection',
      [
        sdk.Query.equal('userId', userId)
      ]
    )

    if (subscriptions.documents.length === 0) {
      return
    }

    // Send to external push service
    const pushPayload = {
      userId,
      title: notification.title,
      body: notification.message,
      data: {
        url: notification.actionUrl,
        tag: 'notification'
      }
    }

    // Call the push notification API
    const response = await fetch(`${process.env.APPWRITE_FUNCTION_ENDPOINT}/functions/send-push/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': process.env.APPWRITE_FUNCTION_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY
      },
      body: JSON.stringify(pushPayload)
    })

    if (!response.ok) {
      throw new Error('Failed to send push notification')
    }
  } catch (error) {
    console.error('Push notification error:', error)
  }
}

async function sendEmailNotification(userId, notification) {
  try {
    // Implementation for email notifications using SendGrid or similar service
    const emailPayload = {
      userId,
      subject: notification.title,
      content: notification.message,
      actionUrl: notification.actionUrl
    }

    // Call email service
    const response = await fetch(`${process.env.APPWRITE_FUNCTION_ENDPOINT}/functions/send-email/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': process.env.APPWRITE_FUNCTION_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY
      },
      body: JSON.stringify(emailPayload)
    })

    if (!response.ok) {
      throw new Error('Failed to send email notification')
    }
  } catch (error) {
    console.error('Email notification error:', error)
  }
}
\`\`\`

### 8.2 AI Chat Function

Create `functions/ai-chat/src/main.js`:

\`\`\`javascript
const sdk = require('node-appwrite')
const { Configuration, OpenAIApi } = require('openai')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client()
  const databases = new sdk.Databases(client)

  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  try {
    const { roomId, message, userId, replyToId } = JSON.parse(req.body)

    // Get conversation context
    const recentMessages = await getRecentMessages(databases, roomId, 10)
    
    // Build conversation history
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.isAI ? 'assistant' : 'user',
      content: msg.content
    }))

    // Add system message
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant for PeerSpark, a social learning platform. 
        You help students and professionals with their questions, provide study guidance, 
        explain concepts, and facilitate learning discussions. Be friendly, encouraging, 
        and educational in your responses. Keep responses concise but informative.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ]

    // Generate AI response
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const aiResponse = completion.data.choices[0].message.content

    // Save AI message to database
    const aiMessage = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
      sdk.ID.unique(),
      {
        messageId: sdk.ID.unique(),
        roomId,
        senderId: 'ai-assistant',
        content: aiResponse,
        type: 'ai',
        replyToId: replyToId || '',
        attachments: JSON.stringify([]),
        mentions: JSON.stringify([]),
        isAI: true,
        aiModel: 'gpt-4',
        isEdited: false,
        isDeleted: false,
        readBy: JSON.stringify(['ai-assistant']),
        createdAt: new Date().toISOString()
      }
    )

    // Update room activity
    await updateRoomActivity(databases, roomId, aiMessage.$id)

    return res.json({ 
      success: true, 
      message: aiResponse,
      messageId: aiMessage.$id 
    })

  } catch (err) {
    error('AI chat function error: ' + err.message)
    return res.json({ success: false, error: err.message }, 500)
  }
}

async function getRecentMessages(databases, roomId, limit) {
  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
      [
        sdk.Query.equal('roomId', roomId),
        sdk.Query.equal('isDeleted', false),
        sdk.Query.orderDesc('createdAt'),
        sdk.Query.limit(limit)
      ]
    )

    return response.documents.reverse()
  } catch (error) {
    return []
  }
}

async function updateRoomActivity(databases, roomId, messageId) {
  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID,
      [
        sdk.Query.equal('roomId', roomId)
      ]
    )

    if (response.documents.length > 0) {
      const room = response.documents[0]
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID,
        room.$id,
        {
          lastMessageId: messageId,
          lastActivity: new Date().toISOString(),
          messageCount: room.messageCount + 1
        }
      )
    }
  } catch (error) {
    console.error('Error updating room activity:', error)
  }
}
\`\`\`

### 8.3 Analytics Function

Create `functions/analytics/src/main.js`:

\`\`\`javascript
const sdk = require('node-appwrite')

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client()
  const databases = new sdk.Databases(client)

  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  try {
    const { 
      userId, 
      eventType, 
      eventData, 
      sessionId, 
      userAgent, 
      ipAddress 
    } = JSON.parse(req.body)

    // Create analytics record
    const analyticsRecord = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_ANALYTICS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        analyticsId: sdk.ID.unique(),
        userId,
        eventType,
        eventData: JSON.stringify(eventData || {}),
        sessionId: sessionId || '',
        userAgent: userAgent || '',
        ipAddress: ipAddress || '',
        timestamp: new Date().toISOString()
      }
    )

    // Process specific analytics events
    await processAnalyticsEvent(databases, eventType, userId, eventData)

    return res.json({ 
      success: true, 
      analyticsId: analyticsRecord.$id 
    })

  } catch (err) {
    error('Analytics function error: ' + err.message)
    return res.json({ success: false, error: err.message }, 500)
  }
}

async function processAnalyticsEvent(databases, eventType, userId, eventData) {
  try {
    switch (eventType) {
      case 'post_view':
        await incrementPostViews(databases, eventData.postId)
        break
      
      case 'resource_download':
        await incrementResourceDownloads(databases, eventData.resourceId)
        break
      
      case 'profile_view':
        await incrementProfileViews(databases, eventData.profileId)
        break
      
      case 'search':
        await trackSearchQuery(databases, userId, eventData.query)
        break
      
      case 'login':
        await updateUserLastActive(databases, userId)
        break
      
      default:
        // Generic event tracking
        break
    }
  } catch (error) {
    console.error('Error processing analytics event:', error)
  }
}

async function incrementPostViews(databases, postId) {
  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID,
      [
        sdk.Query.equal('postId', postId)
      ]
    )

    if (response.documents.length > 0) {
      const post = response.documents[0]
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID,
        post.$id,
        {
          viewsCount: post.viewsCount + 1
        }
      )
    }
  } catch (error) {
    console.error('Error incrementing post views:', error)
  }
}

async function incrementResourceDownloads(databases, resourceId) {
  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION_ID,
      [
        sdk.Query.equal('resourceId', resourceId)
      ]
    )

    if (response.documents.length > 0) {
      const resource = response.documents[0]
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION_ID,
        resource.$id,
        {
          downloadsCount: resource.downloadsCount + 1
        }
      )
    }
  } catch (error) {
    console.error('Error incrementing resource downloads:', error)
  }
}

async function incrementProfileViews(databases, profileId) {
  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
      [
        sdk.Query.equal('userId', profileId)
      ]
    )

    if (response.documents.length > 0) {
      const user = response.documents[0]
      // You might want to add a profileViews field to the users collection
      // For now, we'll just log it
      console.log(`Profile view for user: ${profileId}`)
    }
  } catch (error) {
    console.error('Error incrementing profile views:', error)
  }
}

async function trackSearchQuery(databases, userId, query) {
  try {
    // Create search analytics record
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'search-analytics-collection', // You might want to create this collection
      sdk.ID.unique(),
      {
        userId,
        query,
        timestamp: new Date().toISOString()
      }
    )
  } catch (error) {
    console.error('Error tracking search query:', error)
  }
}

async function updateUserLastActive(databases, userId) {
  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
      [
        sdk.Query.equal('userId', userId)
      ]
    )

    if (response.documents.length > 0) {
      const user = response.documents[0]
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
        user.$id,
        {
          lastActive: new Date().toISOString()
        }
      )
    }
  } catch (error) {
    console.error('Error updating user last active:', error)
  }
}
\`\`\`

### 8.4 Function Deployment

Create `appwrite.json` for function configuration:

\`\`\`json
{
  "projectId": "peerspark-platform-prod",
  "functions": [
    {
      "functionId": "notifications-function",
      "name": "Notifications",
      "runtime": "node-18.0",
      "path": "functions/notifications",
      "entrypoint": "src/main.js",
      "ignore": ["node_modules", ".npm"],
      "execute": ["users"],
      "timeout": 15,
      "env": [
        {
          "key": "APPWRITE_FUNCTION_ENDPOINT",
          "value": "https://cloud.appwrite.io/v1"
        },
        {
          "key": "APPWRITE_FUNCTION_PROJECT_ID",
          "value": "peerspark-platform-prod"
        },
        {
          "key": "APPWRITE_DATABASE_ID",
          "value": "peerspark-main-db"
        }
      ],
      "events": [
        "databases.*.collections.*.documents.*.create",
        "databases.*.collections.*.documents.*.update"
      ]
    },
    {
      "functionId": "ai-chat-function",
      "name": "AI Chat",
      "runtime": "node-18.0",
      "path": "functions/ai-chat",
      "entrypoint": "src/main.js",
      "ignore": ["node_modules", ".npm"],
      "execute": ["users"],
      "timeout": 30,
      "env": [
        {
          "key": "OPENAI_API_KEY",
          "value": "$OPENAI_API_KEY"
        }
      ]
    },
    {
      "functionId": "analytics-function",
      "name": "Analytics",
      "runtime": "node-18.0",
      "path": "functions/analytics",
      "entrypoint": "src/main.js",
      "ignore": ["node_modules", ".npm"],
      "execute": ["users"],
      "timeout": 15
    }
  ]
}
\`\`\`

Deploy functions:

\`\`\`bash
# Deploy all functions
appwrite deploy function

# Deploy specific function
appwrite deploy function --functionId notifications-function
\`\`\`

---

## 9. Security Rules

### 9.1 Collection Permissions

\`\`\`bash
# Users Collection - Users can read any profile, but only update their own
appwrite databases updateCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "users-collection" \
  --permissions "read(\"any\")" "write(\"users\")" "update(\"user:[USER_ID]\")"

# Posts Collection - Public read, authenticated write
appwrite databases updateCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "posts-collection" \
  --permissions "read(\"any\")" "write(\"users\")" "update(\"user:[AUTHOR_ID]\")" "delete(\"user:[AUTHOR_ID]\")"

# Messages Collection - Only participants can read/write
appwrite databases updateCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "messages-collection" \
  --permissions "read(\"users\")" "write(\"users\")"

# Chat Rooms Collection - Only participants can access
appwrite databases updateCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "chat-rooms-collection" \
  --permissions "read(\"users\")" "write(\"users\")"

# Follows Collection - Users can manage their own follows
appwrite databases updateCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "follows-collection" \
  --permissions "read(\"users\")" "write(\"users\")" "delete(\"user:[FOLLOWER_ID]\")"

# Likes Collection - Users can manage their own likes
appwrite databases updateCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "likes-collection" \
  --permissions "read(\"users\")" "write(\"users\")" "delete(\"user:[USER_ID]\")"

# Notifications Collection - Users can only see their own notifications
appwrite databases updateCollection \
  --databaseId "peerspark-main-db" \
  --collectionId "notifications-collection" \
  --permissions "read(\"user:[USER_ID]\")" "write(\"users\")" "update(\"user:[USER_ID]\")"
\`\`\`

### 9.2 Storage Permissions

\`\`\`bash
# Configure storage bucket permissions
appwrite storage updateBucket \
  --bucketId "peerspark-storage" \
  --permissions "read(\"any\")" "write(\"users\")" "delete(\"user:[USER_ID]\")" \
  --fileSecurity true
\`\`\`

### 9.3 Security Service

Create `lib/security.ts`:

\`\`\`typescript
import { databases } from './appwrite'
import { Query } from 'appwrite'

export class SecurityService {
  // Check if user can access resource
  async canAccessResource(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'post':
          return await this.canAccessPost(userId, resourceId, action)
        case 'message':
          return await this.canAccessMessage(userId, resourceId, action)
        case 'room':
          return await this.canAccessRoom(userId, resourceId, action)
        case 'profile':
          return await this.canAccessProfile(userId, resourceId, action)
        default:
          return false
      }
    } catch (error) {
      console.error('Security check error:', error)
      return false
    }
  }

  // Check post access
  private async canAccessPost(
    userId: string,
    postId: string,
    action: string
  ): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID!,
        [Query.equal('postId', postId)]
      )

      if (response.documents.length === 0) return false

      const post = response.documents[0]

      // Public posts can be read by anyone
      if (action === 'read' && post.isPublic) return true

      // Author can do anything
      if (post.authorId === userId) return true

      // For private posts, check if user is following author
      if (!post.isPublic) {
        return await this.isFollowing(userId, post.authorId)
      }

      return false
    } catch (error) {
      return false
    }
  }

  // Check message access
  private async canAccessMessage(
    userId: string,
    messageId: string,
    action: string
  ): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
        [Query.equal('messageId', messageId)]
      )

      if (response.documents.length === 0) return false

      const message = response.documents[0]

      // Check if user is participant in the room
      return await this.canAccessRoom(userId, message.roomId, action)
    } catch (error) {
      return false
    }
  }

  // Check room access
  private async canAccessRoom(
    userId: string,
    roomId: string,
    action: string
  ): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID!,
        [Query.equal('roomId', roomId)]
      )

      if (response.documents.length === 0) return false

      const room = response.documents[0]
      const participants = JSON.parse(room.participants)

      return participants.includes(userId)
    } catch (error) {
      return false
    }
  }

  // Check profile access
  private async canAccessProfile(
    userId: string,
    profileUserId: string,
    action: string
  ): Promise<boolean> {
    try {
      // Users can always access their own profile
      if (userId === profileUserId) return true

      // Get profile privacy settings
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
        [Query.equal('userId', profileUserId)]
      )

      if (response.documents.length === 0) return false

      const profile = response.documents[0]

      // Public profiles can be read by anyone
      if (action === 'read' && !profile.isPrivate) return true

      // For private profiles, check if user is following
      if (profile.isPrivate) {
        return await this.isFollowing(userId, profileUserId)
      }

      return false
    } catch (error) {
      return false
    }
  }

  // Check if user is following another user
  private async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_FOLLOWS_COLLECTION_ID!,
        [
          Query.equal('followerId', followerId),
          Query.equal('followingId', followingId)
        ]
      )

      return response.documents.length > 0
    } catch (error) {
      return false
    }
  }

  // Sanitize user input
  sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  }

  // Validate file upload
  validateFileUpload(file: File, allowedTypes: string[], maxSize: number): boolean {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return false
    }

    // Check file size
    if (file.size > maxSize) {
      return false
    }

    return true
  }

  // Rate limiting check
  async checkRateLimit(
    userId: string,
    action: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    try {
      const windowStart = new Date(Date.now() - windowMs).toISOString()

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_ANALYTICS_COLLECTION_ID!,
        [
          Query.equal('userId', userId),
          Query.equal('eventType', action),
          Query.greaterThan('timestamp', windowStart)
        ]
      )

      return response.documents.length < limit
    } catch (error) {
      return true // Allow on error
    }
  }

  // Content moderation
  async moderateContent(content: string): Promise<{
    isAllowed: boolean
    reason?: string
  }> {
    // Basic content filtering
    const bannedWords = [
      'spam', 'scam', 'hack', 'cheat', 'illegal'
      // Add more banned words as needed
    ]

    const lowerContent = content.toLowerCase()
    
    for (const word of bannedWords) {
      if (lowerContent.includes(word)) {
        return {
          isAllowed: false,
          reason: `Content contains prohibited word: ${word}`
        }
      }
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
    if (capsRatio > 0.7 && content.length > 10) {
      return {
        isAllowed: false,
        reason: 'Excessive use of capital letters'
      }
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(content)) {
      return {
        isAllowed: false,
        reason: 'Excessive repeated characters'
      }
    }

    return { isAllowed: true }
  }

  // Generate secure token
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Hash sensitive data
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

export const securityService = new SecurityService()
\`\`\`

---

## 10. Frontend Integration

### 10.1 Main Appwrite Client

Update `lib/appwrite.ts`:

\`\`\`typescript
import { Client, Databases, Storage, Functions, Realtime } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const databases = new Databases(client)
export const storage = new Storage(client)
export const functions = new Functions(client)
export const realtime = new Realtime(client)

export { client }
export default client
\`\`\`

### 10.2 Data Services

Create `lib/services/posts.ts`:

\`\`\`typescript
import { databases } from '../appwrite'
import { ID, Query } from 'appwrite'

export interface Post {
  $id: string
  postId: string
  authorId: string
  title?: string
  content: string
  type: 'text' | 'image' | 'video' | 'link' | 'poll' | 'question' | 'resource'
  mediaUrls?: string[]
  thumbnailUrl?: string
  tags: string[]
  category?: string
  subject?: string
  podId?: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  bookmarksCount: number
  viewsCount: number
  isPublic: boolean
  allowComments: boolean
  isPinned: boolean
  isEdited: boolean
  createdAt: string
  updatedAt?: string
  scheduledAt?: string
}

export class PostsService {
  private databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
  private collectionId = process.env.NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID!

  // Create post
  async createPost(postData: Partial<Post>): Promise<Post> {
    try {
      const postId = ID.unique()
      const post = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        {
          postId,
          ...postData,
          tags: JSON.stringify(postData.tags || []),
          mediaUrls: JSON.stringify(postData.mediaUrls || []),
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          bookmarksCount: 0,
          viewsCount: 0,
          isPublic: postData.isPublic ?? true,
          allowComments: postData.allowComments ?? true,
          isPinned: false,
          isEdited: false,
          createdAt: new Date().toISOString()
        }
      )

      return this.parsePost(post as any)
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  // Get feed posts
  async getFeedPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('isPublic', true),
          Query.orderDesc('createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      )

      return response.documents.map(doc => this.parsePost(doc as any))
    } catch (error) {
      console.error('Error fetching feed posts:', error)
      return []
    }
  }

  // Get user posts
  async getUserPosts(userId: string, limit: number = 20): Promise<Post[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('authorId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(limit)
        ]
      )

      return response.documents.map(doc => this.parsePost(doc as any))
    } catch (error) {
      console.error('Error fetching user posts:', error)
      return []
    }
  }

  // Get single post
  async getPost(postId: string): Promise<Post | null> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal('postId', postId)]
      )

      if (response.documents.length === 0) return null

      return this.parsePost(response.documents[0] as any)
    } catch (error) {
      console.error('Error fetching post:', error)
      return null
    }
  }

  // Update post
  async updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal('postId', postId)]
      )

      if (response.documents.length === 0) {
        throw new Error('Post not found')
      }

      const processedUpdates = { ...updates }
      if (processedUpdates.tags) {
        processedUpdates.tags = JSON.stringify(processedUpdates.tags) as any
      }
      if (processedUpdates.mediaUrls) {
        processedUpdates.mediaUrls = JSON.stringify(processedUpdates.mediaUrls) as any
      }

      const updatedPost = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        response.documents[0].$id,
        {
          ...processedUpdates,
          isEdited: true,
          updatedAt: new Date().toISOString()
        }
      )

      return this.parsePost(updatedPost as any)
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    }
  }

  // Delete post
  async deletePost(postId: string): Promise<void> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal('postId', postId)]
      )

      if (response.documents.length === 0) {
        throw new Error('Post not found')
      }

      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        response.documents[0].$id
      )
    } catch (error) {
      console.error('Error deleting post:', error)
      throw error
    }
  }

  // Search posts
  async searchPosts(query: string, limit: number = 20): Promise<Post[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.search('content', query),
          Query.equal('isPublic', true),
          Query.orderDesc('createdAt'),
          Query.limit(limit)
        ]
      )

      return response.documents.map(doc => this.parsePost(doc as any))
    } catch (error) {
      console.error('Error searching posts:', error)
      return []
    }
  }

  // Get posts by category
  async getPostsByCategory(category: string, limit: number = 20): Promise<Post[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('category', category),
          Query.equal('isPublic', true),
          Query.orderDesc('createdAt'),
          Query.limit(limit)
        ]
      )

      return response.documents.map(doc => this.parsePost(doc as any))
    } catch (error) {
      console.error('Error fetching posts by category:', error)
      return []
    }
  }

  // Get trending posts
  async getTrendingPosts(limit: number = 20): Promise<Post[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('isPublic', true),
          Query.orderDesc('likesCount'),
          Query.orderDesc('commentsCount'),
          Query.limit(limit)
        ]
      )

      return response.documents.map(doc => this.parsePost(doc as any))
    } catch (error) {
      console.error('Error fetching trending posts:', error)
      return []
    }
  }

  // Parse post document
  private parsePost(doc: any): Post {
    return {
      ...doc,
      tags: JSON.parse(doc.tags || '[]'),
      mediaUrls: JSON.parse(doc.mediaUrls || '[]')
    }
  }
}

export const postsService = new PostsService()
\`\`\`

### 10.3 Real-time Hooks

Create `hooks/use-realtime.ts`:

\`\`\`typescript
import { useEffect, useRef } from 'react'
import { client } from '@/lib/appwrite'
import { RealtimeResponseEvent } from 'appwrite'

export function useRealtime<T>(
  channels: string | string[],
  onMessage: (payload: RealtimeResponseEvent<T>) => void,
  dependencies: any[] = []
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Subscribe to channels
    const channelArray = Array.isArray(channels) ? channels : [channels]
    unsubscribeRef.current = client.subscribe(channelArray, onMessage)

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, dependencies)

  return () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }
  }
}

// Hook for real-time posts
export function useRealtimePosts(onPostUpdate: (post: any) => void) {
  return useRealtime(
    `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID}.documents`,
    (response) => {
      onPostUpdate(response.payload)
    }
  )
}

// Hook for real-time messages
export function useRealtimeMessages(
  roomId: string,
  onMessage: (message: any) => void
) {
  return useRealtime(
    `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID}.documents`,
    (response) => {
      const message = response.payload
      if (message.roomId === roomId) {
        onMessage(message)
      }
    },
    [roomId]
  )
}

// Hook for real-time notifications
export function useRealtimeNotifications(
  userId: string,
  onNotification: (notification: any) => void
) {
  return useRealtime(
    `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID}.documents`,
    (response) => {
      const notification = response.payload
      if (notification.userId === userId) {
        onNotification(notification)
      }
    },
    [userId]
  )
}
\`\`\`

---

## 11. Deployment Guide

### 11.1 Environment Setup

Create production environment variables:

\`\`\`bash
# Production .env.local
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=peerspark-platform-prod
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
NEXT_PUBLIC_APPWRITE_STORAGE_ID=peerspark-storage

# All collection IDs
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users-collection
NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION_ID=posts-collection
NEXT_PUBLIC_APPWRITE_PODS_COLLECTION_ID=pods-collection
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages-collection
NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION_ID=resources-collection
NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=events-collection
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications-collection
NEXT_PUBLIC_APPWRITE_FOLLOWS_COLLECTION_ID=follows-collection
NEXT_PUBLIC_APPWRITE_LIKES_COLLECTION_ID=likes-collection
NEXT_PUBLIC_APPWRITE_COMMENTS_COLLECTION_ID=comments-collection
NEXT_PUBLIC_APPWRITE_BOOKMARKS_COLLECTION_ID=bookmarks-collection
NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION_ID=chat-rooms-collection
NEXT_PUBLIC_APPWRITE_ANALYTICS_COLLECTION_ID=analytics-collection

# Function IDs
NEXT_PUBLIC_APPWRITE_CHAT_FUNCTION_ID=ai-chat-function
NEXT_PUBLIC_APPWRITE_NOTIFICATION_FUNCTION_ID=notifications-function
NEXT_PUBLIC_APPWRITE_ANALYTICS_FUNCTION_ID=analytics-function

# Server-side variables
APPWRITE_FUNCTION_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=peerspark-platform-prod
APPWRITE_API_KEY=your-server-api-key
APPWRITE_DATABASE_ID=peerspark-main-db

# Push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# External services
SENDGRID_API_KEY=your-sendgrid-api-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
\`\`\`

### 11.2 Vercel Deployment

Create `vercel.json`:

\`\`\`json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/webhooks/appwrite",
      "destination": "/api/webhooks/appwrite"
    }
  ]
}
\`\`\`

Deploy to Vercel:

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_APPWRITE_ENDPOINT
vercel env add NEXT_PUBLIC_APPWRITE_PROJECT_ID
# ... add all other environment variables
\`\`\`

### 11.3 Domain Configuration

\`\`\`bash
# Add custom domain in Vercel dashboard
# Configure DNS records:
# A record: @ -> 76.76.19.61
# CNAME record: www -> cname.vercel-dns.com

# Add domain to Appwrite project
# In Appwrite Console -> Settings -> Domains
# Add: https://peerspark.com
# Add: https://www.peerspark.com
\`\`\`

### 11.4 SSL and Security Headers

Create `next.config.mjs`:

\`\`\`javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cloud.appwrite.io',
      'peerspark.com',
      'www.peerspark.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
        pathname: '/v1/storage/buckets/*/files/*/view**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/webhooks/:path*',
        destination: '/api/webhooks/:path*',
      },
    ]
  },
}

export default nextConfig
\`\`\`

---

## 12. Testing & Monitoring

### 12.1 Testing Setup

Create `__tests__/auth.test.ts`:

\`\`\`typescript
import { authService } from '@/lib/auth'

describe('Authentication Service', () => {
  test('should register new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser'
    }

    const result = await authService.register(
      userData.email,
      userData.password,
      userData.firstName,
      userData.lastName,
      userData.username
    )

    expect(result.user).toBeDefined()
    expect(result.profile).toBeDefined()
    expect(result.profile.email).toBe(userData.email)
  })

  test('should login existing user', async () => {
    const result = await authService.login('test@example.com', 'password123')
    
    expect(result.user).toBeDefined()
    expect(result.profile).toBeDefined()
    expect(result.session).toBeDefined()
  })

  test('should check username availability', async () => {
    const isAvailable = await authService.checkUsernameAvailability('newusername')
    expect(typeof isAvailable).toBe('boolean')
  })
})
\`\`\`

### 12.2 Monitoring Setup

Create `lib/monitoring.ts`:

\`\`\`typescript
export class MonitoringService {
  // Log error
  static logError(error: Error, context?: any) {
    console.error('Error:', error.message, {
      stack: error.stack,
      context,
      timestamp: new Date().toISOString
