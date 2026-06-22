import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket = null;
    
    // Only connect if user is logged in
    if (user) {
      newSocket = io('http://localhost:5000');
      setSocket(newSocket);
      console.log('Socket initialized for user:', user.name);

      newSocket.on('connect', () => {
        console.log('Connected to socket server:', newSocket.id);
      });
    }

    // Cleanup on unmount or user change
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        console.log('Socket disconnected');
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
