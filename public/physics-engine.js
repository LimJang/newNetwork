// Simple Physics Engine for Synchronization Testing
class PhysicsEngine {
    constructor() {
        this.balls = [];
        this.gravity = 0.5;
        this.friction = 0.98;
        this.restitution = 0.8; // Bounce factor
        this.canvasWidth = 600;
        this.canvasHeight = 400;
        this.timeStep = 1/60; // 60 FPS
        this.simulationTime = 0;
        this.lastUpdateTime = 0;
        
        this.initializeBalls();
    }
    
    initializeBalls() {
        this.balls = [
            {
                id: 0,
                x: 150,
                y: 100,
                vx: 0,
                vy: 0,
                radius: 20,
                color: '#ff4444',
                mass: 1
            },
            {
                id: 1,
                x: 300,
                y: 100,
                vx: 0,
                vy: 0,
                radius: 20,
                color: '#44ff44',
                mass: 1
            },
            {
                id: 2,
                x: 450,
                y: 100,
                vx: 0,
                vy: 0,
                radius: 20,
                color: '#4444ff',
                mass: 1
            }
        ];
    }
    
    applyForce(ballId, forceX, forceY) {
        if (ballId >= 0 && ballId < this.balls.length) {
            const ball = this.balls[ballId];
            ball.vx += forceX / ball.mass;
            ball.vy += forceY / ball.mass;
        }
    }
    
    update() {
        this.simulationTime += this.timeStep;
        
        for (let ball of this.balls) {
            // Apply gravity
            ball.vy += this.gravity;
            
            // Update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Boundary collisions with walls
            if (ball.x - ball.radius <= 0) {
                ball.x = ball.radius;
                ball.vx = -ball.vx * this.restitution;
            }
            if (ball.x + ball.radius >= this.canvasWidth) {
                ball.x = this.canvasWidth - ball.radius;
                ball.vx = -ball.vx * this.restitution;
            }
            
            // Boundary collisions with floor/ceiling
            if (ball.y - ball.radius <= 0) {
                ball.y = ball.radius;
                ball.vy = -ball.vy * this.restitution;
            }
            if (ball.y + ball.radius >= this.canvasHeight) {
                ball.y = this.canvasHeight - ball.radius;
                ball.vy = -ball.vy * this.restitution;
                ball.vx *= this.friction; // Apply friction on ground
            }
        }
        
        // Ball-to-ball collisions
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
                    // Collision detected - separate balls
                    const overlap = minDistance - distance;
                    const separationX = (dx / distance) * overlap * 0.5;
                    const separationY = (dy / distance) * overlap * 0.5;
                    
                    ball1.x -= separationX;
                    ball1.y -= separationY;
                    ball2.x += separationX;
                    ball2.y += separationY;
                    
                    // Calculate collision response
                    const normalX = dx / distance;
                    const normalY = dy / distance;
                    
                    const relativeVx = ball2.vx - ball1.vx;
                    const relativeVy = ball2.vy - ball1.vy;
                    
                    const normalVelocity = relativeVx * normalX + relativeVy * normalY;
                    
                    if (normalVelocity > 0) continue; // Balls separating
                    
                    const impulse = 2 * normalVelocity / (ball1.mass + ball2.mass);
                    
                    ball1.vx += impulse * ball2.mass * normalX;
                    ball1.vy += impulse * ball2.mass * normalY;
                    ball2.vx -= impulse * ball1.mass * normalX;
                    ball2.vy -= impulse * ball1.mass * normalY;
                }
            }
        }
    }
    
    getState() {
        return {
            balls: this.balls.map(ball => ({
                id: ball.id,
                x: Math.round(ball.x * 100) / 100, // Round for network efficiency
                y: Math.round(ball.y * 100) / 100,
                vx: Math.round(ball.vx * 100) / 100,
                vy: Math.round(ball.vy * 100) / 100,
                color: ball.color
            })),
            simulationTime: Math.round(this.simulationTime * 100) / 100
        };
    }
    
    setState(state) {
        if (state.balls) {
            for (let i = 0; i < state.balls.length && i < this.balls.length; i++) {
                const serverBall = state.balls[i];
                const localBall = this.balls[i];
                
                // Apply server correction with smoothing
                localBall.x = serverBall.x;
                localBall.y = serverBall.y;
                localBall.vx = serverBall.vx;
                localBall.vy = serverBall.vy;
            }
        }
        
        if (state.simulationTime !== undefined) {
            this.simulationTime = state.simulationTime;
        }
    }
    
    reset() {
        this.initializeBalls();
        this.simulationTime = 0;
    }
}

// Rendering Engine
class PhysicsRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
    }
    
    render(physicsEngine) {
        // Clear canvas
        this.ctx.fillStyle = '#f4e4bc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background pattern
        this.drawBackground();
        
        // Draw balls
        for (let ball of physicsEngine.balls) {
            this.drawBall(ball);
        }
        
        // Update FPS
        this.updateFPS();
    }
    
    drawBackground() {
        this.ctx.strokeStyle = '#d4af37';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // Grid pattern
        for (let x = 0; x <= this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawBall(ball) {
        this.ctx.save();
        
        // Ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball body
        this.ctx.fillStyle = ball.color;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball highlight
        const gradient = this.ctx.createRadialGradient(
            ball.x - 5, ball.y - 5, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball border
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Ball ID
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Cinzel';
        this.ctx.textAlign = 'center';
        this.ctx.fillText((ball.id + 1).toString(), ball.x, ball.y + 4);
        
        this.ctx.restore();
    }
    
    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsTime));
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
        }
    }
    
    getFPS() {
        return this.fps;
    }
}