#!/usr/bin/env pwsh
<#
.SYNOPSIS
Fix Appwrite Collection Schema Issues

.DESCRIPTION
Adds missing attributes to collections:
- posts: imageUrls (string)
- pods: teamId (string)

.EXAMPLE
.\scripts\fix-appwrite-schema.ps1
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "🔧 Appwrite Schema Fix" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envPath = ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    exit 1
}

$env_vars = @{}
Get-Content $envPath | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
    $parts = $_ -split '='
    if ($parts.Count -eq 2) {
        $env_vars[$parts[0].Trim()] = $parts[1].Trim()
    }
}

$ENDPOINT = $env_vars['NEXT_PUBLIC_APPWRITE_ENDPOINT']
$PROJECT_ID = $env_vars['NEXT_PUBLIC_APPWRITE_PROJECT_ID']
$API_KEY = $env_vars['APPWRITE_API_KEY']
$DATABASE_ID = $env_vars['NEXT_PUBLIC_APPWRITE_DATABASE_ID'] ?? 'peerspark-main-db'

Write-Host "Configuration:" -ForegroundColor White
Write-Host "  Endpoint: $ENDPOINT" -ForegroundColor Gray
Write-Host "  Project: $PROJECT_ID" -ForegroundColor Gray
Write-Host "  Database: $DATABASE_ID" -ForegroundColor Gray
Write-Host ""

if (-not $ENDPOINT -or -not $PROJECT_ID -or -not $API_KEY) {
    Write-Host "❌ Missing required environment variables" -ForegroundColor Red
    exit 1
}

# Setup headers
$headers = @{
    'X-Appwrite-Project' = $PROJECT_ID
    'X-Appwrite-Key' = $API_KEY
    'Content-Type' = 'application/json'
}

Write-Host "📋 Adding missing attributes..." -ForegroundColor Cyan
Write-Host ""

# Add imageUrls to posts
Write-Host "1️⃣  Adding imageUrls to posts collection..." -ForegroundColor Yellow

$body = @{
    key = "imageUrls"
    size = 1000000
    required = $false
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "$ENDPOINT/databases/$DATABASE_ID/collections/posts/attributes/string" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 201) {
        Write-Host "   ✅ imageUrls added successfully" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 409) {
        Write-Host "   ✅ imageUrls already exists" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️ Response: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "   ✅ imageUrls already exists" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Could not verify: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Add teamId to pods
Write-Host "2️⃣  Adding teamId to pods collection..." -ForegroundColor Yellow

$body = @{
    key = "teamId"
    size = 255
    required = $false
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "$ENDPOINT/databases/$DATABASE_ID/collections/pods/attributes/string" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 201) {
        Write-Host "   ✅ teamId added successfully" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 409) {
        Write-Host "   ✅ teamId already exists" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️ Response: $($response.StatusCode)" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Message -like "*409*") {
        Write-Host "   ✅ teamId already exists" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Could not verify: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Schema attributes processed!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: The attributes may already exist in Appwrite." -ForegroundColor Gray
Write-Host "If so, this is not an issue - the collections are already properly configured." -ForegroundColor Gray
Write-Host ""
