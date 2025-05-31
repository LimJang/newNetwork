const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/network-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'network-test.html'));
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Store user connection
  connectedUsers.set(socket.id, {
    id: socket.id,
    joinTime: new Date(),
    lastActivity: new Date()
  });

  // Broadcast current user count
  io.emit('userCount', connectedUsers.size);

  socket.on('ping', (data) => {
    console.log('Ping received from:', socket.id);
    socket.emit('pong', {
      ...data,
      serverTime: new Date().toISOString()
    });
  });

  socket.on('broadcast', (data) => {
    console.log('Broadcast message:', data);
    socket.broadcast.emit('message', {
      ...data,
      senderId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('userCount', connectedUsers.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
