# DETAILED STEP-BY-STEP VERCEL DEPLOYMENT INSTRUCTIONS

## 🎯 Complete Deployment Walkthrough

---

## PART 1: PREPARE YOUR LOCAL PROJECT

### Step 1.1: Install Git (if not already installed)

1. Download from: https://git-scm.com/download/win
2. Run installer with default settings
3. Verify installation:
   ```cmd
   git --version
   ```
   Should show: `git version X.X.X.windows.X`

### Step 1.2: Configure Git

```cmd
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 1.3: Navigate to Project

```cmd
cd c:\Users\ok\Downloads\peerspark-platform-main\peerspark-platform-main
```

### Step 1.4: Initialize Git Repository

```cmd
# Check if .git folder exists
if exist ".git" echo Git already initialized
if not exist ".git" (
    git init
    git add .
    git commit -m "Initial commit: PeerSpark platform"
)
```

---

## PART 2: CREATE GITHUB REPOSITORY

### Step 2.1: Create GitHub Account (if needed)

1. Go to: https://github.com/signup
2. Create account with email and password
3. Verify email
4. You're ready!

### Step 2.2: Create Repository on GitHub

1. Go to: https://github.com/new
2. **Repository name:** `peerspark-platform`
3. **Description:** "Collaborative Learning Platform with AI"
4. **Visibility:** Public (recommended for free tier)
5. **Initialize repository:** NO (we have local code)
6. Click **"Create repository"**

### Step 2.3: Note Your Repository URL

Your repository URL will be:
```
https://github.com/YOUR_USERNAME/peerspark-platform.git
```

Save this for next step!

---

## PART 3: PUSH CODE TO GITHUB

### Step 3.1: Connect Local Repository to GitHub

Replace `YOUR_USERNAME` with your actual GitHub username:

```cmd
cd c:\Users\ok\Downloads\peerspark-platform-main\peerspark-platform-main

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/peerspark-platform.git

# Verify remote was added
git remote -v
```

Should show:
```
origin  https://github.com/YOUR_USERNAME/peerspark-platform.git (fetch)
origin  https://github.com/YOUR_USERNAME/peerspark-platform.git (push)
```

### Step 3.2: Push Code to GitHub

```cmd
# Rename local branch to main
git branch -M main

# Push code to GitHub
git push -u origin main
```

First time may prompt for authentication. Follow GitHub's instructions.

**Wait for upload to complete** (might take 1-2 minutes for first push)

### Step 3.3: Verify Push Was Successful

1. Go to: https://github.com/YOUR_USERNAME/peerspark-platform
2. You should see all your code files
3. Count files (should be 100+)

---

## PART 4: SIGN UP FOR VERCEL (if needed)

### Step 4.1: Create Vercel Account

1. Go to: https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. Follow setup wizard
5. You're ready!

---

## PART 5: DEPLOY TO VERCEL

### Step 5.1: Import Repository to Vercel

1. Go to: https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Search for: `peerspark-platform`
5. Click **"Select"** next to your repository

### Step 5.2: Configure Project

The configuration page will appear:

**Project Settings:**
- **Project Name:** `peerspark` (can change)
- **Framework Preset:** Next.js ✓ (should auto-detect)
- **Root Directory:** `./` ✓ (correct)

**Build and Output:**
- **Build Command:** `pnpm run build` ✓
- **Output Directory:** `.next` ✓
- **Install Command:** `pnpm install` ✓

**Environment Variables:**
👉 **THIS IS IMPORTANT** - Add all environment variables here

### Step 5.3: Add Environment Variables in Vercel

Click **"Environment Variables"** section

**Add EACH variable individually:**

Public Variables (shown in source):
```
NEXT_PUBLIC_APPWRITE_ENDPOINT = https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID = 68921a0d00146e65d29b
NEXT_PUBLIC_APPWRITE_DATABASE_ID = peerspark-main-db
NEXT_PUBLIC_APPWRITE_STORAGE_ID = peerspark-storage
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION = profiles
NEXT_PUBLIC_APPWRITE_POSTS_COLLECTION = posts
NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION = messages
NEXT_PUBLIC_APPWRITE_RESOURCES_COLLECTION = resources
NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION = notifications
NEXT_PUBLIC_APPWRITE_PODS_COLLECTION = pods
NEXT_PUBLIC_APPWRITE_CALENDAR_EVENTS_COLLECTION = calendar_events
NEXT_PUBLIC_APPWRITE_CHAT_ROOMS_COLLECTION = chat_rooms
NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET = avatars
NEXT_PUBLIC_APPWRITE_RESOURCES_BUCKET = resources
NEXT_PUBLIC_APPWRITE_ATTACHMENTS_BUCKET = attachments
NEXT_PUBLIC_APPWRITE_POST_IMAGES_BUCKET = post_images
NEXT_PUBLIC_APP_NAME = PeerSpark
NEXT_PUBLIC_APP_URL = https://peerspark.vercel.app
```

Private Variables (hidden in source):
```
APPWRITE_API_KEY = standard_335d1a664d81c56203d0e65a9c6a1efb8614cfb2a4af72c320013b20d9b97a9a203fa620d17267a9fbf1be4246b3b980a206f8285d98706b797d08d432e9c91a87629514a84372ecde3a27e1f6410a76a13dd30fc4375d296e3da56084a0b5476d4aa9f304173b56d3919045d4e7a99bc2e184ffb0a98ee604cb6a6048d6e818
APPWRITE_LOG_DEBUG = false
OPENROUTER_API_KEY = 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
```

### Step 5.4: Deploy

1. Click **"Deploy"** button
2. **Wait for deployment** (3-5 minutes)
3. You'll see:
   - Building...
   - Initializing...
   - Building...
   - Ready!

🎉 **Congratulations! Your site is live!**

You'll get a URL like: `https://peerspark-xxxxx.vercel.app`

