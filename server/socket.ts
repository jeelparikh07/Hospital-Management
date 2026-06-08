import { Server, Socket } from 'socket.io';

interface SocketData {
  userId: string;
  role: string;
  hospitalId?: string;
}

export function initializeSocket(io: Server) {
  io.on('connection', (socket: Socket<SocketData>) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join hospital room
    socket.on('join-hospital' as any, (hospitalId: string) => {
      socket.join(`hospital:${hospitalId}`);
      console.log(`User ${socket.id} joined hospital:${hospitalId}`);
    });

    // Join department room
    socket.on('join-department' as any, (departmentId: string) => {
      socket.join(`department:${departmentId}`);
      console.log(`User ${socket.id} joined department:${departmentId}`);
    });

    // Join doctor room
    socket.on('join-doctor' as any, (doctorId: string) => {
      socket.join(`doctor:${doctorId}`);
      console.log(`User ${socket.id} joined doctor:${doctorId}`);
    });

    // Token booked
    socket.on('token-booked' as any, (data: { hospitalId: string; departmentId: string; doctorId: string; token: any }) => {
      io.to(`hospital:${data.hospitalId}`).emit('token-updated', data.token);
      io.to(`department:${data.departmentId}`).emit('token-updated', data.token);
      io.to(`doctor:${data.doctorId}`).emit('token-updated', data.token);
      console.log(`Token booked: ${data.token.tokenNumber}`);
    });

    // Token called
    socket.on('token-called' as any, (data: { hospitalId: string; departmentId: string; doctorId: string; tokenNumber: number }) => {
      io.to(`hospital:${data.hospitalId}`).emit('queue-update', {
        type: 'token-called',
        tokenNumber: data.tokenNumber,
      });
      io.to(`department:${data.departmentId}`).emit('queue-update', {
        type: 'token-called',
        tokenNumber: data.tokenNumber,
      });
      io.to(`doctor:${data.doctorId}`).emit('queue-update', {
        type: 'token-called',
        tokenNumber: data.tokenNumber,
      });
      console.log(`Token called: ${data.tokenNumber}`);
    });

    // Queue status update
    socket.on('queue-status-update' as any, (data: { hospitalId: string; departmentId: string; queue: any }) => {
      io.to(`hospital:${data.hospitalId}`).emit('queue-status', data.queue);
      io.to(`department:${data.departmentId}`).emit('queue-status', data.queue);
    });

    // Notification for patient
    socket.on('send-notification' as any, (data: { patientId: string; message: string; type: string }) => {
      socket.to(`patient:${data.patientId}`).emit('notification' as any, {
        message: data.message,
        type: data.type,
      });
    });

    // Doctor status change
    socket.on('doctor-status-change' as any, (data: { doctorId: string; status: string; hospitalId: string }) => {
      io.to(`hospital:${data.hospitalId}`).emit('doctor-status', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io initialized');
}
