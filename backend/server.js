import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './src/config/db.js';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { setupSocket } from './src/config/socket.js';
import { initializeWorker } from './src/workers/syncWorker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Setup Socket.io
const io = setupSocket(server);

// Initialize BullMQ worker
initializeWorker(io);

server.listen(PORT, () => {
  console.log(`[Server] Vokation Server running on http://localhost:${PORT}`);
  console.log(`[Server] Socket.io enabled`);
  console.log(`[Server] BullMQ worker initialized`);
});