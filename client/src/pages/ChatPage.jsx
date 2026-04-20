import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Check, CheckCheck, Trash2, ArrowLeft, Circle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { chatRoomId } = useParams();
  const { user } = useAuth();
  const { joinChat, leaveChat, sendTyping, isUserOnline, on } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [chatUnavailable, setChatUnavailable] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load chat rooms
  useEffect(() => {
    chatAPI.getMyChatRooms().then(({ data }) => {
      setRooms(data?.data?.rooms || data?.rooms || []);
      setLoadingRooms(false);
    }).catch((err) => {
      if (err.response?.status === 404) {
        setChatUnavailable(true);
        setRooms([]);
      }
      setLoadingRooms(false);
    });
  }, []);

  // Auto-select room from URL
  useEffect(() => {
    if (chatRoomId && rooms.length > 0) {
      const room = rooms.find(r => r._id === chatRoomId);
      if (room) openRoom(room);
    }
  }, [chatRoomId, rooms]);

  // Real-time message listener
  useEffect(() => {
    const cleanup = on('new_message', (msg) => {
      if (activeRoom && msg.chatRoom === activeRoom._id) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return cleanup;
  }, [on, activeRoom]);

  // Typing indicator listener
  useEffect(() => {
    const cleanup = on('typing', ({ userId: typingId, chatRoomId: roomId, isTyping, username }) => {
      if (activeRoom?._id === roomId && typingId !== user._id) {
        setTypingUsers(prev => ({ ...prev, [typingId]: isTyping ? username : undefined }));
      }
    });
    return cleanup;
  }, [on, activeRoom, user._id]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const openRoom = async (room) => {
    if (activeRoom) leaveChat(activeRoom._id);
    setActiveRoom(room);
    setLoadingMessages(true);
    joinChat(room._id);
    navigate(`/chat/${room._id}`, { replace: true });

    try {
      const { data } = await chatAPI.getMessages(room._id);
      setMessages(data.data.messages);
    } catch {
      toast.error('Could not load messages', { className: 'toast-dark' });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !activeRoom) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    sendTyping(activeRoom._id, false);

    // Optimistic UI
    const optimistic = {
      _id: `temp-${Date.now()}`,
      content,
      sender: user,
      chatRoom: activeRoom._id,
      createdAt: new Date().toISOString(),
      type: 'text',
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data } = await chatAPI.sendMessage(activeRoom._id, content);
      setMessages(prev => prev.map(m => m._id === optimistic._id ? data.data.message : m));
      setRooms(prev => prev.map(r => r._id === activeRoom._id
        ? { ...r, lastActivity: new Date().toISOString() } : r));
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setInput(content);
      toast.error('Could not send message', { className: 'toast-dark' });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeRoom) return;
    sendTyping(activeRoom._id, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(activeRoom._id, false), 2000);
  };

  const handleRespondToRequest = async (roomId, action) => {
    try {
      await chatAPI.respondToRequest(roomId, action);
      toast.success(action === 'accept' ? 'Chat accepted! ✨' : 'Request declined.', { className: 'toast-dark' });
      const { data } = await chatAPI.getMyChatRooms();
      setRooms(data.data.rooms);
      if (action === 'accept') {
        const room = data.data.rooms.find(r => r._id === roomId);
        if (room) openRoom(room);
      }
    } catch {
      toast.error('Could not respond', { className: 'toast-dark' });
    }
  };

  const getOtherParticipant = (room) =>
    room.participants?.find(p => p._id !== user?._id) || room.participants?.[0];

  const activeTypingUsers = Object.entries(typingUsers).filter(([, v]) => v).map(([, v]) => v);

  return (
    <div className="h-screen flex flex-col pt-16">
      {chatUnavailable && (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-3">
          <div className="glass rounded-xl px-4 py-2 text-sm text-slate-300">
            Chat service is not available in the current backend build yet.
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 md:px-8 py-4 gap-4">

        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <div className={`w-full md:w-80 flex-shrink-0 glass rounded-2xl flex flex-col overflow-hidden ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-white/10">
            <h2 className="font-heading text-xl text-white">Messages</h2>
            <p className="text-xs text-slate-500 font-body">{rooms.length} conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="p-4 space-y-3">
                {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 font-body text-sm">No conversations yet</p>
                <p className="text-slate-600 text-xs font-body mt-1">Fulfill a wish to start chatting</p>
              </div>
            ) : rooms.map(room => {
              const other = getOtherParticipant(room);
              const isActive = activeRoom?._id === room._id;
              const online = isUserOnline(other?._id);
              const isPending = room.status === 'pending' && room.recipient?._id === user?._id;

              return (
                <div key={room._id}
                  onClick={() => room.status === 'approved' ? openRoom(room) : null}
                  className={`flex items-start gap-3 p-4 border-b border-white/5 cursor-pointer transition-all ${
                    isActive ? 'bg-white/8' : 'hover:bg-white/5'
                  } ${room.status !== 'approved' ? 'cursor-default' : ''}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-silver/30 flex items-center justify-center text-sm font-body font-medium text-white overflow-hidden">
                      {other?.avatar
                        ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                        : other?.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                    {online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-lake-bg" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-white font-body truncate">
                        {other?.displayName || other?.username || 'User'}
                      </p>
                      {room.lastActivity && (
                        <span className="text-xs text-slate-600 font-body flex-shrink-0">
                          {formatDistanceToNow(new Date(room.lastActivity), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {room.relatedWish && (
                      <p className="text-xs text-slate-600 font-body truncate">
                        re: {room.relatedWish.title}
                      </p>
                    )}
                    {isPending && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); handleRespondToRequest(room._id, 'accept'); }}
                          className="text-xs px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/20 hover:bg-gold/25 transition-colors font-body">
                          Accept
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleRespondToRequest(room._id, 'reject'); }}
                          className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-body">
                          Decline
                        </button>
                      </div>
                    )}
                    {room.status === 'pending' && room.initiator === user?._id && (
                      <span className="text-xs text-slate-500 font-body">Awaiting response...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat Area ─────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col glass rounded-2xl overflow-hidden ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <button onClick={() => { setActiveRoom(null); navigate('/chat'); }}
                  className="md:hidden p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {(() => {
                  const other = getOtherParticipant(activeRoom);
                  const online = isUserOnline(other?._id);
                  return (
                    <>
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-silver/30 flex items-center justify-center text-sm font-body font-medium text-white overflow-hidden">
                          {other?.avatar ? <img src={other.avatar} alt="" className="w-full h-full object-cover" /> : other?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                        {online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-lake-solid" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white font-body">{other?.displayName || other?.username}</p>
                        <p className="text-xs text-slate-500 font-body">{online ? 'Online' : `Last seen ${other?.lastSeen ? formatDistanceToNow(new Date(other.lastSeen), { addSuffix: true }) : 'a while ago'}`}</p>
                      </div>
                    </>
                  );
                })()}
                {activeRoom.relatedWish && (
                  <div className="ml-auto glass-card px-3 py-1.5 rounded-full">
                    <p className="text-xs text-slate-400 font-body truncate max-w-32">✨ {activeRoom.relatedWish.title}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center pt-8">
                    <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                  </div>
                ) : messages.map((msg, i) => {
                  const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                  const isSystem = msg.type === 'system';
                  if (isSystem) return (
                    <div key={msg._id} className="text-center">
                      <span className="text-xs text-slate-600 font-body bg-white/5 px-3 py-1 rounded-full">{msg.content}</span>
                    </div>
                  );

                  return (
                    <motion.div key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/30 to-silver/30 flex items-center justify-center text-xs font-body font-medium text-white flex-shrink-0 mt-auto overflow-hidden">
                          {msg.sender?.avatar ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" /> : msg.sender?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                          isMine
                            ? 'bg-gradient-to-br from-gold to-gold-muted text-lake-bg rounded-br-sm'
                            : 'bg-white/8 text-slate-100 rounded-bl-sm border border-white/5'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-slate-600 font-body">
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Typing indicator */}
                <AnimatePresence>
                  {activeTypingUsers.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2">
                      <div className="flex gap-1 px-4 py-2.5 bg-white/8 rounded-2xl rounded-bl-sm border border-white/5">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                        ))}
                      </div>
                      <span className="text-xs text-slate-600 font-body">{activeTypingUsers[0]} is typing</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={handleTyping}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Type a message..."
                    className="input-field flex-1"
                    maxLength={2000}
                  />
                  <button onClick={handleSend} disabled={!input.trim() || sending}
                    className="btn-primary px-4 py-2.5 disabled:opacity-50">
                    {sending
                      ? <div className="w-4 h-4 rounded-full border-2 border-lake-bg border-t-transparent animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="w-16 h-16 text-slate-800 mb-4" />
              <h2 className="font-heading text-2xl text-slate-500 mb-2">Select a conversation</h2>
              <p className="text-slate-600 text-sm font-body">Choose a chat from the sidebar to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
