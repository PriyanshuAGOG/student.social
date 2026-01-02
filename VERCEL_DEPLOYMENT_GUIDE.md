# Deploy PeerSpark to Vercel - Complete Guide

## 🚀 Prerequisites

1. **GitHub Account** - Required for Vercel deployment
2. **Vercel Account** - https://vercel.com (free tier available)
3. **Git Installed** - For pushing code to GitHub
4. **Project Code** - Already in `c:\Users\ok\Downloads\peerspark-platform-main\peerspark-platform-main`

---

## 📋 Step-by-Step Deployment

### Step 1: Push Code to GitHub

#### 1.1 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `peerspark-platform`
3. Description: "Collaborative Learning Platform"
4. Choose **Public** (easier for Vercel free tier)
5. Click "Create repository"

#### 1.2 Initialize Git Locally
```cmd
cd c:\Users\ok\Downloads\peerspark-platform-main\peerspark-platform-main

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: PeerSpark platform with all features"
```

#### 1.3 Connect to GitHub
```cmd
# Add GitHub remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/peerspark-platform.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 2: Create .env.production File

The `.env.local` file is local-only. Create `.env.production` for production:

**File: `.env.production`**
```env
# Appwrite Configuration (same as .env.local)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68921a0d00146e65d29b
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
NEXT_PUBLIC_APPWRITE_STORAGE_ID=peerspark-storage

# Collections
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION=profiles
NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION=posts
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION=messages
NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION=resources
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION=notifications
NEXT_PUBLIC_APPWRITE_PODS_COLLECTION=pods
NEXT_PUBLIC_APPWRITE_CALENDAR_EVENTS_COLLECTION=calendar_events
NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION=chat_rooms

# Storage Buckets
NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET=avatars
NEXT_PUBLIC_APPWRITE_RESOURCES_BUCKET=resources
NEXT_PUBLIC_APPWRITE_ATTACHMENTS_BUCKET=attachments
NEXT_PUBLIC_APPWRITE_POST_IMAGES_BUCKET=post_images

# App Configuration
NEXT_PUBLIC_APP_NAME=PeerSpark
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# API Keys (same as .env.local)
APPWRITE_API_KEY=standard_335d1a664d81c56203d0e65a9c6a1efb8614cfb2a4af72c320013b20d9b97a9a203fa620d17267a9fbf1be4246b3b980a206f8285d98706b797d08d432e9c91a87629514a84372ecde3a27e1f6410a76a13dd30fc4375d296e3da56084a0b5476d4aa9f304173b56d3919045d4e7a99bc2e184ffb0a98ee604cb6a6048d6e818
APPWRITE_LOG_DEBUG=false
OPENROUTER_API_KEY=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
```

⚠️ **IMPORTANT**: Do NOT commit `.env.production` to GitHub if it contains real API keys!

Instead, set environment variables in Vercel dashboard (Step 4).

### Step 3: Set Up Vercel Project

#### 3.1 Import Project to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Search for `peerspark-platform`
5. Click "Import"

#### 3.2 Configure Project Settings
1. **Project Name**: `peerspark` (or your preferred name)
2. **Framework**: Next.js (should auto-detect)
3. **Root Directory**: `./` (default)
4. **Build Command**: `pnpm run build`
5. **Output Directory**: `.next`
6. **Install Command**: `pnpm install`

#### 3.3 Environment Variables
In the "Environment Variables" section, add:

**Public Variables (NEXT_PUBLIC_*):**
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68921a0d00146e65d29b
NEXT_PUBLIC_APPWRITE_DATABASE_ID=peerspark-main-db
NEXT_PUBLIC_APPWRITE_STORAGE_ID=peerspark-storage
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION=profiles
NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION=posts
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION=messages
NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION=resources
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION=notifications
NEXT_PUBLIC_APPWRITE_PODS_COLLECTION=pods
NEXT_PUBLIC_APPWRITE_CALENDAR_EVENTS_COLLECTION=calendar_events
NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION=chat_rooms
NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET=avatars
NEXT_PUBLIC_APPWRITE_RESOURCES_BUCKET=resources
NEXT_PUBLIC_APPWRITE_ATTACHMENTS_BUCKET=attachments
NEXT_PUBLIC_APPWRITE_POST_IMAGES_BUCKET=post_images
NEXT_PUBLIC_APP_NAME=PeerSpark
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**Private Variables:**
```
APPWRITE_API_KEY=standard_335d1a664d81c56203d0e65a9c6a1efb8614cfb2a4af72c320013b20d9b97a9a203fa620d17267a9fbf1be4246b3b980a206f8285d98706b797d08d432e9c91a87629514a84372ecde3a27e1f6410a76a13dd30fc4375d296e3da56084a0b5476d4aa9f304173b56d3919045d4e7a99bc2e184ffb0a98ee604cb6a6048d6e818
APPWRITE_LOG_DEBUG=false
OPENROUTER_API_KEY=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
```

### Step 4: Add Vercel Domain to Appwrite Platforms (CRITICAL!)

⚠️ **THIS STEP IS REQUIRED** - Without this, you'll get CORS errors like:
```
Access to fetch at 'https://fra.cloud.appwrite.io/v1/account' from origin 
'https://your-app.vercel.app' has been blocked by CORS policy
```

**Follow these steps to fix CORS:**

1. Go to https://cloud.appwrite.io
2. Click on your project (ID: `68921a0d00146e65d29b`)
3. Click **"Settings"** (gear icon) in the left sidebar OR go to **"Overview"**
4. Scroll down to **"Integrations"** section → Click **"Platforms"**
5. Click **"+ Add Platform"** button
6. Select **"Web App"**
7. Configure the platform:
   - **Name**: `Vercel Production`
   - **Hostname**: Your Vercel domain (e.g., `studentsocial-iin0su9fw-priyanshus-projects-61ab6498.vercel.app`)
   - ⚠️ **DO NOT include `https://`** - just the domain name!