---

## PART 6: CONFIGURE APPWRITE CORS

### Step 6.1: Add Your Vercel Domain to Appwrite

1. Go to: https://cloud.appwrite.io
2. Select your project
3. Go to **Settings** → **Domains & CORS**
4. Click **"Add Domain"**
5. Add: `https://peerspark.vercel.app` (or your custom domain)
6. Also add: `http://localhost:3000` (for local dev)
7. Click **"Save"**

⚠️ **IMPORTANT:** Without this step, API calls will fail!

---

## PART 7: TEST YOUR DEPLOYMENT

### Step 7.1: Visit Your Live Site

Click the link from Vercel or go to your custom domain.

You should see the PeerSpark landing page.

### Step 7.2: Quick Smoke Test

Test these critical features:

1. **Navigation Works**
   - Click buttons
   - Navigate between pages

2. **Registration**
   - Go to /register
   - Fill in details
   - Click "Sign up"
   - See success message

3. **Email Verification** ⚠️ This is important
   - Check your email (check spam!)
   - Click verification link
   - Verify it works

4. **Login**
   - Go to /login
   - Try with unverified account (should fail)
   - Verify account first
   - Login with verified account

5. **Authenticated Features**
   - See dashboard
   - Create a pod
   - Create a post
   - Send a message

If everything works → Deployment successful! ✅

---

## PART 8: TROUBLESHOOTING

### Issue: Build Failed

**Check build logs:**
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click "Deployments"
4. Click the failed deployment
5. Scroll to see error message

**Common causes:**
- Missing dependencies: Run `pnpm install` locally, commit lock file
- Missing env vars: Add to Vercel dashboard
- Code errors: Check console output

### Issue: Blank Page / 404

**Solutions:**
1. Hard refresh: Ctrl+Shift+R
2. Clear browser cache
3. Try incognito window
4. Check browser console (F12)

### Issue: Appwrite API Errors

**Solutions:**
1. Check CORS settings in Appwrite
2. Verify API key is correct
3. Check environment variables in Vercel
4. Check network tab in DevTools

### Issue: Email Not Sending

**Solutions:**
1. Check spam folder
2. Verify Appwrite SMTP configured
3. Try resending from app
4. Check Appwrite email templates

### Issue: Image/Resource Not Loading

**Solutions:**
1. Check storage bucket names match
2. Verify bucket is public
3. Check Appwrite permissions
4. Check file was actually uploaded

---

## PART 9: NEXT STEPS

### Share Your Site

Send this URL to team members for testing:
```
https://peerspark.vercel.app
```

Provide them with testing checklist: [MANUAL_TESTING_CHECKLIST.md](MANUAL_TESTING_CHECKLIST.md)

### Monitor Performance

1. **Vercel Analytics:** https://vercel.com/dashboard
2. **Web Vitals:** Check page speed
3. **Error Tracking:** Monitor deployment logs

### Future Deployments

Every time you push to GitHub, Vercel automatically deploys:

```cmd
git add .
git commit -m "Your changes"
git push origin main
```

---

## 📞 QUICK REFERENCE

| Task | Link |
|------|------|
| GitHub | https://github.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Your Site | https://peerspark.vercel.app |
| Appwrite Console | https://cloud.appwrite.io |
| Vercel Docs | https://vercel.com/docs |
| Next.js Docs | https://nextjs.org/docs |

---

## ✅ DEPLOYMENT CHECKLIST

Complete each step:

- [ ] Git installed and configured
- [ ] GitHub account created
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] Build succeeded
- [ ] Site is live
- [ ] CORS updated in Appwrite
- [ ] Registration tested
- [ ] Email verification works
- [ ] Login tested
- [ ] Basic features work

---

## 🎉 SUCCESS!

Your PeerSpark platform is now live on Vercel!

**You now have:**
- ✅ Global CDN for fast loading
- ✅ Automatic deployments
- ✅ Easy scaling
- ✅ Built-in monitoring
- ✅ Free tier for testing

**Ready for deep testing with your team!** 🚀

---

*Version: 1.0*  
*Last Updated: January 1, 2026*  
*Status: Ready for Production*
