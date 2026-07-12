import './loadEnv.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routers
import authRouter from './routes/auth.js';
import tasksRouter, { setIoInstance } from './routes/tasks.js';
import analyticsRouter from './routes/analytics.js';
import teamRouter from './routes/team.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for prototype flexibility
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Pass IO instance to tasks router to trigger background feedback broadcasts
setIoInstance(io);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Route bindings
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/team', teamRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Serve compiled static frontend assets in production (Monolith fallback)
const staticPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  // Split Deployment fallback: serve API status on root / path
  app.get('/', (req, res) => {
    res.json({
      status: 'active',
      message: 'TaskPilot Express API Server is running. Frontend is deployed separately.'
    });
  });
}

// Socket.io Real-Time Typing Sync
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join a unique channel per candidate submission
  socket.on('joinSubmissionRoom', (submissionId) => {
    socket.join(submissionId);
    console.log(`Socket ${socket.id} joined room: ${submissionId}`);
  });

  // Candidate streams real-time typing keystrokes/cursors
  socket.on('candidateKeystroke', ({ submissionId, workspaceState, cursor }) => {
    // Broadcast workspace and cursor details directly to listening admins in the same room
    socket.to(submissionId).emit('workspaceStateUpdate', {
      workspaceState,
      cursor
    });
  });

  // Candidate updates activity status (e.g. idle vs typing)
  socket.on('activityStateChange', ({ submissionId, activityState }) => {
    socket.broadcast.emit('monitorActivityState', {
      submissionId,
      activityState // 'working' | 'idle'
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Server listener and Database connection helper
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Fallback database choice: spin up Mongo Memory Server if no URI exists
    if (!mongoUri || mongoUri.includes('placeholder')) {
      console.log('No MONGODB_URI found in environmental variables.');
      console.log('Starting in-memory database helper (mongodb-memory-server)...');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`In-memory database is listening at: ${mongoUri}`);
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB.');

    server.listen(PORT, () => {
      console.log(`TaskPilot server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server boot failed:', error);
    process.exit(1);
  }
}

startServer();
