'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { updateDisplayName } from '@/backend/auth';

// Blocks the app until the signed-in user sets a display name.
// AuthProvider picks up the USER_UPDATED event, so the gate unmounts on save.
export function NameGate() {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required.');
      return;
    }
    setError(null);
    setSaving(true);
    const { error } = await updateDisplayName(trimmed.slice(0, 40));
    if (error) {
      setError(error.message);
      setSaving(false);
    }
    // on success the auth listener refreshes `user` and this screen unmounts
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extralight tracking-tight">Welcome</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">What should we call you?</p>
        </div>

        <div className="relative">
          <User className="absolute left-3 top-3 text-white/20" size={18} />
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            maxLength={40}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-10 text-sm focus:border-[#00FF88]/40 outline-none transition-all"
          />
        </div>

        {error && (
          <p className="text-[10px] text-red-500 uppercase tracking-widest text-center">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full bg-[#00FF88] text-black text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-[#00FF88]/90 disabled:opacity-30 shadow-[0_0_15px_rgba(0,255,136,0.15)] transition-all active:scale-[0.98]"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </motion.div>
    </div>
  );
}
