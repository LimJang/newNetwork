/**
 * Medieval.io Menu Scene
 * 게임 시작 메뉴와 서버 연결을 관리합니다.
 */

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
    }
    
    /**
     * 씬 생성 시 호출됩니다
     */
    create() {
        console.log('🏰 MenuScene created');
        
        // 배경 설정
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        
        // 스프라이트 생성
        SpriteGenerator.generateSprites(this);
        
        // UI 생성
        this.createMenuUI();
        
        // 네트워크 매니저 초기화
        if (!networkManager) {
            networkManager = new NetworkManager();
            this.setupNetworkEvents();
        }
        
        // 자동 연결 시도
        this.attemptConnection();
    }
    
    /**
     * 메뉴 UI를 생성합니다
     */
    createMenuUI() {
        const centerX = GAME_CONFIG.WIDTH / 2;
        const centerY = GAME_CONFIG.HEIGHT / 2;
        
        // 제목
        this.titleText = this.add.text(centerX, centerY - 200, 'MEDIEVAL.IO', {
            fontSize: '64px',
            fontFamily: 'Cinzel',
            fill: '#d4af37',
            stroke: '#8b4513',
            strokeThickness: 4,
            fontWeight: 'bold'
        });
        this.titleText.setOrigin(0.5);
        
        // 부제목
        this.subtitleText = this.add.text(centerX, centerY - 140, 'Battle Royale', {
            fontSize: '24px',
            fontFamily: 'Cinzel',
            fill: '#b8860b',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.subtitleText.setOrigin(0.5);
        
        // 연결 상태 표시
        this.statusText = this.add.text(centerX, centerY - 50, 'Initializing...', {
            fontSize: '18px',
            fontFamily: 'Cinzel',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.statusText.setOrigin(0.5);
        
        // 로딩 스피너
        this.createLoadingSpinner(centerX, centerY);
        
        // 게임 시작 버튼 (연결 후 표시)
        this.startButton = this.add.text(centerX, centerY + 50, 'START BATTLE', {
            fontSize: '32px',
            fontFamily: 'Cinzel',
            fill: '#32cd32',
            stroke: '#000000',
            strokeThickness: 3,
            fontWeight: 'bold'
        });
        this.startButton.setOrigin(0.5);
        this.startButton.setVisible(false);
        this.startButton.setInteractive({ useHandCursor: true });
        this.startButton.on('pointerdown', () => this.startGame());
        this.startButton.on('pointerover', () => {
            this.startButton.setFill('#90ee90');
            this.startButton.setScale(1.1);
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setFill('#32cd32');
            this.startButton.setScale(1.0);
        });
        
        // 재연결 버튼 (연결 실패시 표시)
        this.reconnectButton = this.add.text(centerX, centerY + 120, 'RECONNECT', {
            fontSize: '20px',
            fontFamily: 'Cinzel',
            fill: '#ff6347',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.reconnectButton.setOrigin(0.5);
        this.reconnectButton.setVisible(false);
        this.reconnectButton.setInteractive({ useHandCursor: true });
        this.reconnectButton.on('pointerdown', () => this.attemptConnection());
        this.reconnectButton.on('pointerover', () => {
            this.reconnectButton.setFill('#ff7f7f');
            this.reconnectButton.setScale(1.1);
        });
        this.reconnectButton.on('pointerout', () => {
            this.reconnectButton.setFill('#ff6347');
            this.reconnectButton.setScale(1.0);
        });
        
        // 설명 텍스트
        const instructions = [
            'WASD - Move your knight',
            'Mouse - Aim and attack',
            'Space - Special ability',
            '',
            'Last knight standing wins!'
        ];
        
        instructions.forEach((instruction, index) => {
            this.add.text(centerX, centerY + 200 + (index * 25), instruction, {
                fontSize: '16px',
                fontFamily: 'Cinzel',
                fill: '#b8860b',
                stroke: '#000000',
                strokeThickness: 1,
                align: 'center'
            }).setOrigin(0.5);
        });
        
        // 장식용 기사 스프라이트들
        this.createDecorativeKnights();
    }
    
    /**
     * 로딩 스피너를 생성합니다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     */
    createLoadingSpinner(x, y) {
        this.spinner = this.add.graphics();
        this.spinner.lineStyle(4, 0xd4af37, 1);
        this.spinner.arc(x, y, 20, 0, Math.PI * 1.5);
        
        // 회전 애니메이션
        this.spinnerTween = this.tweens.add({
            targets: this.spinner,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });
    }
    
    /**
     * 장식용 기사들을 생성합니다
     */
    createDecorativeKnights() {
        // 왼쪽 기사
        const leftKnight = this.add.sprite(150, GAME_CONFIG.HEIGHT / 2, 'knight_blue');
        leftKnight.setScale(2);
        leftKnight.anims.play('knight_blue_idle', true);
        
        // 오른쪽 기사
        const rightKnight = this.add.sprite(GAME_CONFIG.WIDTH - 150, GAME_CONFIG.HEIGHT / 2, 'knight_red');
        rightKnight.setScale(2);
        rightKnight.setFlipX(true);
        rightKnight.anims.play('knight_red_idle', true);
        
        // 부드러운 흔들림 애니메이션
        this.tweens.add({
            targets: [leftKnight, rightKnight],
            y: (GAME_CONFIG.HEIGHT / 2) - 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    /**
     * 네트워크 이벤트를 설정합니다
     */
    setupNetworkEvents() {
        // 연결 성공
        networkManager.on('connected', () => {
            this.onConnectionSuccess();
        });
        
        // 연결 실패
        networkManager.on('disconnected', (reason) => {
            this.onConnectionFailed(reason);
        });
        
        // 게임 상태 업데이트
        networkManager.on('gameStateUpdate', (gameState) => {
            this.updatePlayerCount(Object.keys(gameState.players).length);
        });
    }
    
    /**
     * 서버 연결을 시도합니다
     */
    attemptConnection() {
        console.log(`🔌 Connection attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts}`);
        
        this.connectionAttempts++;
        this.updateStatus('Connecting to server...', '#ffff00');
        this.showSpinner(true);
        this.reconnectButton.setVisible(false);
        
        // 네트워크 매니저로 연결 시도
        networkManager.connect(this);
        
        // 연결 시간 초과 처리
        this.connectionTimeout = this.time.delayedCall(5000, () => {
            if (!networkManager.isConnectedToServer()) {
                this.onConnectionFailed('Timeout');
            }
        });
    }
    
    /**
     * 연결 성공 처리
     */
    onConnectionSuccess() {
        console.log('✅ Connected to server successfully');
        
        if (this.connectionTimeout) {
            this.connectionTimeout.destroy();
        }
        
        this.connectionAttempts = 0;
        this.updateStatus('Connected! Ready to battle', '#32cd32');
        this.showSpinner(false);
        this.startButton.setVisible(true);
        
        // 환영 효과
        this.cameras.main.flash(500, 0, 255, 0, false);
    }
    
    /**
     * 연결 실패 처리
     * @param {string} reason - 실패 사유
     */
    onConnectionFailed(reason) {
        console.log('❌ Connection failed:', reason);
        
        if (this.connectionTimeout) {
            this.connectionTimeout.destroy();
        }
        
        this.showSpinner(false);
        
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            this.updateStatus('Connection failed. Check your internet.', '#ff0000');
            this.reconnectButton.setVisible(true);
            this.connectionAttempts = 0;
        } else {
            this.updateStatus(`Retrying... (${this.connectionAttempts}/${this.maxConnectionAttempts})`, '#ff6347');
            this.time.delayedCall(2000, () => this.attemptConnection());
        }
    }
    
    /**
     * 상태 텍스트를 업데이트합니다
     * @param {string} text - 상태 텍스트
     * @param {string} color - 텍스트 색상
     */
    updateStatus(text, color) {
        this.statusText.setText(text);
        this.statusText.setFill(color);
    }
    
    /**
     * 스피너 표시/숨김을 제어합니다
     * @param {boolean} show - 표시 여부
     */
    showSpinner(show) {
        this.spinner.setVisible(show);
        if (show) {
            this.spinnerTween.resume();
        } else {
            this.spinnerTween.pause();
        }
    }
    
    /**
     * 플레이어 수를 업데이트합니다
     * @param {number} count - 플레이어 수
     */
    updatePlayerCount(count) {
        if (count > 1) {
            this.updateStatus(`${count} knights ready to battle!`, '#32cd32');
        }
    }
    
    /**
     * 게임을 시작합니다
     */
    startGame() {
        if (!networkManager.isConnectedToServer()) {
            this.updateStatus('Not connected to server!', '#ff0000');
            return;
        }
        
        console.log('🎮 Starting Medieval.io Battle!');
        
        // 게임 씬으로 전환
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }
    
    /**
     * 씬 업데이트 (매 프레임 호출)
     * @param {number} time - 게임 시간
     * @param {number} delta - 프레임 델타
     */
    update(time, delta) {
        // 메뉴 씬에서는 특별한 업데이트 로직 없음
    }
    
    /**
     * 씬 파괴 시 호출
     */
    destroy() {
        if (this.connectionTimeout) {
            this.connectionTimeout.destroy();
        }
        if (this.spinnerTween) {
            this.spinnerTween.destroy();
        }
    }
}

console.log('🏰 Medieval.io Menu Scene Loaded');