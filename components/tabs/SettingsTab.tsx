'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, ArrowUpRight, Dna, Pencil, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry } from '@/hooks/use-daily-log';
import { signOut, updateDisplayName, linkEmail } from '@/backend/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function SettingsTab({ entries, user }: {
  entries: LogEntry[],
  user: SupabaseUser | null
}) {
  const [copied, setCopied] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [linkEmailInput, setLinkEmailInput] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [linkStatus, setLinkStatus] = useState<{ kind: 'error' | 'success', msg: string } | null>(null);
  const [linking, setLinking] = useState(false);
  const router = useRouter();

  const handleLinkEmail = async () => {
    if (!linkEmailInput.trim() || !linkPassword) {
      setLinkStatus({ kind: 'error', msg: 'Email and password are required.' });
      return;
    }
    setLinkStatus(null);
    setLinking(true);
    const { data, error } = await linkEmail(linkEmailInput.trim(), linkPassword);
    setLinking(false);
    if (error) {
      setLinkStatus({ kind: 'error', msg: error.message });
    } else if (data?.user?.new_email) {
      setLinkStatus({ kind: 'success', msg: 'Check your inbox to confirm your email.' });
    } else {
      setLinkStatus({ kind: 'success', msg: 'Account secured. You can now sign in with email on any device.' });
      setLinkEmailInput('');
      setLinkPassword('');
    }
  };

  const displayName = (user?.user_metadata?.display_name as string) || 'Profile';

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== displayName) {
      await updateDisplayName(trimmed.slice(0, 40)); // auth listener refreshes `user`
    }
    setEditingName(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const JSON_TEMPLATE = `{
  "rawInput": "Meal description here",
  "mealType": "Breakfast | Lunch | Snacks | Dinner",
  "items": [
    {
      "name": "Component Name",
      "quantity": { "value": 1, "unit": "serving" },
      "macros": { "calories": 100, "protein": 10, "carbs": 10, "fat": 2, "fiber": 1, "sugar": 5, "sodium": 200, "saturatedFat": 1, "cholesterol": 10, "potassium": 150, "calcium": 50, "iron": 1 }
    }
  ],
  "totals": {
    "calories": 100,
    "protein": 10,
    "carbs": 10,
    "fat": 2,
    "fiber": 1,
    "sugar": 5,
    "sodium": 200,
    "saturatedFat": 1,
    "cholesterol": 10,
    "potassium": 150,
    "calcium": 50,
    "iron": 1
  }
}`;

  return (
    <div className="px-5 py-6 font-sans overflow-visible">
      <header className="mb-8 text-center pt-4">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 mx-auto mb-4 flex items-center justify-center relative">
          <User size={24} className="text-white/40" />
        </div>
        <span className="small-caps text-white/20 !tracking-[0.4em]">Operational</span>
        {editingName ? (
          <input
            type="text"
            value={nameDraft}
            maxLength={40}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            onBlur={saveName}
            className="block mx-auto mt-1 bg-white/[0.03] border border-[#00FF88]/40 rounded-xl px-4 py-2 text-2xl font-extralight tracking-tight text-center outline-none max-w-xs w-full"
          />
        ) : (
          <button
            onClick={() => { setNameDraft(displayName === 'Profile' ? '' : displayName); setEditingName(true); }}
            className="group flex items-center justify-center gap-2 mx-auto mt-1"
          >
            <h2 className="text-2xl font-extralight tracking-tight truncate max-w-xs px-2">{displayName}</h2>
            <Pencil size={12} className="text-white/20 group-hover:text-[#00FF88] transition-colors shrink-0" />
          </button>
        )}
        <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1">
          {user?.email || 'Guest Account'}
        </p>
      </header>

      <div className="space-y-8">
        {user?.is_anonymous && (
          <div className="space-y-3">
            <label className="small-caps ml-1 !text-white/20">Secure Account</label>
            <div className="bg-[#0a0a0a] border border-[#00FF88]/10 rounded-2xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-[#00FF88]/60 mt-0.5 shrink-0" />
                <p className="text-[9px] text-white/30 uppercase tracking-widest leading-relaxed">
                  Add an email to keep your data safe and sign in from any device. All your history stays.
                </p>
              </div>
              <div className="relative">
                <User className="absolute left-3 top-3 text-white/20" size={16} />
                <input
                  type="email"
                  placeholder="Email"
                  value={linkEmailInput}
                  onChange={(e) => setLinkEmailInput(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 pl-9 text-sm focus:border-[#00FF88]/40 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-white/20" size={16} />
                <input
                  type="password"
                  placeholder="Create Password"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkEmail()}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 pl-9 text-sm focus:border-[#00FF88]/40 outline-none transition-all"
                />
              </div>
              {linkStatus && (
                <p className={cn(
                  "text-[9px] uppercase tracking-widest text-center",
                  linkStatus.kind === 'error' ? "text-red-500" : "text-[#00FF88]"
                )}>
                  {linkStatus.msg}
                </p>
              )}
              <button
                onClick={handleLinkEmail}
                disabled={linking || !linkEmailInput.trim() || !linkPassword}
                className="w-full bg-[#00FF88] text-black text-[10px] font-bold uppercase tracking-[0.2em] py-3.5 rounded-xl hover:bg-[#00FF88]/90 disabled:opacity-30 transition-all active:scale-[0.98]"
              >
                {linking ? 'Securing…' : 'Secure My Account'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="small-caps ml-1 !text-white/20">Identity Management</label>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
             <button
               onClick={handleSignOut}
               className="w-full p-4 flex justify-between items-center hover:bg-white/[0.02] transition-all group"
             >
                <div className="flex flex-col items-start translate-x-0 group-active:translate-x-1 transition-transform">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Deauthorize Session</span>
                  <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">Logout of current operational node</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <X size={14} />
                </div>
             </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="small-caps ml-1 !text-white/20">Data Persistence</label>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
             <button
               onClick={() => {
                 const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `core_recovery_${format(new Date(), 'yyyyMMdd')}.json`;
                 a.click();
               }}
               className="w-full p-4 flex justify-between items-center hover:bg-white/[0.02] transition-all group border-b border-white/5"
             >
                <div className="flex flex-col items-start translate-x-0 group-active:translate-x-1 transition-transform">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Export Data</span>
                  <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">Download your activity log as JSON</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <ArrowUpRight size={14} />
                </div>
             </button>

             <div className="border-b border-white/5">
               <button
                 onClick={() => setShowTemplate(!showTemplate)}
                 className="w-full p-4 flex justify-between items-center hover:bg-sky-500/10 transition-all group active:bg-sky-500/20 cursor-pointer"
               >
                  <div className="flex flex-col items-start translate-x-0 group-active:translate-x-1 transition-transform">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">JSON Protocol Format</span>
                    <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">Toggle format specifications</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sky-400/5 flex items-center justify-center text-sky-400/40">
                    <Dna size={14} className={cn("transition-transform duration-300", showTemplate && "rotate-180")} />
                  </div>
               </button>

               <AnimatePresence>
                 {showTemplate && (
                   <motion.div
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: "auto", opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden bg-black/60 px-4 pb-4"
                   >
                     <div className="bg-white/5 rounded-xl p-3 border border-white/10 relative group">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON_TEMPLATE);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute right-3 top-3 text-[7px] font-bold text-white/40 hover:text-sky-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md transition-colors"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        <pre className="text-[9px] font-mono text-white/30 leading-snug overflow-x-auto no-scrollbar">
                          {JSON_TEMPLATE}
                        </pre>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
