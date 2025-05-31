class SocketHandler {
  constructor(io, engines) {
    this.io = io;
    this.engines = engines;
    this.connectedUsers = new Map();
  }

  setupConnection(socket) {
    console.log('User connected:', socket.id);
    
    // Store user connection
    this.connectedUsers.set(socket.id, {
      id: socket.id,
      joinTime: new Date(),
      lastActivity: new Date()
    });

    // Broadcast current user count
    this.io.emit('userCount', this.connectedUsers.size);

    // Start all engines if this is the first user
    if (this.connectedUsers.size === 1) {
      this.startAllEngines();
    }

    // Setup basic network test events
    this.setupBasicEvents(socket);
    
    // Setup engine-specific events
    this.engines.physics.setupEventHandlers(socket);
    this.engines.boxing.setupEventHandlers(socket);
    this.engines.rpgWorld.setupEventHandlers(socket);
    this.engines.medievalIO.setupEventHandlers(socket);

    // Handle disconnect
    this.setupDisconnectHandler(socket);
  }

  setupBasicEvents(socket) {
    socket.on('ping', (data) => {
      console.log('Ping received from:', socket.id);
      socket.emit('pong', data);
    });

    socket.on('broadcast', (data) => {
      console.log('Broadcast message:', data);
      socket.broadcast.emit('message', {
        ...data,
        senderId: socket.id,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupDisconnectHandler(socket) {
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      this.connectedUsers.delete(socket.id);
      
      // Remove from all engines
      this.engines.boxing.removeCharacter(socket.id);
      
      const character = this.engines.rpgWorld.removeCharacter(socket.id);
      if (character) {
        this.io.emit('characterLeft', {
          characterId: socket.id,
          characterName: character.name
        });
      }
      
      const player = this.engines.medievalIO.removePlayer(socket.id);
      if (player) {
        this.io.emit('playerLeft', socket.id);
      }
      
      this.io.emit('userCount', this.connectedUsers.size);

      // Stop engines if no users are connected
      if (this.connectedUsers.size === 0) {
        this.stopAllEngines();
      }
    });
  }

  startAllEngines() {
    this.engines.physics.start();
    this.engines.boxing.start();
    this.engines.rpgWorld.start();
    this.engines.medievalIO.start();
    console.log('All game engines started');
  }

  stopAllEngines() {
    this.engines.physics.stop();
    this.engines.boxing.stop();
    this.engines.rpgWorld.stop();
    this.engines.medievalIO.stop();
    console.log('All game engines stopped');
  }

  getUserCount() {
    return this.connectedUsers.size;
  }
}

module.exports = SocketHandler;
