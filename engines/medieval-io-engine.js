class MedievalIOEngine {
  constructor(io) {
    this.io = io;
    this.players = new Map();
    this.gameState = 'waiting'; // waiting, playing, finished
    this.gameStartTime = null;
    this.safeZoneRadius = 1024; // Start with full map
    this.safeZoneCenter = { x: 1024, y: 1024 }; // Center of 2048x2048 map
    this.shrinkInterval = null;
    this.updateInterval = null;
    this.isRunning = false;
    this.gameId = Date.now();
    this.rankings = [];
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.updateInterval = setInterval(() => {
        this.update();
        this.broadcastGameState();
      }, 1000/60); // 60 FPS
      
      console.log('Medieval.io Engine started');
    }
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.shrinkInterval) {
      clearInterval(this.shrinkInterval);
      this.shrinkInterval = null;
    }
    this.isRunning = false;
    console.log('Medieval.io Engine stopped');
  }

  startGame() {
    if (this.gameState === 'waiting' && this.players.size >= 1) {
      this.gameState = 'playing';
      this.gameStartTime = Date.now();
      
      // Start safe zone shrinking every 10 seconds
      this.shrinkInterval = setInterval(() => {
        this.shrinkSafeZone();
      }, 10000);
      
      console.log(`Medieval.io game started with ${this.players.size} players`);
      
      // Broadcast game start
      this.io.emit('gameStart', {
        gameId: this.gameId,
        playerCount: this.players.size
      });
    }
  }

  shrinkSafeZone() {
    if (this.gameState !== 'playing') return;
    
    this.safeZoneRadius = Math.max(100, this.safeZoneRadius - 50);
    console.log(`Safe zone shrinking to radius: ${this.safeZoneRadius}`);
    
    // Apply damage to players outside safe zone
    this.players.forEach((player) => {
      const distance = Math.sqrt(
        Math.pow(player.x - this.safeZoneCenter.x, 2) +
        Math.pow(player.y - this.safeZoneCenter.y, 2)
      );
      
      if (distance > this.safeZoneRadius && player.health > 0) {
        player.health = Math.max(0, player.health - 10);
        if (player.health <= 0) {
          this.eliminatePlayer(player.id, 'storm');
        }
      }
    });
  }

  addPlayer(socketId, playerData = {}) {
    // Generate spawn position
    const spawnX = Math.random() * 1800 + 100; // Random position with margin
    const spawnY = Math.random() * 1800 + 100;
    
    const player = {
      id: socketId,
      name: playerData.name || `Knight_${Math.floor(Math.random() * 1000)}`,
      x: spawnX,
      y: spawnY,
      direction: 'down',
      health: 100,
      maxHealth: 100,
      isMoving: false,
      velocity: { x: 0, y: 0 },
      lastProcessedInput: 0,
      joinTime: Date.now()
    };
    
    this.players.set(socketId, player);
    
    // Auto-start game if we have players and game is waiting
    if (this.gameState === 'waiting') {
      // Start game immediately for demo purposes
      setTimeout(() => this.startGame(), 2000);
    }
    
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      this.players.delete(socketId);
      
      // Check for game end
      this.checkGameEnd();
    }
    return player;
  }

  eliminatePlayer(socketId, reason = 'combat') {
    const player = this.players.get(socketId);
    if (player && player.health > 0) {
      player.health = 0;
      
      // Add to rankings
      this.rankings.unshift({
        playerId: socketId,
        name: player.name,
        eliminationTime: Date.now(),
        reason: reason,
        rank: this.getAlivePlayerCount() + 1
      });
      
      console.log(`Player ${socketId} eliminated by ${reason}`);
      
      // Broadcast elimination
      this.io.emit('playerDeath', {
        playerId: socketId,
        reason: reason,
        rank: this.rankings[0].rank
      });
      
      this.checkGameEnd();
    }
  }

  handlePlayerInput(socketId, inputData) {
    const player = this.players.get(socketId);
    if (!player || player.health <= 0 || this.gameState !== 'playing') return;
    
    // Update player position based on movement
    if (inputData.movement) {
      const speed = 200; // pixels per second
      const deltaTime = 1/60; // 60fps
      
      const newX = player.x + (inputData.movement.x * speed * deltaTime);
      const newY = player.y + (inputData.movement.y * speed * deltaTime);
      
      // Validate bounds
      player.x = Math.max(0, Math.min(2048, newX));
      player.y = Math.max(0, Math.min(2048, newY));
      
      player.direction = inputData.direction || player.direction;
      player.isMoving = inputData.movement.x !== 0 || inputData.movement.y !== 0;
      player.lastProcessedInput = inputData.sequence || 0;
    }
  }

  handlePlayerAttack(socketId, attackData) {
    const attacker = this.players.get(socketId);
    if (!attacker || attacker.health <= 0 || this.gameState !== 'playing') return;
    
    // Simple collision detection for attacks
    const attackRange = 64; // pixels
    
    this.players.forEach((target, targetId) => {
      if (targetId === socketId || target.health <= 0) return;
      
      const distance = Math.sqrt(
        Math.pow(target.x - attacker.x, 2) +
        Math.pow(target.y - attacker.y, 2)
      );
      
      if (distance <= attackRange) {
        // Hit!
        const damage = 25;
        target.health = Math.max(0, target.health - damage);
        
        console.log(`Player ${socketId} hit ${targetId} for ${damage} damage`);
        
        if (target.health <= 0) {
          this.eliminatePlayer(targetId, 'combat');
        }
      }
    });
    
    // Broadcast attack
    this.io.emit('playerAttack', {
      playerId: socketId,
      targetX: attackData.targetX,
      targetY: attackData.targetY,
      timestamp: Date.now()
    });
  }

  getAlivePlayerCount() {
    return Array.from(this.players.values()).filter(p => p.health > 0).length;
  }

  checkGameEnd() {
    const aliveCount = this.getAlivePlayerCount();
    
    if (aliveCount <= 1 && this.gameState === 'playing') {
      this.endGame();
    }
  }

  endGame() {
    this.gameState = 'finished';
    
    // Find winner
    const alivePlayers = Array.from(this.players.values()).filter(p => p.health > 0);
    const winner = alivePlayers.length > 0 ? alivePlayers[0] : null;
    
    if (winner) {
      this.rankings.unshift({
        playerId: winner.id,
        name: winner.name,
        eliminationTime: Date.now(),
        reason: 'winner',
        rank: 1
      });
    }
    
    const gameOverData = {
      winner: winner ? winner.id : null,
      rankings: this.rankings,
      totalPlayers: this.players.size,
      gameDuration: Date.now() - this.gameStartTime
    };
    
    console.log('Medieval.io game ended:', gameOverData);
    
    // Broadcast game over
    this.io.emit('gameOver', gameOverData);
    
    // Reset for next game
    setTimeout(() => {
      this.resetGame();
    }, 10000);
  }

  resetGame() {
    this.gameState = 'waiting';
    this.gameStartTime = null;
    this.safeZoneRadius = 1024;
    this.rankings = [];
    this.gameId = Date.now();
    
    // Reset all players
    this.players.forEach((player) => {
      player.health = player.maxHealth;
      player.x = Math.random() * 1800 + 100;
      player.y = Math.random() * 1800 + 100;
    });
    
    console.log('Medieval.io game reset');
  }

  update() {
    if (this.gameState !== 'playing') return;
    
    // Check safe zone damage
    this.players.forEach((player) => {
      if (player.health <= 0) return;
      
      const distance = Math.sqrt(
        Math.pow(player.x - this.safeZoneCenter.x, 2) +
        Math.pow(player.y - this.safeZoneCenter.y, 2)
      );
      
      if (distance > this.safeZoneRadius) {
        // Apply storm damage less frequently in update loop
        if (Math.random() < 0.02) { // 2% chance per frame at 60fps = ~1.2 times per second
          player.health = Math.max(0, player.health - 1);
          if (player.health <= 0) {
            this.eliminatePlayer(player.id, 'storm');
          }
        }
      }
    });
  }

  getGameState() {
    return {
      gameId: this.gameId,
      state: this.gameState,
      players: Object.fromEntries(
        Array.from(this.players.entries()).map(([id, player]) => [
          id,
          {
            id: player.id,
            name: player.name,
            x: Math.round(player.x),
            y: Math.round(player.y),
            direction: player.direction,
            health: player.health,
            maxHealth: player.maxHealth,
            isMoving: player.isMoving,
            lastProcessedInput: player.lastProcessedInput
          }
        ])
      ),
      safeZone: {
        centerX: this.safeZoneCenter.x,
        centerY: this.safeZoneCenter.y,
        radius: this.safeZoneRadius
      },
      aliveCount: this.getAlivePlayerCount(),
      gameStartTime: this.gameStartTime
    };
  }

  broadcastGameState() {
    this.io.emit('gameState', this.getGameState());
  }

  // Event handlers
  setupEventHandlers(socket) {
    socket.on('joinGame', (playerData) => {
      console.log(`User ${socket.id} joining Medieval.io game`);
      const player = this.addPlayer(socket.id, playerData);
      
      // Send current game state to new player
      socket.emit('gameState', this.getGameState());
      
      // Broadcast player joined
      this.io.emit('playerJoined', {
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y
      });
    });

    socket.on('playerInput', (inputData) => {
      this.handlePlayerInput(socket.id, inputData);
    });

    socket.on('playerAttack', (attackData) => {
      this.handlePlayerAttack(socket.id, attackData);
    });
  }
}

module.exports = MedievalIOEngine;
