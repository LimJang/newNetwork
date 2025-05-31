const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Import engines
const PhysicsEngine = require('./engines/physics-engine');
const BoxingEngine = require('./engines/boxing-engine');
const RPGWorldEngine = require('./engines/rpg-world-engine');
const MedievalIOEngine = require('./engines/medieval-io-engine');
const SocketHandler = require('./engines/socket-handler');

// Import routes
const gameRoutes = require('./routes/game-routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Use routes
app.use('/', gameRoutes);

// Initialize game engines
const engines = {
  physics: new PhysicsEngine(io),
  boxing: new BoxingEngine(io),
  rpgWorld: new RPGWorldEngine(io),
  medievalIO: new MedievalIOEngine(io)
};

// Initialize socket handler
const socketHandler = new SocketHandler(io, engines);

// Global game start state
let gameStartRequested = false;
let gameStartTimeout = null;

// Socket.io connection handling
io.on('connection', (socket) => {
  socketHandler.setupConnection(socket);
  
  // Spacebar game start event handler
  socket.on('requestGameStart', () => {
    console.log(`User ${socket.id} requested game start with spacebar`);
    
    if (!gameStartRequested) {
      gameStartRequested = true;
      
      // Broadcast game start initiation
      io.emit('gameStartInitiated', {
        message: 'Game starting in 3 seconds...',
        countdown: 3,
        timestamp: Date.now()
      });
      
      // Start countdown
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          io.emit('gameStartInitiated', {
            message: `Game starting in ${countdown} seconds...`,
            countdown: countdown,
            timestamp: Date.now()
          });
        } else {
          clearInterval(countdownInterval);
          
          // Actually start the game
          io.emit('gameStarted', {
            message: 'Game Started!',
            timestamp: Date.now()
          });
          
          console.log('Game started by spacebar request');
          
          // Reset flag after 3 seconds
          setTimeout(() => {
            gameStartRequested = false;
            console.log('Game start flag reset - spacebar available again');
          }, 3000);
        }
      }, 1000);
    } else {
      // Game start already requested
      socket.emit('gameStartAlreadyRequested', {
        message: 'Game start already in progress'
      });
    }
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🏰 Medieval Network Server running on port ${PORT}`);
  console.log(`📊 Available game modes:`);
  console.log(`   • Physics Test (network-test2)`);
  console.log(`   • Boxing Combat (network-test3)`);
  console.log(`   • RPG World (network-test4)`);
  console.log(`   • Battle Royale (medieval-io)`);
  console.log(`🎮 Press SPACEBAR in any game to start!`);
});
