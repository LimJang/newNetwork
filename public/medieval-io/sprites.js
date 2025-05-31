/**
 * Medieval.io Sprite Generation System
 * 중세 기사 스프라이트를 프로그래밍적으로 생성하는 시스템
 */

class SpriteGenerator {
    /**
     * Phaser 씬에서 스프라이트 텍스처를 생성합니다
     * @param {Phaser.Scene} scene - 스프라이트를 생성할 씬
     */
    static generateSprites(scene) {
        console.log('🎨 Generating Medieval Knight Sprites...');
        
        // 기사 스프라이트 생성
        this.createKnightSprite(scene, 'knight_blue', COLORS.KNIGHT_BLUE);
        this.createKnightSprite(scene, 'knight_red', COLORS.KNIGHT_RED);
        this.createKnightSprite(scene, 'knight_green', COLORS.KNIGHT_GREEN);
        this.createKnightSprite(scene, 'knight_gold', COLORS.KNIGHT_GOLD);
        
        // 무기 스프라이트 생성
        this.createSwordSprite(scene);
        
        // 환경 스프라이트 생성
        this.createEnvironmentSprites(scene);
        
        console.log('✅ All sprites generated successfully');
    }
    
    /**
     * 기사 스프라이트를 생성합니다 (애니메이션 프레임 포함)
     * @param {Phaser.Scene} scene - Phaser 씬
     * @param {string} key - 스프라이트 키
     * @param {number} primaryColor - 주요 색상
     */
    static createKnightSprite(scene, key, primaryColor) {
        const canvas = scene.add.renderTexture(0, 0, 
            SPRITE_CONFIG.KNIGHT.WIDTH * SPRITE_CONFIG.KNIGHT.FRAMES, 
            SPRITE_CONFIG.KNIGHT.HEIGHT);
        
        // 각 애니메이션 프레임 생성
        for (let frame = 0; frame < SPRITE_CONFIG.KNIGHT.FRAMES; frame++) {
            const frameCanvas = this.createKnightFrame(scene, primaryColor, frame);
            canvas.draw(frameCanvas, frame * SPRITE_CONFIG.KNIGHT.WIDTH, 0);
            frameCanvas.destroy();
        }
        
        // 텍스처로 저장
        canvas.saveTexture(key);
        canvas.destroy();
        
        // 애니메이션 프레임 설정
        scene.anims.create({
            key: key + '_walk',
            frames: scene.anims.generateFrameNumbers(key, { 
                start: 0, 
                end: SPRITE_CONFIG.KNIGHT.FRAMES - 1 
            }),
            frameRate: SPRITE_CONFIG.KNIGHT.FRAME_RATE,
            repeat: -1
        });
        
        scene.anims.create({
            key: key + '_idle',
            frames: [{ key: key, frame: 0 }],
            frameRate: 1,
            repeat: -1
        });
    }
    
    /**
     * 개별 기사 프레임을 생성합니다
     * @param {Phaser.Scene} scene - Phaser 씬
     * @param {number} color - 기사 색상
     * @param {number} frame - 애니메이션 프레임 번호
     * @returns {Phaser.GameObjects.Graphics} 생성된 프레임
     */
    static createKnightFrame(scene, color, frame) {
        const graphics = scene.add.graphics();
        const size = SPRITE_CONFIG.KNIGHT.WIDTH;
        const halfSize = size / 2;
        
        // 애니메이션을 위한 오프셋 계산 (걷기 동작)
        const walkOffset = Math.sin(frame * Math.PI / 2) * 2;
        const bobOffset = Math.abs(Math.sin(frame * Math.PI / 2)) * 1;
        
        // 기사 몸체 (갑옷)
        graphics.fillStyle(color);
        graphics.fillRect(halfSize - 8, 8 - bobOffset, 16, 20);
        
        // 투구
        graphics.fillStyle(0x696969); // 회색 철
        graphics.fillCircle(halfSize, 6 - bobOffset, 8);
        
        // 투구 장식
        graphics.fillStyle(color);
        graphics.fillRect(halfSize - 2, 2 - bobOffset, 4, 3);
        
        // 팔 (애니메이션)
        graphics.fillStyle(color);
        // 왼쪽 팔
        graphics.fillRect(halfSize - 12, 12 - bobOffset + walkOffset, 4, 12);
        // 오른쪽 팔
        graphics.fillRect(halfSize + 8, 12 - bobOffset - walkOffset, 4, 12);
        
        // 다리 (애니메이션)
        graphics.fillStyle(0x8b4513); // 갈색 바지
        // 왼쪽 다리
        graphics.fillRect(halfSize - 6, 24 - bobOffset - walkOffset, 4, 8);
        // 오른쪽 다리
        graphics.fillRect(halfSize + 2, 24 - bobOffset + walkOffset, 4, 8);
        
        // 방패 (왼손)
        graphics.fillStyle(0x696969);
        graphics.fillRect(halfSize - 16, 10 - bobOffset + walkOffset, 3, 8);
        graphics.fillStyle(color);
        graphics.fillRect(halfSize - 15, 11 - bobOffset + walkOffset, 1, 6);
        
        // 검 (오른손)
        graphics.fillStyle(0xc0c0c0); // 은색 검날
        graphics.fillRect(halfSize + 12, 8 - bobOffset - walkOffset, 2, 12);
        graphics.fillStyle(0x8b4513); // 갈색 손잡이
        graphics.fillRect(halfSize + 11, 20 - bobOffset - walkOffset, 4, 4);
        
        // 눈 (투구 슬릿)
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(halfSize - 2, 6 - bobOffset, 1);
        graphics.fillCircle(halfSize + 2, 6 - bobOffset, 1);
        
        return graphics;
    }
    
