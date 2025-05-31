// Physics-Based Boxing Character Engine
class BoxingPhysicsEngine {
    constructor() {
        this.canvasWidth = 800;
        this.canvasHeight = 500;
        this.gravity = 0.8;
        this.friction = 0.95;
        this.groundLevel = this.canvasHeight - 50;
        this.simulationTime = 0;
        
        this.character = null;
        this.keyStates = {};
        this.attackCooldown = 0;
        this.energy = 100;
        
        this.initializeCharacter();
        this.setupKeyListeners();
    }
    
    initializeCharacter() {
        this.character = {
            // Body segments as physics objects
            head: {
                x: 400, y: this.groundLevel - 160,
                vx: 0, vy: 0,
                radius: 25,
                mass: 1,
                color: '#ffdbac'
            },
            torso: {
                x: 400, y: this.groundLevel - 120,
                vx: 0, vy: 0,
                width: 40, height: 60,
                mass: 3,
                color: '#8b4513'
            },
            leftArm: {
                shoulder: { x: 380, y: this.groundLevel - 140, vx: 0, vy: 0 },
                elbow: { x: 360, y: this.groundLevel - 120, vx: 0, vy: 0 },
                hand: { x: 340, y: this.groundLevel - 100, vx: 0, vy: 0 },
                mass: 1,
                color: '#ffdbac'
            },
            rightArm: {
                shoulder: { x: 420, y: this.groundLevel - 140, vx: 0, vy: 0 },
                elbow: { x: 440, y: this.groundLevel - 120, vx: 0, vy: 0 },
                hand: { x: 460, y: this.groundLevel - 100, vx: 0, vy: 0 },
                mass: 1,
                color: '#ffdbac'
            },
            leftLeg: {
                hip: { x: 390, y: this.groundLevel - 80, vx: 0, vy: 0 },
                knee: { x: 390, y: this.groundLevel - 40, vx: 0, vy: 0 },
                foot: { x: 390, y: this.groundLevel, vx: 0, vy: 0 },
                mass: 2,
                color: '#4a4a4a'
            },
            rightLeg: {
                hip: { x: 410, y: this.groundLevel - 80, vx: 0, vy: 0 },
                knee: { x: 410, y: this.groundLevel - 40, vx: 0, vy: 0 },
                foot: { x: 410, y: this.groundLevel, vx: 0, vy: 0 },
                mass: 2,
                color: '#4a4a4a'
            },
            facing: 1, // 1 = right, -1 = left (always faces right in this version)
            stance: 'neutral',
            attackState: 'idle'
        };
    }
    
    setupKeyListeners() {
        window.addEventListener('keydown', (e) => {
            this.keyStates[e.key.toLowerCase()] = true;
            this.handleKeyPress(e.key);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keyStates[e.key.toLowerCase()] = false;
        });
    }
    
    handleKeyPress(key) {
        if (this.attackCooldown > 0) return;
        
        switch(key) {
            case 'ArrowRight':
                this.executeAttack('jab');
                break;
            case 'ArrowDown':
                this.executeAttack('hook');
                break;
            case 'ArrowUp':
                this.executeAttack('uppercut');
                break;
            case 'ArrowLeft':
                this.executeAttack('overheadHook');
                break;
        }
    }
    
    executeAttack(attackType) {
        if (this.energy < 10) return;
        
        this.character.attackState = attackType;
        this.attackCooldown = 30; // 30 frames cooldown
        this.energy -= 10;
        
        const char = this.character;
        const forceMultiplier = 15;
        
        switch(attackType) {
            case 'jab':
                // Quick straight punch with right arm
                char.rightArm.shoulder.vx += forceMultiplier * 0.8;
                char.rightArm.elbow.vx += forceMultiplier * 1.2;
                char.rightArm.hand.vx += forceMultiplier * 1.5;
                char.torso.vx += forceMultiplier * 0.3; // Slight body rotation
                break;
                
            case 'hook':
                // Wide horizontal punch
                char.rightArm.shoulder.vx += forceMultiplier * 0.6;
                char.rightArm.elbow.vx += forceMultiplier * 1.0;
                char.rightArm.elbow.vy -= forceMultiplier * 0.3;
                char.rightArm.hand.vx += forceMultiplier * 1.3;
                char.rightArm.hand.vy -= forceMultiplier * 0.2;
                char.torso.vx += forceMultiplier * 0.5; // More body rotation
                break;
                
            case 'uppercut':
                // Upward punch from below
                char.rightArm.shoulder.vy -= forceMultiplier * 0.5;
                char.rightArm.elbow.vy -= forceMultiplier * 1.0;
                char.rightArm.hand.vy -= forceMultiplier * 1.5;
                char.rightArm.hand.vx += forceMultiplier * 0.5;
                char.torso.vy -= forceMultiplier * 0.2;
                char.leftLeg.foot.vy -= forceMultiplier * 0.3; // Push off ground
                char.rightLeg.foot.vy -= forceMultiplier * 0.3;
                break;
                
            case 'overheadHook':
                // Downward arcing punch
                char.rightArm.shoulder.vy -= forceMultiplier * 0.8;
                char.rightArm.elbow.vy -= forceMultiplier * 0.5;
                char.rightArm.elbow.vx += forceMultiplier * 0.7;
                char.rightArm.hand.vy += forceMultiplier * 1.2;
                char.rightArm.hand.vx += forceMultiplier * 1.0;
                char.torso.vx += forceMultiplier * 0.4;
                break;
        }
    }
    
