/**
 * Medieval.io Network Manager
 * Socket.IO 기반 멀티플레이어 네트워킹과 클라이언트 예측을 담당합니다.
 */

class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.gameState = null;
        this.scene = null;
        
        // 클라이언트 예측을 위한 상태 관리
        this.localPlayer = null;
        this.predictedStates = [];
        this.lastServerUpdate = 0;
        this.inputSequence = 0;
        this.pendingInputs = [];
        
        // 네트워크 통계
        this.ping = 0;
        this.lastPingTime = 0;
        
        // 이벤트 리스너들
        this.eventListeners = new Map();
        
        console.log('🌐 NetworkManager initialized');
    }
    
    /**
     * 서버에 연결합니다
     * @param {Phaser.Scene} scene - 게임 씬
     */
    connect(scene) {
        this.scene = scene;
        
        try {
            this.socket = io();
            this.setupSocketEventListeners();
            this.updateConnectionStatus(false, 'Connecting...');
            console.log('🔌 Attempting to connect to server...');
        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.updateConnectionStatus(false, 'Connection Failed');
        }
    }
    
    /**
     * Socket.IO 이벤트 리스너들을 설정합니다
     */
    setupSocketEventListeners() {
        // 연결 성공
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.playerId = this.socket.id;
            this.updateConnectionStatus(true, 'Connected');
            console.log('✅ Connected to server with ID:', this.playerId);
            
            // MenuScene에 연결 성공 알림
            this.emit('connected');
            
            // 게임 참가 요청
            this.socket.emit('joinGame', {
                playerName: 'Knight_' + Math.floor(Math.random() * 1000)
            });
        });
        
        // 연결 끊김
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.updateConnectionStatus(false, 'Disconnected');
            console.log('❌ Disconnected from server:', reason);
            this.emit('disconnected', reason);
        });
        
        // 게임 상태 업데이트
        this.socket.on('gameState', (gameState) => {
            this.handleGameStateUpdate(gameState);
        });
        
        // 플레이어 참가
        this.socket.on('playerJoined', (playerData) => {
            console.log('👤 Player joined:', playerData.id);
            this.emit('playerJoined', playerData);
        });
        
        // 플레이어 퇴장
        this.socket.on('playerLeft', (playerId) => {
            console.log('👋 Player left:', playerId);
            this.emit('playerLeft', playerId);
        });
        
        // 플레이어 업데이트 (서버 권한)
        this.socket.on('playerUpdate', (updateData) => {
            this.handlePlayerUpdate(updateData);
        });
        
        // 게임 이벤트들
        this.socket.on('playerAttack', (attackData) => {
            this.emit('playerAttack', attackData);
        });
        
        this.socket.on('playerDeath', (deathData) => {
            this.emit('playerDeath', deathData);
        });
        
        this.socket.on('gameOver', (gameOverData) => {
            this.emit('gameOver', gameOverData);
        });
        
        // 🚀 게임 시작 이벤트
        this.socket.on('gameStartInitiated', (data) => {
            console.log('🎮 Game start initiated:', data);
            this.emit('gameStartInitiated', data);
        });
        
        // 핑 측정
        this.socket.on('pong', (timestamp) => {
            this.ping = Date.now() - timestamp;
            this.lastPingTime = Date.now();
        });
        
        // 정기적으로 핑 전송
        setInterval(() => {
            if (this.isConnected) {
                this.socket.emit('ping', Date.now());
            }
        }, 5000);
    }
    
    /**
     * 게임 시작을 요청합니다
     */
    requestGameStart() {
        if (!this.isConnected || !this.socket) {
            console.warn('⚠️ Cannot request game start: not connected');
            return;
        }
        
        console.log('🚀 Requesting game start...');
        this.socket.emit('requestGameStart', {
            playerId: this.playerId,
            timestamp: Date.now()
        });
    }
    
    /**
     * 게임 상태 업데이트를 처리합니다 (서버 권한)
     * @param {Object} gameState - 서버에서 받은 게임 상태
     */
    handleGameStateUpdate(gameState) {
        this.lastServerUpdate = Date.now();
        this.gameState = gameState;
        
        // 클라이언트 예측 보정
        if (this.localPlayer && gameState.players[this.playerId]) {
            const serverPlayer = gameState.players[this.playerId];
            this.reconcileClientPrediction(serverPlayer);
        }
        
        // 다른 플레이어들 상태 업데이트
        this.emit('gameStateUpdate', gameState);
        
        // UI 업데이트
        this.updatePlayerCount(Object.keys(gameState.players).length);
        this.updateAliveCount(Object.values(gameState.players).filter(p => p.health > 0).length);
    }
    
    /**
     * 플레이어 업데이트를 처리합니다
     * @param {Object} updateData - 플레이어 업데이트 데이터
     */
    handlePlayerUpdate(updateData) {
        // 로컬 플레이어가 아닌 경우에만 처리
        if (updateData.playerId !== this.playerId) {
            this.emit('playerUpdate', updateData);
        }
    }
    
    /**
     * 클라이언트 예측과 서버 상태를 보정합니다
     * @param {Object} serverPlayer - 서버에서 받은 플레이어 상태
     */
    reconcileClientPrediction(serverPlayer) {
        if (!this.localPlayer) return;
        
        // 서버 상태와 클라이언트 예측 상태의 차이 계산
        const deltaX = Math.abs(this.localPlayer.x - serverPlayer.x);
        const deltaY = Math.abs(this.localPlayer.y - serverPlayer.y);
        
        // 차이가 임계값을 초과하면 서버 상태로 보정
        const threshold = 5; // 픽셀
        if (deltaX > threshold || deltaY > threshold) {
            console.log('🔧 Client prediction correction applied');
            this.localPlayer.x = serverPlayer.x;
            this.localPlayer.y = serverPlayer.y;
            
            // 보정 후 예측된 입력들을 다시 적용
            this.reapplyPendingInputs();
        }
        
        // 처리된 입력들을 대기열에서 제거
        this.pendingInputs = this.pendingInputs.filter(input => 
            input.sequence > serverPlayer.lastProcessedInput
        );
    }
    
    /**
     * 보정 후 대기중인 입력들을 다시 적용합니다
     */
    reapplyPendingInputs() {
        for (const input of this.pendingInputs) {
            this.applyInputLocally(input);
        }
    }
    
    /**
     * 플레이어 입력을 전송합니다 (클라이언트 예측 포함)
     * @param {Object} inputData - 입력 데이터
     */
    sendPlayerInput(inputData) {
        if (!this.isConnected || !this.socket) return;
        
        // 입력에 시퀀스 번호 추가
        inputData.sequence = ++this.inputSequence;
        inputData.timestamp = Date.now();
        
        // 서버로 전송
        this.socket.emit('playerInput', inputData);
        
        // 클라이언트 예측 적용
        this.applyInputLocally(inputData);
        
        // 대기열에 추가 (서버 보정용)
        this.pendingInputs.push(inputData);
        
        // 대기열 크기 제한
        if (this.pendingInputs.length > GAME_CONFIG.NETWORK.PREDICTION_BUFFER) {
            this.pendingInputs.shift();
        }
    }
    
    /**
     * 입력을 로컬에서 즉시 적용합니다 (클라이언트 예측)
     * @param {Object} inputData - 입력 데이터
     */
    applyInputLocally(inputData) {
        if (!this.localPlayer) return;
        
        const deltaTime = 1/60; // 60fps 가정
        const speed = GAME_CONFIG.PLAYER.SPEED;
        
        // 이동 입력 처리
        if (inputData.movement) {
            this.localPlayer.x += inputData.movement.x * speed * deltaTime;
            this.localPlayer.y += inputData.movement.y * speed * deltaTime;
        }
    }
    
    /**
     * 공격 명령을 전송합니다
     * @param {Object} attackData - 공격 데이터
     */
    sendAttack(attackData) {
        if (!this.isConnected || !this.socket) return;
        
        this.socket.emit('playerAttack', {
            ...attackData,
            timestamp: Date.now()
        });
    }
    
    /**
     * 로컬 플레이어 참조를 설정합니다
     * @param {Object} player - 로컬 플레이어 객체
     */
    setLocalPlayer(player) {
        this.localPlayer = player;
    }
    
    /**
     * 이벤트 리스너를 등록합니다
     * @param {string} event - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * 이벤트를 발생시킵니다
     * @param {string} event - 이벤트 이름
     * @param {*} data - 이벤트 데이터
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }
    
    /**
     * 연결 상태를 UI에 업데이트합니다
     * @param {boolean} connected - 연결 상태
     * @param {string} statusText - 상태 텍스트
     */
    updateConnectionStatus(connected, statusText) {
        const statusIndicator = document.getElementById('connectionStatus');
        const statusText_ = document.getElementById('connectionText');
        
        if (statusIndicator && statusText_) {
            statusIndicator.className = connected ? 'status-indicator connected' : 'status-indicator';
            statusText_.textContent = statusText;
        }
    }
    
    /**
     * 플레이어 수를 UI에 업데이트합니다
     * @param {number} count - 플레이어 수
     */
    updatePlayerCount(count) {
        const element = document.getElementById('playerCount');
        if (element) {
            element.textContent = count;
        }
    }
    
    /**
     * 생존자 수를 UI에 업데이트합니다
     * @param {number} count - 생존자 수
     */
    updateAliveCount(count) {
        const element = document.getElementById('aliveCount');
        if (element) {
            element.textContent = count;
        }
    }
    
    /**
     * 네트워크 연결을 종료합니다
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.playerId = null;
        this.updateConnectionStatus(false, 'Disconnected');
    }
    
    /**
     * 현재 핑을 반환합니다
     * @returns {number} 핑 (ms)
     */
    getPing() {
        return this.ping;
    }
    
    /**
     * 연결 상태를 반환합니다
     * @returns {boolean} 연결 상태
     */
    isConnectedToServer() {
        return this.isConnected;
    }
}

console.log('🌐 Medieval.io Network Manager Loaded');