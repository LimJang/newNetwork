const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/network-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'network-test.html'));
});

app.get('/network-test2', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'network-test2.html'));
});

app.get('/network-test3', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'network-test3.html'));
});

app.get('/network-test4', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'network-test4.html'));
});

// Socket.io connection handling
const connectedUsers = new Map();

// Physics Engine for Server-side Authority
class ServerPhysicsEngine {
  constructor() {
    this.balls = [
      { id: 0, x: 150, y: 100, vx: 0, vy: 0, radius: 20, color: '#ff4444', mass: 1 },
      { id: 1, x: 300, y: 100, vx: 0, vy: 0, radius: 20, color: '#44ff44', mass: 1 },
      { id: 2, x: 450, y: 100, vx: 0, vy: 0, radius: 20, color: '#4444ff', mass: 1 }
    ];
    this.gravity = 0.5;
    this.friction = 0.98;
    this.restitution = 0.8;
    this.canvasWidth = 600;
    this.canvasHeight = 400;
    this.simulationTime = 0;
    this.isRunning = false;
    this.updateInterval = null;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.updateInterval = setInterval(() => {
        this.update();
        this.broadcastState();
      }, 1000/60); // 60 FPS
    }
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
    }
  }

  update() {
    this.simulationTime += 1/60;

    for (let ball of this.balls) {
      ball.vy += this.gravity;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Boundary collisions
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * this.restitution;
      }
      if (ball.x + ball.radius >= this.canvasWidth) {
        ball.x = this.canvasWidth - ball.radius;
        ball.vx = -ball.vx * this.restitution;
      }
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy * this.restitution;
      }
      if (ball.y + ball.radius >= this.canvasHeight) {
        ball.y = this.canvasHeight - ball.radius;
        ball.vy = -ball.vy * this.restitution;
        ball.vx *= this.friction;
      }
    }

    this.handleBallCollisions();
  }

  handleBallCollisions() {
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const ball1 = this.balls[i];
        const ball2 = this.balls[j];
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = ball1.radius + ball2.radius;

        if (distance < minDistance) {
          const overlap = minDistance - distance;
          const separationX = (dx / distance) * overlap * 0.5;
          const separationY = (dy / distance) * overlap * 0.5;

          ball1.x -= separationX;
          ball1.y -= separationY;
          ball2.x += separationX;
          ball2.y += separationY;

          const normalX = dx / distance;
          const normalY = dy / distance;
          const relativeVx = ball2.vx - ball1.vx;
          const relativeVy = ball2.vy - ball1.vy;
          const normalVelocity = relativeVx * normalX + relativeVy * normalY;

          if (normalVelocity > 0) continue;

          const impulse = 2 * normalVelocity / (ball1.mass + ball2.mass);
          ball1.vx += impulse * ball2.mass * normalX;
          ball1.vy += impulse * ball2.mass * normalY;
          ball2.vx -= impulse * ball1.mass * normalX;
          ball2.vy -= impulse * ball1.mass * normalY;
        }
      }
    }
  }

  applyForce(ballId, forceX, forceY) {
    if (ballId >= 0 && ballId < this.balls.length) {
      const ball = this.balls[ballId];
      ball.vx += forceX / ball.mass;
      ball.vy += forceY / ball.mass;
    }
  }

  reset() {
    this.balls = [
      { id: 0, x: 150, y: 100, vx: 0, vy: 0, radius: 20, color: '#ff4444', mass: 1 },
      { id: 1, x: 300, y: 100, vx: 0, vy: 0, radius: 20, color: '#44ff44', mass: 1 },
      { id: 2, x: 450, y: 100, vx: 0, vy: 0, radius: 20, color: '#4444ff', mass: 1 }
    ];
    this.simulationTime = 0;
  }

  getState() {
    return {
      balls: this.balls.map(ball => ({
        id: ball.id,
        x: Math.round(ball.x * 100) / 100,
        y: Math.round(ball.y * 100) / 100,
        vx: Math.round(ball.vx * 100) / 100,
        vy: Math.round(ball.vy * 100) / 100,
        color: ball.color
      })),
      simulationTime: Math.round(this.simulationTime * 100) / 100
    };
  }

  broadcastState() {
    io.emit('physicsState', this.getState());
  }
}

// Initialize server physics engine
const serverPhysics = new ServerPhysicsEngine();

