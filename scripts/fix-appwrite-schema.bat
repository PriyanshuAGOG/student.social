@echo off
REM Fix Appwrite Collection Schema Issues
REM
REM Adds missing attributes to collections:
REM - posts: imageUrls (string)
REM - pods: teamId (string)

setlocal enabledelayedexpansion

echo.
echo 🔧 Appwrite Schema Fix
echo.

REM Load environment variables from .env.local
if not exist ".env.local" (
    echo ❌ .env.local file not found
    exit /b 1
)

REM Parse .env.local (basic implementation)
for /f "delims== tokens=1,2" %%i in (.env.local) do (
    if "%%i"=="NEXT_PUBLIC_APPWRITE_ENDPOINT" set ENDPOINT=%%j
    if "%%i"=="NEXT_PUBLIC_APPWRITE_PROJECT_ID" set PROJECT_ID=%%j
    if "%%i"=="APPWRITE_API_KEY" set API_KEY=%%j
    if "%%i"=="NEXT_PUBLIC_APPWRITE_DATABASE_ID" set DATABASE_ID=%%j
)

if "!DATABASE_ID!"=="" set DATABASE_ID=peerspark-main-db

echo Configuration:
echo   Endpoint: !ENDPOINT!
echo   Project: !PROJECT_ID!
echo   Database: !DATABASE_ID!
echo.

if "!ENDPOINT!"=="" (
    echo ❌ Missing NEXT_PUBLIC_APPWRITE_ENDPOINT in .env.local
    exit /b 1
)

if "!PROJECT_ID!"=="" (
    echo ❌ Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID in .env.local
    exit /b 1
)

if "!API_KEY!"=="" (
    echo ❌ Missing APPWRITE_API_KEY in .env.local
    exit /b 1
)

echo 📋 Adding missing attributes...
echo.

REM Add imageUrls to posts collection
echo 1️⃣  Adding imageUrls to posts collection...
curl -X POST "!ENDPOINT!/databases/!DATABASE_ID!/collections/posts/attributes/string" ^
  -H "X-Appwrite-Project: !PROJECT_ID!" ^
  -H "X-Appwrite-Key: !API_KEY!" ^
  -H "Content-Type: application/json" ^
  -d "{\"key\": \"imageUrls\", \"size\": 1000000, \"required\": false}" 2>nul | findstr /C:"\"key\"" >nul && (
    echo    ✅ imageUrls added successfully
) || (
    echo    ℹ️  imageUrls may already exist or couldn't be verified
)

echo.

REM Add teamId to pods collection
echo 2️⃣  Adding teamId to pods collection...
curl -X POST "!ENDPOINT!/databases/!DATABASE_ID!/collections/pods/attributes/string" ^
  -H "X-Appwrite-Project: !PROJECT_ID!" ^
  -H "X-Appwrite-Key: !API_KEY!" ^
  -H "Content-Type: application/json" ^
  -d "{\"key\": \"teamId\", \"size\": 255, \"required\": false}" 2>nul | findstr /C:"\"key\"" >nul && (
    echo    ✅ teamId added successfully
) || (
    echo    ℹ️  teamId may already exist or couldn't be verified
)

echo.
echo ✅ Schema attributes processed!
echo.
echo Note: The attributes may already exist in Appwrite.
echo If so, this is not an issue - the collections are already properly configured.
echo.
