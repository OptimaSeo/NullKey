# NullKey Development Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Redis (optional, for advanced features)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/OptimaSeo/NullKey.git
   cd NullKey
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

### Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

   Or build and run:
   ```bash
   npm run build
   npm start
   ```

The server will run at `http://localhost:8080` by default.

### Frontend Client

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

The client will run at `http://localhost:3000` by default.

## Configuration

Copy the environment variable template:
```bash
cp .env.example .env
```

Then adjust the values as needed.

## Architecture Overview

### Frontend (Next.js)
- Pages in `app/` (App Router)
- Crypto functions in `src/crypto/`
- WebSocket client in `src/socket/`
- UI components in `components/`

### Backend (Node.js + WebSocket)
- Main server in `src/server.ts`
- WebSocket handling in `src/ws/`
- Room management in `src/rooms/`
- Message relay in `src/relay/`
- TTL cleanup in `src/ttl/`

## Core Feature Implementation

### End-to-End Encryption
Implemented in `frontend/src/crypto/` using:
- X25519 for key exchange
- AES-256-GCM for message encryption
- Client-side key generation and storage

### Room Management
Handled in `backend/src/rooms/` with:
- Secret-based room creation/joining
- Participant limit (max 10 per room)
- Automatic cleanup after inactivity

### Message Relay
Managed in `backend/src/relay/` with:
- Server only acts as a message forwarder
- No plaintext storage on the server
- Real-time WebSocket communication

## Security Considerations

- Private keys are generated and stored only on the client side
- Server never has access to plaintext messages
- Room secrets are not stored on the server
- Automatic room and message expiration
- Rate limiting to prevent abuse

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
npm run build
```

### Frontend
```bash
cd frontend
npm run build
```

## Deployment

1. Build the frontend and backend
2. Deploy the backend to a Node.js hosting service
3. Serve the frontend build files through a static file server or CDN
4. Configure WebSocket proxy if using a reverse proxy

## Troubleshooting

### Common Issues
- Ensure the client and server are running during testing
- Check the WebSocket connection URL if the client cannot connect to the server
- Verify rate limits if experiencing connection issues

### Debugging Tips
- Enable verbose logging in development
- Check the browser console for client-side errors
- Monitor server logs for connection issues
