import React, { useEffect, useState } from 'react';
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
  getUserStories,
  createStory,
  viewStory,
  getMessages,
  sendMessage,
  updateMe,
  getAdminStats,
  toggleFollow,
  deletePost
} from './api';
import Messages from './components/Messages';

const VIEW_HOME = 'home';
const VIEW_CREATE = 'create';
const VIEW_SAVED = 'saved';
const VIEW_MESSAGES = 'messages';
const VIEW_PROFILE = 'profile';
const VIEW_ADMIN = 'admin';

function AuthView({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'consumer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Basic validation
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
      const errorMsg = err.response?.data?.message || err.message || 'Authentication failed. Please try again.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-black to-emerald-950 relative overflow-hidden px-4 py-8">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Main card */}
        <div className="bg-gradient-to-br from-slate-900/80 to-black/80 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl">
          
          {/* Logo and title */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-extrabold text-black text-2xl shadow-lg shadow-emerald-500/40 mb-4 transform hover:scale-105 transition-transform">
              ✨
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white text-center">Pixalio</h1>
            <p className="text-emerald-300/80 text-sm mt-2 text-center">Share, Connect & Create</p>
          </div>

          {/* Tab switcher - Modern style */}
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                !isSignup 
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setError(''); }}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                isSignup 
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username field - only on signup */}
            {isSignup && (
              <div className="group">
                <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500">👤</span>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:bg-slate-800/80 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div className="group">
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">📧</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:bg-slate-800/80 transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="group">
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">🔐</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:bg-slate-800/80 transition-all"
                />
              </div>
            </div>

            {/* Account type - only on signup */}
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-3">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: 'consumer' }))}
                    className={`py-3 rounded-xl font-medium text-sm transition-all duration-300 border ${
                      form.role === 'consumer'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    👁️ Consumer
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: 'creator' }))}
                    className={`py-3 rounded-xl font-medium text-sm transition-all duration-300 border ${
                      form.role === 'creator'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    🎬 Creator
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/50 text-red-300 text-sm animate-shake">
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <strong>Oops!</strong>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:from-emerald-400 hover:to-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Loading...
                </>
              ) : (
                <>
                  {isSignup ? '🚀 Create Account' : '✨ Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Footer text */}
          <p className="text-center text-xs text-slate-500 mt-6">
            {isSignup 
              ? "Already have an account? Click 'Log In' above" 
              : "Don't have an account? Click 'Sign Up' above"}
          </p>
        </div>
      </div>
    </div>
  );
}

function AppShell({ user, onLogout, socket }) {
  const [view, setView] = useState(VIEW_HOME);
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageFilter, setMessageFilter] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [pendingMedia, setPendingMedia] = useState(null);
  const [stats, setStats] = useState(null);
  const [me, setMe] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: user.username, email: user.email, password: '', bio: '' });
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const raw = localStorage.getItem('pixalio_saved_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [createImageDataUrl, setCreateImageDataUrl] = useState(null);
  const [profileUser, setProfileUser] = useState(null); // { user, posts }
  const [stories, setStories] = useState([]); // grouped by author
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [newStoryDataUrl, setNewStoryDataUrl] = useState(null);
  const [headerQ, setHeaderQ] = useState('');
  const [headerResults, setHeaderResults] = useState([]);
  const [headerLoading, setHeaderLoading] = useState(false);
  const [showHeaderResults, setShowHeaderResults] = useState(false);

  // Load full user info
  useEffect(() => {
    getMe()
      .then((res) => {
        // Normalize follower/following IDs to strings for easy comparison
        const normalized = {
          ...res.data,
          followers: (res.data.followers || []).map((id) => id.toString()),
          following: (res.data.following || []).map((id) => id.toString())
        };
        setMe(normalized);
        setProfileForm((prev) => ({
          ...prev,
          username: normalized.username,
          email: normalized.email,
          bio: normalized.bio || ''
        }));
      })
      .catch(() => {});
  }, []);

  const refreshFeed = async () => {
    try {
      setLoadingFeed(true);
      const res = await getFeed();
      setFeed(res.data || []);
    } catch {
      setFeed([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Load feed when visiting Home, Saved or Profile so profile posts are visible
  useEffect(() => {
    if (view === VIEW_HOME || view === VIEW_SAVED || view === VIEW_PROFILE) {
      refreshFeed();
    }
  }, [view]);

  // Header search debounce
  useEffect(() => {
    let active = true;
    let timer = null;
    const doSearch = async () => {
      if (!headerQ || headerQ.trim() === '') {
        setHeaderResults([]);
        setHeaderLoading(false);
        return;
      }
      try {
        setHeaderLoading(true);
        const res = await searchUsers(headerQ.trim());
        if (!active) return;
        setHeaderResults(res.data || []);
      } catch (err) {
        if (!active) return;
        setHeaderResults([]);
      } finally {
        if (active) setHeaderLoading(false);
      }
    };
    // debounce
    timer = setTimeout(doSearch, 220);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [headerQ]);

  useEffect(() => {
    if (view === VIEW_ADMIN && user.role === 'admin') {
      getAdminStats()
        .then((res) => setStats(res.data))
        .catch(() => setStats(null));
    }
  }, [view, user.role]);

  const [unreadCounts, setUnreadCounts] = useState({}); // otherUserId -> count
  const [followingUsers, setFollowingUsers] = useState([]);

  // When "me" is loaded or updated, fetch a lightweight list of people we follow
  useEffect(() => {
    if (!me || !Array.isArray(me.following) || me.following.length === 0) {
      setFollowingUsers([]);
      return;
    }
    let active = true;
    searchUsers('')
      .then((res) => {
        if (!active) return;
        const ids = new Set(me.following);
        const list = res.data.filter((u) => ids.has(u._id));
        setFollowingUsers(list);
      })
      .catch(() => {
        if (!active) return;
        setFollowingUsers([]);
      });
    return () => {
      active = false;
    };
  }, [me]);

  // Load stories when home view loads
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getStories();
        if (!active) return;
        setStories(res.data || []);
      } catch (err) {
        if (!active) return;
        setStories([]);
      }
    };
    if (view === VIEW_HOME) load();

    // subscribe to real-time story creation
    if (socket) {
      const handler = (payload) => {
        // refresh
        load();
      };
      socket.on('story:created', handler);
      return () => {
        active = false;
        socket.off('story:created', handler);
      };
    }
    return () => {
      active = false;
    };
  }, [view, socket]);

  // Open another user's profile (or refresh own) and switch to profile view
  const openProfile = async (u) => {
    try {
      const id = u._id || u.id;
      const res = await getUserProfile(id);
      setProfileUser(res.data);
      setView(VIEW_PROFILE);
    } catch (err) {
      console.error(err);
      alert('Failed to load profile');
    }
  };

  // Socket listener for real-time messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      const otherId = msg.from === user.id ? msg.to : msg.from;
      const isForThisChat =
        selectedUser &&
        ((msg.from === user.id && msg.to === (selectedUser._id || selectedUser.id)) ||
          (msg.to === user.id && msg.from === (selectedUser._id || selectedUser.id)));

      if (isForThisChat) {
        // Append to current chat
        setMessages((prev) => [...prev, msg]);
        // Mark this convo as read
        setUnreadCounts((prev) => ({ ...prev, [otherId]: 0 }));
      } else if (msg.to === user.id) {
        // Incoming message for another conversation -> increment unread
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.from]: (prev[msg.from] || 0) + 1
        }));
      }
    };
    socket.on('message:new', handler);
    const typingHandler = (p) => {
      if (!p || !p.from) return;
      setTypingUsers((prev) => ({ ...prev, [p.from]: !!p.typing }));
    };
    const readHandler = (p) => {
      if (!p || !p.from) return;
      // If someone read messages they were sent, clear unread for them
      setUnreadCounts((prev) => ({ ...prev, [p.from]: 0 }));
      // Update messages in current chat to mark read if needed
      setMessages((prev) => prev.map((m) => (m.from === p.from ? { ...m, read: true } : m)));
    };
    socket.on('typing', typingHandler);
    socket.on('message:read', readHandler);
    return () => socket.off('message:new', handler);
  }, [socket, selectedUser, user.id]);

  const handleLike = async (postId) => {
    try {
      await likePost(postId);
      refreshFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFollow = async (targetId) => {
    try {
      const res = await toggleFollow(targetId);
      setMe((prev) => (prev ? { ...prev, following: res.data.following } : prev));
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (post) => {
    try {
      const full = me || (await getMe().then((r) => r.data));
      if (!full || !Array.isArray(full.following) || full.following.length === 0) {
        alert('You are not following anyone yet to share this post with.');
        return;
      }
      const following = full.following;

      await Promise.all(
        following.map((id) =>
          sendMessage(id, {
            text: `shared a post: "${(post.caption || '').slice(0, 60)}"`,
            postId: post._id
          })
        )
      );
      await sharePost(post._id);
      refreshFeed();
      alert(`Shared with ${following.length} people you follow.`);
    } catch (err) {
      console.error(err);
      alert('Failed to share post.');
    }
  };

  const handleToggleSave = (postId) => {
    setSavedIds((prev) => {
      const set = new Set(prev);
      if (set.has(postId)) set.delete(postId);
      else set.add(postId);
      const arr = Array.from(set);
      localStorage.setItem('pixalio_saved_ids', JSON.stringify(arr));
      return arr;
    });
  };

  const openChat = async (u) => {
    setSelectedUser(u);
    setUnreadCounts((prev) => ({ ...prev, [u._id]: 0 }));
    try {
      const res = await getMessages(u._id || u.id);
      setMessages(res.data || []);
      // Mark messages in this convo as read on the server
      try {
        await markMessagesRead(u._id || u.id);
      } catch (err) {
        // ignore
      }
    } catch {
      setMessages([]);
    }
    setView(VIEW_MESSAGES);
  };

  let typingTimeout = null;
  const sendTyping = (to, typing) => {
    if (!socket) return;
    socket.emit('typing', { to, typing });
  };

  const handleInputChange = (val) => {
    setMessageText(val);
    if (!selectedUser) return;
    sendTyping(selectedUser._id || selectedUser.id, true);
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      sendTyping(selectedUser._id || selectedUser.id, false);
    }, 800);
  };

  const handleSend = async (e) => {
    e && e.preventDefault();
    if (!selectedUser) return;
    const toId = selectedUser._id || selectedUser.id;
    if (!messageText.trim() && !pendingMedia) return;
    const body = { text: messageText.trim() };
    if (pendingMedia) body.mediaUrl = pendingMedia;
    setMessageText('');
    setPendingMedia(null);
    try {
      await sendMessage(toId, body);
      // stop typing
      sendTyping(toId, false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const caption = formData.get('caption');
    const finalImageUrl = createImageDataUrl || '';
    if (!caption && !finalImageUrl) return;
    try {
      const res = await createPost({ caption, imageUrl: finalImageUrl });
      const newPost = res.data;
      setFeed((prev) => [newPost, ...prev]);
      e.target.reset();
      setCreateImageDataUrl(null);
      alert('Post added successfully');
      setView(VIEW_HOME);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: profileForm.username,
        email: profileForm.email,
        bio: profileForm.bio
      };
      if (profileForm.password && profileForm.password.trim()) {
        payload.password = profileForm.password.trim();
      }
      const res = await updateMe(payload);
      setMe(res.data);
      const updatedUser = { ...user, username: res.data.username, email: res.data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await updateMe({ avatarUrl: reader.result });
        setMe(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to update avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  const currentUser = me || user;
  const safeFeed = Array.isArray(feed)
    ? feed.filter((p) => p && p.author && p.author._id)
    : [];
  const savedPosts = safeFeed.filter((p) => savedIds.includes(p._id));
  // When viewing someone else's profile, `profileUser` holds { user, posts }
  const displayedUser = profileUser?.user || me || user;
  const displayedFollowers = profileUser?.user?.followers || me?.followers || [];
  const displayedFollowing = profileUser?.user?.following || me?.following || [];
  const profilePosts = profileUser?.posts || safeFeed.filter((p) => {
    try {
      const aid = p.author && (p.author._id || p.author);
      return aid && displayedUser && (aid.toString ? aid.toString() === (displayedUser._id || displayedUser.id).toString() : aid === (displayedUser._id || displayedUser.id));
    } catch (e) {
      return false;
    }
  });
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      setFeed((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-slate-950 to-black text-slate-50">
      <header className="sticky top-0 z-30 bg-black/50 backdrop-blur-sm border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: logo */}
          <div className="flex items-center gap-3">
            <button type="button" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-extrabold text-black text-lg shadow-md group-hover:scale-105 transition-transform">
                PX
              </div>
              <div className="hidden sm:block">
                <div className="text-sm sm:text-base font-bold tracking-wide uppercase text-emerald-100">pixalio</div>
                <div className="text-[11px] text-slate-400">Create · Discover · Share</div>
              </div>
            </button>
          </div>

          {/* Center: global search */}
          <div className="flex-1 px-4">
            <div className="max-w-xl mx-auto relative">
                <input
                  value={headerQ}
                  onChange={(e) => { setHeaderQ(e.target.value); setShowHeaderResults(true); }}
                  onFocus={() => setShowHeaderResults(true)}
                  placeholder="Search people, posts..."
                  className="w-full rounded-full bg-slate-900/60 border border-slate-800/60 px-4 py-2 text-sm placeholder:text-slate-500 text-slate-100 shadow-sm"
                />

                {/* Search dropdown */}
                {showHeaderResults && (
                  <div className="absolute left-0 right-0 mt-2 bg-slate-950/95 border border-slate-800 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                    <div className="p-2">
                      {headerLoading && <div className="text-xs text-slate-400 px-2 py-2">Searching...</div>}
                      {!headerLoading && headerResults.length === 0 && (
                        <div className="text-xs text-slate-500 px-2 py-2">No results</div>
                      )}
                      {!headerLoading && headerResults.map((u) => (
                        <div key={u._id} className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-slate-900/60 rounded">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-[12px] font-semibold">{u.avatarUrl ? <img src={u.avatarUrl} alt="a" className="h-full w-full object-cover" /> : (u.username||'?')[0]?.toUpperCase()}</div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{u.username}</div>
                              <div className="text-[11px] text-slate-500 truncate">{u.role}</div>
                            </div>
                          </div>
                            <div className="flex items-center gap-2">
                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); setShowHeaderResults(false); openProfile(u); }}
                                className="text-[11px] px-2 py-1 rounded bg-slate-800/60"
                              >
                                View
                              </button>

                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); setShowHeaderResults(false); openChat(u); }}
                                className="text-[11px] px-2 py-1 rounded bg-emerald-500 text-black"
                              >
                                Message
                              </button>

                              <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); handleToggleFollow(u._id); }}
                                className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/60"
                              >
                                {me?.following?.includes(u._id) ? 'Following' : 'Follow'}
                              </button>
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          </div>

          {/* Right: user actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-full px-3 py-1 text-xs text-slate-200"
              onClick={() => setView(VIEW_CREATE)}
            >
              <span className="text-[13px]">➕</span>
              <span className="font-semibold">Create</span>
            </button>

            <div className="flex items-center gap-2 bg-black/40 border border-slate-800 rounded-full px-2 py-1">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold overflow-hidden">
                {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="me" className="h-full w-full object-cover" /> : (currentUser.username?.[0]?.toUpperCase() || '?')}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium">{currentUser.username}</span>
                <span className="text-[10px] text-slate-400">{currentUser.role}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="ml-3 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-semibold hover:bg-emerald-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 flex gap-1 px-2 py-2 z-40">
        <button type="button" onClick={() => setView(VIEW_HOME)} className={`flex-1 py-2 rounded-lg text-lg ${view === VIEW_HOME ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}>🏠</button>
        <button type="button" onClick={() => setView(VIEW_CREATE)} className={`flex-1 py-2 rounded-lg text-lg ${view === VIEW_CREATE ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}>➕</button>
        <button type="button" onClick={() => setView(VIEW_SAVED)} className={`flex-1 py-2 rounded-lg text-lg ${view === VIEW_SAVED ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}>★</button>
        <button type="button" onClick={() => setView(VIEW_MESSAGES)} className={`flex-1 py-2 rounded-lg text-lg relative ${view === VIEW_MESSAGES ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}>
          💬
          {totalUnread > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{totalUnread}</span>}
        </button>
        <button type="button" onClick={() => setView(VIEW_PROFILE)} className={`flex-1 py-2 rounded-lg text-lg ${view === VIEW_PROFILE ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}>👤</button>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 flex flex-col md:grid md:grid-cols-[220px_minmax(0,1.8fr)_minmax(0,1.1fr)] gap-3 sm:gap-4 pb-20 md:pb-4">
        <aside className="hidden md:flex flex-col gap-2 text-sm">
          <button
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl border text-sm mb-1 flex items-center gap-2 ${
              view === VIEW_HOME
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                : 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
            }`}
            onClick={() => setView(VIEW_HOME)}
          >
            <span className="text-lg">🏠</span>
            <span className="font-semibold tracking-wide">Home</span>
          </button>
          <button
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl border text-sm mb-1 flex items-center gap-2 ${
              view === VIEW_CREATE
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                : 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
            }`}
            onClick={() => setView(VIEW_CREATE)}
          >
            <span className="text-lg">➕</span>
            <span className="font-semibold tracking-wide">Post</span>
          </button>
          <button
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl border text-sm mb-1 flex items-center gap-2 ${
              view === VIEW_SAVED
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                : 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
            }`}
            onClick={() => setView(VIEW_SAVED)}
          >
            <span className="text-lg">★</span>
            <span className="font-semibold tracking-wide">Saved</span>
          </button>
          <button
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl border text-sm mb-1 flex items-center gap-2 ${
              view === VIEW_MESSAGES
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                : 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
            }`}
            onClick={() => setView(VIEW_MESSAGES)}
          >
            <span className="text-lg">💬</span>
            <span className="font-semibold tracking-wide">Messages{totalUnread > 0 ? ` (${totalUnread})` : ''}</span>
          </button>
          <button
            type="button"
            className={`w-full text-left px-3 py-2 rounded-xl border text-sm mb-1 flex items-center gap-2 ${
              view === VIEW_PROFILE
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                : 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
            }`}
            onClick={() => setView(VIEW_PROFILE)}
          >
            <span className="text-lg">👤</span>
            <span className="font-semibold tracking-wide">Profile</span>
          </button>
          {user.role === 'admin' && (
            <button
              type="button"
              className={`w-full text-left px-3 py-2 rounded-xl border text-sm mb-1 flex items-center gap-2 ${
                view === VIEW_ADMIN
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
              }`}
              onClick={() => setView(VIEW_ADMIN)}
            >
              <span className="text-lg">🛡️</span>
              <span className="font-semibold tracking-wide">Admin</span>
            </button>
          )}
        </aside>

        <section className="min-h-[60vh] space-y-4">
          {view === VIEW_HOME && (
            <>
              {/* Stories carousel */}
              <div className="mb-3">
                <div className="flex items-center gap-3 overflow-x-auto py-2">
                  {/* Your story creation card */}
                  <div className="flex-shrink-0 w-20 text-center">
                    <label className="block cursor-pointer">
                      <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black font-bold shadow-md">
                        +
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          const r = new FileReader();
                          r.onload = () => setNewStoryDataUrl(r.result);
                          r.readAsDataURL(f);
                        }}
                      />
                      <div className="text-[11px] text-slate-400 mt-1">Your story</div>
                    </label>
                    {newStoryDataUrl && (
                      <div className="mt-2 text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await createStory({ mediaUrl: newStoryDataUrl, mediaType: 'image' });
                              setNewStoryDataUrl(null);
                              const res = await getStories();
                              setStories(res.data || []);
                              alert('Story posted');
                            } catch (err) {
                              console.error(err);
                              alert('Failed to post story');
                            }
                          }}
                          className="mt-1 rounded-full bg-emerald-500 text-black px-3 py-1 text-xs"
                        >
                          Post
                        </button>
                      </div>
                    )}
                  </div>
                  {stories.map((g) => (
                    <button
                      key={g.author._id}
                      type="button"
                      onClick={() => {
                        setActiveStoryGroup(g);
                        setActiveStoryIndex(0);
                        setStoryModalOpen(true);
                        // mark first story viewed
                        if (g.stories && g.stories[0]) viewStory(g.stories[0]._id).catch(() => {});
                      }}
                      className="flex-shrink-0 w-20 text-center"
                    >
                      <div className="h-16 w-16 mx-auto rounded-full overflow-hidden border-2 border-emerald-400">
                        {g.author.avatarUrl ? (
                          <img src={g.author.avatarUrl} alt={g.author.username} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-slate-800 text-xs font-semibold">{g.author.username?.[0]?.toUpperCase() || '?'}</div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate mt-1">{g.author.username}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Story modal viewer */}
              {storyModalOpen && activeStoryGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                  <div className="relative max-w-3xl w-full mx-4 bg-black rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-800">
                          {activeStoryGroup.author.avatarUrl ? <img src={activeStoryGroup.author.avatarUrl} alt="a" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center">{activeStoryGroup.author.username?.[0]?.toUpperCase()}</div>}
                        </div>
                        <div>
                          <div className="font-semibold">{activeStoryGroup.author.username}</div>
                          <div className="text-[11px] text-slate-400">{(activeStoryGroup.stories && activeStoryGroup.stories[activeStoryIndex] && new Date(activeStoryGroup.stories[activeStoryIndex].createdAt).toLocaleString()) || ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-slate-300" onClick={() => setStoryModalOpen(false)}>Close</button>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-black">
                      {activeStoryGroup.stories && activeStoryGroup.stories[activeStoryIndex] && (
                        <img src={activeStoryGroup.stories[activeStoryIndex].mediaUrl} alt="story" className="max-h-[70vh] w-auto mx-auto" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStoryIndex((i) => Math.max(0, i - 1));
                        }}
                        className="px-3 py-1 rounded bg-slate-900/60"
                      >Prev</button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveStoryIndex((i) => Math.min((activeStoryGroup.stories||[]).length - 1, i + 1));
                        }}
                        className="px-3 py-1 rounded bg-slate-900/60"
                      >Next</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm sm:text-base font-semibold">Home</h2>
                <span className="text-[11px] text-slate-400">Posts from you and people you follow</span>
              </div>
              {loadingFeed ? (
                <p className="text-xs text-slate-400">Loading feed...</p>
              ) : feed.length === 0 ? (
                <p className="text-xs text-slate-400">No posts yet. Creators can add posts from the Create tab.</p>
              ) : (
                <div className="space-y-3">
                  {safeFeed.map((post) => {
                    const likedCount = post.likes?.length || 0;
                    const isSaved = savedIds.includes(post._id);
                    return (
                      <article
                        key={post._id}
                        className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center text-xs font-semibold">
                            {post.author?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[13px]">{post.author?.username || 'user'}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/60">
                                {post.author?.role || 'creator'}
                              </span>
                            </div>
                          </div>
                          {(post.author?._id === currentUser.id || currentUser.role === 'admin') && (
                            <button
                              type="button"
                              onClick={() => handleDeletePost(post._id)}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/70 text-red-400"
                            >
                              Delete
                            </button>
                          )}
                          {/* Safely render follow button only when author exists and is not the current user */}
                          {post.author && post.author._id && post.author._id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleFollow(post.author._id)}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/60"
                            >
                              {me?.following?.includes(post.author._id) ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                        {post.imageUrl && (
                          <div className="mb-2">
                            <img
                              src={post.imageUrl}
                              alt="post"
                              className="w-full max-h-72 object-cover rounded-xl border border-slate-800"
                            />
                          </div>
                        )}
                        {post.caption && <p className="mb-2 text-[13px]">{post.caption}</p>}
                        <div className="flex items-center gap-3 text-[12px] mb-2">
                          <button type="button" onClick={() => handleLike(post._id)} className="flex items-center gap-1">
                            <span>❤️</span>
                            <span>{likedCount}</span>
                          </button>
                          <button type="button" onClick={() => handleShare(post)} className="flex items-center gap-1">
                            <span>⤴</span>
                            <span>{post.shares || 0}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSave(post._id)}
                            className="flex items-center gap-1 ml-auto"
                          >
                            <span>{isSaved ? '★' : '☆'}</span>
                            <span>Save</span>
                          </button>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto text-[11px]">
                          {Array.isArray(post.comments) &&
                            post.comments.map((c) => (
                              <div key={c._id || c.createdAt}>
                                <span className="font-semibold mr-1">{c.user?.username || 'user'}</span>
                                <span>{c.text}</span>
                              </div>
                            ))}
                        </div>
                        <form
                          className="mt-2 flex items-center gap-2 text-[11px]"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const fd = new FormData(e.target);
                            const text = fd.get('text');
                            if (!text) return;
                            try {
                              const res = await commentOnPost(post._id, text);
                              const newComment = res.data;
                              setFeed((prev) =>
                                prev.map((p) =>
                                  p._id === post._id
                                    ? { ...p, comments: [...(p.comments || []), newComment] }
                                    : p
                                )
                              );
                              e.target.reset();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <input
                            name="text"
                            placeholder="Add a comment..."
                            className="flex-1 rounded-full bg-black/50 border border-slate-700 px-3 py-1 text-[11px]"
                          />
                          <button type="submit" className="rounded-full bg-emerald-500 text-black font-semibold px-3 py-1">
                            Post
                          </button>
                        </form>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {view === VIEW_CREATE && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 text-sm max-w-xl">
              <h2 className="font-semibold text-base mb-3">Create post</h2>
              {user.role !== 'creator' && user.role !== 'admin' ? (
                <p className="text-xs text-slate-400">Only creators and admins can create posts.</p>
              ) : (
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs">Caption</label>
                    <textarea
                      name="caption"
                      rows={3}
                      className="w-full rounded-xl bg-black/70 border border-slate-700 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-emerald-200 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-black cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) {
                          setCreateImageDataUrl(null);
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCreateImageDataUrl(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {createImageDataUrl && (
                      <div className="mt-2">
                        <img
                          src={createImageDataUrl}
                          alt="preview"
                          className="w-full max-h-56 object-cover rounded-xl border border-slate-700"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-emerald-500 text-black font-semibold py-2 text-sm"
                  >
                    Post
                  </button>
                </form>
              )}
            </div>
          )}

          {view === VIEW_SAVED && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-sm">
              <h2 className="font-semibold mb-2 text-sm">Saved posts</h2>
              {savedPosts.length === 0 ? (
                <p className="text-xs text-slate-400">You have not saved any posts yet. Use the ☆ on posts to save them.</p>
              ) : (
                <div className="space-y-3">
                  {savedPosts.map((post) => (
                    <article
                      key={post._id}
                      className="bg-black/60 border border-slate-800 rounded-2xl p-3 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-semibold">
                          {post.author?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-[13px]">{post.author?.username || 'user'}</div>
                          <div className="text-[10px] text-slate-500">{post.author?.role || 'creator'}</div>
                        </div>
                      </div>
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          className="w-full max-h-64 object-cover rounded-xl border border-slate-800 mb-2"
                          alt="saved"
                        />
                      )}
                      {post.caption && <p className="mb-1 text-[13px]">{post.caption}</p>}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === VIEW_MESSAGES && (
            <div>
              {/* Mount the new Instagram-like messages UI component */}
              <React.Suspense fallback={<div className="text-xs text-slate-400">Loading messages UI...</div>}>
                <Messages users={users} currentUser={user} socket={socket} />
              </React.Suspense>
            </div>
          )}

          {view === VIEW_PROFILE && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-20 w-20">
                    <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-emerald-500/60">
                      {displayedUser?.avatarUrl ? (
                        <img src={displayedUser.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-semibold">{(displayedUser?.username || '?')[0].toUpperCase()}</span>
                      )}
                    </div>
                    {me && displayedUser && (me._id || me.id) && ((me._id || me.id).toString() === (displayedUser._id || displayedUser.id).toString()) && (
                      <>
                        <label
                          htmlFor="avatarUpload"
                          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-black border-2 border-emerald-400 text-emerald-200 text-lg flex items-center justify-center shadow-lg shadow-emerald-500/70 cursor-pointer"
                        >
                          +
                        </label>
                        <input
                          id="avatarUpload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>{displayedFollowers?.length || 0} followers</span>
                      <span>·</span>
                      <span>{displayedFollowing?.length || 0} following</span>
                    </div>
                    <div className="flex gap-2">
                      {displayedFollowers && displayedFollowers.slice(0,6).map((f) => (
                        <button
                          key={f._id}
                          type="button"
                          onClick={() => openProfile(f)}
                          className="h-7 w-7 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700"
                        >
                          {f.avatarUrl ? <img src={f.avatarUrl} alt={f.username} className="h-full w-full object-cover" /> : (f.username?.[0]?.toUpperCase() || '?')}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {displayedFollowing && displayedFollowing.slice(0,6).map((f) => (
                        <button
                          key={f._id}
                          type="button"
                          onClick={() => openProfile(f)}
                          className="h-7 w-7 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700"
                        >
                          {f.avatarUrl ? <img src={f.avatarUrl} alt={f.username} className="h-full w-full object-cover" /> : (f.username?.[0]?.toUpperCase() || '?')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <div className="font-semibold text-base">{displayedUser?.username}</div>
                      <div className="text-[11px] text-slate-500">{displayedUser?.email}</div>
                    </div>
                        {me && displayedUser && (me._id || me.id) && ((me._id || me.id).toString() === (displayedUser._id || displayedUser.id).toString()) && (
                          <button
                            type="button"
                            className="rounded-full border border-slate-700 px-3 py-1 text-[11px]"
                            onClick={() => setIsEditingProfile((v) => !v)}
                          >
                            {isEditingProfile ? 'Close' : 'Edit profile'}
                          </button>
                        )}
                        {!me || (displayedUser && (me._id || me.id).toString() !== (displayedUser._id || displayedUser.id).toString()) ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleFollow(displayedUser._id || displayedUser.id)}
                              className="rounded-full border border-emerald-500/60 px-3 py-1 text-[11px]"
                            >
                              {me?.following?.includes((displayedUser._id || displayedUser.id).toString()) ? 'Following' : 'Follow'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openChat(displayedUser)}
                              className="rounded-full bg-emerald-500 text-black px-3 py-1 text-[11px]"
                            >
                              Message
                            </button>
                          </div>
                        ) : null}
                  </div>
                  {!isEditingProfile && (
                    <div className="mt-1 text-[12px] text-slate-200 whitespace-pre-wrap">
                      {me?.bio || 'Add a short bio to tell people who you are.'}
                    </div>
                  )}
                  {isEditingProfile && (
                    <form onSubmit={handleProfileSave} className="mt-3 space-y-2 text-[12px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] mb-1 text-slate-300">Username</label>
                          <input
                            name="username"
                            value={profileForm.username}
                            onChange={handleProfileFormChange}
                            className="w-full rounded-xl bg-black/70 border border-slate-700 px-3 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] mb-1 text-slate-300">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={profileForm.email}
                            onChange={handleProfileFormChange}
                            className="w-full rounded-xl bg-black/70 border border-slate-700 px-3 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] mb-1 text-slate-300">New password</label>
                        <input
                          type="password"
                          name="password"
                          value={profileForm.password}
                          onChange={handleProfileFormChange}
                          placeholder="Leave blank to keep current"
                          className="w-full rounded-xl bg-black/70 border border-slate-700 px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] mb-1 text-slate-300">Bio</label>
                        <textarea
                          name="bio"
                          rows={3}
                          value={profileForm.bio}
                          onChange={handleProfileFormChange}
                          className="w-full rounded-xl bg-black/70 border border-slate-700 px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          className="rounded-full border border-slate-700 px-3 py-1 text-[11px]"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-full bg-emerald-500 text-black font-semibold px-3 py-1 text-[11px]"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-sm">
                <h3 className="font-semibold mb-2 text-sm">Posts by {displayedUser?.username}</h3>
                {(!profilePosts || profilePosts.length === 0) ? (
                  <p className="text-xs text-slate-400">No posts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profilePosts.map((p) => (
                      <article key={p._id} className="border border-slate-800 rounded-xl p-2 text-xs">
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            className="w-full max-h-56 object-cover rounded-lg border border-slate-800 mb-1"
                            alt="post"
                          />
                        )}
                        {p.caption && <p className="mb-1">{p.caption}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === VIEW_ADMIN && user.role === 'admin' && (
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                <h3 className="font-semibold mb-2 text-sm">Users</h3>
                {stats ? (
                  <ul className="space-y-1">
                    <li>Total: {stats.users}</li>
                    <li>Consumers: {stats.roles.consumer}</li>
                    <li>Creators: {stats.roles.creator}</li>
                    <li>Admins: {stats.roles.admin}</li>
                  </ul>
                ) : (
                  <p className="text-slate-400">Loading...</p>
                )}
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                <h3 className="font-semibold mb-2 text-sm">Posts & engagement</h3>
                {stats ? (
                  <ul className="space-y-1">
                    <li>Posts: {stats.posts}</li>
                    <li>Likes: {stats.likes}</li>
                    <li>Comments: {stats.comments}</li>
                    <li>Messages: {stats.messages}</li>
                  </ul>
                ) : (
                  <p className="text-slate-400">Loading...</p>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="hidden md:flex flex-col gap-3 text-xs">
          <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 shadow-[0_18px_40px_rgba(15,23,42,0.9)]">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                🔎
              </span>
              <span>Search people</span>
            </h3>
            <SearchUsers onSelect={openChat} me={me} onToggleFollow={handleToggleFollow} onViewProfile={openProfile} />
          </div>
        </aside>
      </main>

      <footer className="border-t border-slate-900/70 bg-black/95 text-[11px] text-slate-500 mt-4">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-black shadow-md shadow-emerald-500/40">
              PX
            </div>
            <span className="uppercase tracking-[0.18em] text-slate-500">pixalio</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <button type="button" className="hover:text-emerald-400 transition-colors">Explore</button>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <button type="button" className="hover:text-emerald-400 transition-colors">Privacy</button>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <button type="button" className="hover:text-emerald-400 transition-colors">Help</button>
          </div>
          <div className="text-[10px] text-slate-600">
            <span className="hidden sm:inline mr-1">Built for creators</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SearchUsers({ onSelect, me, onToggleFollow, onViewProfile }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await searchUsers(q);
        if (active) setResults(res.data);
      } catch {
        if (active) setResults([]);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [q]);

  return (
    <div className="space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by username"
        className="w-full rounded-lg bg-black/50 border border-slate-700 px-3 py-1 text-xs"
      />
      <div className="space-y-1 max-h-48 overflow-y-auto scroll-hide">
        {results.map((u) => (
          <div
            key={u._id}
            className="w-full text-left px-2 py-1 rounded-lg border border-slate-800 bg-black/60 hover:bg-black/80 text-xs flex items-center gap-2"
          >
            <button type="button" onClick={() => onSelect(u)} className="flex items-center gap-2 flex-1 text-left">
              <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-[11px] font-semibold text-slate-200">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.username} className="h-full w-full object-cover" />
                ) : (
                  u.username?.[0]?.toUpperCase() || '?'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.username}</div>
                <div className="text-[10px] text-slate-400 truncate">{u.role}</div>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow && onToggleFollow(u._id);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/60"
              >
                {me?.following?.includes(u._id) ? 'Following' : 'Follow'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect && onSelect(u);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-black"
              >
                Message
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile && onViewProfile(u);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      // If local data is corrupted, clear it so the app doesn't crash
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
    const s = io(base, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [token]);

  const handleAuth = (tok, u) => {
    setToken(tok);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <AuthView onAuth={handleAuth} />;
  }

  return <AppShell user={user} onLogout={handleLogout} socket={socket} />;
}

export default App;
