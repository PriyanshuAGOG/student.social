@echo off
echo Setting up environment variables...

REM Read API key from .env.local
for /f "tokens=1,* delims==" %%a in ('findstr /B "APPWRITE_API_KEY=" .env.local') do set APPWRITE_API_KEY=%%b
for /f "tokens=2 delims==" %%a in ('findstr /B "NEXT_PUBLIC_APPWRITE_ENDPOINT=" .env.local') do set APPWRITE_ENDPOINT=%%a
for /f "tokens=2 delims==" %%a in ('findstr /B "NEXT_PUBLIC_APPWRITE_PROJECT_ID=" .env.local') do set APPWRITE_PROJECT_ID=%%a
for /f "tokens=2 delims==" %%a in ('findstr /B "NEXT_PUBLIC_APPWRITE_DATABASE_ID=" .env.local') do set APPWRITE_DATABASE_ID=%%a

echo Running course setup...
node scripts/setup-courses.js

pause
