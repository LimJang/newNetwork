// RPG Pixel Art Sprites and Animation System
class RPGSprites {
    constructor() {
        this.tileSize = 32;
        this.characterSize = 24;
        
        // Pixel art data for civilian character (16x24 pixels)
        this.initializeCivilianSprites();
        this.initializeMapTiles();
        
        // Animation frame tracking
        this.animationFrame = 0;
        this.lastAnimationTime = 0;
    }
    
    initializeCivilianSprites() {
        // Color palette for civilian character
        this.colors = {
            0: 'transparent',    // Transparent
            1: '#ffdbac',       // Skin
            2: '#654321',       // Hair (brown)
            3: '#8B4513',       // Dark brown
            4: '#000000',       // Black (eyes, outline)
            5: '#4169E1',       // Blue shirt
            6: '#32CD32',       // Green pants
            7: '#8B7355',       // Brown shoes
            8: '#FFB6C1',       // Light pink
            9: '#FFFFFF'        // White
        };
        
        // Civilian character facing down (idle)
        this.civilianDown = [
            [0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0],
            [0,0,3,2,2,2,2,2,2,3,0,0,0,0,0,0],
            [0,3,2,2,2,2,2,2,2,2,3,0,0,0,0,0],
            [0,3,1,1,1,1,1,1,1,1,3,0,0,0,0,0],
            [3,1,1,4,1,1,1,1,4,1,1,3,0,0,0,0],
            [3,1,1,1,1,8,8,1,1,1,1,3,0,0,0,0],
            [3,1,1,1,8,8,8,8,1,1,1,3,0,0,0,0],
            [0,3,1,1,1,8,8,1,1,1,3,0,0,0,0,0],
            [0,0,3,1,1,1,1,1,1,3,0,0,0,0,0,0],
            [0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0],
            [0,0,0,5,5,5,5,5,5,0,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,5,1,5,5,5,5,1,5,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0],
            [0,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0],
            [0,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0],
            [0,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0],
            [0,6,6,6,6,0,0,6,6,6,6,0,0,0,0,0],
            [0,7,7,7,0,0,0,0,7,7,7,0,0,0,0,0],
            [7,7,7,7,0,0,0,0,7,7,7,7,0,0,0,0],
            [7,7,7,0,0,0,0,0,0,7,7,7,0,0,0,0],
            [7,7,0,0,0,0,0,0,0,0,7,7,0,0,0,0]
        ];
        
        // Walking animation frame 1 (left foot forward)
        this.civilianWalk1 = [
            [0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0],
            [0,0,3,2,2,2,2,2,2,3,0,0,0,0,0,0],
            [0,3,2,2,2,2,2,2,2,2,3,0,0,0,0,0],
            [0,3,1,1,1,1,1,1,1,1,3,0,0,0,0,0],
            [3,1,1,4,1,1,1,1,4,1,1,3,0,0,0,0],
            [3,1,1,1,1,8,8,1,1,1,1,3,0,0,0,0],
            [3,1,1,1,8,8,8,8,1,1,1,3,0,0,0,0],
            [0,3,1,1,1,8,8,1,1,1,3,0,0,0,0,0],
            [0,0,3,1,1,1,1,1,1,3,0,0,0,0,0,0],
            [0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0],
            [0,0,0,5,5,5,5,5,5,0,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,5,1,5,5,5,5,1,5,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0],
            [0,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0],
            [6,6,6,6,6,6,6,6,6,6,0,0,0,0,0,0], // Left foot forward
            [7,7,6,6,6,0,0,6,6,6,0,0,0,0,0,0],
            [7,7,7,6,0,0,0,0,6,6,6,0,0,0,0,0],
            [7,7,7,0,0,0,0,0,0,7,7,7,0,0,0,0],
            [7,7,0,0,0,0,0,0,0,7,7,7,7,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,7,7,7,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,7,7,0,0,0]
        ];
        
        // Walking animation frame 2 (right foot forward)
        this.civilianWalk2 = [
            [0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0],
            [0,0,3,2,2,2,2,2,2,3,0,0,0,0,0,0],
            [0,3,2,2,2,2,2,2,2,2,3,0,0,0,0,0],
            [0,3,1,1,1,1,1,1,1,1,3,0,0,0,0,0],
            [3,1,1,4,1,1,1,1,4,1,1,3,0,0,0,0],
            [3,1,1,1,1,8,8,1,1,1,1,3,0,0,0,0],
            [3,1,1,1,8,8,8,8,1,1,1,3,0,0,0,0],
            [0,3,1,1,1,8,8,1,1,1,3,0,0,0,0,0],
            [0,0,3,1,1,1,1,1,1,3,0,0,0,0,0,0],
            [0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0],
            [0,0,0,5,5,5,5,5,5,0,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,5,1,5,5,5,5,1,5,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,5,5,5,5,5,5,5,5,0,0,0,0,0,0],
            [0,0,6,6,6,6,6,6,6,6,0,0,0,0,0,0],
            [0,6,6,6,6,6,6,6,6,6,6,0,0,0,0,0],
            [0,0,0,6,6,6,6,6,6,6,6,6,6,0,0,0], // Right foot forward
            [0,0,6,6,6,0,0,6,6,6,7,7,0,0,0,0],
            [0,0,6,6,0,0,0,0,6,7,7,7,0,0,0,0],
            [0,0,7,7,7,0,0,0,0,0,7,7,7,0,0,0],
            [0,7,7,7,7,0,0,0,0,0,0,0,7,7,0,0],
            [0,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,7,7,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        // Create directional sprites (simplified - using same base with rotation concept)
        this.sprites = {
            down: {
                idle: this.civilianDown,
                walk: [this.civilianWalk1, this.civilianWalk2]
            },
            up: {
                idle: this.flipVertical(this.civilianDown),
                walk: [this.flipVertical(this.civilianWalk1), this.flipVertical(this.civilianWalk2)]
            },
            left: {
                idle: this.civilianDown, // Simplified - same sprite
                walk: [this.civilianWalk1, this.civilianWalk2]
            },
            right: {
                idle: this.civilianDown, // Simplified - same sprite  
                walk: [this.civilianWalk1, this.civilianWalk2]
            }
        };
    }
    
    flipVertical(sprite) {
        return sprite.slice().reverse();
    }
    
    initializeMapTiles() {
        // Simple grass tile
        this.grassTile = this.createSolidTile('#4a7c59');
        
        // Stone path tile
        this.stoneTile = this.createSolidTile('#8d8d8d');
        
        // Tree tile (simplified)
        this.treeTile = this.createTreeTile();
    }
    
    createSolidTile(baseColor) {
        const tile = [];
        for (let y = 0; y < 32; y++) {
            const row = [];
            for (let x = 0; x < 32; x++) {
                // Add some texture variation
                const variation = Math.random() * 0.3 - 0.15;
                row.push(this.adjustColor(baseColor, variation));
            }
            tile.push(row);
        }
        return tile;
    }
    
    createTreeTile() {
        // Simple tree representation
        const tile = Array(32).fill().map(() => Array(32).fill('#4a7c59')); // Grass base
        
        // Tree trunk
        for (let y = 20; y < 32; y++) {
            for (let x = 14; x < 18; x++) {
                tile[y][x] = '#8B4513';
            }
        }
        
        // Tree foliage
        for (let y = 8; y < 22; y++) {
            for (let x = 8; x < 24; x++) {
                const distance = Math.sqrt((x - 16) ** 2 + (y - 15) ** 2);
                if (distance < 8) {
                    tile[y][x] = '#228B22';
                }
            }
        }
        
        return tile;
    }
    
    adjustColor(color, variation) {
        // Simple color variation for texture
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        const newR = Math.max(0, Math.min(255, r + variation * 255));
        const newG = Math.max(0, Math.min(255, g + variation * 255));
        const newB = Math.max(0, Math.min(255, b + variation * 255));
        
        return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
    }
    
    renderSprite(ctx, sprite, x, y, scale = 2) {
        if (typeof sprite[0][0] === 'string') {
            // Direct color array
            this.renderColorArray(ctx, sprite, x, y, scale);
        } else {
            // Indexed color array
            this.renderIndexedSprite(ctx, sprite, x, y, scale);
        }
    }
    
    renderIndexedSprite(ctx, sprite, x, y, scale) {
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const colorIndex = sprite[row][col];
                const color = this.colors[colorIndex];
                
                if (color && color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + col * scale,
                        y + row * scale,
                        scale,
                        scale
                    );
                }
            }
        }
    }
    
    renderColorArray(ctx, sprite, x, y, scale) {
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const color = sprite[row][col];
                
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + col * scale,
                        y + row * scale,
                        scale,
                        scale
                    );
                }
            }
        }
    }
    
    getCharacterSprite(direction, isMoving, animationFrame) {
        const spriteSet = this.sprites[direction];
        
        if (isMoving) {
            const walkFrames = spriteSet.walk;
            return walkFrames[animationFrame % walkFrames.length];
        } else {
            return spriteSet.idle;
        }
    }
    
    getMapTile(tileType) {
        switch (tileType) {
            case 'grass': return this.grassTile;
            case 'stone': return this.stoneTile;
            case 'tree': return this.treeTile;
            default: return this.grassTile;
        }
    }
}