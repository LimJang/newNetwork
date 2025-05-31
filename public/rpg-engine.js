// Tick-Based RPG Engine (Like Lineage)
class RPGEngine {
    constructor() {
        this.mapWidth = 25;
        this.mapHeight = 18;
        this.tileSize = 32;
        this.tickRate = 200; // 200ms per tick (like classic MMORPGs)
        this.currentTick = 0;
        this.lastTickTime = 0;
        
        this.characters = new Map();
        this.myCharacterId = null;
        this.sprites = new RPGSprites();
        
        this.initializeMap();
        this.setupMouseHandling();
        
        // Tick-based timing
        this.tickTimer = null;
        this.animationFrame = 0;
    }
    
    initializeMap() {
        // Create a simple map with grass, stones, and trees
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // Border trees
                if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
                    row.push('tree');
                }
                // Random trees
                else if (Math.random() < 0.05 && !(x >= 10 && x <= 15 && y >= 8 && y <= 10)) {
                    row.push('tree');
                }
                // Stone path in center
                else if ((x >= 10 && x <= 15 && y >= 8 && y <= 10) || 
                        (x >= 12 && x <= 13 && y >= 5 && y <= 13)) {
                    row.push('stone');
                }
                // Default grass
                else {
                    row.push('grass');
                }
            }
            this.map.push(row);
        }
    }
    
    setupMouseHandling() {
        this.targetPosition = null;
        this.mouseMoveCallback = null;
    }
    
    setMouseMoveCallback(callback) {
        this.mouseMoveCallback = callback;
    }
    
    handleMouseClick(mouseX, mouseY, canvasRect) {
        // Convert mouse coordinates to tile coordinates
        const tileX = Math.floor((mouseX - canvasRect.left) / this.tileSize);
        const tileY = Math.floor((mouseY - canvasRect.top) / this.tileSize);
        
        // Check if click is within map bounds and not on a tree
        if (tileX >= 0 && tileX < this.mapWidth && 
            tileY >= 0 && tileY < this.mapHeight &&
            this.map[tileY][tileX] !== 'tree') {
            
            this.targetPosition = { x: tileX, y: tileY };
            
            // Send movement command to server
            if (this.mouseMoveCallback) {
                this.mouseMoveCallback(tileX, tileY);
            }
            
            return true;
        }
        
        return false;
    }
    
    startTickSystem() {
        this.stopTickSystem();
        
        this.tickTimer = setInterval(() => {
            this.processTick();
        }, this.tickRate);
    }
    
    stopTickSystem() {
        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
    }
    
    processTick() {
        this.currentTick++;
        
        // Update animation frame every tick
        this.animationFrame = Math.floor(this.currentTick / 2) % 2;
        
        // Process character movements
        for (let [characterId, character] of this.characters) {
            this.updateCharacterMovement(character);
        }
    }
    
    updateCharacterMovement(character) {
        if (character.movementQueue && character.movementQueue.length > 0) {
            const nextMove = character.movementQueue[0];
            const currentTime = Date.now();
            
            // Check if enough time has passed for the next movement step
            if (currentTime >= nextMove.executeTime) {
                character.x = nextMove.x;
                character.y = nextMove.y;
                character.movementQueue.shift();
                
                // Update character state
                if (character.movementQueue.length === 0) {
                    character.isMoving = false;
                    character.direction = character.direction || 'down';
                } else {
                    character.isMoving = true;
                    // Calculate direction based on next movement
                    const next = character.movementQueue[0];
                    character.direction = this.calculateDirection(character.x, character.y, next.x, next.y);
                }
            }
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
    
    addCharacter(characterData) {
        const character = {
            id: characterData.id,
            name: characterData.name || 'Civilian',
            x: characterData.x || 12,
            y: characterData.y || 9,
            direction: characterData.direction || 'down',
            isMoving: false,
            movementQueue: [],
            color: characterData.color || this.generateRandomColor(),
            joinTime: Date.now()
        };
        
        this.characters.set(characterData.id, character);
        return character;
    }
    
    removeCharacter(characterId) {
        this.characters.delete(characterId);
    }
    
    updateCharacter(characterData) {
        const character = this.characters.get(characterData.id);
        if (character) {
            // Update character with server data
            Object.assign(character, characterData);
            
            // Handle movement path
            if (characterData.movementPath && characterData.movementPath.length > 0) {
                character.movementQueue = characterData.movementPath.map((pos, index) => ({
                    x: pos.x,
                    y: pos.y,
                    executeTime: Date.now() + (index * this.tickRate)
                }));
                character.isMoving = true;
                
                // Set initial direction
                if (character.movementQueue.length > 0) {
                    const firstMove = character.movementQueue[0];
                    character.direction = this.calculateDirection(
                        character.x, character.y, 
                        firstMove.x, firstMove.y
                    );
                }
            }
        }
    }
    
    generateRandomColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
            '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getMyCharacter() {
        return this.characters.get(this.myCharacterId);
    }
    
    findPath(startX, startY, targetX, targetY) {
        // Simple pathfinding - straight line for now
        // In a full implementation, you'd use A* pathfinding
        const path = [];
        
        let currentX = startX;
        let currentY = startY;
        
        while (currentX !== targetX || currentY !== targetY) {
            // Move one step closer to target
            if (currentX < targetX) currentX++;
            else if (currentX > targetX) currentX--;
            
            if (currentY < targetY) currentY++;
            else if (currentY > targetY) currentY--;
            
            // Check if position is valid (not a tree)
            if (this.map[currentY] && this.map[currentY][currentX] !== 'tree') {
                path.push({ x: currentX, y: currentY });
            } else {
                // Hit obstacle, stop pathfinding
                break;
            }
        }
        
        return path;
    }
    
    getState() {
        return {
            characters: Array.from(this.characters.values()),
            currentTick: this.currentTick,
            mapData: this.map
        };
    }
    
    setState(state) {
        if (state.characters) {
            // Update all characters
            const newCharacters = new Map();
            
            state.characters.forEach(charData => {
                if (this.characters.has(charData.id)) {
                    // Update existing character
                    this.updateCharacter(charData);
                    newCharacters.set(charData.id, this.characters.get(charData.id));
                } else {
                    // Add new character
                    const newChar = this.addCharacter(charData);
                    newCharacters.set(charData.id, newChar);
                }
            });
            
            this.characters = newCharacters;
        }
        
        if (state.currentTick !== undefined) {
            this.currentTick = state.currentTick;
        }
    }
}

