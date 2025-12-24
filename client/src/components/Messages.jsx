import React, { useEffect, useState, useRef } from 'react';
import MessageComposer from './MessageComposer';
import { getMessages, sendMessage, markMessagesRead, searchUsers, getConversations } from '../api';

export default function Messages({ users: propUsers, currentUser, socket }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pendingMedia, setPendingMedia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState({});
  const scrollRef = useRef();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      const convos = res.data || [];
      setConversations(convos);
      
      const counts = {};
      convos.forEach((c) => {
        const oderId = c.user._id || c.user.id;
        counts[oderId] = c.unreadCount || 0;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (m) => {
      const oderId = m.from === currentUser.id ? m.to : m.from;
      
      if (selectedUser && (selectedUser._id === oderId || selectedUser.id === oderId)) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === m._id)) return prev;
          return [...prev, m];
        });
        if (m.from !== currentUser.id) {
          markMessagesRead(oderId).catch(() => {});
        }
      } else if (m.to === currentUser.id) {
        setUnreadCounts((p) => ({ ...p, [m.from]: (p[m.from] || 0) + 1 }));
      }
      
      loadConversations();
    };
    
    const typingHandler = (p) => {
      if (!p || !p.from) return;
      setTypingUsers((prev) => ({ ...prev, [p.from]: !!p.typing }));
      setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [p.from]: false }));
      }, 3000);
    };
    
    const readHandler = (p) => {
      if (!p || !p.from) return;
      setUnreadCounts((prev) => ({ ...prev, [p.from]: 0 }));
      setMessages((prev) => prev.map((m) => 
        m.to === p.from ? { ...m, read: true } : m
      ));
    };
    
    socket.on('message:new', handleNewMessage);
    socket.on('typing', typingHandler);
    socket.on('message:read', readHandler);
    
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing', typingHandler);
      socket.off('message:read', readHandler);
    };
  }, [socket, selectedUser, currentUser.id]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(searchTerm);
        const filtered = (res.data || []).filter(
          (u) => u._id !== currentUser.id && u._id !== currentUser._id
        );
        setSearchResults(filtered);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchTerm, currentUser.id]);

  useEffect(() => {
    try { 
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); 
    } catch {}
  }, [messages]);

  const openConversation = async (u) => {
    const oderId = u._id || u.id;
    setSelectedUser(u);
    setShowConversationList(false);
    setSearchTerm('');
    setSearchResults([]);
    
    try {
      const res = await getMessages(oderId);
      setMessages(res.data || []);
      await markMessagesRead(oderId);
      setUnreadCounts((p) => ({ ...p, [oderId]: 0 }));
      setConversations((prev) => 
        prev.map((c) => 
          (c.user._id || c.user.id) === oderId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!selectedUser) return;
    const toId = selectedUser._id || selectedUser.id;
    if (!text.trim() && !pendingMedia) return;
    
    const body = { text: text.trim() };
    if (pendingMedia) body.mediaUrl = pendingMedia;
    
    setText('');
    setPendingMedia(null);
    
    try {
      await sendMessage(toId, body);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + (n || 0), 0);
  const displayList = searchTerm.trim() ? searchResults : conversations;

  return (
    <div className="h-[100dvh] md:h-[600px] w-full max-w-5xl mx-auto flex flex-col md:flex-row bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 md:rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      
      {(showConversationList || !selectedUser) && (
        <div className={`
          ${selectedUser ? 'absolute md:relative' : 'relative'} 
          z-20 w-full md:w-80 h-full 
          bg-gray-900/95 md:bg-gray-900/50 
          backdrop-blur-xl 
          border-r border-white/5
          flex flex-col
          transition-all duration-300
        `}>
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500 text-white rounded-full">
                    {totalUnread}
                  </span>
                )}
              </h1>
              <button 
                onClick={() => setSearchTerm(searchTerm ? '' : ' ')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search or start new chat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && !searchTerm ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : displayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 4H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a2 2 0 002-2V6a2 2 0 00-2-2z" />
                </svg>
                <p className="text-sm font-medium">
                  {searchTerm ? 'No users found' : 'No conversations yet'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {searchTerm ? 'Try a different search' : 'Search for users to start chatting'}
                </p>
              </div>
            ) : (
              displayList.map((item) => {
                const user = item.user || item;
                const oderId = user._id || user.id;
                const isSelected = selectedUser && (selectedUser._id === oderId || selectedUser.id === oderId);
                const unread = unreadCounts[oderId] || item.unreadCount || 0;
                const isTyping = typingUsers[oderId];
                const lastMessage = item.lastMessage;
                
                return (
                  <button
                    key={oderId}
                    onClick={() => openConversation(user)}
                    className={`
                      w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200
                      ${isSelected 
                        ? 'bg-emerald-500/20 border border-emerald-500/30' 
                        : 'hover:bg-white/5 border border-transparent'
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`
                        h-12 w-12 rounded-full overflow-hidden flex items-center justify-center text-base font-semibold
                        ${user.avatarUrl ? '' : 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white'}
                      `}>
                        {user.avatarUrl 
                          ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> 
                          : (user.username || '?')[0]?.toUpperCase()
                        }
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium truncate ${unread > 0 ? 'text-white' : 'text-gray-200'}`}>
                          {user.username}
                        </span>
                        {lastMessage && (
                          <span className="text-[10px] text-gray-500 flex-shrink-0">
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                        {isTyping ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="flex gap-0.5">
                              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                            </span>
                            typing...
                          </span>
                        ) : lastMessage ? (
                          <>
                            {lastMessage.post ? (
                              <span>📷 Shared a post</span>
                            ) : lastMessage.mediaUrl ? (
                              <span>🖼️ Sent an image</span>
                            ) : (
                              <>
                                {lastMessage.fromMe && <span className="text-gray-600">You: </span>}
                                {lastMessage.text}
                              </>
                            )}
                          </>
                        ) : (
                          user.role || 'Start a conversation'
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full bg-gray-950/50">
        
        {selectedUser && !showConversationList && (
          <div className="md:hidden absolute top-4 left-4 z-30">
            <button 
              type="button" 
              onClick={() => setShowConversationList(true)} 
              className="p-2 rounded-lg bg-gray-800/80 backdrop-blur-sm text-white hover:bg-gray-700 transition-all flex items-center gap-2 text-sm font-medium shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
        )}

        {selectedUser ? (
          <>
            <div className="flex-shrink-0 px-4 md:px-6 py-4 bg-gray-900/80 backdrop-blur-xl border-b border-white/5">
              <div className="flex items-center gap-4 md:ml-0 ml-16">
                <div className="relative">
                  <div className={`
                    h-11 w-11 rounded-full overflow-hidden flex items-center justify-center text-base font-semibold
                    ${selectedUser.avatarUrl ? '' : 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white'}
                  `}>
                    {selectedUser.avatarUrl 
                      ? <img src={selectedUser.avatarUrl} alt="" className="h-full w-full object-cover" /> 
                      : (selectedUser.username || '?')[0]?.toUpperCase()
                    }
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-900"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white truncate">{selectedUser.username}</h2>
                  <p className="text-xs text-gray-400">
                    {typingUsers[selectedUser._id || selectedUser.id] ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </span>
                        typing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                        Online
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <button className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Start the conversation</h3>
                  <p className="text-sm text-gray-500 max-w-xs">Say hello to {selectedUser.username}!</p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const mine = m.from === currentUser.id || m.from === currentUser._id;
                  const showAvatar = idx === 0 || messages[idx - 1].from !== m.from;
                  
                  return (
                    <div key={m._id || m.createdAt || idx} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine && showAvatar && (
                        <div className="flex-shrink-0 mr-2">
                          <div className={`
                            h-8 w-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold
                            ${selectedUser.avatarUrl ? '' : 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white'}
                          `}>
                            {selectedUser.avatarUrl 
                              ? <img src={selectedUser.avatarUrl} alt="" className="h-full w-full object-cover" /> 
                              : (selectedUser.username || '?')[0]?.toUpperCase()
                            }
                          </div>
                        </div>
                      )}
                      {!mine && !showAvatar && <div className="w-10" />}
                      
                      <div className="max-w-[80%] md:max-w-[70%] group">
                        {m.post && (
                          <div className={`mb-2 p-2 rounded-xl ${mine ? 'bg-emerald-600/30' : 'bg-gray-700/50'}`}>
                            {m.post.imageUrl && (
                              <img src={m.post.imageUrl} alt="" className="w-full max-w-48 h-24 object-cover rounded-lg mb-2" />
                            )}
                            <p className="text-xs text-gray-300 line-clamp-2">{m.post.caption || 'Shared post'}</p>
                          </div>
                        )}
                        
                        {m.mediaUrl && (
                          <div className={`mb-2 rounded-2xl overflow-hidden ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                            <img src={m.mediaUrl} alt="" className="max-h-64 w-auto object-cover" />
                          </div>
                        )}
                        
                        {m.text && (
                          <div className={`
                            px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed
                            ${mine 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md' 
                              : 'bg-gray-800 text-gray-100 rounded-bl-md'
                            }
                          `}>
                            <p className="break-words whitespace-pre-wrap">{m.text}</p>
                          </div>
                        )}
                        
                        <div className={`flex items-center gap-1.5 mt-1 text-[10px] text-gray-500 ${mine ? 'justify-end' : 'justify-start'}`}>
                          <span>{formatTime(m.createdAt)}</span>
                          {mine && (
                            <span className={m.read ? 'text-emerald-400' : 'text-gray-500'}>
                              {m.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            <div className="flex-shrink-0 p-4 md:p-6 bg-gray-900/80 backdrop-blur-xl border-t border-white/5">
              <MessageComposer 
                currentUser={currentUser} 
                toUser={selectedUser} 
                onSend={handleSend} 
                pendingMedia={pendingMedia} 
                setPendingMedia={setPendingMedia} 
                value={text} 
                onChange={setText} 
                socket={socket} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
              <p className="text-gray-400 mb-6">Select a conversation or search for someone to start chatting</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-gray-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Choose from sidebar
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}