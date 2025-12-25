import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  signup,
  login,
  getMe,
  getFeed,
  createPost,
  likePost,
  commentOnPost,
  sharePost,
  searchUsers,
  getUserProfile,
  getStories,
  createStory,
  viewStory,
  getMessages,
  sendMessage,
  updateMe,
  getAdminStats,
  toggleFollow,
  deletePost,
  markMessagesRead,
  getConversations
} from './api';
import Messages from './components/Messages';

const VIEW_HOME = 'home';
const VIEW_CREATE = 'create';
const VIEW_SAVED = 'saved';
const VIEW_MESSAGES = 'messages';
const VIEW_PROFILE = 'profile';
const VIEW_ADMIN = 'admin';

const UI = {
  card: 'bg-gray-900/45 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/40',
  cardSoft: 'bg-gray-900/35 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl shadow-black/30',
  surface: 'bg-gray-900/40 backdrop-blur-xl border border-gray-800/60 rounded-3xl',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ' +
    'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 ' +
    'hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/35 active:scale-[0.99] transition-all ' +
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/90 ' +
    'bg-gray-800/60 border border-gray-700/60 hover:bg-gray-800 hover:border-gray-600/70 active:scale-[0.99] transition-all ' +
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
  btnGhost:
    'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ' +
    'text-gray-300 hover:text-white hover:bg-gray-800/60 active:scale-[0.99] transition-all ' +
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
  btnDanger:
    'inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-bold ' +
    'text-red-300 bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 hover:border-red-500/35 active:scale-[0.99] transition-all ' +
    'focus:outline-none focus:ring-2 focus:ring-red-500/25',
  pill:
    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ' +
    'bg-gray-800/55 border border-gray-700/55 hover:bg-gray-800/75 hover:border-gray-600/60 active:scale-[0.99] transition-all',
  input:
    'w-full rounded-xl bg-gray-900/45 border border-gray-700/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 ' +
    'focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all',
  inputWithIcon:
    'w-full rounded-xl bg-gray-900/45 border border-gray-700/60 pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 ' +
    'focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all'
};

