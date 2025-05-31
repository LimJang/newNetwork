// Network-based RPG Client
let rpgSocket = null;
let rpgEngine = null;
let rpgRenderer = null;
let isRPGConnected = false;
let rpgAnimationId = null;

// DOM elements
const connectRPGBtn = document.getElementById('connectRPGBtn');
const respawnBtn = document.getElementById('respawnBtn');
const rpgStatus = document.getElementById('rpgStatus');
const userCount = document.getElementById('userCount');
const tickCount = document.getElementById('tickCount');
const fpsDisplay = document.getElementById('fpsDisplay');
const characterName = document.getElementById('characterName');
const characterPos = document.getElementById('characterPos');
const movingStatus = document.getElementById('movingStatus');
const rpgLogContainer = document.getElementById('rpgLogContainer');
const canvas = document.getElementById('rpgCanvas');

// Initialize RPG system
function initializeRPG() {
    rpgEngine = new RPGEngine();
    rpgRenderer = new RPGRenderer(canvas);
    
    // Setup mouse click handling
    canvas.addEventListener('click', handleCanvasClick);
    
    // Setup movement callback
    rpgEngine.setMouseMoveCallback(sendMovementCommand);
    
    addRPGLog('Medieval RPG engine initialized', 'success');
    addRPGLog('Click "Enter Fantasy World" to begin your adventure!', 'info');
}

// Event listeners
connectRPGBtn.addEventListener('click', toggleRPGConnection);
respawnBtn.addEventListener('click', respawnCharacter);

function toggleRPGConnection() {
    if (isRPGConnected) {
        disconnectRPG();
    } else {
        connectRPG();
    }
}

function connectRPG() {
    addRPGLog('Connecting to fantasy world...', 'info');
    
    rpgSocket = io();
    
    rpgSocket.on('connect', () => {
        isRPGConnected = true;
        updateRPGStatus(true);
        addRPGLog('Connected to fantasy world!', 'success');
        connectRPGBtn.innerHTML = `
            <span class="button-text">Leave Fantasy World</span>
            <span class="button-subtext">판타지 세계 나가기</span>
        `;
        enableRPGControls(true);
        startRPGLoop();
        
        // Request to join the world
        rpgSocket.emit('joinWorld');
    });
    
    rpgSocket.on('disconnect', () => {
        isRPGConnected = false;
        updateRPGStatus(false);
        addRPGLog('Disconnected from fantasy world', 'error');
        connectRPGBtn.innerHTML = `
            <span class="button-text">Enter Fantasy World</span>
            <span class="button-subtext">판타지 세계 입장</span>
        `;
        enableRPGControls(false);
        stopRPGLoop();
        rpgEngine.stopTickSystem();
    });
    
    rpgSocket.on('userCount', (count) => {
        userCount.textContent = count;
        addRPGLog(`Players in world: ${count}`, 'info');
    });
    
    rpgSocket.on('worldState', (state) => {
        if (rpgEngine) {
            rpgEngine.setState(state);
        }
    });
    
    rpgSocket.on('characterJoined', (data) => {
        if (rpgEngine) {
            rpgEngine.addCharacter(data.character);
            
            if (data.character.id === rpgSocket.id) {
                rpgEngine.myCharacterId = data.character.id;
                addRPGLog(`Your character ${data.character.name} has entered the world!`, 'success');
            } else {
                addRPGLog(`${data.character.name} has joined the world`, 'info');
            }
        }
    });
    
    rpgSocket.on('characterLeft', (data) => {
        if (rpgEngine) {
            rpgEngine.removeCharacter(data.characterId);
            addRPGLog(`${data.characterName} has left the world`, 'info');
        }
    });
    
    rpgSocket.on('characterMoved', (data) => {
        if (rpgEngine) {
            rpgEngine.updateCharacter(data.character);
        }
    });
    
    rpgSocket.on('serverTick', (tickData) => {
        if (rpgEngine) {
            rpgEngine.currentTick = tickData.tick;
            tickCount.textContent = tickData.tick;
        }
    });
    
    rpgSocket.on('connect_error', (error) => {
        addRPGLog(`World connection error: ${error.message}`, 'error');
    });
}

function disconnectRPG() {
    if (rpgSocket) {
        rpgSocket.disconnect();
        rpgSocket = null;
    }
    stopRPGLoop();
}

function startRPGLoop() {
    if (rpgAnimationId) {
        cancelAnimationFrame(rpgAnimationId);
    }
    
    // Start tick system
    rpgEngine.startTickSystem();
    
    function rpgLoop() {
        if (rpgEngine && rpgRenderer && isRPGConnected) {
            // Render current state
            rpgRenderer.render(rpgEngine);
            
            // Update displays
            fpsDisplay.textContent = rpgRenderer.getFPS();
            
            // Update character info
            const myChar = rpgEngine.getMyCharacter();
            if (myChar) {
                characterPos.textContent = `${myChar.x}, ${myChar.y}`;
                movingStatus.textContent = myChar.isMoving ? 'Moving' : 'Idle';
            }
        }
        
        rpgAnimationId = requestAnimationFrame(rpgLoop);
    }
    
    rpgLoop();
}

function stopRPGLoop() {
    if (rpgAnimationId) {
        cancelAnimationFrame(rpgAnimationId);
        rpgAnimationId = null;
    }
}

function handleCanvasClick(event) {
    if (!isRPGConnected || !rpgEngine) {
        addRPGLog('Not connected to world', 'error');
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const success = rpgEngine.handleMouseClick(event.clientX, event.clientY, rect);
    
    if (!success) {
        addRPGLog('Cannot move to that location', 'error');
    }
}

function sendMovementCommand(targetX, targetY) {
    if (!isRPGConnected || !rpgSocket) {
        addRPGLog('Not connected to world', 'error');
        return;
    }
    
    const myChar = rpgEngine.getMyCharacter();
    if (!myChar) {
        addRPGLog('Character not found', 'error');
        return;
    }
    
    rpgSocket.emit('moveCharacter', {
        fromX: myChar.x,
        fromY: myChar.y,
        toX: targetX,
        toY: targetY
    });
    
    addRPGLog(`Moving to (${targetX}, ${targetY})`, 'info');
}

function respawnCharacter() {
    if (!isRPGConnected || !rpgSocket) {
        addRPGLog('Not connected to world', 'error');
        return;
    }
    
    rpgSocket.emit('respawnCharacter');
    addRPGLog('Respawning character...', 'info');
}

function updateRPGStatus(connected) {
    if (connected) {
        rpgStatus.textContent = 'Connected';
        rpgStatus.className = 'status-connected';
    } else {
        rpgStatus.textContent = 'Disconnected';
        rpgStatus.className = 'status-disconnected';
        userCount.textContent = '0';
        tickCount.textContent = '0';
        characterPos.textContent = '0, 0';
        movingStatus.textContent = 'Idle';
    }
}

function enableRPGControls(enabled) {
    respawnBtn.disabled = !enabled;
}

function addRPGLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    rpgLogContainer.appendChild(logEntry);
    rpgLogContainer.scrollTop = rpgLogContainer.scrollHeight;
    
    // Keep only last 30 log entries
    while (rpgLogContainer.children.length > 30) {
        rpgLogContainer.removeChild(rpgLogContainer.firstChild);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeRPG();
    addRPGLog('Medieval Fantasy World ready', 'info');
    addRPGLog('Enter the world to begin your adventure with other players', 'info');
});