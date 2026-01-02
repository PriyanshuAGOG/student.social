@echo off
echo ========================================
echo  PeerSpark - Vercel Deployment Helper
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking Git Installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git is installed

echo.
echo Step 2: Initializing Git Repository...
if not exist ".git" (
    echo Initializing git...
    git init
    git add .
    git commit -m "Initial commit: PeerSpark platform"
) else (
    echo [OK] Git repository already exists
)

echo.
echo Step 3: Checking Vercel CLI...
where vercel >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Vercel CLI...
    npm install -g vercel
    if errorlevel 1 (
        echo [ERROR] Failed to install Vercel CLI
        pause
        exit /b 1
    )
) else (
    echo [OK] Vercel CLI is installed
)

echo.
echo ========================================
echo  Vercel Deployment Instructions
echo ========================================
echo.
echo Before proceeding, ensure you have:
echo   1. GitHub account (https://github.com)
echo   2. Vercel account (https://vercel.com)
echo   3. Code pushed to GitHub
echo.
echo You will need to:
echo   1. Create a GitHub repository
echo   2. Push this code to GitHub
echo   3. Log in to Vercel and import the GitHub repo
echo   4. Set environment variables in Vercel dashboard
echo   5. Update Appwrite CORS settings
echo.
echo For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md
echo.
pause
