#!/bin/bash

# 🏰 Medieval Network Deployment Script
# Quick deployment to Git and Render

echo "🏰 Starting Medieval Network Deployment..."

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed!"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository!"
    exit 1
fi

# Add all changes
echo "📦 Adding all changes to git..."
git add .

# Get commit message from user or use default
if [ -z "$1" ]; then
    COMMIT_MSG="🚀 Deploy update - $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

# Commit changes
echo "💾 Committing changes: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Push to main branch
echo "🚀 Pushing to origin main..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed to Git!"
    echo "🌐 Render will auto-deploy from main branch"
    echo "🔗 Check your Render dashboard for deployment status"
    echo ""
    echo "🎮 Game modes available:"
    echo "   • Network Test: /network-test"
    echo "   • Physics Test: /network-test2" 
    echo "   • Boxing Combat: /network-test3"
    echo "   • RPG World: /network-test4"
    echo "   • Battle Royale: /medieval-io"
    echo ""
    echo "⌨️  Press SPACEBAR in any game to start!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
