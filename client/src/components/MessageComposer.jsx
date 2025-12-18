import React, { useRef } from 'react';

export default function MessageComposer({ currentUser, toUser, onSend, pendingMedia, setPendingMedia, value, onChange, socket }) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingMedia(reader.result);
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="border-t border-slate-800 pt-3 w-full">
      {pendingMedia && (
        <div className="mb-2 flex items-center gap-2">
          <img src={pendingMedia} alt="preview" className="h-16 w-16 object-cover rounded" />
          <button type="button" onClick={() => setPendingMedia(null)} className="text-xs text-red-400">Remove</button>
        </div>
      )}
      <div className="w-full flex justify-center">
        <form className="flex items-center gap-2 w-full max-w-[420px]" onSubmit={(e) => { e.preventDefault(); if (!toUser) return; onSend(); }}>
          <button type="button" onClick={() => fileRef.current?.click()} className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-black/60 border border-emerald-900/40 text-lg">📎</button>
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFile} />
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={toUser ? `Message ${toUser.username}` : 'Select a conversation'} className="flex-1 min-w-0 rounded-full bg-black/40 border border-emerald-500/60 px-3 py-2 text-sm text-emerald-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
          <button type="submit" className="flex-shrink-0 rounded-full bg-white text-emerald-600 text-sm font-semibold px-5 py-2 shadow-md hover:bg-emerald-100 transition-all">Send</button>
        </form>
      </div>
    </div>
  );
}
