# 🏰 Medieval Network - Git Deployment Guide

## 🚀 Quick Deployment

### Method 1: Using Deployment Script
```bash
# Deploy with auto-generated commit message
./deploy.sh

# Deploy with custom commit message  
./deploy.sh "🎮 Added new game feature"
```

### Method 2: Manual Git Commands
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "🎮 Your update description"

# Push to main branch (triggers auto-deploy)
git push origin main
```

### Method 3: Package.json Script
```bash
# Quick deploy command
npm run deploy
```

## 🌐 Render Deployment

### Auto-Deploy Setup
1. Connect GitHub repository to Render
2. Enable auto-deploy from `main` branch
3. Use these build settings:

```yaml
Build Command: npm install
Start Command: npm start
Environment: Node.js
Branch: main
Auto-Deploy: ✅ Enabled
```

### Environment Variables
```env
NODE_ENV=production
PORT=10000  # Auto-set by Render
```

## 📋 Pre-Deployment Checklist

- [ ] All game engines working locally
- [ ] No console errors in browser
- [ ] WebSocket connections stable
- [ ] All routes responding correctly
- [ ] Memory bank files updated
- [ ] README.md current

## 🔍 Deployment Status Check

### Live Server Health Check
```bash
# Check if server is responding
curl https://your-app-name.onrender.com

# Test WebSocket endpoint
curl https://your-app-name.onrender.com/socket.io/
```

### Game Mode Verification
After deployment, test each game mode:
- ✅ Main page: `/`
- ✅ Network test: `/network-test`
- ✅ Physics test: `/network-test2` 
- ✅ Boxing combat: `/network-test3`
- ✅ RPG world: `/network-test4`
- ✅ Battle royale: `/medieval-io`

## 🛠️ Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Check node version compatibility
node --version  # Should be >=18.0.0
npm --version   # Should be >=8.0.0
```

**Socket.IO Connection Issues:**
- Check CORS settings in server.js
- Verify WebSocket support on hosting platform
- Test with multiple browsers

**Game Engine Errors:**
- Check server logs in Render dashboard
- Verify all engine modules properly exported
- Test modular imports locally

### Debug Commands
```bash
# Local testing
npm start
npm run dev

# Check git status
git status
git log --oneline -5

# Verify deployment script
./deploy.sh --dry-run  # (if implemented)
```

## 📊 Deployment History

Track your deployments:
```bash
# View recent commits
git log --oneline -10

# View deployment tags
git tag -l

# Create deployment tag
git tag v2.0.0
git push origin v2.0.0
```

## 🎯 Next Steps After Deployment

1. **Test All Game Modes** - Verify each endpoint works
2. **Monitor Performance** - Check Render metrics
3. **User Testing** - Share with testers
4. **Collect Feedback** - Monitor user experience
5. **Plan Updates** - Schedule next deployment

---

**🎮 Press SPACEBAR in any deployed game to start! 🎮**
