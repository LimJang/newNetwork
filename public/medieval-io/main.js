/**
 * Medieval.io Main Entry Point
 * Phaser 게임을 초기화하고 시작합니다.
 */

// 전역 변수들
let game = null;
let networkManager = null;

/**
 * 게임 초기화 및 시작
 */
function initializeGame() {
    console.log('🚀 Initializing Medieval.io...');
    
    try {
        // Phaser 게임 인스턴스 생성
        game = new Phaser.Game(phaserConfig);
        
        // 게임 이벤트 리스너 설정
        setupGameEvents();
        
        console.log('✅ Medieval.io initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize Medieval.io:', error);
        showErrorMessage('Failed to initialize game. Please refresh the page.');
    }
}

/**
 * 게임 이벤트들을 설정합니다
 */
function setupGameEvents() {
    // 게임 준비 완료
    game.events.on('ready', () => {
        console.log('🎮 Game ready');
        updateGameStatus('Game Ready');
    });
    
    // 게임 포커스 이벤트
    game.events.on('focus', () => {
        console.log('👁️ Game focused');
        if (networkManager && networkManager.isConnectedToServer()) {
            // 게임에 포커스가 돌아왔을 때 재연결 시도
            console.log('🔄 Attempting to reconnect...');
        }
    });
    
    // 게임 블러 이벤트
    game.events.on('blur', () => {
        console.log('😴 Game blurred');
        // 게임이 백그라운드로 갈 때 처리할 로직
    });
    
    // 에러 처리
    game.events.on('error', (error) => {
        console.error('🚨 Game error:', error);
        showErrorMessage('A game error occurred. Please refresh the page.');
    });
}

/**
 * 게임 상태를 UI에 업데이트합니다
 * @param {string} status - 상태 메시지
 */
function updateGameStatus(status) {
    console.log(`📊 Game Status: ${status}`);
    // 추가적인 상태 표시 로직이 필요하면 여기에 구현
}

/**
 * 에러 메시지를 표시합니다
 * @param {string} message - 에러 메시지
 */
function showErrorMessage(message) {
    console.error('❌', message);
    
    // 간단한 에러 알림 표시
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: 'Cinzel', serif;
        font-size: 18px;
        text-align: center;
        z-index: 10000;
        border: 3px solid #8b4513;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    `;
    errorDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #ffd700;">⚠️ Error</h3>
        <p style="margin: 0 0 15px 0;">${message}</p>
        <button onclick="this.parentElement.remove(); location.reload();" 
                style="background: #8b4513; color: white; border: none; padding: 10px 20px; 
                       border-radius: 5px; cursor: pointer; font-family: 'Cinzel', serif;">
            Reload Page
        </button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // 10초 후 자동 제거
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

/**
 * 게임을 안전하게 종료합니다
 */
function shutdownGame() {
    console.log('🛑 Shutting down Medieval.io...');
    
    try {
        // 네트워크 연결 해제
        if (networkManager) {
            networkManager.disconnect();
            networkManager = null;
        }
        
        // Phaser 게임 인스턴스 정리
        if (game) {
            game.destroy(true);
            game = null;
        }
        
        console.log('✅ Game shutdown complete');
        
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
    }
}

/**
 * 페이지 언로드 시 게임 정리
 */
window.addEventListener('beforeunload', () => {
    shutdownGame();
});

/**
 * 페이지 가시성 변경 처리
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Page hidden');
        // 페이지가 숨겨졌을 때 처리
        if (game && game.scene) {
            game.scene.pause();
        }
    } else {
        console.log('📱 Page visible');
        // 페이지가 다시 보일 때 처리
        if (game && game.scene) {
            game.scene.resume();
        }
    }
});

/**
 * 키보드 단축키 설정
 */
document.addEventListener('keydown', (event) => {
    // F11으로 전체화면 토글
    if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
    }
    
    // F5나 Ctrl+R로 새로고침 시 게임 정리
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        shutdownGame();
    }
});

/**
 * 전체화면 모드를 토글합니다
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('❌ Fullscreen request failed:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

/**
 * 게임 성능 모니터링
 */
function setupPerformanceMonitoring() {
    // FPS 모니터링
    let frameCount = 0;
    let lastTime = performance.now();
    
    function monitorFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) { // 1초마다
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            
            // 낮은 FPS 경고
            if (fps < 30) {
                console.warn(`⚠️ Low FPS detected: ${fps}`);
            }
            
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(monitorFPS);
    }
    
    monitorFPS();
}

/**
 * 브라우저 호환성 검사
 */
function checkBrowserCompatibility() {
    const requiredFeatures = {
        'WebGL': !!window.WebGLRenderingContext,
        'WebSocket': !!window.WebSocket,
        'Canvas': !!document.createElement('canvas').getContext,
        'AudioContext': !!(window.AudioContext || window.webkitAudioContext)
    };
    
    const missingFeatures = Object.entries(requiredFeatures)
        .filter(([feature, supported]) => !supported)
        .map(([feature]) => feature);
    
    if (missingFeatures.length > 0) {
        const message = `Your browser doesn't support required features: ${missingFeatures.join(', ')}. Please update your browser.`;
        showErrorMessage(message);
        return false;
    }
    
    return true;
}

/**
 * 모바일 기기 감지 및 최적화
 */
function optimizeForMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('📱 Mobile device detected, applying optimizations...');
        
        // 모바일 최적화 설정
        if (phaserConfig.scale) {
            phaserConfig.scale.mode = Phaser.Scale.FIT;
            phaserConfig.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
        }
        
        // 터치 컨트롤 활성화 안내
        console.log('👆 Touch controls will be available');
    }
    
    return isMobile;
}

/**
 * DOM이 로드되면 게임 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏰 Medieval.io Starting...');
    
    // 브라우저 호환성 검사
    if (!checkBrowserCompatibility()) {
        return;
    }
    
    // 모바일 최적화
    optimizeForMobile();
    
    // 성능 모니터링 시작
    setupPerformanceMonitoring();
    
    // 약간의 지연 후 게임 초기화 (DOM 완전 로드 대기)
    setTimeout(() => {
        initializeGame();
    }, 100);
});

/**
 * 디버그 정보 출력
 */
function printDebugInfo() {
    console.log('🔧 Medieval.io Debug Info:');
    console.log('- Phaser Version:', Phaser.VERSION);
    console.log('- Game Instance:', !!game);
    console.log('- Network Manager:', !!networkManager);
    console.log('- Connected:', networkManager ? networkManager.isConnectedToServer() : false);
    console.log('- Current Scene:', game ? game.scene.getScenes(true).map(s => s.scene.key) : 'None');
}

// 전역 디버그 함수로 등록
window.debugMedievalIO = printDebugInfo;

console.log('🚀 Medieval.io Main Script Loaded');
console.log('💡 Type "debugMedievalIO()" in console for debug info');