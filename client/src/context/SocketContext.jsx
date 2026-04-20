import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const disabledRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lakeActivity, setLakeActivity] = useState([]);
  const listenersRef = useRef({});

  // ─── Connect / Disconnect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || disabledRef.current) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_lake');
      socket.emit('get_online_users');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      disabledRef.current = true;
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    });

    // ── Online users tracking ────────────────────────────────────────────────
    socket.on('online_users', ({ userIds }) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // ── Lake activity ────────────────────────────────────────────────────────
    socket.on('new_wish', (wish) => {
      setLakeActivity(prev => [wish, ...prev].slice(0, 20));
      // Trigger registered listeners
      if (listenersRef.current['new_wish']) {
        listenersRef.current['new_wish'].forEach(fn => fn(wish));
      }
    });

    socket.on('wish_ripple', (data) => {
      if (listenersRef.current['wish_ripple']) {
        listenersRef.current['wish_ripple'].forEach(fn => fn(data));
      }
    });

    // ── Global notifications ─────────────────────────────────────────────────
    socket.on('broadcast_notification', ({ title, message }) => {
      toast(message, { icon: '📢', className: 'toast-dark', duration: 6000 });
    });

    socket.on('fulfillment_approved', ({ wishTitle, karmaEarned }) => {
      toast.success(`Your offer was accepted! +${karmaEarned} karma ✨`, { className: 'toast-dark', duration: 6000 });
    });

    socket.on('message_notification', ({ senderName, preview }) => {
      toast(`💬 ${senderName}: ${preview}`, { className: 'toast-dark' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  // ─── Register event listeners ─────────────────────────────────────────────
  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = new Set();
    }
    listenersRef.current[event].add(callback);

    // Also register directly on socket if connected
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    return () => {
      listenersRef.current[event]?.delete(callback);
      socketRef.current?.off(event, callback);
    };
  }, []);

  // ─── Emit events ──────────────────────────────────────────────────────────
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinChat = useCallback((chatRoomId) => {
    emit('join_chat', { chatRoomId });
  }, [emit]);

  const leaveChat = useCallback((chatRoomId) => {
    emit('leave_chat', { chatRoomId });
  }, [emit]);

  const sendTyping = useCallback((chatRoomId, isTyping) => {
    emit(isTyping ? 'typing_start' : 'typing_stop', { chatRoomId });
  }, [emit]);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId?.toString());
  }, [onlineUsers]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      lakeActivity,
      on,
      emit,
      joinChat,
      leaveChat,
      sendTyping,
      isUserOnline,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
