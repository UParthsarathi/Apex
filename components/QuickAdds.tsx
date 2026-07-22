'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodEntry, NUTRIENT_KEYS } from '@/hooks/use-daily-log';

// Shared by the paste flow and the AI chat: AI-JSON -> addFood args. Null if the shape is unknown.
export function parseFoodJson(entryData: any, fallbackMeal: FoodEntry['meal']) {
  if (!entryData || (!entryData.rawInput && !entryData.items && !entryData.totals)) return null;

  const nutrition: Record<string, unknown> = { items: entryData.items || [] };
  for (const k of NUTRIENT_KEYS) {
    nutrition[k] = entryData.totals?.[k] ?? (entryData.items?.reduce((sum: number, item: any) => sum + (item.macros?.[k] || 0), 0) || 0);
  }

  let meal = fallbackMeal;
  if (entryData.mealType) {
    const m = String(entryData.mealType).toLowerCase();
    if (m.includes('breakfast')) meal = 'Breakfast';
    else if (m.includes('lunch')) meal = 'Lunch';
    else if (m.includes('snack')) meal = 'Snacks';
    else if (m.includes('dinner')) meal = 'Dinner';
  }

  return { meal, description: entryData.rawInput || 'Encoded Component', nutrition };
}

export function FoodQuickAdd({ onAdd }: { onAdd: (meal: FoodEntry['meal'], desc: string, nutrition?: any) => void }) {
  const [desc, setDesc] = useState('');
  const [meal, setMeal] = useState<FoodEntry['meal']>('Lunch');
  const [showMacros, setShowMacros] = useState(false);
  const [macros, setMacros] = useState({ calories: '', protein: '', carbs: '', fat: '', fiber: '' });

  const isJson = (desc.trim().startsWith('{') && desc.trim().endsWith('}')) || (desc.trim().startsWith('[') && desc.trim().endsWith(']'));

  const handleSave = () => {
    if (!desc.trim()) return;

    // Try to parse as JSON if it looks like JSON
    if (isJson) {
      try {
        const data = JSON.parse(desc.trim());

        const processEntry = (entryData: any) => {
          const parsed = parseFoodJson(entryData, meal);
          if (!parsed) return false;
          onAdd(parsed.meal, parsed.description, parsed.nutrition);
          return true;
        };

        if (Array.isArray(data)) {
          data.forEach(processEntry);
          setDesc('');
          setMacros({ calories: '', protein: '', carbs: '', fat: '', fiber: '' });
          setShowMacros(false);
          return;
        } else if (processEntry(data)) {
          setDesc('');
          setMacros({ calories: '', protein: '', carbs: '', fat: '', fiber: '' });
          setShowMacros(false);
          return;
        }
      } catch (e) {
        // Fallback to normal text if JSON parse fails
        console.warn("Input looked like JSON but failed to parse", e);
      }
    }

    const nutrition = {
      calories: macros.calories ? parseInt(macros.calories) : 0,
      protein: macros.protein ? parseInt(macros.protein) : 0,
      carbs: macros.carbs ? parseInt(macros.carbs) : 0,
      fat: macros.fat ? parseInt(macros.fat) : 0,
      fiber: macros.fiber ? parseInt(macros.fiber) : 0,
    };
    onAdd(meal, desc, nutrition);
    setDesc('');
    setMacros({ calories: '', protein: '', carbs: '', fat: '', fiber: '' });
    setShowMacros(false);
  };

  return (
    <div className={cn(
      "bg-[#0a0a0a] rounded-2xl border border-white/5 p-2 space-y-1.5 focus-within:border-white/10 transition-all duration-500",
      isJson && "border-sky-500/30 bg-sky-500/[0.02]"
    )}>
      <div className="relative">
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Document intake or paste JSON..."
          className="w-full bg-transparent text-base font-extralight text-white resize-none outline-none px-4 py-3 placeholder:text-white/10 h-24 leading-relaxed no-scrollbar"
        />
        {isJson && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
            <span className="text-[7px] font-bold text-sky-400 tracking-widest uppercase">JSON DETECTED</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMacros && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-5 gap-1.5 px-2 pb-3">
              {[
              { label: 'CAL', key: 'calories', color: 'text-white' },
              { label: 'PRO', key: 'protein', color: 'text-indigo-400' },
              { label: 'FIB', key: 'fiber', color: 'text-emerald-400' },
              { label: 'FAT', key: 'fat', color: 'text-rose-500' },
              { label: 'CHO', key: 'carbs', color: 'text-orange-400' }
            ].map(m => (
                <div key={m.key} className="space-y-1">
                  <span className={cn("text-[7px] font-bold tracking-[0.15em] block text-center opacity-40 uppercase", m.color)}>{m.label}</span>
                  <input
                    type="number"
                    value={(macros as any)[m.key]}
                    onChange={e => setMacros(prev => ({ ...prev, [m.key]: e.target.value }))}
                    className={cn("w-full bg-white/5 border border-white/5 rounded-lg py-1.5 text-center text-[10px] font-medium outline-none transition-colors focus:border-white/20", m.color)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between p-1 bg-black/20 rounded-[20px]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar pl-1 flex-1 items-center">
          <button
            onClick={() => {
              setShowMacros(!showMacros);
            }}
            className={cn(
              "px-3 py-2 rounded-full text-[8px] font-bold tracking-[0.1em] uppercase transition-all duration-300",
              showMacros ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
            )}
          >
            Manual
          </button>

          <div className="w-[1px] h-3 bg-white/10 mx-1" />
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMeal(m)}
                className={cn(
                  "px-3 py-2 rounded-full text-[8px] font-bold tracking-[0.05em] uppercase transition-all duration-300 whitespace-nowrap",
                  meal === m ? "bg-[#00FF88] text-black" : "text-white/20 hover:text-white/40"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!desc.trim()}
          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-5 transition-all hover:scale-105 active:scale-95 shrink-0 ml-1"
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function WaterQuickAdd({ onAdd }: { onAdd: (amount: number) => void }) {
  const [amount, setAmount] = useState(250);
  const [isSaved, setIsSaved] = useState(false);

  const presets = [150, 250, 330, 500];

  const handleSave = () => {
    onAdd(amount);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-6 space-y-6 transition-all duration-500 focus-within:border-white/10 shadow-3xl shadow-black">
      <div className="space-y-4">
        <div className="flex justify-between items-baseline px-1">
          <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.4em]">Volume</span>
          <span className="text-3xl font-light tracking-tighter text-blue-400">{amount}<span className="text-xs text-blue-400/20 ml-1 uppercase font-bold tracking-widest">ml</span></span>
        </div>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={amount}
          onChange={e => setAmount(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-400"
        />
        <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pt-2">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-[9px] font-mono transition-all border",
                amount === p ? "bg-blue-400/20 border-blue-400/40 text-blue-400" : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
              )}
            >
              {p}ml
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className={cn(
          "w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 active:scale-95 shadow-xl",
          isSaved
            ? "bg-[#00FF88] text-black shadow-[#00FF88]/20"
            : "bg-blue-500 text-white hover:bg-white hover:text-black shadow-blue-500/20"
        )}
      >
        {isSaved ? 'Hydration Authenticated' : 'Log Intake'}
      </button>
    </div>
  );
}

export function WorkoutQuickAdd({ onAdd }: { onAdd: (activity: string, cal: number, dur?: number) => void }) {
  const [activity, setActivity] = useState('');
  const [calories, setCalories] = useState('');

  const handleSave = () => {
    if (!activity.trim() || !calories) return;
    onAdd(activity, parseInt(calories, 10));
    setActivity('');
    setCalories('');
  };

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 px-4 py-3.5 flex items-center gap-4 transition-all duration-500 focus-within:border-white/10">
      <div className="flex-1 space-y-0.5">
        <input
          type="text"
          placeholder="Activity Name"
          value={activity}
          onChange={e => setActivity(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-base font-extralight placeholder:text-white/10"
        />
        <div className="flex items-center gap-1.5">
          <input
             type="number"
             placeholder="Kcal"
             value={calories}
             onChange={e => setCalories(e.target.value)}
             className="w-16 bg-transparent border-none outline-none text-xs font-bold text-orange-400 placeholder:text-orange-400/20"
          />
          <span className="text-[7px] font-bold tracking-[0.1em] text-white/10 uppercase">EST. BURN</span>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={!activity.trim() || !calories}
        className="w-10 h-10 rounded-full bg-orange-400/5 text-orange-400 border border-orange-400/10 flex items-center justify-center disabled:opacity-5 transition-all hover:bg-orange-400 hover:text-black"
      >
        <Plus size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function SleepQuickAdd({ onAdd }: { onAdd: (duration: number, quality: number, category: 'Sleep' | 'Nap') => void }) {
  const [hours, setHours] = useState(8);
  const [minutes, setMinutes] = useState(0);
  const [quality, setQuality] = useState(7);
  const [category, setCategory] = useState<'Sleep' | 'Nap'>('Sleep');
  const [isSaved, setIsSaved] = useState(false);

  const duration = hours + minutes / 60;

  const handleSave = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onAdd(duration, quality, category);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-[#080808] rounded-[32px] border border-white/5 p-6 space-y-8 transition-all duration-500 shadow-3xl shadow-black focus-within:border-violet-500/20">

      {/* Category Toggle */}
      <div className="flex bg-white/5 p-1 rounded-2xl">
        <button
          onClick={() => {
            setCategory('Sleep');
            if (hours === 0 && minutes === 0) setHours(8);
          }}
          className={cn(
            "flex-1 py-2 text-[8px] font-bold uppercase tracking-widest rounded-xl transition-all",
            category === 'Sleep' ? "bg-indigo-600 text-white shadow-lg" : "text-white/20 hover:text-white/40"
          )}
        >
          Night Sleep
        </button>
        <button
          onClick={() => {
            setCategory('Nap');
            if (hours > 2) setHours(0);
            if (minutes === 0) setMinutes(30);
          }}
          className={cn(
            "flex-1 py-2 text-[8px] font-bold uppercase tracking-widest rounded-xl transition-all",
            category === 'Nap' ? "bg-violet-400 text-black shadow-lg" : "text-white/20 hover:text-white/40"
          )}
        >
          Power Nap
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Hours Selector */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline px-1">
            <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.4em]">Duration: Hours</span>
            <span className="text-3xl font-light tracking-tighter text-white">{hours}<span className="text-xs text-white/20 ml-1 uppercase font-bold tracking-widest">h</span></span>
          </div>
          <input
            type="range"
            min="0"
            max={category === 'Sleep' ? 16 : 4}
            step="1"
            value={hours}
            onChange={e => setHours(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-violet-400"
          />
        </div>

        {/* Minutes Selector */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline px-1">
            <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.4em]">Duration: Minutes</span>
            <span className="text-2xl font-light tracking-tighter text-white/60">{minutes}<span className="text-[10px] text-white/10 ml-1 uppercase font-bold tracking-widest">m</span></span>
          </div>
          <input
            type="range"
            min="0"
            max="59"
            step="1"
            value={minutes}
            onChange={e => setMinutes(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-violet-300"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex gap-2">
          {[2, 4, 6, 8, 10].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                quality >= q ? "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.5)]" : "bg-white/5 hover:bg-white/10"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => handleSave(e)}
          className={cn(
            "px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 active:scale-95 shadow-xl",
            isSaved
              ? "bg-[#00FF88] text-black shadow-[#00FF88]/20"
              : "bg-violet-500 text-white hover:bg-white hover:text-black shadow-violet-500/20"
          )}
        >
          {isSaved ? 'Saved' : 'Save Entry'}
        </button>
      </div>
    </div>
  );
}

export function TaskQuickAdd({ onAdd, className }: { onAdd: (desc: string) => void, className?: string }) {
  const [desc, setDesc] = useState('');

  const handleSave = () => {
    if (!desc.trim()) return;
    onAdd(desc);
    setDesc('');
  };

  return (
    <div className={cn("bg-[#0a0a0a] rounded-2xl p-1.5 border border-white/5 flex items-center gap-2 transition-all duration-500 focus-within:border-white/10", className)}>
      <input
        type="text"
        placeholder="New Objective"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        className="flex-1 bg-transparent border-none outline-none px-3.5 text-base font-light placeholder:text-white/10"
      />
      <button
        onClick={handleSave}
        disabled={!desc.trim()}
        className="w-8 h-8 rounded-xl bg-white/5 text-white/20 hover:bg-white hover:text-black flex items-center justify-center disabled:opacity-5 transition-all"
      >
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
