'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, ArrowUpRight, Dna, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry } from '@/hooks/use-daily-log';
import { signOut, updateDisplayName } from '@/backend/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function SettingsTab({ entries, onClear, user }: {
  entries: LogEntry[],
  onClear: () => void,
  user: SupabaseUser | null
}) {
  const [confirmClear, setConfirmClear] = useState<'none' | 'purge'>('none');
  const [copied, setCopied] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const router = useRouter();

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
      "macros": { "calories": 100, "protein": 10, "carbs": 10, "fat": 2, "fiber": 1 }
    }
  ],
  "totals": {
    "calories": 100,
    "protein": 10,
    "carbs": 10,
    "fat": 2,
    "fiber": 1
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

             <button
               onClick={() => {
                 if (confirmClear === 'purge') {
                   onClear();
                   setConfirmClear('none');
                 } else {
                   setConfirmClear('purge');
                 }
               }}
               onMouseLeave={() => setConfirmClear('none')}
               className={cn(
                 "w-full p-4 flex justify-between items-center transition-all group active:scale-[0.98]",
                 confirmClear === 'purge' ? "bg-red-500/10" : "hover:bg-red-500/5"
               )}
             >
                <div className="flex flex-col items-start translate-x-0 group-active:translate-x-1 transition-transform">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", confirmClear === 'purge' ? "text-red-500" : "text-red-500/60")}>
                    {confirmClear === 'purge' ? 'Confirm Full Deletion' : 'Delete All Local Data'}
                  </span>
                  <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">
                    {confirmClear === 'purge' ? 'Tap again to erase all history' : 'Permanently remove all activity records'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-400/5 flex items-center justify-center text-red-500/20">
                  <Trash2 size={14} />
                </div>
             </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="small-caps ml-1 !text-white/20">Biometrics</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="bento-card !p-3.5 text-center !bg-[#0a0a0a]">
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-1">Heart Rate</span>
              <span className="text-xs font-mono text-[#00FF88]/40 tracking-wider">OFFLINE</span>
            </div>
            <div className="bento-card !p-3.5 text-center !bg-[#0a0a0a]">
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-1">Daily Load</span>
              <span className="text-xs font-mono text-[#00FF88]/40 tracking-wider">STANDBY</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="small-caps ml-1 !text-white/20">System Meta</label>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 text-center">
              <span className="text-[7px] font-bold text-white/10 uppercase block mb-0.5">Build</span>
              <span className="text-[9px] font-mono text-white/30 tracking-tighter">7.A.4</span>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 text-center col-span-2">
              <span className="text-[7px] font-bold text-white/10 uppercase block mb-0.5">System Architecture</span>
              <span className="text-[9px] font-mono text-white/30 tracking-tighter uppercase">Unified Tracking Core</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
