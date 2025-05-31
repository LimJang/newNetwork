# Medieval Network Research

A real-time communication research project with a medieval European theme, built to test and validate WebSocket connections and networking strategies.

## Features

- Real-time WebSocket communication
- Medieval European themed UI with Korean language support
- Network connectivity testing
- Ping/latency testing
- Message broadcasting
- Connection status monitoring
- User count tracking

## Tech Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript
- **Fonts**: Cinzel (medieval), Noto Serif KR (Korean)
- **Deployment**: Designed for Render

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

### Development Mode

```bash
npm run dev
```

## Project Structure

```
newNetwork/
├── public/
│   ├── index.html          # Main landing page
│   ├── network-test.html   # Network testing interface
│   ├── styles.css          # Medieval themed styles
│   └── network-test.js     # Client-side WebSocket handling
├── server.js               # Express + Socket.IO server
├── package.json
└── README.md
```

## Testing Features

### Network Test Page
- **Connection Testing**: Connect/disconnect to WebSocket server
- **Ping Testing**: Measure latency between client and server
- **Message Broadcasting**: Send messages to all connected clients
- **Real-time Monitoring**: Track connection status and user count

## Deployment

This project is configured for deployment on Render:

1. Connect your GitHub repository to Render
2. Set the build command: `npm install`
3. Set the start command: `npm start`
4. Deploy!

## Research Goals

This project serves as a foundation for researching:
- Real-time communication strategies
- WebSocket performance and reliability
- Alternative networking approaches after P2P limitations
- Scalable multiplayer game architecture

## Contributing

This is a research project. Feel free to fork and experiment with different networking approaches.

## License

MIT License
