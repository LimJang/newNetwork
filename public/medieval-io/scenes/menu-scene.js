/**
 * Medieval.io Menu Scene
 * 게임 시작 메뉴와 서버 연결을 관리합니다.
 */

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.gameStartRequested = false; // 게임 시작 요청 상태
        this.isDestroyed = false; // 씬 파괴 상태 추적
        this.networkEventCallbacks = []; // 네트워크 이벤트 콜백 참조 저장
    }
    
    /**
     * 씬 생성 시 호출됩니다
     */
    create() {
        console.log('🏰 MenuScene created');
        
        this.isDestroyed = false;
        
        // 배경 설정
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        
        // 스프라이트 생성
        SpriteGenerator.generateSprites(this);
        
        // UI 생성
        this.createMenuUI();
        
        // 네트워크 매니저 초기화
        if (!networkManager) {
            networkManager = new NetworkManager();
        }
        this.setupNetworkEvents();
        
        // 키보드 입력 설정
        this.setupKeyboardInput();
        
        // 자동 연결 시도
        this.attemptConnection();
    }
    
    /**
     * 키보드 입력을 설정합니다
     */
    setupKeyboardInput() {
        // Spacebar 키 등록
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Spacebar 입력 이벤트
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.isDestroyed) {
                this.handleSpacebarPress();
            }
        });
    }
    
    /**
     * 스페이스바 입력을 처리합니다
     */
    handleSpacebarPress() {
        if (this.isDestroyed) return;
        
        if (!networkManager.isConnectedToServer()) {
            this.updateStatus('Not connected to server!', '#ff0000');
            return;
        }
        
        if (this.gameStartRequested) {
            console.log('⚠️ Game start already requested');
            return;
        }
        
        this.gameStartRequested = true;
        console.log('🚀 Game start requested by spacebar!');
        
        // 서버에 게임 시작 요청 전송
        networkManager.requestGameStart();
        
        // UI 업데이트
        this.updateStatus('Starting game...', '#ffff00');
        this.showSpinner(true);
        
        // 3초 후 플래그 리셋 (서버와 동기화)
        this.time.delayedCall(3000, () => {
            this.gameStartRequested = false;
            console.log('🔄 Client game start flag reset');
        });
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
        
        // 게임 시작 안내 (Spacebar)
        this.spacebarText = this.add.text(centerX, centerY + 50, 'Press SPACEBAR to start battle!', {
            fontSize: '24px',
            fontFamily: 'Cinzel',
            fill: '#32cd32',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        });
        this.spacebarText.setOrigin(0.5);
        this.spacebarText.setVisible(false);
        
        // 반짝이는 효과 추가
        this.tweens.add({
            targets: this.spacebarText,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 게임 시작 버튼 (백업용 - 클릭으로도 시작 가능)
        this.startButton = this.add.text(centerX, centerY + 100, 'or click here', {
            fontSize: '16px',
            fontFamily: 'Cinzel',
            fill: '#90ee90',
            stroke: '#000000',
            strokeThickness: 1
        });
        this.startButton.setOrigin(0.5);
        this.startButton.setVisible(false);
        this.startButton.setInteractive({ useHandCursor: true });
        this.startButton.on('pointerdown', () => {
            if (!this.isDestroyed) {
                this.handleSpacebarPress();
            }
        });
        this.startButton.on('pointerover', () => {
            if (!this.isDestroyed) {
                this.startButton.setFill('#ffffff');
                this.startButton.setScale(1.1);
            }
        });
        this.startButton.on('pointerout', () => {
            if (!this.isDestroyed) {
                this.startButton.setFill('#90ee90');
                this.startButton.setScale(1.0);
            }
        });
        
        // 재연결 버튼 (연결 실패시 표시)
        this.reconnectButton = this.add.text(centerX, centerY + 150, 'RECONNECT', {
            fontSize: '20px',
            fontFamily: 'Cinzel',
            fill: '#ff6347',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.reconnectButton.setOrigin(0.5);
        this.reconnectButton.setVisible(false);
        this.reconnectButton.setInteractive({ useHandCursor: true });
        this.reconnectButton.on('pointerdown', () => {
            if (!this.isDestroyed) {
                this.attemptConnection();
            }
        });
        this.reconnectButton.on('pointerover', () => {
            if (!this.isDestroyed) {
                this.reconnectButton.setFill('#ff7f7f');
                this.reconnectButton.setScale(1.1);
            }
        });
        this.reconnectButton.on('pointerout', () => {
            if (!this.isDestroyed) {
                this.reconnectButton.setFill('#ff6347');
                this.reconnectButton.setScale(1.0);
            }
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
            this.add.text(centerX, centerY + 220 + (index * 25), instruction, {
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
        // 콜백 함수들 정의 (참조 저장을 위해)
        const connectedCallback = () => {
            if (!this.isDestroyed) this.onConnectionSuccess();
        };
        
        const disconnectedCallback = (reason) => {
            if (!this.isDestroyed) this.onConnectionFailed(reason);
        };
        
        const gameStateUpdateCallback = (gameState) => {
            if (!this.isDestroyed) this.updatePlayerCount(Object.keys(gameState.players).length);
        };
        
        const gameStartInitiatedCallback = (data) => {
            if (!this.isDestroyed) this.onGameStartInitiated(data);
        };
        
        const gameStartedCallback = (data) => {
            if (!this.isDestroyed) this.onGameStarted(data);
        };
        
        const gameStartAlreadyRequestedCallback = (data) => {
            if (!this.isDestroyed) {
                console.log('⚠️ Server says:', data.message);
                this.updateStatus('Game start already in progress', '#ffaa00');
            }
        };
        
        // 이벤트 리스너 등록
        networkManager.on('connected', connectedCallback);
        networkManager.on('disconnected', disconnectedCallback);
        networkManager.on('gameStateUpdate', gameStateUpdateCallback);
        networkManager.on('gameStartInitiated', gameStartInitiatedCallback);
        networkManager.on('gameStarted', gameStartedCallback);
        networkManager.on('gameStartAlreadyRequested', gameStartAlreadyRequestedCallback);
        
        // 콜백 참조 저장 (cleanup을 위해)
        this.networkEventCallbacks = [
            { event: 'connected', callback: connectedCallback },
            { event: 'disconnected', callback: disconnectedCallback },
            { event: 'gameStateUpdate', callback: gameStateUpdateCallback },
            { event: 'gameStartInitiated', callback: gameStartInitiatedCallback },
            { event: 'gameStarted', callback: gameStartedCallback },
            { event: 'gameStartAlreadyRequested', callback: gameStartAlreadyRequestedCallback }
        ];
    }
    
    /**
     * 서버 연결을 시도합니다
     */
    attemptConnection() {
        if (this.isDestroyed) return;
        
        console.log(`🔌 Connection attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts}`);
        
        this.connectionAttempts++;
        this.updateStatus('Connecting to server...', '#ffff00');
        this.showSpinner(true);
        this.reconnectButton.setVisible(false);
        
        // 네트워크 매니저로 연결 시도
        networkManager.connect(this);
        
        // 연결 시간 초과 처리
        this.connectionTimeout = this.time.delayedCall(5000, () => {
            if (!this.isDestroyed && !networkManager.isConnectedToServer()) {
                this.onConnectionFailed('Timeout');
            }
        });
    }
    
    /**
     * 연결 성공 처리
     */
    onConnectionSuccess() {
        if (this.isDestroyed) return;
        
        console.log('✅ Connected to server successfully');
        
        if (this.connectionTimeout) {
            this.connectionTimeout.destroy();
        }
        
        this.connectionAttempts = 0;
        this.updateStatus('Connected! Press SPACEBAR to start', '#32cd32');
        this.showSpinner(false);
        
        // Spacebar 안내 표시
        this.spacebarText.setVisible(true);
        this.startButton.setVisible(true);
        
        // 환영 효과
        this.cameras.main.flash(500, 0, 255, 0, false);
    }
    
    /**
     * 연결 실패 처리
     * @param {string} reason - 실패 사유
     */
    onConnectionFailed(reason) {
        if (this.isDestroyed) return;
        
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
            this.time.delayedCall(2000, () => {
                if (!this.isDestroyed) {
                    this.attemptConnection();
                }
            });
        }
    }
    
    /**
     * 게임 시작 개시를 처리합니다
     * @param {Object} data - 게임 시작 데이터
     */
    onGameStartInitiated(data) {
        if (this.isDestroyed) return;
        
        console.log('🎮 Game start initiated by server!', data);
        
        this.updateStatus(`Game starting... (${data.countdown}s)`, '#ffd700');
        
        // 카운트다운이 3일 때만 카운트다운 시작 (중복 방지)
        if (data.countdown === 3) {
            this.startCountdown(data.countdown);
        }
    }
    
    /**
     * 게임 시작 완료를 처리합니다
     * @param {Object} data - 게임 시작 완료 데이터
     */
    onGameStarted(data) {
        if (this.isDestroyed) return;
        
        console.log('🎮 Game started by server!', data);
        this.startGame();
    }
    
    /**
     * 카운트다운을 시작합니다
     * @param {number} seconds - 카운트다운 초
     */
    startCountdown(seconds) {
        if (this.isDestroyed) return;
        
        let remaining = seconds;
        
        const countdownText = this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 100, remaining.toString(), {
            fontSize: '128px',
            fontFamily: 'Cinzel',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 6,
            fontWeight: 'bold'
        });
        countdownText.setOrigin(0.5);
        
        const countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isDestroyed) return;
                
                remaining--;
                if (remaining > 0) {
                    countdownText.setText(remaining.toString());
                    
                    // 카운트다운 효과
                    this.tweens.add({
                        targets: countdownText,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        duration: 200,
                        yoyo: true
                    });
                } else {
                    countdownText.setText('FIGHT!');
                    countdownText.setFill('#ff0000');
                }
            },
            callbackScope: this,
            repeat: seconds - 1 // seconds-1만큼 반복 (0에서 멈춤)
        });
    }
    
    /**
     * 상태 텍스트를 업데이트합니다
     * @param {string} text - 상태 텍스트
     * @param {string} color - 텍스트 색상
     */
    updateStatus(text, color) {
        if (this.isDestroyed || !this.statusText || !this.statusText.active) return;
        
        try {
            this.statusText.setText(text);
            this.statusText.setFill(color);
        } catch (error) {
            console.warn('Status text update failed:', error);
        }
    }
    
    /**
     * 스피너 표시/숨김을 제어합니다
     * @param {boolean} show - 표시 여부
     */
    showSpinner(show) {
        if (this.isDestroyed || !this.spinner) return;
        
        try {
            this.spinner.setVisible(show);
            if (show && this.spinnerTween) {
                this.spinnerTween.resume();
            } else if (this.spinnerTween) {
                this.spinnerTween.pause();
            }
        } catch (error) {
            console.warn('Spinner update failed:', error);
        }
    }
    
    /**
     * 플레이어 수를 업데이트합니다
     * @param {number} count - 플레이어 수
     */
    updatePlayerCount(count) {
        if (this.isDestroyed) return;
        
        if (count > 1) {
            this.updateStatus(`${count} knights ready! Press SPACEBAR to start`, '#32cd32');
        }
    }
    
    /**
     * 게임을 시작합니다
     */
    startGame() {
        if (this.isDestroyed) return;
        
        console.log('🎮 Starting Medieval.io Battle!');
        
        // 씬 파괴 플래그 설정
        this.isDestroyed = true;
        
        // 네트워크 이벤트 리스너 정리
        this.cleanupNetworkEvents();
        
        // 게임 씬으로 전환
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene');
        });
    }
    
    /**
     * 네트워크 이벤트 리스너들을 정리합니다
     */
    cleanupNetworkEvents() {
        // 등록된 네트워크 이벤트 콜백들 제거
        for (const { event, callback } of this.networkEventCallbacks) {
            if (networkManager && networkManager.eventListeners && networkManager.eventListeners.has(event)) {
                const listeners = networkManager.eventListeners.get(event);
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        }
        this.networkEventCallbacks = [];
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
        console.log('🗑️ MenuScene destroyed');
        
        this.isDestroyed = true;
        
        // 네트워크 이벤트 정리
        this.cleanupNetworkEvents();
        
        // 타이머 정리
        if (this.connectionTimeout) {
            this.connectionTimeout.destroy();
        }
        if (this.spinnerTween) {
            this.spinnerTween.destroy();
        }
    }
}

console.log('🏰 Medieval.io Menu Scene Loaded');
