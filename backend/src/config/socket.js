import { Server } from 'socket.io';
import { Clerk } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY,
});

let ioInstance = null;

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : 'http://localhost:5173',
      methods: ['GET', 'POST'],
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
      const session = await clerk.sessions.verifySession({
        sessionId: token,
      });

      if (!session) {
        return next(new Error('Invalid token'));
      }

      // Find user in MongoDB
      const user = await User.findOne({ clerkUserId: session.userId });
      
      if (!user || !user.organizationId) {
        return next(new Error('User not found or no organization'));
      }

      socket.data.userId = user._id;
      socket.data.organizationId = user.organizationId;
      socket.data.clerkUserId = session.userId;
      
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
    
    console.log(`🔌 User ${userId} connected to room ${room}`);

    // Send connection confirmation
    socket.emit('connected', { message: 'Connected to notification server' });

    socket.on('disconnect', () => {
      console.log(`🔌 User ${userId} disconnected`);
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