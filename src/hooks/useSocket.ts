'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { onConnect, onDisconnect, autoConnect = true } = options;

  useEffect(() => {
    if (!autoConnect) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [autoConnect, onConnect, onDisconnect]);

  const joinHospital = (hospitalId: string) => {
    socketRef.current?.emit('join-hospital', hospitalId);
  };

  const joinDepartment = (departmentId: string) => {
    socketRef.current?.emit('join-department', departmentId);
  };

  const joinDoctor = (doctorId: string) => {
    socketRef.current?.emit('join-doctor', doctorId);
  };

  const onTokenUpdated = (callback: (data: any) => void) => {
    socketRef.current?.on('token-updated', callback);
    return () => {
      socketRef.current?.off('token-updated', callback);
    };
  };

  const onQueueUpdate = (callback: (data: any) => void) => {
    socketRef.current?.on('queue-update', callback);
    return () => {
      socketRef.current?.off('queue-update', callback);
    };
  };

  const onQueueStatus = (callback: (data: any) => void) => {
    socketRef.current?.on('queue-status', callback);
    return () => {
      socketRef.current?.off('queue-status', callback);
    };
  };

  const onNotification = (callback: (data: any) => void) => {
    socketRef.current?.on('notification', callback);
    return () => {
      socketRef.current?.off('notification', callback);
    };
  };

  return {
    socket: socketRef.current,
    joinHospital,
    joinDepartment,
    joinDoctor,
    onTokenUpdated,
    onQueueUpdate,
    onQueueStatus,
    onNotification,
  };
}