// Boxing Character Engine for Server-side Authority
class ServerBoxingEngine {
  constructor() {
    this.characters = new Map(); // Store multiple boxing characters
    this.isRunning = false;
    this.updateInterval = null;
    this.simulationTime = 0;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.updateInterval = setInterval(() => {
        this.update();
        this.broadcastState();
      }, 1000/60); // 60 FPS
    }
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
    }
  }

  addCharacter(userId) {
    this.characters.set(userId, {
      id: userId,
      energy: 100,
      attackCooldown: 0,
      lastAction: 'idle',
      joinTime: Date.now()
    });
  }

  removeCharacter(userId) {
    this.characters.delete(userId);
  }

  update() {
    this.simulationTime += 1/60;
    
    // Update all characters
    for (let [userId, character] of this.characters) {
      // Regenerate energy
      if (character.energy < 100) {
        character.energy += 0.2;
      }
      
      // Update attack cooldown
      if (character.attackCooldown > 0) {
        character.attackCooldown--;
        if (character.attackCooldown === 0) {
          character.lastAction = 'idle';
        }
      }
    }
  }

  handleAction(userId, action) {
    const character = this.characters.get(userId);
    if (!character) return false;

    // Check if action is allowed
    if (character.attackCooldown > 0) return false;
    
    let energyCost = 0;
    let cooldown = 0;

    switch(action) {
      case 'jab':
        energyCost = 8;
        cooldown = 15;
        break;
      case 'hook':
        energyCost = 12;
        cooldown = 25;
        break;
      case 'uppercut':
        energyCost = 15;
        cooldown = 35;
        break;
      case 'overheadHook':
        energyCost = 18;
        cooldown = 40;
        break;
      case 'moveLeft':
      case 'moveRight':
        energyCost = 1;
        cooldown = 0;
        break;
    }

    if (character.energy < energyCost) return false;

    // Apply action
    character.energy -= energyCost;
    character.attackCooldown = cooldown;
    character.lastAction = action;

    return true;
  }

  getState() {
    const charactersArray = Array.from(this.characters.entries()).map(([userId, char]) => ({
      userId,
      energy: Math.round(char.energy),
      attackCooldown: char.attackCooldown,
      lastAction: char.lastAction
    }));

    return {
      characters: charactersArray,
      simulationTime: Math.round(this.simulationTime * 100) / 100
    };
  }

  broadcastState() {
    io.emit('boxingState', this.getState());
  }

  reset() {
    for (let [userId, character] of this.characters) {
      character.energy = 100;
      character.attackCooldown = 0;
      character.lastAction = 'idle';
    }
    this.simulationTime = 0;
  }
}

// Initialize server boxing engine
const serverBoxing = new ServerBoxingEngine();

// RPG World Engine for Server-side Authority
class RPGWorldEngine {
  constructor() {
    this.characters = new Map();
    this.currentTick = 0;
    this.tickRate = 200; // 200ms per tick
    this.isRunning = false;
    this.tickInterval = null;
    this.mapWidth = 25;
    this.mapHeight = 18;
    
    this.initializeWorld();
  }

