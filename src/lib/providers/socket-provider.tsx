'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientIO } from 'socket.io-client';

type SocketContextType = {
  socket: any | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SITE_URL;
    let socketInstance: any;
    if (host) {
      socketInstance = (ClientIO as any)(host, {
        path: '/api/socket/io',
        addTrailingSlash: false,
      });
    } else {
      // no explicit host — connect to same origin (useful in dev without forcing port)
      socketInstance = (ClientIO as any)({
        path: '/api/socket/io',
        addTrailingSlash: false,
      } as any);
    }
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
