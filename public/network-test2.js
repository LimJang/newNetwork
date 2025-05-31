// Network-based Physics Test Client
let physicsSocket = null;
let physicsEngine = null;
let renderer = null;
let isPhysicsConnected = false;
let animationId = null;

// DOM elements
const connectPhysicsBtn = document.getElementById('connectPhysicsBtn');
const resetSimBtn = document.getElementById('resetSimBtn');
const physicsStatus = document.getElementById('physicsStatus');
const userCount = document.getElementById('userCount');
const syncStatus = document.getElementById('syncStatus');
const fpsDisplay = document.getElementById('fpsDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const physicsLogContainer = document.getElementById('physicsLogContainer');
const canvas = document.getElementById('physicsCanvas');
const ballSelect = document.getElementById('ballSelect');

// Force buttons
const forceLeftBtn = document.getElementById('forceLeftBtn');
const forceUpBtn = document.getElementById('forceUpBtn');
const forceRightBtn = document.getElementById('forceRightBtn');
const forceDownBtn = document.getElementById('forceDownBtn');

// Initialize physics engine and renderer
function initializePhysics() {
    physicsEngine = new PhysicsEngine();
    renderer = new PhysicsRenderer(canvas);
    addPhysicsLog('Physics engine initialized', 'success');
}

// Event listeners
connectPhysicsBtn.addEventListener('click', togglePhysicsConnection);
resetSimBtn.addEventListener('click', resetSimulation);

// Force button listeners
forceLeftBtn.addEventListener('click', () => applyUserForce(-15, 0));
forceUpBtn.addEventListener('click', () => applyUserForce(0, -20));
forceRightBtn.addEventListener('click', () => applyUserForce(15, 0));
forceDownBtn.addEventListener('click', () => applyUserForce(0, 15));

function togglePhysicsConnection() {
    if (isPhysicsConnected) {
        disconnectPhysics();
    } else {
        connectPhysics();
    }
}

function connectPhysics() {
    addPhysicsLog('Attempting to connect to physics server...', 'info');
    
    physicsSocket = io();
    
    physicsSocket.on('connect', () => {
        isPhysicsConnected = true;
        updatePhysicsStatus(true);
        addPhysicsLog('Connected to physics server!', 'success');
        connectPhysicsBtn.innerHTML = `
            <span class="button-text">Disconnect Physics</span>
            <span class="button-subtext">물리 연결 해제</span>
        `;
        enablePhysicsControls(true);
        startPhysicsLoop();
        
        // Request current physics state
        physicsSocket.emit('requestPhysicsState');
    });
    
    physicsSocket.on('disconnect', () => {
        isPhysicsConnected = false;
        updatePhysicsStatus(false);
        addPhysicsLog('Disconnected from physics server', 'error');
        connectPhysicsBtn.innerHTML = `
            <span class="button-text">Connect to Physics Server</span>
            <span class="button-subtext">물리 서버 연결</span>
        `;
        enablePhysicsControls(false);
        stopPhysicsLoop();
    });
    
    physicsSocket.on('userCount', (count) => {
        userCount.textContent = count;
        addPhysicsLog(`Physics users online: ${count}`, 'info');
    });
    
    physicsSocket.on('physicsState', (state) => {
        if (physicsEngine) {
            physicsEngine.setState(state);
            syncStatus.textContent = 'Synchronized';
            syncStatus.className = 'status-connected';
        }
    });
    
    physicsSocket.on('forceApplied', (data) => {
        addPhysicsLog(`User ${data.userId} applied force to ball ${data.ballId + 1}`, 'info');
        if (physicsEngine) {
            physicsEngine.applyForce(data.ballId, data.forceX, data.forceY);
        }
    });
    
    physicsSocket.on('simulationReset', () => {
        addPhysicsLog('Simulation reset by server', 'info');
        if (physicsEngine) {
            physicsEngine.reset();
        }
    });
    
    physicsSocket.on('connect_error', (error) => {
        addPhysicsLog(`Physics connection error: ${error.message}`, 'error');
    });
}

function disconnectPhysics() {
    if (physicsSocket) {
        physicsSocket.disconnect();
        physicsSocket = null;
    }
    stopPhysicsLoop();
}

function startPhysicsLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    function physicsLoop() {
        if (physicsEngine && renderer && isPhysicsConnected) {
            // Update physics locally for smooth rendering
            physicsEngine.update();
            
            // Render current state
            renderer.render(physicsEngine);
            
            // Update displays
            fpsDisplay.textContent = renderer.getFPS();
            timeDisplay.textContent = physicsEngine.simulationTime.toFixed(1) + 's';
            
            // Send state to server periodically (every 10 frames for efficiency)
            if (physicsEngine.simulationTime % (1/6) < (1/60)) {
                if (physicsSocket) {
                    physicsSocket.emit('physicsUpdate', physicsEngine.getState());
                }
            }
        }
        
        animationId = requestAnimationFrame(physicsLoop);
    }
    
    physicsLoop();
}

function stopPhysicsLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function resetSimulation() {
    if (!isPhysicsConnected || !physicsSocket) {
        addPhysicsLog('Not connected to physics server', 'error');
        return;
    }
    
    physicsSocket.emit('resetSimulation');
    addPhysicsLog('Reset simulation requested', 'info');
}

function applyUserForce(forceX, forceY) {
    if (!isPhysicsConnected || !physicsSocket) {
        addPhysicsLog('Not connected to physics server', 'error');
        return;
    }
    
    const selectedBall = parseInt(ballSelect.value);
    
    physicsSocket.emit('applyForce', {
        ballId: selectedBall,
        forceX: forceX,
        forceY: forceY
    });
    
    const direction = forceX < 0 ? 'left' : forceX > 0 ? 'right' : forceY < 0 ? 'up' : 'down';
    addPhysicsLog(`Applied ${direction} force to ball ${selectedBall + 1}`, 'success');
}

function updatePhysicsStatus(connected) {
    if (connected) {
        physicsStatus.textContent = 'Connected';
        physicsStatus.className = 'status-connected';
        syncStatus.textContent = 'Synchronizing...';
        syncStatus.className = 'status-info';
    } else {
        physicsStatus.textContent = 'Disconnected';
        physicsStatus.className = 'status-disconnected';
        syncStatus.textContent = 'Not Synced';
        syncStatus.className = 'status-disconnected';
        userCount.textContent = '0';
    }
}

function enablePhysicsControls(enabled) {
    resetSimBtn.disabled = !enabled;
    ballSelect.disabled = !enabled;
    forceLeftBtn.disabled = !enabled;
    forceUpBtn.disabled = !enabled;
    forceRightBtn.disabled = !enabled;
    forceDownBtn.disabled = !enabled;
}

function addPhysicsLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    physicsLogContainer.appendChild(logEntry);
    physicsLogContainer.scrollTop = physicsLogContainer.scrollHeight;
    
    // Keep only last 30 log entries
    while (physicsLogContainer.children.length > 30) {
        physicsLogContainer.removeChild(physicsLogContainer.firstChild);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializePhysics();
    addPhysicsLog('Physics testing interface ready', 'info');
    addPhysicsLog('Connect to server to begin physics synchronization test', 'info');
});