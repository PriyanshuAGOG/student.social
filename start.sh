#!/bin/bash

# PeerSpark Quick Start Script
# Run this to set up and start the development environment

echo "🚀 PeerSpark Platform - Quick Start"
echo "=================================="
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if Appwrite is set up
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo "Please create .env.local with Appwrite credentials first."
    exit 1
fi

# Ask if user wants to setup Appwrite
read -p "Do you want to setup Appwrite collections? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Setting up Appwrite collections..."
    pnpm run setup-appwrite
    echo ""
fi

# Start development server
echo "🎯 Starting development server..."
echo ""
echo "📍 Application will be available at: http://localhost:3000"
echo ""
echo "📚 Quick Links:"
echo "   - Register: http://localhost:3000/register"
echo "   - Login: http://localhost:3000/login"
echo "   - App: http://localhost:3000/app/feed"
echo ""

pnpm dev