8. Click **"Register"** → **"Skip optional steps"** → **"Go to dashboard"**

**Add these additional platforms for full coverage:**

| Name | Hostname | Purpose |
|------|----------|---------|
| `Vercel Production` | `studentsocial-iin0su9fw-priyanshus-projects-61ab6498.vercel.app` | Main deployment |
| `Vercel Previews` | `*.vercel.app` | Preview deployments |
| `Local Development` | `localhost` | Local testing |

**Visual Path:**
```
Appwrite Console
└── Your Project
    └── Settings (⚙️) OR Overview
        └── Integrations → Platforms
            └── + Add Platform → Web App
                └── Hostname: your-app.vercel.app (no https://)
```

### Step 5: Deploy!

Click "Deploy" button on Vercel.

**Deployment will take 3-5 minutes**

---

## ✅ Verify Deployment

### After Deployment
1. Visit your Vercel URL (e.g., `https://peerspark.vercel.app`)
2. You should see the PeerSpark landing page
3. Try the following:
   - [ ] Click "Sign up"
   - [ ] Register a test account
   - [ ] Check email for verification link
   - [ ] Complete verification
   - [ ] Login
   - [ ] Complete onboarding

### If Deployment Fails
Check the "Deployment" tab in Vercel for build logs.

**Common Issues:**

1. **Build Error: Missing dependencies**
   - Solution: Ensure `pnpm-lock.yaml` is committed to GitHub

2. **Environment variables not working**
   - Solution: Check they're added in Vercel dashboard
   - Verify NEXT_PUBLIC_ prefix for client-side vars

3. **CORS Error: "Access to fetch blocked by CORS policy"** ⚠️ COMMON
   - Error looks like: `Access to fetch at 'https://fra.cloud.appwrite.io/v1/account' from origin 'https://your-app.vercel.app' has been blocked by CORS policy`
   - **ROOT CAUSE**: Your Vercel domain is NOT added as a platform in Appwrite
   - **Solution**: 
     1. Go to Appwrite Console → Your Project → Settings → Platforms
     2. Add a **Web App** platform with your exact Vercel hostname
     3. **DO NOT include `https://`** in the hostname field
     4. Wait 1-2 minutes for changes to propagate
     5. Hard refresh your browser (Ctrl+Shift+R)