// RPG Renderer
class RPGRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sprites = new RPGSprites();
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        
        // Camera system
        this.cameraX = 0;
        this.cameraY = 0;
    }
    
    render(rpgEngine) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update camera to follow player
        this.updateCamera(rpgEngine);
        
        // Render map
        this.renderMap(rpgEngine);
        
        // Render target position
        this.renderTarget(rpgEngine);
        
        // Render characters
        this.renderCharacters(rpgEngine);
        
        // Render UI
        this.renderUI(rpgEngine);
        
        // Update FPS
        this.updateFPS();
    }
    
    updateCamera(rpgEngine) {
        const myChar = rpgEngine.getMyCharacter();
        if (myChar) {
            // Center camera on player character
            this.cameraX = (myChar.x * rpgEngine.tileSize) - (this.canvas.width / 2);
            this.cameraY = (myChar.y * rpgEngine.tileSize) - (this.canvas.height / 2);
            
            // Clamp camera to map bounds
            this.cameraX = Math.max(0, Math.min(this.cameraX, 
                (rpgEngine.mapWidth * rpgEngine.tileSize) - this.canvas.width));
            this.cameraY = Math.max(0, Math.min(this.cameraY, 
                (rpgEngine.mapHeight * rpgEngine.tileSize) - this.canvas.height));
        }
    }
    
    renderMap(rpgEngine) {
        const tileSize = rpgEngine.tileSize;
        
        for (let y = 0; y < rpgEngine.mapHeight; y++) {
            for (let x = 0; x < rpgEngine.mapWidth; x++) {
                const tileType = rpgEngine.map[y][x];
                const tile = this.sprites.getMapTile(tileType);
                
                const screenX = (x * tileSize) - this.cameraX;
                const screenY = (y * tileSize) - this.cameraY;
                
                // Only render tiles that are visible on screen
                if (screenX > -tileSize && screenX < this.canvas.width &&
                    screenY > -tileSize && screenY < this.canvas.height) {
                    
                    this.sprites.renderSprite(this.ctx, tile, screenX, screenY, 1);
                }
            }
        }
    }
    
    renderTarget(rpgEngine) {
        if (rpgEngine.targetPosition) {
            const target = rpgEngine.targetPosition;
            const screenX = (target.x * rpgEngine.tileSize) - this.cameraX;
            const screenY = (target.y * rpgEngine.tileSize) - this.cameraY;
            
            // Render target indicator
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(screenX, screenY, rpgEngine.tileSize, rpgEngine.tileSize);
            
            // Animated target marker
            const time = Date.now() / 500;
            const alpha = (Math.sin(time) + 1) / 2;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
            this.ctx.fillRect(screenX, screenY, rpgEngine.tileSize, rpgEngine.tileSize);
        }
    }
    
    renderCharacters(rpgEngine) {
        const tileSize = rpgEngine.tileSize;
        
        for (let [characterId, character] of rpgEngine.characters) {
            const screenX = (character.x * tileSize) - this.cameraX;
            const screenY = (character.y * tileSize) - this.cameraY;
            
            // Only render characters that are visible
            if (screenX > -tileSize && screenX < this.canvas.width &&
                screenY > -tileSize && screenY < this.canvas.height) {
                
                // Get appropriate sprite
                const sprite = this.sprites.getCharacterSprite(
                    character.direction, 
                    character.isMoving, 
                    rpgEngine.animationFrame
                );
                
                // Render character sprite
                this.sprites.renderSprite(
                    this.ctx, 
                    sprite, 
                    screenX + 4, 
                    screenY + 4, 
                    1
                );
                
                // Render character name
                this.ctx.fillStyle = '#000';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    character.name, 
                    screenX + tileSize/2, 
                    screenY - 5
                );
                
                // Highlight own character
                if (character.id === rpgEngine.myCharacterId) {
                    this.ctx.strokeStyle = '#ffff00';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(screenX, screenY, tileSize, tileSize);
                }
            }
        }
    }
    
    renderUI(rpgEngine) {
        // Render tick counter
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Tick: ${rpgEngine.currentTick}`, 10, 25);
        
        // Render character count
        this.ctx.fillText(`Players: ${rpgEngine.characters.size}`, 10, 45);
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