import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/_core/hooks/useAuth';

interface UseSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initialize Socket.io connection
    const socket = io(window.location.origin, {
      auth: {
        userId: user.id,
        token: 'auth-token', // In production, use actual JWT token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected');
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected');
      options.onDisconnect?.();
    });

    socket.on('error', (error) => {
      console.error('[Socket.io] Error:', error);
      options.onError?.(error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, options]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    isConnected: socketRef.current?.connected ?? false,
  };
}