4. **Appwrite connection error**
   - Solution: Verify Appwrite credentials are correct
   - Check CORS settings in Appwrite (see issue #3 above)

5. **Module not found errors**
   - Solution: Run `pnpm install` locally to update lock file
   - Commit and push changes

---

## 🌐 Custom Domain (Optional)

To use your own domain:

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain
4. Follow DNS configuration instructions
5. Update Appwrite CORS with your domain

---

## 📊 Monitoring & Logs

### View Deployment Logs
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click on any deployment
5. View build and runtime logs

### Monitor Performance
- Vercel Analytics (free)
- Web Vitals tracking
- Error tracking

---

## 🔄 Continuous Deployment

After initial setup, every push to GitHub will trigger automatic deployment:

```cmd
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically:
1. Build the project
2. Run tests (if configured)
3. Deploy to production

---

## 🚨 Important Notes

### Security
- **Never commit `.env.local` or `.env.production`** with real API keys
- Use Vercel Environment Variables for secrets
- Consider rotating API keys periodically

### Performance
- Vercel provides global CDN (included)
- Edge Functions available for serverless
- Database/Appwrite is cloud-hosted (fast)

### Costs
- Vercel free tier: up to 100 GB bandwidth/month
- Appwrite free tier: up to 30 GB bandwidth/month
- OpenRouter: Pay-per-use (monitor costs)

---

## 📝 Deployment Checklist

Before deploying, verify:

- [ ] All code pushed to GitHub
- [ ] `.env.local` NOT committed
- [ ] `vercel.json` exists in root
- [ ] Environment variables set in Vercel
- [ ] Appwrite CORS updated
- [ ] Appwrite collections created
- [ ] Appwrite storage buckets created
- [ ] OpenRouter API key valid
- [ ] All dependencies in package.json

---

## 🎉 After Deployment

### Testing Checklist
- [ ] Sign up and register
- [ ] Email verification works
- [ ] Login successful
- [ ] Onboarding completes
- [ ] Create a pod
- [ ] Create a post
- [ ] Send a message
- [ ] Upload a resource
- [ ] AI assistant responds

### Share with Testers
Share URL with team members for testing:
```
https://peerspark.vercel.app
```

---

## 📞 Troubleshooting

### Issue: Build Fails
**Solution:**
1. Check Vercel build logs
2. Ensure all dependencies are installed locally
3. Run `pnpm install` locally
4. Verify `pnpm-lock.yaml` is up to date
5. Push changes to GitHub

### Issue: Appwrite Errors
**Solution:**
1. Verify API keys are correct
2. Check Appwrite CORS settings
3. Ensure collections exist
4. Check network tab in browser dev tools

### Issue: Blank Page / White Screen
**Solution:**
1. Check browser console for errors
2. Check Vercel deployment logs
3. Verify environment variables loaded
4. Try hard refresh (Ctrl+Shift+R)

### Issue: Email Not Sending
**Solution:**
1. Check Appwrite SMTP configuration
2. Check spam folder
3. Verify email in Appwrite console
4. Check email templates in Appwrite

---

## 🚀 Next Steps

After successful deployment:

1. **Share with Team**
   - Send Vercel URL to testers
   - Share testing checklist

2. **Monitor Performance**
   - Check Vercel analytics
   - Monitor error rates
   - Track user feedback

3. **Collect Feedback**
   - Create issues for bugs
   - Note feature requests
   - Track performance issues

4. **Iterate & Improve**
   - Fix bugs
   - Optimize performance
   - Add requested features

---

## 📚 Useful Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Appwrite Docs](https://appwrite.io/docs)
- [OpenRouter Docs](https://openrouter.ai/docs)

---

## ✅ Summary

Your PeerSpark platform is now deployed on Vercel!

**What you get:**
- ✅ Global CDN for fast loading
- ✅ Automatic deployments on code push
- ✅ Easy environment variable management
- ✅ Built-in analytics and monitoring
- ✅ Free tier for testing

**Ready for deep testing!** 🎉

---

*Last Updated: January 1, 2026*