function AuthView({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'consumer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.email || !form.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }
    if (isSignup && !form.username) {
      setError('Username is required for signup');
      setLoading(false);
      return;
    }

    try {
      const fn = isSignup ? signup : login;
      const payload = isSignup
        ? { username: form.username, email: form.email, password: form.password, role: form.role }
        : { email: form.email, password: form.password };

      const res = await fn(payload);
      const { token, user } = res.data;
      if (!token || !user) {
        setError('Invalid auth response from server');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onAuth(token, user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 relative overflow-hidden px-4 py-10">
      <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-teal-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[340px] h-[340px] bg-emerald-600/5 rounded-full blur-[90px] -translate-x-1/2 -translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className={`${UI.card} p-8 sm:p-10`}>
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center font-extrabold text-white text-2xl shadow-xl shadow-emerald-500/30 mb-5 transform hover:scale-105 hover:rotate-3 transition-all duration-300">✨</div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Pixalio</h1>
            <p className="text-emerald-300/80 text-sm mt-2 font-semibold">Share, Connect & Create</p>
          </div>

          <div className="flex gap-2 mb-8 p-1 bg-gray-900/40 border border-white/10 rounded-2xl">
            <button type="button" onClick={() => { setIsSignup(false); setError(''); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${!isSignup ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-400 hover:text-white hover:bg-gray-800/40'}`}>Log In</button>
            <button type="button" onClick={() => { setIsSignup(true); setError(''); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isSignup ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-400 hover:text-white hover:bg-gray-800/40'}`}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">👤</span>
                  <input name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" className={UI.inputWithIcon} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">📧</span>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={UI.inputWithIcon} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔐</span>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className={UI.inputWithIcon} />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm(p => ({ ...p, role: 'consumer' }))} className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 border ${form.role === 'consumer' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 shadow-lg shadow-emerald-500/10' : 'border-gray-700/60 bg-gray-900/20 text-gray-400 hover:text-white hover:bg-gray-800/30'}`}>👁️ Consumer</button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, role: 'creator' }))} className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-300 border ${form.role === 'creator' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 shadow-lg shadow-emerald-500/10' : 'border-gray-700/60 bg-gray-900/20 text-gray-400 hover:text-white hover:bg-gray-800/30'}`}>🎬 Creator</button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <div><p className="font-bold">Oops!</p><p className="mt-0.5 text-red-300/85">{error}</p></div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className={`w-full py-4 ${UI.btnPrimary} disabled:opacity-60 disabled:cursor-not-allowed`}>
              {loading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Loading...</span></>) : (<>{isSignup ? 'Create Account' : 'Sign In'}</>)}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">{isSignup ? "Already have an account? Click 'Log In' above" : "Don't have an account? Click 'Sign Up' above"}</p>
        </div>
      </div>
    </div>
  );
}

function SearchUsers({ onSelect, me, onToggleFollow, onViewProfile }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let active = true;
    searchUsers(q).then(res => { if (active) setResults(res.data || []); }).catch(() => { if (active) setResults([]); });
    return () => { active = false; };
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by username" className={`pl-10 pr-4 ${UI.input}`} />
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.map(u => (
          <div key={u._id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-900/35 transition-colors">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 overflow-hidden flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
              {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm truncate">{u.username}</div>
              <div className="text-xs text-gray-500 truncate">{u.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={e => { e.stopPropagation(); onToggleFollow?.(u._id); }} className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-extrabold transition-all active:scale-[0.99] border ${me?.following?.includes(u._id) ? 'bg-gray-800/70 border-gray-700/60 text-gray-200 hover:bg-gray-800' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20'}`}>{me?.following?.includes(u._id) ? '✓' : '+'}</button>
              <button type="button" onClick={e => { e.stopPropagation(); onSelect?.(u); }} className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-bold bg-gray-800/60 border border-gray-700/60 text-gray-200 hover:bg-gray-800 transition-all active:scale-[0.99]">💬</button>
            </div>
          </div>
        ))}
        {results.length === 0 && q && <div className="text-center py-4 text-gray-500 text-sm">No users found</div>}
      </div>
    </div>
  );
}

function AppShell({ user, onLogout, socket }) {
  const [view, setView] = useState(VIEW_HOME);
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [me, setMe] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: user.username, email: user.email, password: '', bio: '' });
  const [savedIds, setSavedIds] = useState(() => { try { return JSON.parse(localStorage.getItem('pixalio_saved_ids') || '[]'); } catch { return []; } });
  const [createImageDataUrl, setCreateImageDataUrl] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [headerQ, setHeaderQ] = useState('');
  const [headerResults, setHeaderResults] = useState([]);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [showHeaderResults, setShowHeaderResults] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getMe().then(res => {
      const normalized = { ...res.data, followers: (res.data.followers || []).map(id => id.toString()), following: (res.data.following || []).map(id => id.toString()) };
      setMe(normalized);
      setProfileForm(p => ({ ...p, username: normalized.username, email: normalized.email, bio: normalized.bio || '' }));
    }).catch(() => {});
  }, []);

  const refreshFeed = async () => {
    try { setLoadingFeed(true); const res = await getFeed(); setFeed(res.data || []); }
    catch { setFeed([]); }
    finally { setLoadingFeed(false); }
  };

  useEffect(() => { if ([VIEW_HOME, VIEW_SAVED, VIEW_PROFILE].includes(view)) refreshFeed(); }, [view]);

  useEffect(() => {
    let active = true, timer = setTimeout(async () => {
      if (!headerQ?.trim()) { setHeaderResults([]); setHeaderLoading(false); return; }
      try { setHeaderLoading(true); const res = await searchUsers(headerQ.trim()); if (active) setHeaderResults(res.data || []); }
      catch { if (active) setHeaderResults([]); }
      finally { if (active) setHeaderLoading(false); }
    }, 220);
    return () => { active = false; clearTimeout(timer); };
  }, [headerQ]);

  useEffect(() => { if (view === VIEW_ADMIN && user.role === 'admin') getAdminStats().then(res => setStats(res.data)).catch(() => setStats(null)); }, [view, user.role]);

  useEffect(() => {
    let active = true;
    const load = async () => { try { const res = await getStories(); if (active) setStories(res.data || []); } catch { if (active) setStories([]); } };
    if (view === VIEW_HOME) load();
    if (socket) { socket.on('story:created', load); return () => { active = false; socket.off('story:created', load); }; }
    return () => { active = false; };
  }, [view, socket]);

  useEffect(() => {
    getConversations().then(res => {
      const counts = {};
      (res.data || []).forEach(c => { counts[c.user._id || c.user.id] = c.unreadCount || 0; });
      setUnreadCounts(counts);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = msg => {
      const otherId = msg.from === user.id ? msg.to : msg.from;
      if (msg.to === user.id) setUnreadCounts(p => ({ ...p, [msg.from]: (p[msg.from] || 0) + 1 }));
    };
    const readHandler = p => { if (p?.from) setUnreadCounts(prev => ({ ...prev, [p.from]: 0 })); };
    socket.on('message:new', handler);
    socket.on('message:read', readHandler);
    return () => { socket.off('message:new', handler); socket.off('message:read', readHandler); };
  }, [socket, user.id]);

  const openProfile = async u => {
    try { const res = await getUserProfile(u._id || u.id); setProfileUser(res.data); setView(VIEW_PROFILE); }
    catch { alert('Failed to load profile'); }
  };

  const openChat = async u => {
    setUnreadCounts(p => ({ ...p, [u._id]: 0 }));
    try { await markMessagesRead(u._id || u.id); } catch {}
    setView(VIEW_MESSAGES);
  };

  const handleLike = async postId => { try { await likePost(postId); refreshFeed(); } catch {} };

  const handleToggleFollow = async targetId => {
    try { const res = await toggleFollow(targetId); setMe(p => p ? { ...p, following: res.data.following } : p); }
    catch {}
  };

  const handleShare = async post => {
    try {
      const full = me || (await getMe().then(r => r.data));
      if (!full?.following?.length) { alert('You are not following anyone yet.'); return; }
      if (!window.confirm(`Share with ${full.following.length} people you follow?`)) return;
      await Promise.all(full.following.map(id => sendMessage(id, { text: post.caption ? `Check out: "${post.caption.slice(0, 50)}..."` : 'Shared a post', postId: post._id })));
      await sharePost(post._id);
      refreshFeed();
      alert(`Shared with ${full.following.length} people!`);
    } catch { alert('Failed to share.'); }
  };

  const handleToggleSave = postId => {
    setSavedIds(prev => {
      const set = new Set(prev);
      set.has(postId) ? set.delete(postId) : set.add(postId);
      const arr = Array.from(set);
      localStorage.setItem('pixalio_saved_ids', JSON.stringify(arr));
      return arr;
    });
  };

  const handleCreatePost = async e => {
    e.preventDefault();
    const caption = new FormData(e.target).get('caption');
    if (!caption && !createImageDataUrl) return;
    try {
      const res = await createPost({ caption, imageUrl: createImageDataUrl || '' });
      setFeed(p => [res.data, ...p]);
      e.target.reset();
      setCreateImageDataUrl(null);
      alert('Post added!');
      setView(VIEW_HOME);
    } catch {}
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    try {
      const payload = { username: profileForm.username, email: profileForm.email, bio: profileForm.bio };
      if (profileForm.password?.trim()) payload.password = profileForm.password.trim();
      const res = await updateMe(payload);
      setMe(res.data);
      localStorage.setItem('user', JSON.stringify({ ...user, username: res.data.username, email: res.data.email }));
      setIsEditingProfile(false);
    } catch { alert('Failed to update profile'); }
  };

  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => { try { const res = await updateMe({ avatarUrl: reader.result }); setMe(res.data); } catch { alert('Failed to update avatar'); } };
    reader.readAsDataURL(file);
  };

  const handleDeletePost = async postId => {
    if (!window.confirm('Delete this post?')) return;
    try { await deletePost(postId); setFeed(p => p.filter(x => x._id !== postId)); } catch {}
  };

  const currentUser = me || user;
  const safeFeed = (feed || []).filter(p => p?.author?._id);
  const savedPosts = safeFeed.filter(p => savedIds.includes(p._id));
  const displayedUser = profileUser?.user || me || user;
  const displayedFollowers = profileUser?.user?.followers || me?.followers || [];
  const displayedFollowing = profileUser?.user?.following || me?.following || [];
  const profilePosts = profileUser?.posts || safeFeed.filter(p => {
    const aid = p.author?._id || p.author;
    return aid && displayedUser && (aid.toString?.() === (displayedUser._id || displayedUser.id)?.toString());
  });
  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + (n || 0), 0);

  const navItems = [
    { id: VIEW_HOME, icon: '🏠', label: 'Home' },
    { id: VIEW_CREATE, icon: '➕', label: 'Create' },
    { id: VIEW_SAVED, icon: '⭐', label: 'Saved' },
    { id: VIEW_MESSAGES, icon: '💬', label: 'Messages', badge: totalUnread },
    { id: VIEW_PROFILE, icon: '👤', label: 'Profile' }
  ];
  if (user.role === 'admin') navItems.push({ id: VIEW_ADMIN, icon: '🛡️', label: 'Admin' });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/75 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button type="button" className="flex items-center gap-3 group flex-shrink-0" onClick={() => { setProfileUser(null); setView(VIEW_HOME); }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-extrabold text-white text-sm shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">PX</div>
            <div className="hidden sm:block text-base font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Pixalio</div>
          </button>

          <div className="flex-1 max-w-xl mx-4 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input value={headerQ} onChange={e => { setHeaderQ(e.target.value); setShowHeaderResults(true); }} onFocus={() => setShowHeaderResults(true)} onBlur={() => setTimeout(() => setShowHeaderResults(false), 200)} placeholder="Search people..." className={`pl-11 pr-4 ${UI.input}`} />
            {showHeaderResults && (headerLoading || headerResults.length > 0 || headerQ) && (
              <div className="absolute left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/60 rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden">
                <div className="p-2">
                  {headerLoading && <div className="flex items-center justify-center py-6"><div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}
                  {!headerLoading && headerResults.length === 0 && headerQ && <div className="text-center py-6 text-gray-500 text-sm">No results</div>}
                  {!headerLoading && headerResults.map(u => (
                    <div key={u._id} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-800/55 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 overflow-hidden flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-white truncate">{u.username}</div>
                          <div className="text-xs text-gray-500">{u.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onMouseDown={e => e.preventDefault()} onClick={() => { setShowHeaderResults(false); openProfile(u); }} className={UI.btnSecondary}>View</button>
                        <button onMouseDown={e => e.preventDefault()} onClick={() => { setShowHeaderResults(false); openChat(u); }} className={UI.btnPrimary}>Message</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button type="button" className={`hidden md:inline-flex ${UI.btnPrimary}`} onClick={() => setView(VIEW_CREATE)}>+ Create</button>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-gray-900/40 border border-gray-700/50">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-semibold text-white overflow-hidden">
                {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" /> : currentUser.username?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-white">{currentUser.username}</span>
              <button type="button" onClick={onLogout} className={UI.btnDanger}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map(item => (
            <button key={item.id} type="button" onClick={() => { setProfileUser(null); setView(item.id); }} className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${view === item.id ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'text-gray-500'}`}>
              <span className="text-xl">{item.icon}</span>
              {item.badge > 0 && <span className="absolute -top-1 right-1 h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{item.badge}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        <div className="flex flex-col lg:grid lg:grid-cols-[240px_1fr_280px] gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              {navItems.map(item => (
                <button key={item.id} type="button" onClick={() => { setProfileUser(null); setView(item.id); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${view === item.id ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-200 border border-emerald-500/25' : 'text-gray-400 hover:text-white hover:bg-gray-900/40 border border-transparent'}`}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                  {item.badge > 0 && <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{item.badge}</span>}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <section className="min-w-0">
            {/* HOME */}
            {view === VIEW_HOME && (
              <div className="space-y-6">
                {/* Stories */}
                <div className={`${UI.surface} p-4`}>
                  <div className="flex items-center gap-4 overflow-x-auto pb-2">
                    <label className="flex-shrink-0 cursor-pointer group">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-all">+</div>
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const r = new FileReader();
                        r.onload = async () => { try { await createStory({ mediaUrl: r.result, mediaType: 'image' }); const res = await getStories(); setStories(res.data || []); alert('Story posted!'); } catch { alert('Failed'); } };
                        r.readAsDataURL(f);
                      }} />
                      <div className="text-xs text-gray-400 mt-2 text-center font-semibold">Add Story</div>
                    </label>
                    {stories.map(g => (
                      <button key={g.author._id} type="button" onClick={() => { setActiveStoryGroup(g); setActiveStoryIndex(0); setStoryModalOpen(true); if (g.stories?.[0]) viewStory(g.stories[0]._id).catch(() => {}); }} className="flex-shrink-0 group">
                        <div className="h-15 w-15 rounded-full p-0.5 bg-gradient-to-br from-emerald-400 to-teal-500 group-hover:scale-105 transition-all">
                          <div className="h-full w-full rounded-full overflow-hidden bg-gray-900 border-2 border-gray-900">
                            {g.author.avatarUrl ? <img src={g.author.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center bg-gray-800 text-sm font-semibold text-white">{g.author.username?.[0]?.toUpperCase()}</div>}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2 text-center truncate max-w-16 font-semibold">{g.author.username}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Story Modal */}
                {storyModalOpen && activeStoryGroup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="relative max-w-lg w-full bg-gray-950/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500">
                            {activeStoryGroup.author.avatarUrl ? <img src={activeStoryGroup.author.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-white font-semibold">{activeStoryGroup.author.username?.[0]?.toUpperCase()}</div>}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{activeStoryGroup.author.username}</div>
                            <div className="text-xs text-gray-500">{activeStoryGroup.stories?.[activeStoryIndex] && new Date(activeStoryGroup.stories[activeStoryIndex].createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <button onClick={() => setStoryModalOpen(false)} className={UI.btnGhost}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                      <div className="relative aspect-[9/16] max-h-[60vh] bg-black flex items-center justify-center">
                        {activeStoryGroup.stories?.[activeStoryIndex] && <img src={activeStoryGroup.stories[activeStoryIndex].mediaUrl} alt="" className="max-h-full max-w-full object-contain" />}
                      </div>
                      <div className="flex items-center justify-between p-4 border-t border-white/10">
                        <button type="button" onClick={() => setActiveStoryIndex(i => Math.max(0, i - 1))} disabled={activeStoryIndex === 0} className={`${UI.btnSecondary} disabled:opacity-50`}>← Prev</button>
                        <div className="flex gap-1">{activeStoryGroup.stories?.map((_, i) => <div key={i} className={`h-1 w-8 rounded-full ${i === activeStoryIndex ? 'bg-emerald-500' : 'bg-gray-700'}`} />)}</div>
                        <button type="button" onClick={() => setActiveStoryIndex(i => Math.min((activeStoryGroup.stories?.length || 1) - 1, i + 1))} disabled={activeStoryIndex === (activeStoryGroup.stories?.length || 1) - 1} className={`${UI.btnSecondary} disabled:opacity-50`}>Next →</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Your Feed</h2>
                  <span className="text-sm text-gray-500">Posts from you and people you follow</span>
                </div>

                {loadingFeed ? (
                  <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
                ) : safeFeed.length === 0 ? (
                  <div className={`${UI.surface} text-center py-12`}><div className="text-4xl mb-3">📭</div><p className="text-gray-400">No posts yet. Follow creators!</p></div>
                ) : (
                  <div className="space-y-4">
                    {safeFeed.map(post => {
                      const isSaved = savedIds.includes(post._id);
                      return (
                        <article key={post._id} className="bg-gray-900/45 backdrop-blur-xl border border-gray-800/60 rounded-3xl overflow-hidden hover:border-gray-700/70 transition-all">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                                {post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" className="h-full w-full object-cover" /> : post.author?.username?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-white">{post.author?.username}</span>
                                <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/15 text-emerald-300 rounded-full">{post.author?.role}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(post.author?._id === currentUser.id || currentUser.role === 'admin') && <button onClick={() => handleDeletePost(post._id)} className={UI.btnDanger}>Delete</button>}
                              {post.author?._id && post.author._id !== currentUser.id && (
                                <button onClick={() => handleToggleFollow(post.author._id)} className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all ${me?.following?.includes(post.author._id) ? 'bg-gray-800/70 border-gray-700/60 text-gray-200' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'}`}>
                                  {me?.following?.includes(post.author._id) ? 'Following' : 'Follow'}
                                </button>
                              )}
                            </div>
                          </div>
                          {post.imageUrl && <div className="border-y border-gray-800/60"><img src={post.imageUrl} alt="" className="w-full max-h-[520px] object-cover" /></div>}
                          <div className="p-4 space-y-3">
                            {post.caption && <p className="text-gray-200">{post.caption}</p>}
                            <div className="flex items-center gap-3 pt-2">
                              <button onClick={() => handleLike(post._id)} className={`${UI.pill} text-gray-200`}><span className="text-xl">❤️</span><span className="text-sm font-bold">{post.likes?.length || 0}</span></button>
                              <button onClick={() => handleShare(post)} className={`${UI.pill} text-gray-200`}><span className="text-xl">↗️</span><span className="text-sm font-bold">{post.shares || 0}</span></button>
                              <button onClick={() => handleToggleSave(post._id)} className={`${UI.pill} ml-auto text-gray-200`}><span className="text-xl">{isSaved ? '⭐' : '☆'}</span></button>
                            </div>
                            {post.comments?.length > 0 && (
                              <div className="space-y-2 pt-3 border-t border-gray-800/60 max-h-32 overflow-y-auto">
                                {post.comments.map(c => <div key={c._id || c.createdAt} className="text-sm"><span className="font-semibold text-white mr-2">{c.user?.username}</span><span className="text-gray-400">{c.text}</span></div>)}
                              </div>
                            )}
                            <form className="flex items-center gap-2 pt-2" onSubmit={async e => {
                              e.preventDefault();
                              const text = new FormData(e.target).get('text');
                              if (!text) return;
                              try { const res = await commentOnPost(post._id, text); setFeed(p => p.map(x => x._id === post._id ? { ...x, comments: [...(x.comments || []), res.data] } : x)); e.target.reset(); } catch {}
                            }}>
                              <input name="text" placeholder="Add a comment..." className={`flex-1 ${UI.input}`} />
                              <button type="submit" className={UI.btnPrimary}>Post</button>
                            </form>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CREATE */}
            {view === VIEW_CREATE && (
              <div className="max-w-xl mx-auto">
                <div className={`${UI.surface} p-6`}>
                  <h2 className="text-xl font-bold text-white mb-6">Create Post</h2>
                  {user.role !== 'creator' && user.role !== 'admin' ? (
                    <div className="text-center py-8"><div className="text-4xl mb-3">🎨</div><p className="text-gray-400">Only creators and admins can create posts.</p></div>
                  ) : (
                    <form onSubmit={handleCreatePost} className="space-y-5">
                      <div><label className="block text-sm font-semibold text-gray-300 mb-2">Caption</label><textarea name="caption" rows={4} placeholder="Write something..." className={`${UI.input} resize-none`} /></div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Image</label>
                        <input type="file" accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-emerald-500/15 file:text-emerald-200 cursor-pointer" onChange={e => {
                          const f = e.target.files?.[0]; if (!f) { setCreateImageDataUrl(null); return; }
                          const r = new FileReader(); r.onload = () => setCreateImageDataUrl(r.result); r.readAsDataURL(f);
                        }} />
                        {createImageDataUrl && (
                          <div className="mt-4 relative">
                            <img src={createImageDataUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-2xl border border-gray-700/60" />
                            <button type="button" onClick={() => setCreateImageDataUrl(null)} className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 text-white">✕</button>
                          </div>
                        )}
                      </div>
                      <button type="submit" className={`w-full py-3.5 ${UI.btnPrimary}`}>Publish Post</button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* SAVED */}
            {view === VIEW_SAVED && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Saved Posts</h2>
                {savedPosts.length === 0 ? (
                  <div className={`${UI.surface} text-center py-12`}><div className="text-4xl mb-3">⭐</div><p className="text-gray-400">No saved posts yet.</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedPosts.map(post => (
                      <article key={post._id} className="bg-gray-900/45 border border-gray-800/60 rounded-3xl overflow-hidden">
                        {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full h-48 object-cover" />}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
                              {post.author?.avatarUrl ? <img src={post.author.avatarUrl} alt="" className="h-full w-full object-cover" /> : post.author?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-semibold text-white text-sm">{post.author?.username}</span>
                          </div>
                          {post.caption && <p className="text-gray-400 text-sm line-clamp-2">{post.caption}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MESSAGES */}
            {view === VIEW_MESSAGES && (
              <div className="h-[calc(100vh-180px)] md:h-[600px]">
                <Messages currentUser={{ id: user.id || user._id, _id: user.id || user._id, username: user.username, avatarUrl: user.avatarUrl || me?.avatarUrl }} socket={socket} />
              </div>
            )}

            {/* PROFILE */}
            {view === VIEW_PROFILE && (
              <div className="space-y-6">
                <div className={`${UI.surface} p-6`}>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5">
                          <div className="h-full w-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            {displayedUser?.avatarUrl ? <img src={displayedUser.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-3xl font-black text-white">{displayedUser?.username?.[0]?.toUpperCase()}</span>}
                          </div>
                        </div>
                        {me && displayedUser && (me._id || me.id)?.toString() === (displayedUser._id || displayedUser.id)?.toString() && (
                          <label className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-emerald-400">
                            <span className="text-sm font-bold">+</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                          </label>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-center">
                        <div><div className="text-xl font-bold text-white">{profilePosts?.length || 0}</div><div className="text-xs text-gray-500">Posts</div></div>
                        <div><div className="text-xl font-bold text-white">{displayedFollowers?.length || 0}</div><div className="text-xs text-gray-500">Followers</div></div>
                        <div><div className="text-xl font-bold text-white">{displayedFollowing?.length || 0}</div><div className="text-xs text-gray-500">Following</div></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div><h1 className="text-2xl font-bold text-white">{displayedUser?.username}</h1><p className="text-gray-500 text-sm">{displayedUser?.email}</p></div>
                        {me && displayedUser && (me._id || me.id)?.toString() === (displayedUser._id || displayedUser.id)?.toString() ? (
                          <button onClick={() => setIsEditingProfile(v => !v)} className={UI.btnSecondary}>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleToggleFollow(displayedUser._id || displayedUser.id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold border transition-all ${me?.following?.includes((displayedUser._id || displayedUser.id)?.toString()) ? 'bg-gray-800/70 border-gray-700/60 text-white' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-100'}`}>
                              {me?.following?.includes((displayedUser._id || displayedUser.id)?.toString()) ? 'Following' : 'Follow'}
                            </button>
                            <button onClick={() => openChat(displayedUser)} className={UI.btnSecondary}>Message</button>
                          </div>
                        )}
                      </div>
                      {!isEditingProfile && <p className="text-gray-300 whitespace-pre-wrap">{me?.bio || 'Add a bio to tell people about yourself.'}</p>}
                      {isEditingProfile && (
                        <form onSubmit={handleProfileSave} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-semibold text-gray-400 mb-1">Username</label><input name="username" value={profileForm.username} onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))} className={UI.input} /></div>
                            <div><label className="block text-xs font-semibold text-gray-400 mb-1">Email</label><input type="email" name="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className={UI.input} /></div>
                          </div>
                          <div><label className="block text-xs font-semibold text-gray-400 mb-1">New Password</label><input type="password" value={profileForm.password} onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current" className={UI.input} /></div>
                          <div><label className="block text-xs font-semibold text-gray-400 mb-1">Bio</label><textarea rows={3} value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} className={`${UI.input} resize-none`} /></div>
                          <button type="submit" className={UI.btnPrimary}>Save Changes</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`${UI.surface} p-6`}>
                  <h3 className="text-lg font-bold text-white mb-4">Posts by {displayedUser?.username}</h3>
                  {!profilePosts?.length ? (
                    <div className="text-center py-8"><div className="text-3xl mb-2">📷</div><p className="text-gray-500">No posts yet</p></div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {profilePosts.map(p => (
                        <div key={p._id} className="aspect-square rounded-2xl overflow-hidden bg-gray-900/40 border border-gray-800/60">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center p-4"><p className="text-gray-400 text-sm text-center line-clamp-4">{p.caption}</p></div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN */}
            {view === VIEW_ADMIN && user.role === 'admin' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats ? (
                    <>
                      <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-3xl p-5"><div className="text-3xl font-bold text-white">{stats.users}</div><div className="text-emerald-300 text-sm font-semibold mt-1">Total Users</div></div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-3xl p-5"><div className="text-3xl font-bold text-white">{stats.posts}</div><div className="text-blue-300 text-sm font-semibold mt-1">Total Posts</div></div>
                      <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 rounded-3xl p-5"><div className="text-3xl font-bold text-white">{stats.likes}</div><div className="text-pink-300 text-sm font-semibold mt-1">Total Likes</div></div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/30 rounded-3xl p-5"><div className="text-3xl font-bold text-white">{stats.messages}</div><div className="text-purple-300 text-sm font-semibold mt-1">Messages</div></div>
                    </>
                  ) : <div className="col-span-full flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}
                </div>
                {stats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`${UI.surface} p-5`}>
                      <h3 className="font-semibold text-white mb-4">Users by Role</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-gray-400">Consumers</span><span className="text-white font-semibold">{stats.roles?.consumer || 0}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Creators</span><span className="text-white font-semibold">{stats.roles?.creator || 0}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Admins</span><span className="text-white font-semibold">{stats.roles?.admin || 0}</span></div>
                      </div>
                    </div>
                    <div className={`${UI.surface} p-5`}>
                      <h3 className="font-semibold text-white mb-4">Engagement</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-gray-400">Comments</span><span className="text-white font-semibold">{stats.comments || 0}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Shares</span><span className="text-white font-semibold">{stats.shares || 0}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className={`${UI.surface} p-4`}>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><span>🔍</span><span>Find People</span></h3>
                <SearchUsers onSelect={openChat} me={me} onToggleFollow={handleToggleFollow} onViewProfile={openProfile} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-gray-800/50 bg-gray-950 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white">PX</div><span className="text-sm text-gray-500 font-semibold">Pixalio</span></div>
          <div className="flex items-center gap-6 text-sm text-gray-500"><button className="hover:text-emerald-400">Explore</button><button className="hover:text-emerald-400">Privacy</button><button className="hover:text-emerald-400">Help</button></div>
          <div className="text-sm text-gray-600">© {new Date().getFullYear()} Pixalio</div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { localStorage.clear(); return null; } });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) { socket?.disconnect(); setSocket(null); return; }
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    const s = io(base, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  const handleAuth = (tok, u) => { setToken(tok); setUser(u); };
  const handleLogout = () => { localStorage.clear(); setToken(null); setUser(null); };

  if (!token || !user) return <AuthView onAuth={handleAuth} />;
  return <AppShell user={user} onLogout={handleLogout} socket={socket} />;
}

export default App;