import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const initSocket = async () => {
      try {
        const token = await getToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socketUrl = apiUrl.replace(/\/api\/?$/, '');
        const socketInstance = io(socketUrl, {
          auth: { token },
          transports: ['websocket'],
          withCredentials: true,
        });

        socketInstance.on('connect', () => {
          console.log('[Socket] Socket connected to Vokation');
          setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          console.log('[Socket] Socket disconnected');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isLoaded, isSignedIn]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};