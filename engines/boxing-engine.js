class ServerBoxingEngine {
  constructor(io) {
    this.io = io;
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
      console.log('Boxing Engine started');
    }
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
      console.log('Boxing Engine stopped');
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
    this.io.emit('boxingState', this.getState());
  }

  reset() {
    for (let [userId, character] of this.characters) {
      character.energy = 100;
      character.attackCooldown = 0;
      character.lastAction = 'idle';
    }
    this.simulationTime = 0;
  }

  // Event handlers
  setupEventHandlers(socket) {
    socket.on('requestBoxingState', () => {
      // Add character to boxing simulation
      this.addCharacter(socket.id);
      socket.emit('boxingState', this.getState());
    });

    socket.on('boxingAction', (data) => {
      console.log(`User ${socket.id} boxing action:`, data.action);
      const success = this.handleAction(socket.id, data.action);
      
      if (success) {
        // Broadcast to all clients that an action was performed
        this.io.emit('boxingAction', {
          userId: socket.id,
          action: data.action,
          timestamp: data.timestamp
        });
      }
    });

    socket.on('resetCharacter', () => {
      console.log(`User ${socket.id} reset boxing character`);
      if (this.characters.has(socket.id)) {
        const character = this.characters.get(socket.id);
        character.energy = 100;
        character.attackCooldown = 0;
        character.lastAction = 'idle';
      }
      this.io.emit('characterReset');
    });

    socket.on('boxingUpdate', (clientState) => {
      // Server is authoritative for boxing too
      // Could use this for client prediction validation
    });
  }
}

module.exports = ServerBoxingEngine;
