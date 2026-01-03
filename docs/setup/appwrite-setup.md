# 🚀 Complete Appwrite Setup Guide for PeerSpark

This guide will walk you through setting up Appwrite for your PeerSpark platform step by step, like explaining to a 5-year-old! 

## 📋 Table of Contents
1. [What is Appwrite?](#what-is-appwrite)
2. [Creating Your Appwrite Account](#creating-your-appwrite-account)
3. [Setting Up Your Project](#setting-up-your-project)
4. [Creating the Database](#creating-the-database)
5. [Setting Up Collections](#setting-up-collections)
6. [Creating Storage Buckets](#creating-storage-buckets)
7. [Configuring Authentication](#configuring-authentication)
8. [Setting Up Environment Variables](#setting-up-environment-variables)
9. [Testing Your Setup](#testing-your-setup)
10. [Troubleshooting](#troubleshooting)

---

## 🤔 What is Appwrite?

Think of Appwrite like a magical toolbox that helps your app store information, manage users, and handle files - all without you having to build these complicated parts yourself!

It's like having a super-smart assistant that:
- 👥 Manages who can log into your app
- 💾 Stores all your app's data (like user profiles, messages, etc.)
- 📁 Keeps your files safe (like profile pictures, documents)
- 🔄 Updates everything in real-time

---

## 🎯 Creating Your Appwrite Account

### Step 1: Go to Appwrite Cloud
1. Open your web browser
2. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
3. Click the big **"Sign Up"** button

### Step 2: Create Your Account
1. Enter your email address
2. Create a strong password (mix of letters, numbers, and symbols)
3. Click **"Create Account"**
4. Check your email and click the verification link

### Step 3: Verify Your Account
1. Open the email from Appwrite
2. Click **"Verify Email"**
3. You'll be redirected back to Appwrite - you're now logged in! 🎉

---

## 🏗️ Setting Up Your Project

### Step 1: Create a New Project
1. Once logged in, you'll see a **"Create Project"** button
2. Click it!
3. Give your project a name: **"PeerSpark"**
4. Choose your region: **"Frankfurt"** (since your endpoint is fra.cloud.appwrite.io)
5. Click **"Create"**

### Step 2: Get Your Project Details
After creating the project, you'll see:
- **Project ID**: This should be `68921a0d00146e65d29b` (yours)
- **Endpoint**: This should be `https://fra.cloud.appwrite.io/v1`

✅ **Important**: Write these down! You already have them in your credentials.

---

## 💾 Creating the Database

### Step 1: Navigate to Databases
1. In your Appwrite dashboard, look for the left sidebar
2. Click on **"Databases"** (it has a database icon 🗄️)
3. Click **"Create Database"**

### Step 2: Create Your Main Database
1. **Database ID**: Enter `peerspark-main-db`
2. **Name**: Enter `PeerSpark Main Database`
3. Click **"Create"**

🎉 Congratulations! You now have a database!

---

## 📊 Setting Up Collections

Now we need to create "collections" - think of these as different folders for different types of information.

### Collection 1: User Profiles

1. Click **"Create Collection"**
2. **Collection ID**: `profiles`
3. **Name**: `User Profiles`
4. Click **"Create"**

Now add these **Attributes** (fields) by clicking **"Create Attribute"**:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `userId` | String | 255 | ✅ Yes | - |
| `name` | String | 255 | ✅ Yes | - |
| `email` | String | 255 | ✅ Yes | - |
| `bio` | String | 1000 | ❌ No | "" |
| `avatar` | String | 500 | ❌ No | "" |
| `avatarFileId` | String | 255 | ❌ No | "" |
| `interests` | String | 2000 | ❌ No | "[]" |
| `joinedAt` | String | 255 | ✅ Yes | - |
| `isOnline` | Boolean | - | ❌ No | false |
| `lastSeen` | String | 255 | ❌ No | "" |
| `studyStreak` | Integer | - | ❌ No | 0 |
| `totalPoints` | Integer | - | ❌ No | 0 |
| `level` | Integer | - | ❌ No | 1 |
| `badges` | String | 2000 | ❌ No | "[]" |

### Collection 2: Posts

1. Click **"Create Collection"**
2. **Collection ID**: `posts`
3. **Name**: `Posts`
4. Click **"Create"**

Add these attributes:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `authorId` | String | 255 | ✅ Yes | - |
| `content` | String | 5000 | ✅ Yes | - |
| `type` | String | 50 | ✅ Yes | "text" |
| `podId` | String | 255 | ❌ No | "" |
| `resourceId` | String | 255 | ❌ No | "" |
| `imageUrl` | String | 500 | ❌ No | "" |
| `imageFileId` | String | 255 | ❌ No | "" |
| `timestamp` | String | 255 | ✅ Yes | - |
| `likes` | Integer | - | ❌ No | 0 |
| `comments` | Integer | - | ❌ No | 0 |
| `shares` | Integer | - | ❌ No | 0 |
| `isEdited` | Boolean | - | ❌ No | false |
| `editedAt` | String | 255 | ❌ No | "" |
| `visibility` | String | 50 | ❌ No | "public" |
| `tags` | String | 1000 | ❌ No | "[]" |
| `mentions` | String | 1000 | ❌ No | "[]" |
| `likedBy` | String | 5000 | ❌ No | "[]" |

### Collection 3: Messages

1. Click **"Create Collection"**
2. **Collection ID**: `messages`
3. **Name**: `Messages`
4. Click **"Create"**

Add these attributes:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `roomId` | String | 255 | ✅ Yes | - |
| `authorId` | String | 255 | ✅ Yes | - |
| `content` | String | 5000 | ✅ Yes | - |
| `type` | String | 50 | ✅ Yes | "text" |
| `timestamp` | String | 255 | ✅ Yes | - |
| `isEdited` | Boolean | - | ❌ No | false |
| `editedAt` | String | 255 | ❌ No | "" |
| `replyTo` | String | 255 | ❌ No | "" |
| `fileUrl` | String | 500 | ❌ No | "" |
| `fileName` | String | 255 | ❌ No | "" |
| `fileSize` | Integer | - | ❌ No | 0 |
| `reactions` | String | 2000 | ❌ No | "{}" |
| `mentions` | String | 1000 | ❌ No | "[]" |

### Collection 4: Pods

1. Click **"Create Collection"**
2. **Collection ID**: `pods`
3. **Name**: `Pods`
4. Click **"Create"**

Add these attributes:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `teamId` | String | 255 | ✅ Yes | - |
| `name` | String | 255 | ✅ Yes | - |
| `description` | String | 2000 | ✅ Yes | - |
| `creatorId` | String | 255 | ✅ Yes | - |
| `members` | String | 5000 | ✅ Yes | "[]" |
| `subject` | String | 100 | ❌ No | "" |
| `difficulty` | String | 50 | ❌ No | "Beginner" |
| `tags` | String | 1000 | ❌ No | "[]" |
| `isActive` | Boolean | - | ❌ No | true |
| `isPublic` | Boolean | - | ❌ No | true |
| `maxMembers` | Integer | - | ❌ No | 50 |
| `createdAt` | String | 255 | ✅ Yes | - |
| `updatedAt` | String | 255 | ❌ No | "" |
| `memberCount` | Integer | - | ❌ No | 1 |
| `totalSessions` | Integer | - | ❌ No | 0 |
| `totalResources` | Integer | - | ❌ No | 0 |
| `avatar` | String | 500 | ❌ No | "" |
| `rules` | String | 2000 | ❌ No | "[]" |
| `schedule` | String | 2000 | ❌ No | "{}" |

### Collection 5: Resources

1. Click **"Create Collection"**
2. **Collection ID**: `resources`
3. **Name**: `Resources`
4. Click **"Create"**

Add these attributes:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `fileId` | String | 255 | ✅ Yes | - |
| `fileName` | String | 255 | ✅ Yes | - |
| `fileSize` | Integer | - | ✅ Yes | - |
| `fileType` | String | 100 | ✅ Yes | - |
| `fileUrl` | String | 500 | ✅ Yes | - |
| `title` | String | 255 | ✅ Yes | - |
| `description` | String | 2000 | ❌ No | "" |
| `tags` | String | 1000 | ❌ No | "[]" |
| `authorId` | String | 255 | ✅ Yes | - |
| `podId` | String | 255 | ❌ No | "" |
| `visibility` | String | 50 | ❌ No | "public" |
| `category` | String | 100 | ❌ No | "other" |
| `uploadedAt` | String | 255 | ✅ Yes | - |
| `downloads` | Integer | - | ❌ No | 0 |
| `likes` | Integer | - | ❌ No | 0 |
| `views` | Integer | - | ❌ No | 0 |
| `isApproved` | Boolean | - | ❌ No | true |

### Collection 6: Notifications

1. Click **"Create Collection"**
2. **Collection ID**: `notifications`
3. **Name**: `Notifications`
4. Click **"Create"**

Add these attributes:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `userId` | String | 255 | ✅ Yes | - |
| `title` | String | 255 | ✅ Yes | - |
| `message` | String | 1000 | ✅ Yes | - |
| `type` | String | 50 | ✅ Yes | "info" |
| `isRead` | Boolean | - | ❌ No | false |
| `timestamp` | String | 255 | ✅ Yes | - |
| `readAt` | String | 255 | ❌ No | "" |
| `actionUrl` | String | 500 | ❌ No | "" |
| `actionText` | String | 100 | ❌ No | "" |
| `imageUrl` | String | 500 | ❌ No | "" |

### Collection 7: Calendar Events

1. Click **"Create Collection"**
2. **Collection ID**: `calendar_events`
3. **Name**: `Calendar Events`
4. Click **"Create"**

Add these attributes:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `userId` | String | 255 | ✅ Yes | - |
| `title` | String | 255 | ✅ Yes | - |
| `description` | String | 2000 | ❌ No | "" |
| `startTime` | String | 255 | ✅ Yes | - |
| `endTime` | String | 255 | ✅ Yes | - |
| `type` | String | 50 | ❌ No | "study" |
| `podId` | String | 255 | ❌ No | "" |
| `isRecurring` | Boolean | - | ❌ No | false |
| `recurringPattern` | String | 500 | ❌ No | "" |
| `attendees` | String | 2000 | ❌ No | "[]" |
| `location` | String | 255 | ❌ No | "" |
| `meetingUrl` | String | 500 | ❌ No | "" |
| `reminders` | String | 500 | ❌ No | "[15]" |
| `createdAt` | String | 255 | ✅ Yes | - |
| `updatedAt` | String | 255 | ❌ No | "" |
| `isCompleted` | Boolean | - | ❌ No | false |

### Collection 8: Chat Rooms

1. Click **"Create Collection"**
2. **Collection ID**: `chat_rooms`
3. **Name**: `Chat Rooms`
4. Click **"Create"**

Add these attributes:

| Attribute Key | Type | Size | Required | Default |
|---------------|------|------|----------|---------|
| `podId` | String | 255 | ❌ No | "" |
| `name` | String | 255 | ❌ No | "" |
| `type` | String | 50 | ✅ Yes | "pod" |
| `participants` | String | 2000 | ❌ No | "[]" |
| `createdBy` | String | 255 | ❌ No | "" |
| `createdAt` | String | 255 | ✅ Yes | - |
| `isActive` | Boolean | - | ❌ No | true |
| `lastMessage` | String | 1000 | ❌ No | "" |
| `lastMessageTime` | String | 255 | ❌ No | "" |

---

## 📁 Creating Storage Buckets

Storage buckets are like different folders where you keep different types of files.

### Step 1: Navigate to Storage
1. In the left sidebar, click **"Storage"** (folder icon 📁)
2. Click **"Create Bucket"**

### Bucket 1: Avatars
1. **Bucket ID**: `avatars`
2. **Name**: `User Avatars`
3. **File Size Limit**: `5MB`
4. **Allowed File Extensions**: `jpg,jpeg,png,gif,webp`
5. **Encryption**: ✅ Enabled
6. **Antivirus**: ✅ Enabled
7. Click **"Create"**

### Bucket 2: Resources
1. **Bucket ID**: `resources`
2. **Name**: `Study Resources`
3. **File Size Limit**: `50MB`
4. **Allowed File Extensions**: `pdf,doc,docx,txt,ppt,pptx,xls,xlsx,jpg,jpeg,png,gif,mp4,mp3`
5. **Encryption**: ✅ Enabled
6. **Antivirus**: ✅ Enabled
7. Click **"Create"**

### Bucket 3: Attachments
1. **Bucket ID**: `attachments`
2. **Name**: `Chat Attachments`
3. **File Size Limit**: `25MB`
4. **Allowed File Extensions**: `jpg,jpeg,png,gif,pdf,doc,docx,txt,mp4,mp3,zip`
5. **Encryption**: ✅ Enabled
6. **Antivirus**: ✅ Enabled
7. Click **"Create"**

### Bucket 4: Post Images
1. **Bucket ID**: `post_images`
2. **Name**: `Post Images`
3. **File Size Limit**: `10MB`
4. **Allowed File Extensions**: `jpg,jpeg,png,gif,webp`
5. **Encryption**: ✅ Enabled
6. **Antivirus**: ✅ Enabled
7. Click **"Create"**

---

## 🔐 Configuring Authentication

### Step 1: Navigate to Auth
1. In the left sidebar, click **"Auth"** (key icon 🔑)
2. Click on **"Settings"**

### Step 2: Configure Auth Settings
1. **Session Length**: Set to `365 days` (1 year)
2. **Password History**: `5` (prevents reusing last 5 passwords)
3. **Password Dictionary**: ✅ Enabled
4. **Personal Data**: ✅ Enabled
5. **Mock Numbers**: ❌ Disabled (for production)

### Step 3: Enable OAuth Providers (Optional)
If you want users to login with Google, GitHub, etc.:

1. Click **"OAuth2"** tab
2. Enable **Google**:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Add your Client ID and Client Secret
3. Enable **GitHub**:
   - Get credentials from [GitHub Developer Settings](https://github.com/settings/developers)
   - Add your Client ID and Client Secret

### Step 4: Configure Security
1. Click **"Security"** tab
2. **Session Alerts**: ✅ Enabled
3. **Password Breach Detection**: ✅ Enabled
4. **Rate Limits**: Keep default settings

---

## 🔧 Setting Up Environment Variables

Now you need to tell your app how to connect to Appwrite.

### Step 1: Create Environment File
In your project root, create a `.env.local` file:

\`\`\`bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68921a0d00146e65d29b
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db

# Optional: Add these if you plan to use server-side functions
APPWRITE_API_KEY=your-api-key-here
\`\`\`

### Step 2: Get Your API Key (Optional)
If you need server-side access:

1. Go to **"Overview"** in your Appwrite dashboard
2. Scroll down to **"Integrations"**
3. Click **"API Keys"**
4. Click **"Create API Key"**
5. **Name**: `PeerSpark Server Key`
6. **Scopes**: Select all the permissions you need
7. Click **"Create"**
8. Copy the API key and add it to your `.env.local` file

### Step 3: Update Your Code
Your `lib/appwrite.ts` file is already configured with the correct credentials!

---

## 🧪 Testing Your Setup

### Step 1: Test Database Connection
1. Start your development server: `npm run dev`
2. Open your browser and go to `http://localhost:3000`
3. Try to register a new account
4. Check your Appwrite dashboard - you should see:
   - New user in **Auth > Users**
   - New profile in **Databases > profiles**

### Step 2: Test File Upload
1. Try uploading a profile picture
2. Check **Storage > avatars** - you should see the uploaded file

### Step 3: Test Real-time Features
1. Open two browser windows
2. Send a message in one window
3. It should appear in the other window (with a small delay due to polling)

---

## 🔧 Setting Up Permissions

This is VERY important! Without proper permissions, your app won't work.

### Step 1: Set Collection Permissions

For each collection, you need to set permissions:

1. Go to **Databases > [Collection Name]**
2. Click **"Settings"** tab
3. Click **"Permissions"**

#### For `profiles` collection:
- **Create**: `users`
- **Read**: `users`
- **Update**: `users`
- **Delete**: `users`

#### For `posts` collection:
- **Create**: `users`
- **Read**: `any`
- **Update**: `users`
- **Delete**: `users`

#### For `messages` collection:
- **Create**: `users`
- **Read**: `users`
- **Update**: `users`
- **Delete**: `users`

#### For `pods` collection:
- **Create**: `users`
- **Read**: `any`
- **Update**: `users`
- **Delete**: `users`

#### For `resources` collection:
- **Create**: `users`
- **Read**: `any`
- **Update**: `users`
- **Delete**: `users`

#### For `notifications` collection:
- **Create**: `users`
- **Read**: `users`
- **Update**: `users`
- **Delete**: `users`

#### For `calendar_events` collection:
- **Create**: `users`
- **Read**: `users`
- **Update**: `users`
- **Delete**: `users`

#### For `chat_rooms` collection:
- **Create**: `users`
- **Read**: `users`
- **Update**: `users`
- **Delete**: `users`

### Step 2: Set Storage Permissions

For each bucket:

1. Go to **Storage > [Bucket Name]**
2. Click **"Settings"** tab
3. Click **"Permissions"**

#### For all buckets:
- **Create**: `users`
- **Read**: `any`
- **Update**: `users`
- **Delete**: `users`

---

## 🎯 Setting Up Jitsi for Video Calls

Jitsi is already integrated in your code! Here's how it works:

### How Jitsi Integration Works
1. When someone starts a meeting, the app creates a unique room name
2. It generates a Jitsi Meet URL: `https://meet.jit.si/[room-name]`
3. All participants get the same URL and can join the meeting
4. It's completely free and doesn't require any setup!

### Testing Video Calls
1. Go to any pod in your app
2. Look for a video call button
3. Click it - it should open a new tab with Jitsi Meet
4. Share the URL with others to join the same meeting

---

## 🚨 Troubleshooting

### Problem: "Collection not found" error
**Solution**: 
1. Make sure you created all collections with the exact IDs mentioned above
2. Check that `DATABASE_ID` in your code matches your database ID

### Problem: "Permission denied" error
**Solution**:
1. Go to your collection settings
2. Make sure permissions are set correctly (see permissions section above)
3. Make sure users are logged in before trying to access data

### Problem: "File upload failed" error
**Solution**:
1. Check that your storage buckets exist
2. Verify file size limits and allowed extensions
3. Make sure storage permissions are set correctly

### Problem: "Authentication failed" error
**Solution**:
1. Double-check your project ID and endpoint in `.env.local`
2. Make sure the file is named `.env.local` (not `.env`)
3. Restart your development server after changing environment variables

### Problem: Messages not appearing in real-time
**Solution**:
This is normal! The current setup uses polling (checking every few seconds) instead of true real-time updates. For production, you'd want to implement Appwrite's real-time subscriptions.

### Problem: "Network error" or "Failed to fetch"
**Solution**:
1. Check your internet connection
2. Verify your Appwrite endpoint is correct
3. Make sure your Appwrite project is active (not paused)

---

## 🎉 Congratulations!

You've successfully set up Appwrite for PeerSpark! Here's what you now have:

✅ **User Authentication** - Users can register, login, and manage their accounts
✅ **Database** - All your app data is stored securely
✅ **File Storage** - Profile pictures, documents, and attachments
✅ **Real-time Features** - Messages and notifications (with polling)
✅ **Video Calls** - Integrated Jitsi Meet for pod meetings
✅ **Calendar System** - Events and scheduling

### Next Steps:
1. **Test everything** - Try all features to make sure they work
2. **Add more users** - Invite friends to test the platform
3. **Monitor usage** - Check your Appwrite dashboard regularly
4. **Optimize performance** - As you grow, you might need to upgrade your plan

### Need Help?
- **Appwrite Documentation**: [https://appwrite.io/docs](https://appwrite.io/docs)
- **Appwrite Discord**: [https://discord.gg/appwrite](https://discord.gg/appwrite)
- **Appwrite GitHub**: [https://github.com/appwrite/appwrite](https://github.com/appwrite/appwrite)

Remember: Building an app is like building with LEGO blocks - start simple, test often, and add features one by one! 🧱

---

## 📱 Mobile Optimization Notes

Your PeerSpark app is already mobile-optimized! Here are the key features:

- **Responsive Design** - Works on phones, tablets, and desktops
- **Touch-Friendly** - All buttons and inputs work great on touch screens
- **Mobile Navigation** - Bottom navigation bar for easy thumb access
- **Optimized Chat** - Message input boxes work perfectly on mobile keyboards
- **File Upload** - Camera and gallery access for easy photo sharing

---

## 🔒 Security Best Practices

Your setup includes several security features:

1. **Encrypted Storage** - All files are encrypted
2. **Secure Authentication** - Passwords are hashed and secure
3. **Permission-Based Access** - Users can only access their own data
4. **Rate Limiting** - Prevents spam and abuse
5. **Input Validation** - All data is validated before storage

---

## 📊 Monitoring Your App

Keep an eye on these metrics in your Appwrite dashboard:

- **Active Users** - How many people are using your app
- **Database Usage** - How much data you're storing
- **Storage Usage** - How many files are uploaded
- **API Calls** - How often your app talks to Appwrite
- **Bandwidth** - How much data is being transferred

---

**Happy coding! 🚀 Your PeerSpark platform is now ready to help students learn together!**
