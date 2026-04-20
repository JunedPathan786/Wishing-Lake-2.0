import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, Sparkles, LogOut, User, LayoutDashboard, MessageCircle, Wand2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationAPI } from '../services/api';

const getAvatarSrc = (user) => {
  if (user?.avatar) return user.avatar;
  const name = encodeURIComponent(user?.displayName || user?.name || user?.username || 'User');
  return `https://ui-avatars.com/api/?name=${name}&background=0F172A&color=F8FAFC&size=128`;
};

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationAPI.getAll({ limit: 8 }).then(({ data }) => {
      setNotifications(data.data.notifications);
      setUnreadCount(data.unreadCount);
    }).catch(() => {});
  }, [isAuthenticated, notifOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setUnreadCount(0);
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const navLinks = [
    
    ...(isAuthenticated ? [
      { to: '/lake', label: 'The Lake' },
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/oracle', label: 'Oracle' },
      { to: '/chat', label: 'Messages' },
    ] : []),
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl bg-lake-bg/80 border-b border-white/10 shadow-glass' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Sparkles className="w-5 h-5 text-gold group-hover:animate-pulse-glow transition-all" />
          <span className="font-heading text-xl tracking-tight text-white">
            Wishing <span className="gradient-gold">Lake</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-body transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Socket status dot */}
          {isAuthenticated && (
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-600'}`}
              title={isConnected ? 'Live' : 'Offline'} />
          )}

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button onClick={() => setNotifOpen(o => !o)}
                  className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-lake-bg rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 glass rounded-2xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="font-body text-sm font-medium text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead}
                            className="text-xs text-gold hover:text-gold-light transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-slate-500 text-sm py-8 font-body">No notifications yet</p>
                        ) : notifications.map(n => (
                          <div key={n._id}
                            className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-gold/5' : ''}`}>
                            <p className="text-sm font-medium text-white font-body">{n.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-body">{n.message}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-white/10">
                        <Link to="/dashboard?tab=notifications"
                          onClick={() => setNotifOpen(false)}
                          className="block text-center text-xs text-gold hover:text-gold-light py-1 font-body transition-colors">
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/30 to-silver/30 border border-white/20 flex items-center justify-center overflow-hidden">
                    <img
                      src={getAvatarSrc(user)}
                      alt={user?.displayName || user?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
                <div className="absolute right-0 top-12 w-52 glass rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-glass">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white font-body">{user?.displayName || user?.name || 'Wisher'}</p>
                    <p className="text-xs text-slate-400 font-body">{user?.username ? `@${user.username}` : user?.email}</p>
                  </div>
                  {[
                    { to: `/profile/${user?.username}`, icon: User, label: 'Profile' },
                    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/chat', icon: MessageCircle, label: 'Messages' },
                    { to: '/oracle', icon: Wand2, label: 'Wish Oracle' },
                    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin Panel' }] : []),
                  ].map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-body">
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  ))}
                  <button onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-red-400 transition-colors border-t border-white/10 font-body">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm px-5 py-2">Sign in</Link>
              <Link to="/signup" className="btn-primary text-sm px-5 py-2">
                <Sparkles className="w-3.5 h-3.5" /> Join the Lake
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-white/10 backdrop-blur-xl bg-lake-bg/95 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <NavLink key={link.to} to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-body transition-colors ${
                      isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }>
                  {link.label}
                </NavLink>
              ))}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-ghost text-center text-sm">Sign in</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-center text-sm justify-center">Join</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
