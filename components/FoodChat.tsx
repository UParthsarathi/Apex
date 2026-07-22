'use client';

import { useRef, useState } from 'react';
import { Send, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodEntry } from '@/hooks/use-daily-log';
import { parseFoodJson } from '@/components/QuickAdds';

type Msg = { role: 'user' | 'model'; text: string };

// The model replies conversationally, then ends with pure JSON. Strip fences
// (belt and suspenders — the prompt forbids markdown) and try to parse.
function extractFoodJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) return null;
  try {
    const data = JSON.parse(cleaned);
    const list = Array.isArray(data) ? data : [data];
    const parsed = list.map(d => parseFoodJson(d, 'Lunch')).filter(Boolean) as NonNullable<ReturnType<typeof parseFoodJson>>[];
    return parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export function FoodChat({ onAdd }: { onAdd: (meal: FoodEntry['meal'], desc: string, nutrition?: any) => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply = res.ok && data.text ? data.text : `Something went wrong (${data.error || res.status}). Try again.`;
      setMessages([...next, { role: 'model', text: reply }]);
    } catch {
      setMessages([...next, { role: 'model', text: 'Network error — try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    }
  };

  const last = messages[messages.length - 1];
  const pending = last?.role === 'model' ? extractFoodJson(last.text) : null;

  const logPending = () => {
    if (!pending) return;
    for (const p of pending) onAdd(p.meal, p.description, p.nutrition);
    setMessages([]);
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-3 space-y-3 focus-within:border-white/10 transition-all duration-500">
      {messages.length > 0 && (
        <div ref={scrollRef} className="max-h-64 overflow-y-auto no-scrollbar space-y-2 px-1 pt-1">
          {messages.map((m, i) => {
            const isFinalJson = i === messages.length - 1 && m.role === 'model' && pending;
            if (isFinalJson) return null; // rendered as the confirm card below
            if (m.role === 'model' && extractFoodJson(m.text)) return null; // stale JSON from a corrected round
            return (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm font-extralight leading-relaxed',
                  m.role === 'user' ? 'bg-[#00FF88]/10 text-[#d9ffe9]' : 'bg-white/5 text-white/80'
                )}>
                  {m.text}
                </div>
              </div>
            );
          })}
          {loading && <div className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20 px-2 py-1 animate-pulse">Estimating…</div>}
        </div>
      )}

      {pending && (
        <div className="rounded-2xl border border-[#00FF88]/20 bg-[#00FF88]/[0.04] p-4 space-y-3">
          {pending.map((p, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-extralight text-white/90 truncate">{p.description}</p>
                <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-[#00FF88]/50">{p.meal}</span>
              </div>
              <span className="text-sm font-light text-white/70 whitespace-nowrap tabular-nums">
                {Number(p.nutrition.calories) || 0}<small className="text-[8px] opacity-40 ml-0.5">kcal</small>
                <span className="text-indigo-400/70 ml-2">{Number(p.nutrition.protein) || 0}<small className="text-[8px] opacity-40 ml-0.5">p</small></span>
              </span>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={logPending}
              className="flex-1 py-3 rounded-xl bg-[#00FF88] text-black text-[9px] font-bold uppercase tracking-[0.25em] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={12} strokeWidth={2.5} /> Log It
            </button>
            <button
              onClick={() => setMessages([])}
              className="px-4 py-3 rounded-xl bg-white/5 text-white/40 text-[9px] font-bold uppercase tracking-[0.25em] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} /> Discard
            </button>
          </div>
          <p className="text-[7px] text-white/15 uppercase tracking-[0.2em] text-center">Not right? Type a correction below instead.</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={logged ? 'Logged ✓ — what else did you eat?' : messages.length ? 'Reply…' : 'What did you eat? e.g. "4 idlis and sambar"'}
          className="flex-1 bg-transparent text-base font-extralight text-white outline-none px-3 py-2.5 placeholder:text-white/10"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-5 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
