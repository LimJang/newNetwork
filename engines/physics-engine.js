class ServerPhysicsEngine {
  constructor(io) {
    this.io = io;
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
      console.log('Physics Engine started');
    }
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
      console.log('Physics Engine stopped');
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
    this.io.emit('physicsState', this.getState());
  }

  // Event handlers
  setupEventHandlers(socket) {
    socket.on('requestPhysicsState', () => {
      socket.emit('physicsState', this.getState());
    });

    socket.on('applyForce', (data) => {
      console.log(`User ${socket.id} applying force:`, data);
      this.applyForce(data.ballId, data.forceX, data.forceY);
      
      // Broadcast to all clients that a force was applied
      this.io.emit('forceApplied', {
        userId: socket.id,
        ballId: data.ballId,
        forceX: data.forceX,
        forceY: data.forceY
      });
    });

    socket.on('resetSimulation', () => {
      console.log(`User ${socket.id} reset simulation`);
      this.reset();
      this.io.emit('simulationReset');
    });

    socket.on('physicsUpdate', (clientState) => {
      // For now, server is authoritative, so we ignore client updates
      // In a more complex system, we might use this for lag compensation
    });
  }
}

module.exports = ServerPhysicsEngine;
