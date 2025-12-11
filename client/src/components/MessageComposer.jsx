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
    <div className="border-t border-slate-800 pt-3">
      {pendingMedia && (
        <div className="mb-2 flex items-center gap-2">
          <img src={pendingMedia} alt="preview" className="h-16 w-16 object-cover rounded" />
          <button type="button" onClick={() => setPendingMedia(null)} className="text-xs text-red-400">Remove</button>
        </div>
      )}
      <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (!toUser) return; onSend(); }}>
        <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-full bg-black/60 border border-slate-700 text-xs">📎</button>
        <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFile} />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={toUser ? `Message ${toUser.username}` : 'Select a conversation'} className="flex-1 rounded-full bg-black/40 border border-emerald-500/60 px-3 py-2 text-xs text-emerald-300 placeholder-slate-500" />
        <button type="submit" className="rounded-full bg-emerald-500 text-black text-xs font-semibold px-4 py-2">Send</button>
      </form>
    </div>
  );
}
