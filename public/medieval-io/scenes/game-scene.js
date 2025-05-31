/**
 * Medieval.io Game Scene
 * 메인 게임플레이를 담당하는 씬입니다.
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // 게임 상태
        this.players = new Map();
        this.localPlayer = null;
        this.gameStarted = false;
        this.gameEnded = false;
        
        // 맵 및 환경
        this.mapObjects = null;
        this.safeZone = null;
        this.safeZoneRadius = GAME_CONFIG.MAP.WIDTH / 2;
        
        // UI 요소들
        this.miniMap = null;
        this.gameTimer = null;
        
        // 카메라
        this.followCamera = null;
        
        console.log('🎮 GameScene initialized');
    }
    
    /**
     * 씬 생성 시 호출됩니다
     */
    create() {
        console.log('🎮 GameScene created');
        
        // 월드 경계 설정
        this.physics.world.setBounds(0, 0, GAME_CONFIG.MAP.WIDTH, GAME_CONFIG.MAP.HEIGHT);
        
        // 배경 생성
        this.createBackground();
        
        // 맵 환경 생성
        this.createMapEnvironment();
        
        // 세이프존 생성
        this.createSafeZone();
        
        // 네트워크 이벤트 설정
        this.setupNetworkEvents();
        
        // 카메라 설정
        this.setupCamera();
        
        // 게임 시작
        this.startGame();
        
        // 페이드 인 효과
        this.cameras.main.fadeIn(1000, 0, 0, 0);
    }
    
    /**
     * 배경을 생성합니다
     */
    createBackground() {
        // 타일 기반 배경 생성
        const tileSize = 64;
        const tilesX = Math.ceil(GAME_CONFIG.MAP.WIDTH / tileSize);
        const tilesY = Math.ceil(GAME_CONFIG.MAP.HEIGHT / tileSize);
        
        for (let x = 0; x < tilesX; x++) {
            for (let y = 0; y < tilesY; y++) {
                // 체스판 패턴으로 두 가지 색상 번갈아 표시
                const color = (x + y) % 2 === 0 ? 0x2d5a2d : 0x2a5a2a;
                const tile = this.add.rectangle(
                    x * tileSize + tileSize / 2,
                    y * tileSize + tileSize / 2,
                    tileSize,
                    tileSize,
                    color
                );
                tile.setAlpha(0.3);
            }
        }
    }
    
    /**
     * 맵 환경 객체들을 생성합니다
     */
    createMapEnvironment() {
        this.mapObjects = this.physics.add.staticGroup();
        
        // 나무들을 랜덤하게 배치
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(100, GAME_CONFIG.MAP.WIDTH - 100);
            const y = Phaser.Math.Between(100, GAME_CONFIG.MAP.HEIGHT - 100);
            
            const tree = this.mapObjects.create(x, y, 'tree');
            tree.setSize(24, 24); // 충돌 영역 조정
            tree.refreshBody();
        }
        
        // 바위들을 랜덤하게 배치
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(100, GAME_CONFIG.MAP.WIDTH - 100);
            const y = Phaser.Math.Between(100, GAME_CONFIG.MAP.HEIGHT - 100);
            
            const rock = this.mapObjects.create(x, y, 'rock');
            rock.setSize(20, 20); // 충돌 영역 조정
            rock.refreshBody();
        }
    }
    
    /**
     * 세이프존을 생성합니다
     */
    createSafeZone() {
        const centerX = GAME_CONFIG.MAP.WIDTH / 2;
        const centerY = GAME_CONFIG.MAP.HEIGHT / 2;
        
        // 세이프존 영역 표시
        this.safeZoneGraphics = this.add.graphics();
        this.updateSafeZoneGraphics();
        
        // 세이프존 축소 타이머
        this.safeZoneShrinkTimer = this.time.addEvent({
            delay: 10000, // 10초마다 축소
            callback: this.shrinkSafeZone,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * 세이프존 그래픽을 업데이트합니다
     */
    updateSafeZoneGraphics() {
        const centerX = GAME_CONFIG.MAP.WIDTH / 2;
        const centerY = GAME_CONFIG.MAP.HEIGHT / 2;
        
        this.safeZoneGraphics.clear();
        
        // 위험 구역 (빨간색)
        this.safeZoneGraphics.fillStyle(0xff0000, 0.1);
        this.safeZoneGraphics.fillRect(0, 0, GAME_CONFIG.MAP.WIDTH, GAME_CONFIG.MAP.HEIGHT);
        
        // 안전 구역 (투명)
        this.safeZoneGraphics.fillStyle(0x00ff00, 0.05);
        this.safeZoneGraphics.fillCircle(centerX, centerY, this.safeZoneRadius);
        
        // 경계선
        this.safeZoneGraphics.lineStyle(4, 0x00ffff, 0.8);
        this.safeZoneGraphics.strokeCircle(centerX, centerY, this.safeZoneRadius);
    }
    
    /**
     * 세이프존을 축소합니다
     */
    shrinkSafeZone() {
        const shrinkAmount = 50;
        this.safeZoneRadius = Math.max(100, this.safeZoneRadius - shrinkAmount);
        this.updateSafeZoneGraphics();
        
        console.log(`⚠️ Safe zone shrinking! New radius: ${this.safeZoneRadius}`);
        
        // 세이프존 축소 알림
        this.showNotification('Safe Zone Shrinking!', 0xff6347);
        
        // 플레이어들에게 데미지 적용 (세이프존 밖에 있는 경우)
        this.checkPlayersInSafeZone();
    }
    
    /**
     * 플레이어들이 세이프존 안에 있는지 확인합니다
     */
    checkPlayersInSafeZone() {
        const centerX = GAME_CONFIG.MAP.WIDTH / 2;
        const centerY = GAME_CONFIG.MAP.HEIGHT / 2;
        
        this.players.forEach((player) => {
            if (!player.isAlive()) return;
            
            const distance = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y, centerX, centerY
            );
            
            if (distance > this.safeZoneRadius) {
                // 세이프존 밖에서 데미지 받음
                player.takeDamage(10);
                console.log(`💀 Player ${player.playerId} taking storm damage`);
            }
        });
    }
    
    /**
     * 네트워크 이벤트들을 설정합니다
     */
    setupNetworkEvents() {
        // 게임 상태 업데이트
        networkManager.on('gameStateUpdate', (gameState) => {
            this.handleGameStateUpdate(gameState);
        });
        
        // 플레이어 참가
        networkManager.on('playerJoined', (playerData) => {
            this.addPlayer(playerData);
        });
        
        // 플레이어 퇴장
        networkManager.on('playerLeft', (playerId) => {
            this.removePlayer(playerId);
        });
        
        // 플레이어 업데이트
        networkManager.on('playerUpdate', (updateData) => {
            this.updatePlayer(updateData);
        });
        
        // 플레이어 공격
        networkManager.on('playerAttack', (attackData) => {
            this.handlePlayerAttack(attackData);
        });
        
        // 플레이어 사망
        networkManager.on('playerDeath', (deathData) => {
            this.handlePlayerDeath(deathData);
        });
        
        // 게임 종료
        networkManager.on('gameOver', (gameOverData) => {
            this.handleGameOver(gameOverData);
        });
    }
    
    /**
     * 카메라를 설정합니다
     */
    setupCamera() {
        // 메인 카메라 설정
        this.cameras.main.setBounds(0, 0, GAME_CONFIG.MAP.WIDTH, GAME_CONFIG.MAP.HEIGHT);
        this.cameras.main.setZoom(1);
    }
    
    /**
     * 게임을 시작합니다
     */
    startGame() {
        this.gameStarted = true;
        console.log('🚀 Game started!');
        
        // 로컬 플레이어 생성 요청
        this.requestPlayerSpawn();
    }
    
    /**
     * 플레이어 스폰을 요청합니다
     */
    requestPlayerSpawn() {
        if (networkManager.isConnectedToServer()) {
            // 서버에서 처리하도록 요청만 전송
            console.log('📡 Requesting player spawn...');
        }
    }
    
    /**
     * 게임 상태 업데이트를 처리합니다
     * @param {Object} gameState - 서버 게임 상태
     */
    handleGameStateUpdate(gameState) {
        // 플레이어들 위치 업데이트
        Object.entries(gameState.players).forEach(([playerId, playerData]) => {
            if (this.players.has(playerId)) {
                const player = this.players.get(playerId);
                if (!player.isLocal) {
                    player.setTargetPosition(playerData.x, playerData.y);
                    player.setDirection(playerData.direction);
                    player.health = playerData.health;
                }
            } else {
                // 새 플레이어 추가
                this.addPlayer(playerData);
            }
        });
        
        // 존재하지 않는 플레이어들 제거
        this.players.forEach((player, playerId) => {
            if (!gameState.players[playerId]) {
                this.removePlayer(playerId);
            }
        });
    }
    
    /**
     * 플레이어를 추가합니다
     * @param {Object} playerData - 플레이어 데이터
     */
    addPlayer(playerData) {
        const playerId = playerData.id;
        
        if (this.players.has(playerId)) {
            console.log(`⚠️ Player ${playerId} already exists`);
            return;
        }
        
        // 로컬 플레이어인지 확인
        const isLocal = playerId === networkManager.playerId;
        
        // 플레이어 생성
        const player = new Player(
            this, 
            playerData.x, 
            playerData.y, 
            playerId, 
            isLocal
        );
        
        this.players.set(playerId, player);
        
        // 로컬 플레이어 설정
        if (isLocal) {
            this.localPlayer = player;
            networkManager.setLocalPlayer(player);
            
            // 카메라가 로컬 플레이어를 따라가도록 설정
            this.cameras.main.startFollow(player.sprite, true, 0.08, 0.08);
            
            console.log('👤 Local player created');
        }
        
        // 충돌 설정
        this.physics.add.collider(player.sprite, this.mapObjects);
        
        console.log(`👥 Player ${playerId} joined the battle`);
        this.showNotification(`Knight ${player.getPlayerIndex()} joined!`, 0x32cd32);
    }
    
    /**
     * 플레이어를 제거합니다
     * @param {string} playerId - 플레이어 ID
     */
    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            player.destroy();
            this.players.delete(playerId);
            
            console.log(`👋 Player ${playerId} left the battle`);
            this.showNotification(`Knight ${player.getPlayerIndex()} left`, 0xff6347);
        }
    }
    
    /**
     * 플레이어를 업데이트합니다
     * @param {Object} updateData - 업데이트 데이터
     */
    updatePlayer(updateData) {
        const player = this.players.get(updateData.playerId);
        if (player && !player.isLocal) {
            player.setTargetPosition(updateData.x, updateData.y);
            player.setDirection(updateData.direction);
            player.health = updateData.health;
        }
    }
    
    /**
     * 플레이어 공격을 처리합니다
     * @param {Object} attackData - 공격 데이터
     */
    handlePlayerAttack(attackData) {
        const player = this.players.get(attackData.playerId);
        if (player) {
            player.performAttack(attackData.targetX, attackData.targetY);
            
            // 공격 효과 생성
            this.createAttackEffect(attackData.targetX, attackData.targetY);
        }
    }
    
    /**
     * 공격 효과를 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    createAttackEffect(x, y) {
        // 파티클 효과
        const particles = this.add.particles(x, y, 'sword', {
            scale: { start: 0.5, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 300,
            quantity: 5
        });
        
        // 효과 자동 제거
        this.time.delayedCall(300, () => {
            particles.destroy();
        });
    }
    
    /**
     * 플레이어 사망을 처리합니다
     * @param {Object} deathData - 사망 데이터
     */
    handlePlayerDeath(deathData) {
        const player = this.players.get(deathData.playerId);
        if (player) {
            player.die();
            console.log(`💀 Player ${deathData.playerId} was eliminated`);
            
            this.showNotification(`Knight ${player.getPlayerIndex()} eliminated!`, 0xff0000);
            
            // 로컬 플레이어가 죽은 경우
            if (player.isLocal) {
                this.handleLocalPlayerDeath();
            }
        }
    }
    
    /**
     * 로컬 플레이어 사망을 처리합니다
     */
    handleLocalPlayerDeath() {
        console.log('💀 You have been eliminated!');
        
        // 사망 화면 표시
        this.showDeathScreen();
        
        // 관전자 모드로 전환
        this.switchToSpectatorMode();
    }
    
    /**
     * 사망 화면을 표시합니다
     */
    showDeathScreen() {
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;
        
        // 반투명 오버레이
        const overlay = this.add.rectangle(centerX, centerY, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT, 0x000000, 0.7);
        overlay.setScrollFactor(0);
        
        // 사망 메시지
        const deathText = this.add.text(centerX, centerY - 50, 'YOU HAVE BEEN ELIMINATED', {
            fontSize: '48px',
            fontFamily: 'Cinzel',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4,
            fontWeight: 'bold'
        });
        deathText.setOrigin(0.5);
        deathText.setScrollFactor(0);
        
        // 관전 안내
        const spectateText = this.add.text(centerX, centerY + 50, 'Spectating remaining knights...', {
            fontSize: '24px',
            fontFamily: 'Cinzel',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        spectateText.setOrigin(0.5);
        spectateText.setScrollFactor(0);
    }
    
    /**
     * 관전자 모드로 전환합니다
     */
    switchToSpectatorMode() {
        // 살아있는 다른 플레이어들 중 하나를 따라가기
        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive() && !p.isLocal);
        
        if (alivePlayers.length > 0) {
            const targetPlayer = alivePlayers[0];
            this.cameras.main.startFollow(targetPlayer.sprite, true, 0.08, 0.08);
        }
    }
    
    /**
     * 게임 종료를 처리합니다
     * @param {Object} gameOverData - 게임 종료 데이터
     */
    handleGameOver(gameOverData) {
        this.gameEnded = true;
        console.log('🏆 Game Over!', gameOverData);
        
        // 게임 오버 씬으로 전환
        this.time.delayedCall(3000, () => {
            this.scene.start('GameOverScene', gameOverData);
        });
    }
    
    /**
     * 알림 메시지를 표시합니다
     * @param {string} message - 메시지
     * @param {number} color - 색상
     */
    showNotification(message, color) {
        const centerX = GAME_CONFIG.WIDTH / 2;
        
        const notification = this.add.text(centerX, 100, message, {
            fontSize: '24px',
            fontFamily: 'Cinzel',
            fill: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        });
        notification.setOrigin(0.5);
        notification.setScrollFactor(0);
        
        // 페이드 아웃 애니메이션
        this.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {
                notification.destroy();
            }
        });
    }
    
    /**
     * 씬 업데이트 (매 프레임 호출)
     * @param {number} time - 게임 시간
     * @param {number} delta - 프레임 델타
     */
    update(time, delta) {
        if (!this.gameStarted || this.gameEnded) return;
        
        // 모든 플레이어 업데이트
        this.players.forEach(player => {
            player.update(delta / 1000); // 초 단위로 변환
        });
        
        // 정기적으로 세이프존 체크
        if (time % 1000 < 16) { // 대략 1초마다
            this.checkPlayersInSafeZone();
        }
    }
    
    /**
     * 씬 파괴 시 호출
     */
    destroy() {
        // 타이머들 정리
        if (this.safeZoneShrinkTimer) {
            this.safeZoneShrinkTimer.destroy();
        }
        
        // 플레이어들 정리
        this.players.forEach(player => {
            player.destroy();
        });
        this.players.clear();
    }
}

console.log('🎮 Medieval.io Game Scene Loaded');