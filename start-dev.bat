@echo off
echo ========================================
echo  PeerSpark Platform - Start Script
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if node_modules exists...
if not exist "node_modules\" (
    echo.
    echo [INSTALL] Installing dependencies...
    call pnpm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo Please run: pnpm install
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies found!
)

echo.
echo ========================================
echo  Starting Development Server...
echo ========================================
echo.
echo Server will start on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call pnpm run dev

pause