    update() {
        this.simulationTime += 1/60;
        
        // Handle movement
        if (this.keyStates['a']) {
            this.applyMovementForce(-5, 0);
        }
        if (this.keyStates['d']) {
            this.applyMovementForce(5, 0);
        }
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
            if (this.attackCooldown === 0) {
                this.character.attackState = 'idle';
            }
        }
        
        // Regenerate energy
        if (this.energy < 100) {
            this.energy += 0.2;
        }
        
        // Update physics for all body parts
        this.updateBodyPhysics();
        this.applyConstraints();
        this.handleGroundCollision();
    }
    
    applyMovementForce(forceX, forceY) {
        const char = this.character;
        const movementForce = 2;
        
        // Apply movement to legs and torso
        char.leftLeg.foot.vx += forceX * movementForce * 0.8;
        char.rightLeg.foot.vx += forceX * movementForce * 0.8;
        char.torso.vx += forceX * movementForce * 0.5;
    }
    
    updateBodyPhysics() {
        const char = this.character;
        
        // Update head
        char.head.vy += this.gravity;
        char.head.x += char.head.vx;
        char.head.y += char.head.vy;
        char.head.vx *= this.friction;
        char.head.vy *= this.friction;
        
        // Update torso
        char.torso.vy += this.gravity;
        char.torso.x += char.torso.vx;
        char.torso.y += char.torso.vy;
        char.torso.vx *= this.friction;
        char.torso.vy *= this.friction;
        
        // Update limbs
        this.updateLimbPhysics(char.leftArm);
        this.updateLimbPhysics(char.rightArm);
        this.updateLimbPhysics(char.leftLeg);
        this.updateLimbPhysics(char.rightLeg);
    }
    
    updateLimbPhysics(limb) {
        for (let joint in limb) {
            if (typeof limb[joint] === 'object' && limb[joint].x !== undefined) {
                limb[joint].vy += this.gravity;
                limb[joint].x += limb[joint].vx;
                limb[joint].y += limb[joint].vy;
                limb[joint].vx *= this.friction;
                limb[joint].vy *= this.friction;
            }
        }
    }
    
    applyConstraints() {
        const char = this.character;
        
        // Keep head connected to torso
        this.constrainDistance(char.head, char.torso, 40);
        
        // Arm constraints
        this.constrainDistance(char.leftArm.shoulder, char.torso, 20);
        this.constrainDistance(char.rightArm.shoulder, char.torso, 20);
        this.constrainDistance(char.leftArm.shoulder, char.leftArm.elbow, 30);
        this.constrainDistance(char.leftArm.elbow, char.leftArm.hand, 25);
        this.constrainDistance(char.rightArm.shoulder, char.rightArm.elbow, 30);
        this.constrainDistance(char.rightArm.elbow, char.rightArm.hand, 25);
        
        // Leg constraints
        this.constrainDistance(char.leftLeg.hip, char.torso, 25);
        this.constrainDistance(char.rightLeg.hip, char.torso, 25);
        this.constrainDistance(char.leftLeg.hip, char.leftLeg.knee, 35);
        this.constrainDistance(char.leftLeg.knee, char.leftLeg.foot, 35);
        this.constrainDistance(char.rightLeg.hip, char.rightLeg.knee, 35);
        this.constrainDistance(char.rightLeg.knee, char.rightLeg.foot, 35);
    }
    
    constrainDistance(bodyPart1, bodyPart2, targetDistance) {
        const dx = bodyPart2.x - bodyPart1.x;
        const dy = bodyPart2.y - bodyPart1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const difference = targetDistance - distance;
            const percent = difference / distance / 2;
            const offsetX = dx * percent;
            const offsetY = dy * percent;
            
            bodyPart1.x -= offsetX;
            bodyPart1.y -= offsetY;
            bodyPart2.x += offsetX;
            bodyPart2.y += offsetY;
        }
    }
    
    handleGroundCollision() {
        const char = this.character;
        const groundY = this.groundLevel;
        
        // Ground collision for feet
        if (char.leftLeg.foot.y > groundY) {
            char.leftLeg.foot.y = groundY;
            char.leftLeg.foot.vy *= -0.3;
            char.leftLeg.foot.vx *= 0.8;
        }
        
        if (char.rightLeg.foot.y > groundY) {
            char.rightLeg.foot.y = groundY;
            char.rightLeg.foot.vy *= -0.3;
            char.rightLeg.foot.vx *= 0.8;
        }
        
        // Prevent other body parts from going through ground
        if (char.torso.y > groundY - 30) {
            char.torso.y = groundY - 30;
            char.torso.vy *= -0.1;
        }
    }
    
    getState() {
        return {
            character: this.character,
            simulationTime: Math.round(this.simulationTime * 100) / 100,
            energy: Math.round(this.energy),
            attackCooldown: this.attackCooldown
        };
    }
    
    setState(state) {
        if (state.character) {
            this.character = state.character;
        }
        if (state.simulationTime !== undefined) {
            this.simulationTime = state.simulationTime;
        }
        if (state.energy !== undefined) {
            this.energy = state.energy;
        }
        if (state.attackCooldown !== undefined) {
            this.attackCooldown = state.attackCooldown;
        }
    }
    
    reset() {
        this.initializeCharacter();
        this.simulationTime = 0;
        this.energy = 100;
        this.attackCooldown = 0;
    }
}