  initializeWorld() {
    // Same map as client
    this.map = [];
    for (let y = 0; y < this.mapHeight; y++) {
      const row = [];
      for (let x = 0; x < this.mapWidth; x++) {
        if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
          row.push('tree');
        } else if (Math.random() < 0.05 && !(x >= 10 && x <= 15 && y >= 8 && y <= 10)) {
          row.push('tree');
        } else if ((x >= 10 && x <= 15 && y >= 8 && y <= 10) || 
                  (x >= 12 && x <= 13 && y >= 5 && y <= 13)) {
          row.push('stone');
        } else {
          row.push('grass');
        }
      }
      this.map.push(row);
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.tickInterval = setInterval(() => {
        this.processTick();
      }, this.tickRate);
      console.log('RPG World started');
    }
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      this.isRunning = false;
      console.log('RPG World stopped');
    }
  }

  processTick() {
    this.currentTick++;
    
    // Process character movements
    for (let [characterId, character] of this.characters) {
      this.updateCharacterMovement(character);
    }
    
    // Broadcast tick update
    io.emit('serverTick', {
      tick: this.currentTick,
      timestamp: Date.now()
    });
    
    // Broadcast world state every few ticks
    if (this.currentTick % 5 === 0) {
      this.broadcastWorldState();
    }
  }

  updateCharacterMovement(character) {
    if (character.movementPath && character.movementPath.length > 0) {
      const nextStep = character.movementPath[0];
      
      // Move to next step
      character.x = nextStep.x;
      character.y = nextStep.y;
      character.movementPath.shift();
      
      // Update movement state
      if (character.movementPath.length === 0) {
        character.isMoving = false;
        character.direction = character.direction || 'down';
      } else {
        character.isMoving = true;
        const next = character.movementPath[0];
        character.direction = this.calculateDirection(character.x, character.y, next.x, next.y);
      }
      
      // Broadcast character movement
      io.emit('characterMoved', {
        character: this.getCharacterData(character)
      });
    }
  }

  calculateDirection(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  addCharacter(socketId, characterData = {}) {
    const character = {
      id: socketId,
      name: characterData.name || 'Civilian',
      x: characterData.x || 12,
      y: characterData.y || 9,
      direction: 'down',
      isMoving: false,
      movementPath: [],
      joinTime: Date.now(),
      level: 1,
      health: 100,
      maxHealth: 100
    };
    
    this.characters.set(socketId, character);
    return character;
  }

  removeCharacter(socketId) {
    const character = this.characters.get(socketId);
    this.characters.delete(socketId);
    return character;
  }

  moveCharacter(socketId, fromX, fromY, toX, toY) {
    const character = this.characters.get(socketId);
    if (!character) return false;
    
    // Validate movement (basic checks)
    if (toX < 0 || toX >= this.mapWidth || toY < 0 || toY >= this.mapHeight) {
      return false;
    }
    
    // Check if target tile is walkable
    if (this.map[toY][toX] === 'tree') {
      return false;
    }
    
    // Generate path (simple pathfinding for now)
    const path = this.findPath(character.x, character.y, toX, toY);
    
    if (path.length > 0) {
      character.movementPath = path;
      character.isMoving = true;
      
      // Set initial direction
      const firstStep = path[0];
      character.direction = this.calculateDirection(
        character.x, character.y, 
        firstStep.x, firstStep.y
      );
      
      return true;
    }
    
    return false;
  }

  findPath(startX, startY, targetX, targetY) {
    // Simple pathfinding - direct line with obstacle avoidance
    const path = [];
    let currentX = startX;
    let currentY = startY;
    
    while (currentX !== targetX || currentY !== targetY) {
      const oldX = currentX;
      const oldY = currentY;
      
      // Move towards target
      if (currentX < targetX) currentX++;
      else if (currentX > targetX) currentX--;
      
      if (currentY < targetY) currentY++;
      else if (currentY > targetY) currentY--;
      
      // Check if new position is valid
      if (currentX >= 0 && currentX < this.mapWidth &&
          currentY >= 0 && currentY < this.mapHeight &&
          this.map[currentY][currentX] !== 'tree') {
        
        path.push({ x: currentX, y: currentY });
      } else {
        // Hit obstacle, try alternative route
        currentX = oldX;
        currentY = oldY;
        
        // Try moving only on one axis
        if (Math.abs(targetX - currentX) > Math.abs(targetY - currentY)) {
          // Move horizontally first
          if (currentX < targetX) currentX++;
          else if (currentX > targetX) currentX--;
        } else {
          // Move vertically first
          if (currentY < targetY) currentY++;
          else if (currentY > targetY) currentY--;
        }
        
        // Check this position
        if (currentX >= 0 && currentX < this.mapWidth &&
            currentY >= 0 && currentY < this.mapHeight &&
            this.map[currentY][currentX] !== 'tree') {
          
          path.push({ x: currentX, y: currentY });
        } else {
          // Can't find path, stop
          break;
        }
      }
      
      // Prevent infinite loops
      if (path.length > 50) break;
    }
    
    return path;
  }

  respawnCharacter(socketId) {
    const character = this.characters.get(socketId);
    if (character) {
      character.x = 12;
      character.y = 9;
      character.direction = 'down';
      character.isMoving = false;
      character.movementPath = [];
      character.health = character.maxHealth;
      return true;
    }
    return false;
  }

  getCharacterData(character) {
    return {
      id: character.id,
      name: character.name,
      x: character.x,
      y: character.y,
      direction: character.direction,
      isMoving: character.isMoving,
      movementPath: character.movementPath,
      level: character.level,
      health: character.health,
      maxHealth: character.maxHealth
    };
  }

  getWorldState() {
    return {
      characters: Array.from(this.characters.values()).map(char => this.getCharacterData(char)),
      currentTick: this.currentTick,
      mapData: this.map
    };
  }

  broadcastWorldState() {
    io.emit('worldState', this.getWorldState());
  }
}

