import React, { useEffect, useState, useRef } from 'react';
import ConversationList from './ConversationList';
import MessageComposer from './MessageComposer';
import { getMessages, sendMessage, markMessagesRead, searchUsers } from '../api';

export default function Messages({ users: propUsers, currentUser, socket }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pendingMedia, setPendingMedia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [users, setUsers] = useState(propUsers || []);
  const [showConversationList, setShowConversationList] = useState(true);
  const originalUsersRef = React.useRef(propUsers || []);
  const searchTimerRef = React.useRef(null);
  const reqIdRef = React.useRef(0);
  const [typingUsers, setTypingUsers] = useState({});
  const scrollRef = useRef();

  useEffect(() => {
    if (!socket) return;
    const handler = (m) => {
      // If message belongs to current open convo, append
      const otherId = (m.from === currentUser.id) ? m.to : m.from;
      setUnreadCounts((p) => ({ ...p, [otherId]: (p[otherId] || 0) + 1 }));
      if (selectedUser && (selectedUser._id === otherId || selectedUser.id === otherId)) {
        setMessages((prev) => [...prev, m]);
        // mark read
        markMessagesRead(otherId).catch(() => {});
        setUnreadCounts((p) => ({ ...p, [otherId]: 0 }));
      }
    };
    const typingHandler = (p) => {
      setTypingUsers((prev) => ({ ...prev, [p.from]: !!p.typing }));
    };
    const readHandler = (p) => {
      // p.from indicates who read messages
      // we can mark messages as read if the reader is the other
      setMessages((prev) => prev.map((m) => ({ ...m, read: m.from !== currentUser.id ? true : m.read })));
    };
    socket.on('message:new', handler);
    socket.on('typing', typingHandler);
    socket.on('message:read', readHandler);
    return () => {
      socket.off('message:new', handler);
      socket.off('typing', typingHandler);
      socket.off('message:read', readHandler);
    };
  }, [socket, selectedUser, currentUser.id]);

  // Load initial users list if not provided via props
  useEffect(() => {
    let active = true;
    if (Array.isArray(propUsers) && propUsers.length > 0) {
      setUsers(propUsers);
      originalUsersRef.current = propUsers;
      return () => { active = false; };
    }
    const load = async () => {
      try {
        const res = await searchUsers('');
        if (!active) return;
        setUsers(res.data || []);
        originalUsersRef.current = res.data || [];
      } catch (err) {
        if (!active) return;
        setUsers([]);
      }
    };
    load();
    return () => { active = false; };
  }, [propUsers]);

  // Perform search when searchTerm changes
  useEffect(() => {
    // Immediate local filter for instant UX
    const term = (searchTerm || '').toLowerCase();
    if (!term) {
      setUsers(originalUsersRef.current || []);
    } else {
      const local = (originalUsersRef.current || []).filter((u) => (u.username || '').toLowerCase().includes(term));
      if (local.length > 0) setUsers(local);
    }

    // Debounce remote search to update results and keep cache fresh
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      const myId = ++reqIdRef.current;
      try {
        const res = await searchUsers(searchTerm || '');
        // only apply if this response is the latest
        if (myId !== reqIdRef.current) return;
        originalUsersRef.current = res.data || [];
        setUsers(res.data || []);
      } catch (err) {
        // ignore errors; keep current local results
      }
    }, 220);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [searchTerm]);

  useEffect(() => { // scroll to bottom when messages change
    try { scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); } catch {}
  }, [messages]);

  const openConversation = async (u) => {
    setSelectedUser(u);
    try {
      const res = await getMessages(u._id || u.id);
      setMessages(res.data || []);
      await markMessagesRead(u._id || u.id);
      setUnreadCounts((p) => ({ ...p, [u._id || u.id]: 0 }));
    } catch (err) {
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
      // optimistic UI: server will emit message:new back
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen md:h-[520px] flex flex-col sm:grid sm:grid-cols-[300px_minmax(0,1fr)] gap-3 text-sm">
      {/* Mobile: show/hide conversations */}
      {(showConversationList || !selectedUser) && (
        <div className="sm:static relative">
          <ConversationList users={users} selectedUser={selectedUser} onSelect={(u) => { openConversation(u); setShowConversationList(false); }} unreadCounts={unreadCounts} searchTerm={searchTerm} onSearch={setSearchTerm} />
        </div>
      )}
      {/* Mobile: back button when viewing conversation */}
      {selectedUser && !showConversationList && (
        <div className="sm:hidden mb-2">
          <button type="button" onClick={() => setShowConversationList(true)} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm">← Back</button>
        </div>
      )}
      {/* Message thread */}
      {(selectedUser || showConversationList) && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            {selectedUser ? (
              <>
                <div className="h-10 w-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-[13px] font-semibold">
                  {selectedUser.avatarUrl ? <img src={selectedUser.avatarUrl} alt="a" className="h-full w-full object-cover" /> : (selectedUser.username||'?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{selectedUser.username}</div>
                  <div className="text-[11px] text-slate-500 truncate">{typingUsers[selectedUser._id] ? 'Typing...' : (selectedUser.role || '')}</div>
                </div>
              </>
            ) : (
              <div className="text-slate-500">Select a conversation</div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-3 px-1 space-y-3">
            {!selectedUser && <div className="text-center text-[11px] text-slate-500 mt-10">No conversation selected</div>}
            {selectedUser && messages.map((m) => {
              const mine = m.from === currentUser.id;
              return (
                <div key={m._id || m.createdAt} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${mine ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-100'} max-w-[78%] px-3 py-2 rounded-2xl text-[13px]` }>
                    {m.mediaUrl && <img src={m.mediaUrl} alt="m" className="mb-2 max-h-48 w-auto rounded" />}
                    <div>{m.text}</div>
                    <div className="text-[10px] text-slate-400 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {mine && m.read ? '✓✓' : ''}</div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
          <MessageComposer currentUser={currentUser} toUser={selectedUser} onSend={handleSend} pendingMedia={pendingMedia} setPendingMedia={setPendingMedia} value={text} onChange={setText} socket={socket} />
        </div>
      )}
    </div>
  );
}
