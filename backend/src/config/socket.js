import { Server } from 'socket.io';
import clerk from './clerk.js';
import { getOrCreateUser } from '../utils/userProvisioner.js';
import dotenv from 'dotenv';

dotenv.config();

let ioInstance = null;

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token with Clerk
      const claims = await clerk.verifyToken(token);

      if (!claims) {
        return next(new Error('Invalid token'));
      }

      // Find user in MongoDB or auto-provision them
      const user = await getOrCreateUser(claims.sub);
      
      if (!user || !user.organizationId) {
        return next(new Error('User not found or no organization'));
      }

      socket.data.userId = user._id;
      socket.data.organizationId = user.organizationId;
      socket.data.clerkUserId = claims.sub;
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { organizationId, userId } = socket.data;
    
    // Join organization room
    const room = `org:${organizationId}`;
    socket.join(room);
    
    console.log(`[Socket] User ${userId} connected to room ${room}`);

    // Send connection confirmation
    socket.emit('connected', { message: 'Connected to Vokation notification server' });

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};