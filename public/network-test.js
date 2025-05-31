let socket = null;
let isConnected = false;

// DOM elements
const connectBtn = document.getElementById('connectBtn');
const pingBtn = document.getElementById('pingBtn');
const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('messageInput');
const connectionStatus = document.getElementById('connectionStatus');
const userCount = document.getElementById('userCount');
const logContainer = document.getElementById('logContainer');

// Event listeners
connectBtn.addEventListener('click', toggleConnection);
pingBtn.addEventListener('click', sendPing);
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function toggleConnection() {
    if (isConnected) {
        disconnect();
    } else {
        connect();
    }
}

function connect() {
    addLog('Attempting to connect to server...', 'info');
    
    socket = io();
    
    socket.on('connect', () => {
        isConnected = true;
        updateConnectionStatus(true);
        addLog('Successfully connected to server!', 'success');
        connectBtn.innerHTML = `
            <span class="button-text">Disconnect</span>
            <span class="button-subtext">연결 해제</span>
        `;
        enableControls(true);
    });
    
    socket.on('disconnect', () => {
        isConnected = false;
        updateConnectionStatus(false);
        addLog('Disconnected from server', 'error');
        connectBtn.innerHTML = `
            <span class="button-text">Connect to Server</span>
            <span class="button-subtext">서버 연결</span>
        `;
        enableControls(false);
    });
    
    socket.on('userCount', (count) => {
        userCount.textContent = count;
        addLog(`Current users online: ${count}`, 'info');
    });
    
    socket.on('pong', (data) => {
        const latency = Date.now() - data.timestamp;
        addLog(`Ping response received - Latency: ${latency}ms`, 'success');
    });
    
    socket.on('message', (data) => {
        addLog(`Message from ${data.senderId}: ${data.message}`, 'info');
    });
    
    socket.on('connect_error', (error) => {
        addLog(`Connection error: ${error.message}`, 'error');
    });
}

function disconnect() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

function sendPing() {
    if (!isConnected || !socket) {
        addLog('Not connected to server', 'error');
        return;
    }
    
    const pingData = {
        timestamp: Date.now(),
        message: 'ping test'
    };
    
    socket.emit('ping', pingData);
    addLog('Ping sent to server...', 'info');
}

function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) {
        addLog('Please enter a message', 'error');
        return;
    }
    
    if (!isConnected || !socket) {
        addLog('Not connected to server', 'error');
        return;
    }
    
    socket.emit('broadcast', {
        message: message,
        timestamp: Date.now()
    });
    
    addLog(`Message sent: ${message}`, 'success');
    messageInput.value = '';
}

function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = 'Connected';
        connectionStatus.className = 'status-connected';
    } else {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.className = 'status-disconnected';
        userCount.textContent = '0';
    }
}

function enableControls(enabled) {
    pingBtn.disabled = !enabled;
    sendBtn.disabled = !enabled;
    messageInput.disabled = !enabled;
}

function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Keep only last 50 log entries
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// Initialize
addLog('Network testing interface ready', 'info');
addLog('Click "Connect to Server" to begin testing', 'info');