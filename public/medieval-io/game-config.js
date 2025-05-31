/**
 * Medieval.io Game Configuration
 * Phaser 3 게임의 기본 설정과 상수들을 정의합니다.
 */

// 게임 상수
const GAME_CONFIG = {
    // 게임 크기
    WIDTH: 1024,
    HEIGHT: 768,
    
    // 물리 설정
    PHYSICS: {
        GRAVITY: 0,
        DEBUG: false
    },
    
    // 플레이어 설정
    PLAYER: {
        SPEED: 200,
        HEALTH: 100,
        SIZE: 32
    },
    
    // 네트워크 설정
    NETWORK: {
        UPDATE_RATE: 60, // 60fps
        INTERPOLATION_DELAY: 100, // 100ms
        PREDICTION_BUFFER: 5 // 5 프레임
    },
    
    // 맵 설정
    MAP: {
        WIDTH: 2048,
        HEIGHT: 2048,
        SAFE_ZONE_SHRINK_RATE: 1 // 초당 픽셀
    }
};

// Phaser 3 게임 설정
const phaserConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2c5530',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GAME_CONFIG.PHYSICS.GRAVITY },
            debug: GAME_CONFIG.PHYSICS.DEBUG
        }
    },
    scene: [
        MenuScene,    // 메뉴 씬 (로딩 및 연결)
        GameScene,    // 메인 게임 씬
        GameOverScene // 게임 오버 씬
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 게임 상태 열거형
const GAME_STATES = {
    MENU: 'menu',
    CONNECTING: 'connecting',
    WAITING: 'waiting',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

// 플레이어 상태 열거형
const PLAYER_STATES = {
    IDLE: 'idle',
    MOVING: 'moving',
    ATTACKING: 'attacking',
    DEAD: 'dead'
};

// 키 매핑
const KEYS = {
    W: 'KeyW',
    A: 'KeyA',
    S: 'KeyS',
    D: 'KeyD',
    SPACE: 'Space'
};

// 방향 벡터
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    UP_LEFT: { x: -0.707, y: -0.707 },
    UP_RIGHT: { x: 0.707, y: -0.707 },
    DOWN_LEFT: { x: -0.707, y: 0.707 },
    DOWN_RIGHT: { x: 0.707, y: 0.707 }
};

// 색상 팔레트
const COLORS = {
    KNIGHT_BLUE: 0x4169e1,
    KNIGHT_RED: 0xdc143c,
    KNIGHT_GREEN: 0x32cd32,
    KNIGHT_GOLD: 0xffd700,
    BACKGROUND: 0x2c5530,
    UI_GOLD: 0xd4af37,
    UI_BROWN: 0x8b4513
};

// 스프라이트 설정
const SPRITE_CONFIG = {
    KNIGHT: {
        WIDTH: 32,
        HEIGHT: 32,
        FRAMES: 4, // 애니메이션 프레임 수
        FRAME_RATE: 8 // 초당 프레임
    }
};

// 전역 변수
let game = null;
let networkManager = null;

console.log('🏰 Medieval.io Game Configuration Loaded');