    /**
     * 검 스프라이트를 생성합니다
     * @param {Phaser.Scene} scene - Phaser 씬
     */
    static createSwordSprite(scene) {
        const graphics = scene.add.graphics();
        
        // 검날
        graphics.fillStyle(0xc0c0c0);
        graphics.fillRect(2, 0, 4, 24);
        
        // 검 가드
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(0, 24, 8, 2);
        
        // 손잡이
        graphics.fillStyle(0x654321);
        graphics.fillRect(2, 26, 4, 8);
        
        // 검 끝
        graphics.fillStyle(0xc0c0c0);
        graphics.fillTriangle(4, 0, 2, 4, 6, 4);
        
        graphics.generateTexture('sword', 8, 34);
        graphics.destroy();
    }
    
    /**
     * 환경 스프라이트들을 생성합니다
     * @param {Phaser.Scene} scene - Phaser 씬
     */
    static createEnvironmentSprites(scene) {
        // 나무
        const treeGraphics = scene.add.graphics();
        treeGraphics.fillStyle(0x8b4513); // 갈색 나무줄기
        treeGraphics.fillRect(12, 16, 8, 16);
        treeGraphics.fillStyle(0x228b22); // 녹색 나무잎
        treeGraphics.fillCircle(16, 12, 12);
        treeGraphics.generateTexture('tree', 32, 32);
        treeGraphics.destroy();
        
        // 바위
        const rockGraphics = scene.add.graphics();
        rockGraphics.fillStyle(0x696969);
        rockGraphics.fillCircle(16, 20, 10);
        rockGraphics.fillStyle(0x808080);
        rockGraphics.fillCircle(16, 18, 8);
        rockGraphics.generateTexture('rock', 32, 32);
        rockGraphics.destroy();
        
        // 풀
        const grassGraphics = scene.add.graphics();
        grassGraphics.fillStyle(0x32cd32);
        for (let i = 0; i < 8; i++) {
            const x = (i % 4) * 8 + 4;
            const y = Math.floor(i / 4) * 16 + 20;
            grassGraphics.fillRect(x, y, 2, 8);
        }
        grassGraphics.generateTexture('grass', 32, 32);
        grassGraphics.destroy();
        
        // 세이프존 경계
        const safeZoneGraphics = scene.add.graphics();
        safeZoneGraphics.lineStyle(4, 0x00ffff, 0.8);
        safeZoneGraphics.strokeCircle(16, 16, 12);
        safeZoneGraphics.generateTexture('safe_zone_border', 32, 32);
        safeZoneGraphics.destroy();
    }
    
    /**
     * 플레이어별 고유 색상을 생성합니다
     * @param {number} playerId - 플레이어 ID
     * @returns {number} 헥스 색상 값
     */
    static getPlayerColor(playerId) {
        const colors = [
            COLORS.KNIGHT_BLUE,
            COLORS.KNIGHT_RED,
            COLORS.KNIGHT_GREEN,
            COLORS.KNIGHT_GOLD,
            0xff69b4, // 핫핑크
            0x9370db, // 보라색
            0x20b2aa, // 라이트 시그린
            0xff6347  // 토마토 레드
        ];
        
        return colors[playerId % colors.length];
    }
    
    /**
     * 색상 기반 스프라이트 키를 반환합니다
     * @param {number} color - 색상 값
     * @returns {string} 스프라이트 키
     */
    static getSpriteKey(color) {
        switch(color) {
            case COLORS.KNIGHT_BLUE: return 'knight_blue';
            case COLORS.KNIGHT_RED: return 'knight_red';
            case COLORS.KNIGHT_GREEN: return 'knight_green';
            case COLORS.KNIGHT_GOLD: return 'knight_gold';
            default: return 'knight_blue';
        }
    }
}

console.log('🎨 Medieval.io Sprite Generator Loaded');