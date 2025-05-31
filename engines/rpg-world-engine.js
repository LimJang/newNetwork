class RPGWorldEngine {
  constructor(io) {
    this.io = io;
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
      console.log('RPG World Engine started');
    }
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      this.isRunning = false;
      console.log('RPG World Engine stopped');
    }
  }

  processTick() {
    this.currentTick++;
    
    // Process character movements
    for (let [characterId, character] of this.characters) {
      this.updateCharacterMovement(character);
    }
    
    // Broadcast tick update
    this.io.emit('serverTick', {
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
      this.io.emit('characterMoved', {
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
    this.io.emit('worldState', this.getWorldState());
  }

  // Event handlers
  setupEventHandlers(socket) {
    socket.on('joinWorld', () => {
      console.log(`User ${socket.id} joining RPG world`);
      const character = this.addCharacter(socket.id);
      
      // Send character joined event to all clients
      this.io.emit('characterJoined', {
        character: this.getCharacterData(character)
      });
      
      // Send current world state to new player
      socket.emit('worldState', this.getWorldState());
    });

    socket.on('moveCharacter', (data) => {
      console.log(`User ${socket.id} moving character:`, data);
      const success = this.moveCharacter(socket.id, data.fromX, data.fromY, data.toX, data.toY);
      
      if (!success) {
        // Send error back to client
        socket.emit('movementError', {
          message: 'Cannot move to that location'
        });
      }
    });

    socket.on('respawnCharacter', () => {
      console.log(`User ${socket.id} respawning character`);
      const success = this.respawnCharacter(socket.id);
      
      if (success) {
        const character = this.characters.get(socket.id);
        this.io.emit('characterMoved', {
          character: this.getCharacterData(character)
        });
      }
    });
  }
}

module.exports = RPGWorldEngine;
