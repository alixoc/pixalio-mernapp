import React from 'react';

export default function ConversationList({ users, selectedUser, onSelect, unreadCounts, searchTerm, onSearch }) {
  const filtered = (users || []).filter((u) => (u.username || '').toLowerCase().includes((searchTerm || '').toLowerCase()));
  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Messages</h3>
          <div className="text-[11px] text-slate-500">Chats</div>
        </div>
      </div>
      <div className="mb-3">
        <input
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search..."
          autoComplete="off"
          className="w-full rounded-xl bg-black/50 border border-slate-800 px-3 py-2 text-xs placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {filtered.length === 0 && <div className="text-center text-xs text-slate-500 mt-4">No conversations</div>}
        {filtered.map((u) => {
          const unread = unreadCounts?.[u._id] || 0;
          const active = selectedUser && (selectedUser._id === u._id || selectedUser.id === u._id);
          return (
            <button
              key={u._id}
              type="button"
              onClick={() => onSelect(u)}
              className={`w-full text-left px-2 py-2 rounded-xl border flex items-center gap-3 transition-colors ${
                active ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:bg-black/60'
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-[12px] font-semibold overflow-hidden">
                {u.avatarUrl ? <img src={u.avatarUrl} alt="a" className="h-full w-full object-cover" /> : (u.username || '?')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[13px] truncate">{u.username}</div>
                  {unread > 0 && <div className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 text-black text-[11px] px-2 py-0.5 flex-shrink-0">{unread}</div>}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{u.role || ''}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
