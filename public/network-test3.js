// Network-based Boxing Physics Client
let boxingSocket = null;
let boxingEngine = null;
let boxingRenderer = null;
let isBoxingConnected = false;
let boxingAnimationId = null;

// DOM elements
const connectBoxingBtn = document.getElementById('connectBoxingBtn');
const resetCharacterBtn = document.getElementById('resetCharacterBtn');
const boxingStatus = document.getElementById('boxingStatus');
const userCount = document.getElementById('userCount');
const energyLevel = document.getElementById('energyLevel');
const fpsDisplay = document.getElementById('fpsDisplay');
const physicsTime = document.getElementById('physicsTime');
const boxingLogContainer = document.getElementById('boxingLogContainer');
const canvas = document.getElementById('boxingCanvas');

// Initialize boxing physics
function initializeBoxing() {
    boxingEngine = new BoxingPhysicsEngine();
    boxingRenderer = new BoxingRenderer(canvas);
    addBoxingLog('Boxing physics engine initialized', 'success');
    addBoxingLog('Use A/D keys to move, arrow keys to attack!', 'info');
}

// Event listeners
connectBoxingBtn.addEventListener('click', toggleBoxingConnection);
resetCharacterBtn.addEventListener('click', resetCharacter);

function toggleBoxingConnection() {
    if (isBoxingConnected) {
        disconnectBoxing();
    } else {
        connectBoxing();
    }
}

function connectBoxing() {
    addBoxingLog('Entering the boxing ring...', 'info');
    
    boxingSocket = io();
    
    boxingSocket.on('connect', () => {
        isBoxingConnected = true;
        updateBoxingStatus(true);
        addBoxingLog('Connected to boxing server!', 'success');
        connectBoxingBtn.innerHTML = `
            <span class="button-text">Leave Boxing Ring</span>
            <span class="button-subtext">복싱 링 나가기</span>
        `;
        enableBoxingControls(true);
        startBoxingLoop();
        
        // Request current boxing state
        boxingSocket.emit('requestBoxingState');
    });
    
    boxingSocket.on('disconnect', () => {
        isBoxingConnected = false;
        updateBoxingStatus(false);
        addBoxingLog('Disconnected from boxing server', 'error');
        connectBoxingBtn.innerHTML = `
            <span class="button-text">Enter Boxing Ring</span>
            <span class="button-subtext">복싱 링 입장</span>
        `;
        enableBoxingControls(false);
        stopBoxingLoop();
    });
    
    boxingSocket.on('userCount', (count) => {
        userCount.textContent = count;
        addBoxingLog(`Boxers in ring: ${count}`, 'info');
    });
    
    boxingSocket.on('boxingState', (state) => {
        if (boxingEngine) {
            boxingEngine.setState(state);
        }
    });
    
    boxingSocket.on('boxingAction', (data) => {
        addBoxingLog(`Boxer ${data.userId} performed ${data.action}`, 'info');
    });
    
    boxingSocket.on('characterReset', () => {
        addBoxingLog('Character reset by server', 'info');
        if (boxingEngine) {
            boxingEngine.reset();
        }
    });
    
    boxingSocket.on('connect_error', (error) => {
        addBoxingLog(`Boxing connection error: ${error.message}`, 'error');
    });
}

function disconnectBoxing() {
    if (boxingSocket) {
        boxingSocket.disconnect();
        boxingSocket = null;
    }
    stopBoxingLoop();
}

function startBoxingLoop() {
    if (boxingAnimationId) {
        cancelAnimationFrame(boxingAnimationId);
    }
    
    function boxingLoop() {
        if (boxingEngine && boxingRenderer && isBoxingConnected) {
            // Update physics locally for smooth rendering
            boxingEngine.update();
            
            // Render current state
            boxingRenderer.render(boxingEngine);
            
            // Update displays
            fpsDisplay.textContent = boxingRenderer.getFPS();
            physicsTime.textContent = boxingEngine.simulationTime.toFixed(1) + 's';
            energyLevel.textContent = Math.round(boxingEngine.energy) + '%';
            
            // Send state to server periodically (every 10 frames for efficiency)
            if (Math.floor(boxingEngine.simulationTime * 60) % 10 === 0) {
                if (boxingSocket) {
                    boxingSocket.emit('boxingUpdate', boxingEngine.getState());
                }
            }
        }
        
        boxingAnimationId = requestAnimationFrame(boxingLoop);
    }
    
    boxingLoop();
}

function stopBoxingLoop() {
    if (boxingAnimationId) {
        cancelAnimationFrame(boxingAnimationId);
        boxingAnimationId = null;
    }
}

function resetCharacter() {
    if (!isBoxingConnected || !boxingSocket) {
        addBoxingLog('Not connected to boxing server', 'error');
        return;
    }
    
    boxingSocket.emit('resetCharacter');
    addBoxingLog('Character reset requested', 'info');
}

// Enhanced key handling for boxing actions
function handleBoxingKeyPress(key) {
    if (!isBoxingConnected || !boxingSocket) {
        return;
    }
    
    let action = null;
    let actionName = '';
    
    switch(key) {
        case 'a':
        case 'A':
            action = 'moveLeft';
            actionName = 'Move Left';
            break;
        case 'd':
        case 'D':
            action = 'moveRight';
            actionName = 'Move Right';
            break;
        case 'ArrowRight':
            action = 'jab';
            actionName = 'Jab';
            break;
        case 'ArrowDown':
            action = 'hook';
            actionName = 'Hook';
            break;
        case 'ArrowUp':
            action = 'uppercut';
            actionName = 'Uppercut';
            break;
        case 'ArrowLeft':
            action = 'overheadHook';
            actionName = 'Overhead Hook';
            break;
    }
    
    if (action) {
        boxingSocket.emit('boxingAction', {
            action: action,
            timestamp: Date.now()
        });
        
        if (action !== 'moveLeft' && action !== 'moveRight') {
            addBoxingLog(`Executed ${actionName}!`, 'success');
        }
    }
}

// Override key listeners to include boxing actions
window.addEventListener('keydown', (e) => {
    if (isBoxingConnected && boxingEngine) {
        handleBoxingKeyPress(e.key);
    }
});

function updateBoxingStatus(connected) {
    if (connected) {
        boxingStatus.textContent = 'Connected';
        boxingStatus.className = 'status-connected';
    } else {
        boxingStatus.textContent = 'Disconnected';
        boxingStatus.className = 'status-disconnected';
        userCount.textContent = '0';
        energyLevel.textContent = '100%';
    }
}

function enableBoxingControls(enabled) {
    resetCharacterBtn.disabled = !enabled;
}

function addBoxingLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    boxingLogContainer.appendChild(logEntry);
    boxingLogContainer.scrollTop = boxingLogContainer.scrollHeight;
    
    // Keep only last 30 log entries
    while (boxingLogContainer.children.length > 30) {
        boxingLogContainer.removeChild(boxingLogContainer.firstChild);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeBoxing();
    addBoxingLog('Medieval Boxing Chamber ready', 'info');
    addBoxingLog('Enter the ring to begin physics-based combat', 'info');
    
    // Add visual focus indicator for controls
    const controlItems = document.querySelectorAll('.control-item');
    controlItems.forEach(item => {
        const key = item.querySelector('.key');
        if (key) {
            item.addEventListener('mouseenter', () => {
                key.style.backgroundColor = '#d4af37';
                key.style.color = '#2c3e50';
            });
            item.addEventListener('mouseleave', () => {
                key.style.backgroundColor = '#8b4513';
                key.style.color = '#f4e4bc';
            });
        }
    });
});