@echo off
REM PeerSpark Quick Start Script for Windows
REM Run this to set up and start the development environment

echo.
echo 🚀 PeerSpark Platform - Quick Start
echo ==================================
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    pnpm install
    echo ✅ Dependencies installed
    echo.
)

REM Check if Appwrite is set up
if not exist ".env.local" (
    echo ⚠️  .env.local file not found!
    echo Please create .env.local with Appwrite credentials first.
    echo.
    echo See APPWRITE_SETUP_GUIDE.md for instructions.
    pause
    exit /b 1
)

REM Ask if user wants to setup Appwrite
echo Do you want to setup Appwrite collections? (y/n)
set /p setup_choice="Enter choice: "

if /i "%setup_choice%"=="y" (
    echo.
    echo 📋 Setting up Appwrite collections...
    pnpm run setup-appwrite
    echo.
)

REM Start development server
echo 🎯 Starting development server...
echo.
echo 📍 Application will be available at: http://localhost:3000
echo.
echo 📚 Quick Links:
echo    - Register: http://localhost:3000/register
echo    - Login: http://localhost:3000/login
echo    - App: http://localhost:3000/app/feed
echo.
echo 📖 Documentation:
echo    - Auth Setup: AUTH_SETUP_GUIDE.md
echo    - Backend Status: BACKEND_STATUS.md
echo    - Appwrite Setup: APPWRITE_SETUP_GUIDE.md
echo.

pnpm dev

pause
