import { NextApiResponseServerIo } from '@/lib/types';
import { Server as NetServer } from 'net';
import { Server as ServerIO } from 'socket.io';
import { NextApiRequest } from 'next';
import { Server as HTTPServer } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  // guard: ensure the underlying server exists and supports event handling
  const serverAny = (res.socket && (res.socket as any).server) as any;
  if (!serverAny) {
    console.log('No underlying server available for Socket.IO yet');
    return res.status(200).json({ success: true });
  }

  if (!serverAny.io) {
    console.log('Initializing Socket.IO');
    const path = '/api/socket/io';
    const httpServer: HTTPServer = serverAny as any;

    const io = new ServerIO(httpServer, {
      path,
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      
      socket.on('create-room', (fileId) => {
        console.log('User joined room:', fileId);
        socket.join(fileId);
      });
      
      socket.on('send-changes', (deltas, fileId) => {
        console.log('Changes received for file:', fileId);
        socket.to(fileId).emit('receive-changes', deltas, fileId);
      });
      
      socket.on('send-cursor-move', (range, fileId, cursorId) => {
        socket.to(fileId).emit('receive-cursor-move', range, fileId, cursorId);
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
    
    res.socket.server.io = io;
  }
  
  res.status(200).json({ success: true });
};

export default ioHandler;
