# 🏰 Medieval Network Research

A comprehensive real-time multiplayer game research project with medieval European theme, featuring multiple game modes and advanced networking architecture.

## 🎮 Game Modes

- **🌐 Network Test** (`/network-test`) - Basic WebSocket connectivity testing
- **⚽ Physics Simulation** (`/network-test2`) - Real-time physics synchronization
- **🥊 Boxing Combat** (`/network-test3`) - Physics-based combat system
- **🗡️ RPG World** (`/network-test4`) - Top-down RPG with pixel art
- **🏟️ Battle Royale** (`/medieval-io`) - Medieval.io style battle royale

## ✨ Features

### Core Networking
- Real-time WebSocket communication with Socket.IO
- Server-authoritative game state management
- Lag compensation and prediction
- Multi-room/multi-game support

### Game Features
- **Spacebar Game Start**: Press spacebar in any game to start
- **Pixel Art Characters**: Hand-crafted medieval sprites
- **Physics Engine**: Real-time ball physics and character combat
- **Pathfinding**: Mouse-click movement with obstacle avoidance
- **Battle Royale**: Shrinking safe zone with combat system
- **Medieval UI**: Authentic medieval theme with Korean support

## 🏗️ Architecture

### Modular Server Structure
```
newNetwork/
├── engines/
│   ├── physics-engine.js      # Ball physics simulation
│   ├── boxing-engine.js       # Combat mechanics
│   ├── rpg-world-engine.js    # RPG world management
│   ├── medieval-io-engine.js  # Battle royale logic
│   └── socket-handler.js      # WebSocket event management
├── routes/
│   └── game-routes.js         # HTTP route handlers
├── public/
│   ├── *.html                 # Game interfaces
│   ├── css/                   # Medieval themed styles
│   ├── js/                    # Client-side game logic
│   └── assets/                # Sprites and resources
├── server.js                  # Main server (modular)
└── memory-bank/               # AI conversation history
```

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Open multiple browser tabs:**
   - Main page: `http://localhost:3000`
   - Network test: `http://localhost:3000/network-test`
   - Physics test: `http://localhost:3000/network-test2`
   - Boxing test: `http://localhost:3000/network-test3`
   - RPG world: `http://localhost:3000/network-test4`
   - Battle royale: `http://localhost:3000/medieval-io`

### Development Mode
```bash
npm run dev  # Auto-restart on file changes
```

## 🎯 Game Controls

### RPG World (`/network-test4`)
- **Mouse Click**: Move character to location
- **Auto-pathfinding**: Avoids obstacles automatically
- **Respawn**: Automatic respawn on death

### Boxing Combat (`/network-test3`)
- **A/D**: Move left/right
- **Arrow Keys**: Combat attacks
  - **→**: Jab (8 energy)
  - **↓**: Hook (12 energy)
  - **↑**: Uppercut (15 energy)
  - **←**: Overhead Hook (18 energy)

### Battle Royale (`/medieval-io`)
- **WASD**: Movement
- **Click**: Attack nearby players
- **Survive**: Last player standing wins

### Physics Test (`/network-test2`)
- **Force Buttons**: Apply forces to colored balls
- **Reset**: Reset simulation state

## 🌐 Deployment

### Render Deployment
1. Connect GitHub repository to Render
2. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
   - **Auto-Deploy**: Enable for main branch

### Environment Variables
```env
PORT=3000  # Automatically set by Render
NODE_ENV=production
```

### Live Demo
🔗 **[Live Server](https://newnetwork-latest.onrender.com)** (if deployed)

## 🔧 Technical Features

### Server-Side Authority
- All game logic runs on server
- Client prediction for smooth gameplay
- Anti-cheat through server validation

### Real-Time Synchronization
- 60 FPS physics simulation
- Tick-based RPG system (200ms intervals)
- Battle royale safe zone mechanics

### Performance Optimizations
- Modular engine architecture
- Efficient event handling
- Memory leak prevention
- Graceful disconnect handling

## 📊 Research Goals

This project explores:
- **Real-time multiplayer architectures**
- **WebSocket performance at scale**
- **Server-authoritative game design**
- **Alternative to P2P limitations**
- **Korean game UI/UX patterns**

## 🛠️ Development

### Adding New Game Modes
1. Create engine in `engines/your-engine.js`
2. Add route in `routes/game-routes.js`
3. Create HTML interface in `public/`
4. Register engine in `server.js`

### Code Structure
- **Engines**: Game logic and state management
- **Routes**: HTTP endpoint handlers  
- **Socket Handler**: WebSocket event routing
- **Public**: Client-side code and assets

## 🤝 Contributing

This is a research project. Contributions welcome:
- New game modes
- Performance improvements
- UI/UX enhancements
- Networking optimizations

## 📝 Recent Updates

### v2.0.0 - Major Refactor (Latest)
- ✅ Modularized server.js (850 → 100 lines)
- 🎮 Added spacebar game start functionality
- 🏗️ Separated engines into individual modules
- 🚀 Improved maintainability and scalability

### v1.0.0 - Initial Release
- 🌐 Basic networking infrastructure
- 🎯 Four game mode prototypes
- 🎨 Medieval themed UI

## 📄 License

MIT License - Feel free to fork and experiment!

---

**🎮 Press SPACEBAR in any game to start!** 🎮