// Boxing Character Renderer
class BoxingRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
    }
    
    render(boxingEngine) {
        // Clear canvas
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw character
        this.drawCharacter(boxingEngine.character);
        
        // Draw UI elements
        this.drawEnergyBar(boxingEngine.energy);
        this.drawAttackIndicator(boxingEngine.character.attackState);
        
        // Update FPS
        this.updateFPS();
    }
    
    drawBackground() {
        // Medieval stone floor
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Stone texture lines
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        for (let x = 0; x < this.canvas.width; x += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.canvas.height - 50);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Background castle walls
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - 50);
        
        // Torch light effect
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, 100, 0,
            this.canvas.width / 2, 100, 400
        );
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawCharacter(character) {
        const ctx = this.ctx;
        
        // Draw torso
        ctx.fillStyle = character.torso.color;
        ctx.fillRect(
            character.torso.x - character.torso.width/2,
            character.torso.y - character.torso.height/2,
            character.torso.width,
            character.torso.height
        );
        
        // Draw head
        ctx.fillStyle = character.head.color;
        ctx.beginPath();
        ctx.arc(character.head.x, character.head.y, character.head.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw face (always facing right)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(character.head.x + 8, character.head.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(character.head.x + 8, character.head.y + 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw limbs
        this.drawLimb(character.leftArm, character.leftArm.color);
        this.drawLimb(character.rightArm, character.rightArm.color);
        this.drawLimb(character.leftLeg, character.leftLeg.color);
        this.drawLimb(character.rightLeg, character.rightLeg.color);
        
        // Draw boxing gloves
        this.drawBoxingGloves(character);
    }
    
    drawLimb(limb, color) {
        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        
        const joints = Object.keys(limb).filter(key => 
            typeof limb[key] === 'object' && limb[key].x !== undefined
        );
        
        for (let i = 0; i < joints.length - 1; i++) {
            const joint1 = limb[joints[i]];
            const joint2 = limb[joints[i + 1]];
            
            ctx.beginPath();
            ctx.moveTo(joint1.x, joint1.y);
            ctx.lineTo(joint2.x, joint2.y);
            ctx.stroke();
        }
        
        // Draw joints
        ctx.fillStyle = color;
        joints.forEach(jointName => {
            const joint = limb[jointName];
            ctx.beginPath();
            ctx.arc(joint.x, joint.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawBoxingGloves(character) {
        const ctx = this.ctx;
        
        // Left glove
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(character.leftArm.hand.x, character.leftArm.hand.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Right glove  
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(character.rightArm.hand.x, character.rightArm.hand.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Glove highlights
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(character.leftArm.hand.x - 3, character.leftArm.hand.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(character.rightArm.hand.x - 3, character.rightArm.hand.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawEnergyBar(energy) {
        const ctx = this.ctx;
        const barWidth = 200;
        const barHeight = 20;
        const x = 20;
        const y = 20;
        
        // Background
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Energy fill
        const energyWidth = (energy / 100) * barWidth;
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#e74c3c');
        gradient.addColorStop(0.5, '#f39c12');
        gradient.addColorStop(1, '#27ae60');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, energyWidth, barHeight);
        
        // Border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Text
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '14px Cinzel';
        ctx.fillText('Energy', x, y - 5);
    }
    
    drawAttackIndicator(attackState) {
        if (attackState === 'idle') return;
        
        const ctx = this.ctx;
        const x = this.canvas.width - 150;
        const y = 20;
        
        ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        ctx.font = 'bold 16px Cinzel';
        
        let attackText = '';
        switch(attackState) {
            case 'jab': attackText = 'JAB!'; break;
            case 'hook': attackText = 'HOOK!'; break;
            case 'uppercut': attackText = 'UPPERCUT!'; break;
            case 'overheadHook': attackText = 'OVERHEAD!'; break;
        }
        
        ctx.fillText(attackText, x, y);
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