// Initialize RPG world engine
const rpgWorld = new RPGWorldEngine();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Store user connection
  connectedUsers.set(socket.id, {
    id: socket.id,
    joinTime: new Date(),
    lastActivity: new Date()
  });

  // Broadcast current user count
  io.emit('userCount', connectedUsers.size);

  // Start physics simulation if this is the first user
  if (connectedUsers.size === 1) {
    serverPhysics.start();
    serverBoxing.start();
    rpgWorld.start();
    console.log('All game engines started');
  }

  // Basic network test events
  socket.on('ping', (data) => {
    console.log('Ping received from:', socket.id);
    socket.emit('pong', {
      ...data,
      serverTime: new Date().toISOString()
    });
  });

  socket.on('broadcast', (data) => {
    console.log('Broadcast message:', data);
    socket.broadcast.emit('message', {
      ...data,
      senderId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Physics test events
  socket.on('requestPhysicsState', () => {
    socket.emit('physicsState', serverPhysics.getState());
  });

  socket.on('applyForce', (data) => {
    console.log(`User ${socket.id} applying force:`, data);
    serverPhysics.applyForce(data.ballId, data.forceX, data.forceY);
    
    // Broadcast to all clients that a force was applied
    io.emit('forceApplied', {
      userId: socket.id,
      ballId: data.ballId,
      forceX: data.forceX,
      forceY: data.forceY
    });
  });

  socket.on('resetSimulation', () => {
    console.log(`User ${socket.id} reset simulation`);
    serverPhysics.reset();
    io.emit('simulationReset');
  });

  socket.on('physicsUpdate', (clientState) => {
    // For now, server is authoritative, so we ignore client updates
    // In a more complex system, we might use this for lag compensation
  });

  // Boxing test events
  socket.on('requestBoxingState', () => {
    // Add character to boxing simulation
    serverBoxing.addCharacter(socket.id);
    socket.emit('boxingState', serverBoxing.getState());
  });

  socket.on('boxingAction', (data) => {
    console.log(`User ${socket.id} boxing action:`, data.action);
    const success = serverBoxing.handleAction(socket.id, data.action);
    
    if (success) {
      // Broadcast to all clients that an action was performed
      io.emit('boxingAction', {
        userId: socket.id,
        action: data.action,
        timestamp: data.timestamp
      });
    }
  });

  socket.on('resetCharacter', () => {
    console.log(`User ${socket.id} reset boxing character`);
    if (serverBoxing.characters.has(socket.id)) {
      const character = serverBoxing.characters.get(socket.id);
      character.energy = 100;
      character.attackCooldown = 0;
      character.lastAction = 'idle';
    }
    io.emit('characterReset');
  });

  socket.on('boxingUpdate', (clientState) => {
    // Server is authoritative for boxing too
    // Could use this for client prediction validation
  });

  // RPG world events
  socket.on('joinWorld', () => {
    console.log(`User ${socket.id} joining RPG world`);
    const character = rpgWorld.addCharacter(socket.id);
    
    // Send character joined event to all clients
    io.emit('characterJoined', {
      character: rpgWorld.getCharacterData(character)
    });
    
    // Send current world state to new player
    socket.emit('worldState', rpgWorld.getWorldState());
  });

  socket.on('moveCharacter', (data) => {
    console.log(`User ${socket.id} moving character:`, data);
    const success = rpgWorld.moveCharacter(socket.id, data.fromX, data.fromY, data.toX, data.toY);
    
    if (!success) {
      // Send error back to client
      socket.emit('movementError', {
        message: 'Cannot move to that location'
      });
    }
  });

  socket.on('respawnCharacter', () => {
    console.log(`User ${socket.id} respawning character`);
    const success = rpgWorld.respawnCharacter(socket.id);
    
    if (success) {
      const character = rpgWorld.characters.get(socket.id);
      io.emit('characterMoved', {
        character: rpgWorld.getCharacterData(character)
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    
    // Remove from boxing simulation
    serverBoxing.removeCharacter(socket.id);
    
    // Remove from RPG world
    const character = rpgWorld.removeCharacter(socket.id);
    if (character) {
      io.emit('characterLeft', {
        characterId: socket.id,
        characterName: character.name
      });
    }
    
    io.emit('userCount', connectedUsers.size);

    // Stop simulations if no users are connected
    if (connectedUsers.size === 0) {
      serverPhysics.stop();
      serverBoxing.stop();
      rpgWorld.stop();
      console.log('All game engines stopped');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
