'use client';

import { useState, useMemo, useEffect } from 'react';
import { Home, History, CheckSquare, User, Flame, Utensils, ClipboardList, Trash2, Plus, X, Activity, ArrowUpRight, Zap, Target, Dna, Droplets, Wheat, CircleDot, Calendar, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { useDailyLog, LogEntry, TaskEntry, FoodEntry, WorkoutEntry, SleepEntry } from '@/hooks/use-daily-log';
import { format, isToday, isYesterday, isSameDay, startOfDay, subDays, addDays, eachDayOfInterval, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

type Tab = 'home' | 'history' | 'tasks' | 'settings' | 'protocol';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const { 
    entries, 
    isSimulationMode,
    addFood, 
    addWorkout, 
    addTask, 
    addSleep,
    toggleTask, 
    deleteEntry, 
    clearLogs, 
    clearSimulation, 
    seedSimulation, 
    isLoaded 
  } = useDailyLog();

  if (!isLoaded) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1, 0.98] }} 
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="small-caps !text-[#00FF88]"
        >
          Initializing Apex
        </motion.div>
      </div>
    );
  }

  const handleDateJump = (date: Date) => {
    setSelectedDate(date);
    setActiveTab('home');
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden selection:bg-[#00FF88]/30 font-sans">
      
      {/* Global Top Controls */}
      <div className="fixed top-6 left-5 z-[60]">
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-10 h-10 rounded-full border transition-all active:scale-95 flex items-center justify-center backdrop-blur-xl shadow-2xl shadow-black",
            activeTab === 'settings' 
              ? "bg-[#00FF88]/20 border-[#00FF88]/40 text-[#00FF88]" 
              : "bg-[#111]/80 border-white/10 text-white/40 hover:bg-[#111] hover:text-white"
          )}
        >
          <User size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full pb-32"
          >
            {activeTab === 'home' && (
              <HomeTab 
                entries={entries} 
                isSimulation={isSimulationMode}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                addFood={addFood} 
                addWorkout={addWorkout} 
                addTask={addTask} 
                onSeed={seedSimulation}
                onClearSimulation={clearSimulation}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab 
                entries={entries} 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                addFood={addFood}
                addWorkout={addWorkout}
                addTask={addTask}
                deleteEntry={deleteEntry} 
                onDateJump={handleDateJump} 
                onSwitchToProtocol={() => setActiveTab('protocol')}
              />
            )}
            {activeTab === 'tasks' && (
              <TasksTab 
                entries={entries} 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                addTask={addTask} 
                toggleTask={toggleTask} 
                deleteEntry={deleteEntry} 
              />
            )}
            {activeTab === 'protocol' && (
              <ProtocolTab 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                addFood={addFood}
                addWorkout={addWorkout}
                addSleep={addSleep}
                addTask={addTask}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab 
                entries={entries} 
                isSimulationMode={isSimulationMode}
                onSeed={() => {
                  seedSimulation();
                  setActiveTab('home');
                }} 
                onClear={clearLogs}
                onClearSimulation={clearSimulation}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50">
        <nav className="bg-[#111]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-1.5 flex justify-around items-center shadow-2xl shadow-black">
          <NavItem icon={<Home strokeWidth={1.5} size={18} />} label="Status" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<History strokeWidth={1.5} size={18} />} label="Logs" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavItem icon={<Zap strokeWidth={1.5} size={18} />} label="Protocol" isActive={activeTab === 'protocol'} onClick={() => setActiveTab('protocol')} />
          <NavItem icon={<CheckSquare strokeWidth={1.5} size={18} />} label="Focus" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-300 relative",
        isActive ? "text-[#00FF88]" : "text-white/20 hover:text-white/50"
      )}
    >
      <div className={cn("transition-transform duration-500", isActive && "scale-110 -translate-y-0.5")}>
        {icon}
      </div>
      <span className={cn("text-[8px] uppercase tracking-[0.2em] font-bold mt-1.5 transition-opacity duration-300", isActive ? "opacity-100" : "opacity-0")}>{label}</span>
      {isActive && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute inset-0 bg-[#00FF88]/5 rounded-2xl -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

// --- TABS ---

function HomeTab({ entries, isSimulation, selectedDate, onDateChange, addFood, addWorkout, addTask, onSeed, onClearSimulation }: { 
  entries: LogEntry[], 
  isSimulation: boolean,
  selectedDate: Date,
  onDateChange: (d: Date) => void,
  addFood: (meal: FoodEntry['meal'], desc: string, nutrition?: any, date?: Date) => void, 
  addWorkout: (activity: string, calories: number, duration?: number, date?: Date) => void, 
  addTask: (desc: string, date?: Date) => void,
  onSeed: () => void,
  onClearSimulation: () => void
}) {
  const [showPerformance, setShowPerformance] = useState(false);
  const todayEntries = entries.filter(e => isSameDay(e.timestamp, selectedDate));
  const tasks = todayEntries.filter(e => e.type === 'task') as TaskEntry[];
  const workouts = todayEntries.filter(e => e.type === 'workout') as WorkoutEntry[];
  const food = todayEntries.filter(e => e.type === 'food') as FoodEntry[];

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalBurned = workouts.reduce((sum, w) => sum + w.calories, 0);
  const sleepEntries = todayEntries.filter(e => e.type === 'sleep') as SleepEntry[];
  const totalSleep = sleepEntries.reduce((sum, s) => sum + s.duration, 0);
  const avgSleepQuality = sleepEntries.length > 0 
    ? sleepEntries.reduce((sum, s) => sum + s.quality, 0) / sleepEntries.length 
    : 0;
  
  const nutrition = food.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fat: acc.fat + (f.fat || 0),
    fiber: acc.fiber + (f.fiber || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  return (
    <div className="px-5 space-y-6">
      <header className="space-y-4">
        {isSimulation && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Zap size={10} className="text-sky-400 animate-pulse" />
              <span className="text-[8px] font-bold text-sky-400 uppercase tracking-widest">Simulation Mode Active</span>
            </div>
            <button 
              onClick={onClearSimulation}
              className="text-[8px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              <X size={10} />
              Exit
            </button>
          </motion.div>
        )}
        <div className="flex justify-between items-end">
          <div className="space-y-0 text-left">
            <span className="small-caps text-[#00FF88] !tracking-[0.3em]">Apex Protocol • {format(selectedDate, 'MMM d').toUpperCase()}</span>
            <h1 className="display-light">Overview</h1>
          </div>
          <div className="pb-1 flex flex-col items-end gap-2 fixed top-6 right-5 z-[60]">
            <button 
              onClick={() => setShowPerformance(true)}
              className="w-10 h-10 rounded-full bg-[#111]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-[#00FF88] hover:bg-[#111] hover:border-[#00FF88]/20 transition-all active:scale-95 shadow-2xl shadow-black"
            >
              <BarChart2 size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showPerformance && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPerformance(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-0.5">
                    <span className="small-caps !text-[#00FF88] text-[8px] !tracking-[0.3em]">Neural Trends</span>
                    <h2 className="text-xl font-light tracking-tight uppercase">Performance</h2>
                  </div>
                  <button 
                    onClick={() => setShowPerformance(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Intake</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Activity</span>
                  </div>
                </div>

                <div className="h-64 mb-4">
                  <PerformanceGraph entries={entries} selectedDate={selectedDate} />
                </div>

                <p className="text-[8px] text-center text-white/10 uppercase tracking-[0.2em] font-bold py-2 border-t border-white/5">
                  Synchronized with local persistence buffer
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
      </header>

      {entries.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#00FF88]/5 border border-[#00FF88]/10 rounded-3xl p-6 text-center space-y-4"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-extralight tracking-tight text-[#00FF88]">Empty Substrate Detected</h2>
            <p className="text-xs text-white/30 uppercase tracking-widest leading-relaxed">No biometric records found. Initialize simulation to preview high-density data analytics.</p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={onSeed}
              className="flex-1 bg-[#00FF88] text-black px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,136,0.2)] hover:bg-[#00FF88]/90 active:scale-[0.98] transition-all cursor-pointer relative z-10"
            >
              Run Simulation
            </button>
            <button 
              type="button"
              onClick={() => addTask('First Protocol: Establish Baseline')}
              className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer relative z-10"
            >
              Manual Start
            </button>
          </div>
        </motion.div>
      )}

      {/* Primary Metrics Bento - High Density */}
      <section className="grid grid-cols-4 gap-3">
        {/* Main Burn/Intake Card */}
        <div className="col-span-4 bento-card neon-shimmer bg-white/[0.05] p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="small-caps text-white/30 !tracking-widest">Net Intake</span>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-extralight tracking-tighter">
                 {nutrition.calories - totalBurned}
               </span>
               <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap">kcal</span>
            </div>
          </div>
          
          <div className="flex gap-4 text-right">
            <div className="space-y-0">
               <span className="text-[8px] font-bold text-[#00FF88]/40 uppercase">Eaten</span>
               <p className="text-xl font-light leading-none">{nutrition.calories}</p>
            </div>
            <div className="space-y-0">
               <span className="text-[8px] font-bold text-orange-400/40 uppercase">Burned</span>
               <p className="text-xl font-light leading-none">{totalBurned}</p>
            </div>
          </div>
        </div>
        
        {/* Macronutrient Status */}
        <div className="col-span-2 bento-card flex flex-col gap-2.5 p-4 border-white/[0.06]">
           <div className="flex items-center justify-between">
              <span className="small-caps !text-[#00FF88]/40 text-[8px] !tracking-[0.2em]">Protein</span>
              <span className="text-base font-light font-mono tabular-nums">{nutrition.protein}<small className="text-[8px] opacity-20 ml-0.5">g</small></span>
           </div>
           <div className="h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((nutrition.protein / 160) * 100, 100)}%` }}
                className="h-full bg-sky-400/60 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
              />
           </div>
        </div>

        <div className="col-span-2 bento-card flex flex-col gap-2.5 p-4 border-white/[0.06]">
           <div className="flex items-center justify-between">
              <span className="small-caps !text-[#00FF88]/40 text-[8px] !tracking-[0.2em]">Carbs</span>
              <span className="text-base font-light font-mono tabular-nums">{nutrition.carbs}<small className="text-[8px] opacity-20 ml-0.5">g</small></span>
           </div>
           <div className="h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((nutrition.carbs / 280) * 100, 100)}%` }}
                className="h-full bg-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
              />
           </div>
        </div>

        <div className="bento-card p-3 flex flex-col items-center gap-1">
           <span className="text-base font-light text-rose-400/80">{nutrition.fat}g</span>
           <span className="text-[8px] font-bold tracking-[0.2em] text-white/10 uppercase">Fats</span>
        </div>

        <div className="bento-card p-3 flex flex-col items-center gap-1">
           <span className="text-base font-light text-emerald-400/80">{nutrition.fiber}g</span>
           <span className="text-[8px] font-bold tracking-[0.2em] text-white/10 uppercase">Fiber</span>
        </div>

        <div className="col-span-2 bento-card p-3 flex items-center justify-center gap-4 bg-white/[0.02] border-white/[0.06]">
           <div className="flex flex-col items-center">
             <span className="text-base font-light font-mono text-white/80 leading-tight">{completedTasks}<span className="text-white/20 mx-0.5">/</span>{tasks.length}</span>
             <span className="text-[7px] font-bold text-white/10 tracking-[0.2em] uppercase">Goals</span>
           </div>
           <div className="w-[1px] h-6 bg-white/5" />
           <div className="flex flex-col items-center">
             <span className="text-base font-light font-mono text-[#00FF88]/80 leading-tight">{tasks.length > 0 ? Math.round((completedTasks/tasks.length)*100) : 0}%</span>
             <span className="text-[7px] font-bold text-white/10 tracking-[0.2em] uppercase">Done</span>
           </div>
        </div>

        {/* Sleep Card */}
        <div className="col-span-4 bento-card p-5 bg-sky-500/[0.03] border-sky-500/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Zap size={20} strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5">
                <span className="small-caps !text-sky-400/40 text-[8px] !tracking-[0.2em]">Regeneration</span>
                <p className="text-xl font-light tracking-tight">{totalSleep} <small className="text-[10px] opacity-40 uppercase">Hours</small></p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest block mb-1">Quality Index</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn("w-3 h-1 rounded-full", i < (avgSleepQuality / 2) ? "bg-sky-400" : "bg-white/5")} />
                ))}
              </div>
            </div>
        </div>
      </section>
    </div>
  );
}

function HistoryTab({ entries, selectedDate, onDateChange, addFood, addWorkout, addTask, deleteEntry, onDateJump, onSwitchToProtocol }: { 
  entries: LogEntry[], 
  selectedDate: Date,
  onDateChange: (d: Date) => void,
  addFood: (meal: FoodEntry['meal'], desc: string, nutrition?: any, date?: Date) => void, 
  addWorkout: (activity: string, calories: number, duration?: number, date?: Date) => void, 
  addTask: (desc: string, date?: Date) => void,
  deleteEntry: (id: string) => void, 
  onDateJump: (d: Date) => void,
  onSwitchToProtocol: () => void
}) {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const months = useMemo(() => {
    const unique = new Set<string>();
    entries.forEach(e => unique.add(format(e.timestamp, 'yyyy-MM')));
    unique.add(format(new Date(), 'yyyy-MM')); // Always show current month
    return Array.from(unique).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (focusedDate) {
      return entries.filter(e => format(e.timestamp, 'yyyy-MM-dd') === focusedDate);
    }
    return entries.filter(e => format(e.timestamp, 'yyyy-MM') === selectedMonth);
  }, [entries, selectedMonth, focusedDate]);

  const grouped = useMemo(() => {
    const data = filteredEntries.reduce((acc, entry) => {
      const dateStr = format(entry.timestamp, 'yyyy-MM-dd');
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(entry);
      return acc;
    }, {} as Record<string, LogEntry[]>);
    return data;
  }, [filteredEntries]);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="px-5 flex flex-col min-h-full transition-all duration-500">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <span className="small-caps text-[#00FF88] !tracking-[0.3em]">Temporal Buffer</span>
          <h1 className="display-light text-3xl">{focusedDate ? 'Day Focus' : 'Journal'}</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          {focusedDate ? (
            <button 
              onClick={() => setFocusedDate(null)}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-bold uppercase tracking-widest text-[#00FF88] hover:bg-[#00FF88]/10 transition-all font-bold"
            >
              Month View
            </button>
          ) : (
            <>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Filter</span>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg text-[10px] p-1 font-mono uppercase tracking-tighter outline-none focus:border-[#00FF88]/50 transition-all font-bold"
              >
                {months.map(m => (
                  <option key={m} value={m} className="bg-neutral-900">{format(new Date(m + '-01'), 'MMMM yyyy')}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </header>

      {/* Protocol Shortcut */}
      <section className="mb-10">
        <button 
          onClick={onSwitchToProtocol}
          className="w-full bento-card p-4 bg-[#00FF88]/5 border border-[#00FF88]/10 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex flex-col items-start">
            <span className="small-caps text-[#00FF88] text-[8px] !tracking-[0.3em]">Protocol Interface</span>
            <span className="text-sm font-light tracking-tight text-white/60">Initialize New Entry</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#00FF88]/10 flex items-center justify-center text-[#00FF88] group-hover:scale-110 transition-transform">
            <Plus size={20} strokeWidth={2} />
          </div>
        </button>
      </section>

      {/* Ribbon Navigator */}
      {!focusedDate && sortedDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 mb-2 border-b border-white/5">
          {sortedDates.map(date => (
            <button
              key={`jump-${date}`}
              onClick={() => setFocusedDate(date)}
              className="flex-shrink-0 group flex flex-col items-center gap-1"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 group-hover:border-[#00FF88]/50 flex items-center justify-center text-[10px] font-mono transition-all">
                {format(new Date(date), 'd')}
              </div>
              <span className="text-[6px] font-bold text-white/20 uppercase tracking-[0.1em]">{format(new Date(date), 'EEE')}</span>
            </button>
          )).reverse()}
        </div>
      )}

      {sortedDates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-24">
          <History size={100} strokeWidth={0.3} />
          <span className="small-caps mt-6 text-center">No records detected for<br/>this period</span>
        </div>
      ) : (
        <div className="space-y-10 pb-24">
          {sortedDates.map(date => {
            const dayEntries = grouped[date].sort((a, b) => b.timestamp - a.timestamp);
            let dateLabel = format(new Date(date), 'MMMM d');
            if (isToday(new Date(date))) dateLabel = 'Today';
            else if (isYesterday(new Date(date))) dateLabel = 'Yesterday';

            const stats = dayEntries.reduce((acc, e) => {
              if (e.type === 'food') {
                acc.calories += (e.calories || 0);
              } else if (e.type === 'workout') {
                acc.burned += (e.calories || 0);
              } else if (e.type === 'sleep') {
                acc.sleep += e.duration;
              } else if (e.type === 'task' && e.completed) {
                acc.tasksDone += 1;
              }
              return acc;
            }, { calories: 0, burned: 0, tasksDone: 0, sleep: 0 });

            const foods = dayEntries.filter(e => e.type === 'food') as FoodEntry[];
            const workouts = dayEntries.filter(e => e.type === 'workout') as WorkoutEntry[];
            const tasks = dayEntries.filter(e => e.type === 'task') as TaskEntry[];
            const sleeps = dayEntries.filter(e => e.type === 'sleep') as SleepEntry[];

            return (
              <div key={date} className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/[0.05] pb-2.5 px-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88]/50 shadow-[0_0_8px_rgba(0,255,136,0.3)]" />
                    <h3 className="small-caps !text-[#00FF88]/80 text-[10px] !tracking-[0.2em]">{dateLabel}</h3>
                  </div>
                  <div className="flex gap-4 text-[8px] font-mono tracking-tighter uppercase tabular-nums items-center">
                    <span className="text-white/40"><span className="text-white/80 font-bold">{stats.calories}</span> IN</span>
                    <span className="text-orange-400/40"><span className="text-orange-500/80 font-bold">{stats.burned}</span> OUT</span>
                    {stats.sleep > 0 && <span className="text-sky-400/40"><span className="text-sky-500/80 font-bold">{stats.sleep}</span> HRS</span>}
                    {stats.tasksDone > 0 && <span className="text-emerald-400/40"><span className="text-emerald-500/80 font-bold">{stats.tasksDone}</span> OK</span>}
                    <button 
                      onClick={() => onDateJump(new Date(date))}
                      className="text-[#00FF88]/40 hover:text-[#00FF88] flex items-center gap-1 transition-colors ml-2"
                    >
                      <Activity size={10} />
                      <span className="text-[7px] font-bold">STATUS</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {foods.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Fuel Intake</span>
                      <div className="space-y-2">
                        {foods.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}

                  {workouts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Kinetic Output</span>
                      <div className="space-y-2">
                        {workouts.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}

                  {sleeps.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Regeneration</span>
                      <div className="space-y-2">
                        {sleeps.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}

                  {tasks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Objectives</span>
                      <div className="space-y-2">
                        {tasks.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TasksTab({ entries, selectedDate, onDateChange, addTask, toggleTask, deleteEntry }: { 
  entries: LogEntry[], 
  selectedDate: Date,
  onDateChange: (d: Date) => void,
  addTask: (desc: string, date?: Date) => void, 
  toggleTask: (id: string) => void, 
  deleteEntry: (id: string) => void 
}) {
  const dayTasks = entries.filter(e => e.type === 'task' && isSameDay(e.timestamp, selectedDate)) as TaskEntry[];
  const sortedTasks = [...dayTasks].sort((a, b) => {
    if (a.completed === b.completed) return b.timestamp - a.timestamp;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="px-5 flex flex-col min-h-full font-sans">
      <header className="mb-6 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="small-caps text-[#00FF88] !tracking-[0.3em]">Your Objectives</span>
            <h1 className="display-light">Focus</h1>
          </div>
          <div className="pb-1 text-right">
            <span className="text-xl font-light tracking-tight opacity-40">{format(selectedDate, 'MMM d')}</span>
          </div>
        </div>

        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
      </header>

      <TaskQuickAdd onAdd={(desc) => addTask(desc, selectedDate)} className="mb-6" />

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className={cn(
                "group flex items-center justify-between p-4 rounded-3xl border transition-all duration-500",
                task.completed ? "bg-white/[0.02] border-white/5" : "bg-white/[0.05] border-white/10"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                    task.completed 
                      ? "bg-[#00FF88] border-[#00FF88] text-black" 
                      : "border-white/10 text-transparent"
                  )}
                >
                  <ArrowUpRight size={12} strokeWidth={3} className={cn("transition-transform duration-500", task.completed ? "rotate-0" : "rotate-45")} />
                </button>
                <span className={cn("text-base font-light tracking-tight transition-all duration-500", task.completed && "line-through text-white/10")}>
                  {task.description}
                </span>
              </div>
              <button 
                onClick={() => deleteEntry(task.id)}
                className="p-2 text-white/5 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} strokeWidth={1} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {sortedTasks.length === 0 && (
          <div className="text-center py-20 opacity-5">
            <CheckSquare size={48} strokeWidth={0.5} className="mx-auto mb-4" />
            <span className="small-caps">Zero Pending Tasks</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab({ entries, isSimulationMode, onSeed, onClear, onClearSimulation }: { 
  entries: LogEntry[], 
  isSimulationMode: boolean,
  onSeed: () => void, 
  onClear: () => void, 
  onClearSimulation: () => void 
}) {
  const [confirmClear, setConfirmClear] = useState<'none' | 'purge' | 'simulation'>('none');

  return (
    <div className="px-5 py-6 font-sans overflow-visible">
      <header className="mb-8 text-center pt-4">
        <div className="w-16 h-16 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 mx-auto mb-4 flex items-center justify-center relative">
          <User size={24} className={cn("text-[#00FF88]", isSimulationMode && "text-sky-400")} />
          <div className={cn("absolute inset-0 rounded-full border border-[#00FF88]/20 animate-pulse", isSimulationMode && "border-sky-400/20")} />
        </div>
        <span className={cn("small-caps text-[#00FF88] !tracking-[0.4em]", isSimulationMode && "text-sky-400")}>
          {isSimulationMode ? "Simulation Active" : "Operational"}
        </span>
        <h2 className="text-2xl font-extralight tracking-tight mt-1">Profile</h2>
      </header>
      
      <div className="space-y-8">
        <div className="space-y-3">
          <label className="small-caps ml-1 !text-white/20">Data Persistence</label>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
             <button 
               onClick={() => {
                 const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `${isSimulationMode ? 'simulation' : 'core'}_recovery_${format(new Date(), 'yyyyMMdd')}.json`;
                 a.click();
               }}
               className="w-full p-4 flex justify-between items-center hover:bg-white/[0.02] transition-all group border-b border-white/5"
             >
                <div className="flex flex-col items-start translate-x-0 group-active:translate-x-1 transition-transform">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", isSimulationMode ? "text-sky-400" : "text-[#00FF88]")}>Export Ledger</span>
                  <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">Generate encrypted JSON backup</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <ArrowUpRight size={14} />
                </div>
             </button>

             {isSimulationMode ? (
               <button 
                 type="button"
                 onClick={() => {
                   if (confirmClear === 'simulation') {
                     onClearSimulation();
                     setConfirmClear('none');
                   } else {
                     setConfirmClear('simulation');
                   }
                 }}
                 onMouseLeave={() => setConfirmClear('none')}
                 className={cn(
                   "w-full p-4 flex justify-between items-center transition-all group border-b border-white/5 cursor-pointer",
                   confirmClear === 'simulation' ? "bg-amber-500/10" : "hover:bg-amber-500/5"
                 )}
               >
                  <div className="flex flex-col items-start translate-x-0 group-active:translate-x-1 transition-transform">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", confirmClear === 'simulation' ? "text-amber-500" : "text-amber-500/60")}>
                      {confirmClear === 'simulation' ? 'Confirm Termination' : 'Terminate Simulation'}
                    </span>
                    <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">
                      {confirmClear === 'simulation' ? 'Tap again to purge simulated buffer' : 'Exit simulation mode and purge mock data'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-500/5 flex items-center justify-center text-amber-500/40">
                    <X size={14} />
                  </div>
               </button>
             ) : (
               <button 
                 type="button"
                 onClick={() => {
                   onSeed();
                 }}
                 className="w-full p-4 flex justify-between items-center hover:bg-sky-500/10 transition-all group border-b border-white/5 active:bg-sky-500/20 cursor-pointer"
               >
                  <div className="flex flex-col items-start translate-x-0 group-active:translate-x-1 transition-transform">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Initialize Simulation</span>
                    <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">Seed 30 days of biometric records in a sandbox</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sky-400/5 flex items-center justify-center text-sky-400/40">
                    <Zap size={14} />
                  </div>
               </button>
             )}

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
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", confirmClear === 'purge' ? "text-red-500" : "text-red-400/40")}>
                    {confirmClear === 'purge' ? 'Confirm Total Purge' : 'Terminate Buffer'}
                  </span>
                  <span className="text-[8px] text-white/20 uppercase tracking-tighter mt-0.5">
                    {confirmClear === 'purge' ? 'Tap again to confirm destruction' : 'Purge all local records permanently'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-400/5 flex items-center justify-center text-red-500/20">
                  <Trash2 size={14} />
                </div>
             </button>
          </div>
        </div>

        {/* PWA Installation Section */}
        <div className="space-y-4">
          <label className="small-caps ml-1 !text-white/20">Operational Container</label>
          <div className="bento-card p-6 bg-[#00FF88]/5 border-[#00FF88]/10 space-y-4 shadow-xl shadow-black">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/20 flex items-center justify-center text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                <Plus size={24} strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-light tracking-tight text-[#00FF88]">Protocol Native</h3>
                <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-bold">Standalone APK Equivalent</p>
              </div>
            </div>
            
            <p className="text-[10px] font-light text-white/40 leading-relaxed uppercase tracking-wide">
              Install the protocol directly to your device home screen for low-latency native experience.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono shrink-0">01</div>
                <p className="text-[10px] font-light text-white/60 leading-relaxed">Open mobile browser menu <span className="text-white/80">(Share icon on iOS / Three dots on Android)</span></p>
              </div>
              <div className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono shrink-0">02</div>
                <p className="text-[10px] font-light text-white/60 leading-relaxed">Select <span className="text-[#00FF88] font-medium">"Add to Home Screen"</span> or <span className="text-[#00FF88] font-medium">"Install App"</span></p>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-white/5 mt-2">
              <span className="text-[7px] font-bold text-white/10 uppercase tracking-[0.3em]">Neural Package: standby</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-[#00FF88]" />
                <div className="w-1 h-1 rounded-full bg-[#00FF88]/40" />
                <div className="w-1 h-1 rounded-full bg-[#00FF88]/10" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="small-caps ml-1 !text-white/20">Biometrics</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="bento-card !p-3.5 text-center !bg-[#0a0a0a]">
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-1">Heart Variance</span>
              <span className="text-xs font-mono text-[#00FF88]/40 tracking-wider">OFFLINE</span>
            </div>
            <div className="bento-card !p-3.5 text-center !bg-[#0a0a0a]">
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-1">Neural Load</span>
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
              <span className="text-[7px] font-bold text-white/10 uppercase block mb-0.5">Infrastructure</span>
              <span className="text-[9px] font-mono text-white/30 tracking-tighter uppercase">Edge Protocol / Apex</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtocolTab({ selectedDate, onDateChange, addFood, addWorkout, addSleep, addTask }: { 
  selectedDate: Date, 
  onDateChange: (d: Date) => void,
  addFood: (meal: FoodEntry['meal'], desc: string, nutrition?: any, date?: Date) => void, 
  addWorkout: (activity: string, calories: number, duration?: number, date?: Date) => void, 
  addSleep: (duration: number, quality: number, date?: Date) => void,
  addTask: (desc: string, date?: Date) => void,
}) {
  const [activeModule, setActiveModule] = useState<'intake' | 'activity' | 'sleep' | 'tasks'>('intake');

  const modules = [
    { id: 'intake', label: 'Fuel', icon: <Utensils size={14} />, color: 'text-[#00FF88]' },
    { id: 'activity', label: 'Kinetic', icon: <Flame size={14} />, color: 'text-orange-400' },
    { id: 'sleep', label: 'Rest', icon: <Zap size={14} />, color: 'text-sky-400' },
    { id: 'tasks', label: 'Goal', icon: <CheckSquare size={14} />, color: 'text-emerald-400' },
  ] as const;

  return (
    <div className="px-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="space-y-4">
        <div>
          <span className="small-caps text-[#00FF88] !tracking-[0.3em]">System Input</span>
          <h1 className="display-light">Protocol</h1>
        </div>
        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
      </header>

      {/* Module Selector - Segmented Control */}
      <div className="p-1.5 bg-[#111] border border-white/5 rounded-[24px] flex gap-1 shadow-2xl shadow-black/50">
        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={cn(
              "flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-500 relative overflow-hidden",
              activeModule === mod.id ? "text-white" : "text-white/10 hover:text-white/30"
            )}
          >
            {activeModule === mod.id && (
              <motion.div 
                layoutId="protocol-active-bg"
                className="absolute inset-0 bg-white/[0.03] border border-white/5 shadow-inner"
                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
              />
            )}
            <div className={cn("relative z-10 transition-transform duration-500", activeModule === mod.id && mod.color)}>
              {mod.icon}
            </div>
            <span className="relative z-10 text-[7px] font-bold uppercase tracking-[0.2em]">{mod.label}</span>
          </button>
        ))}
      </div>

      <section className="min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {activeModule === 'intake' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Utensils size={12} className="text-[#00FF88]" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Fuel Intake</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 italic">NUTRITION_BUFFER_01</span>
                </div>
                <FoodQuickAdd onAdd={(m, d, n) => addFood(m, d, n, selectedDate)} />
              </div>
            )}

            {activeModule === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Flame size={12} className="text-orange-400" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Kinetic Record</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 italic">EXERTION_MODULE_02</span>
                </div>
                <WorkoutQuickAdd onAdd={(a, c, du) => addWorkout(a, c, du, selectedDate)} />
              </div>
            )}

            {activeModule === 'sleep' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-sky-400" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Regeneration</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 italic">NEURAL_CYCLES_03</span>
                </div>
                <SleepQuickAdd onAdd={(dur, qual) => addSleep(dur, qual, selectedDate)} />
              </div>
            )}

            {activeModule === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">New Objective</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 italic">GOAL_SET_04</span>
                </div>
                <TaskQuickAdd onAdd={(desc) => addTask(desc, selectedDate)} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
      
      <div className="bento-card bg-white/[0.01] border-white/5 p-6 text-center">
        <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] font-medium italic">
          High-fidelity data synchronization verified
        </p>
      </div>
    </div>
  );
}

function SleepQuickAdd({ onAdd }: { onAdd: (duration: number, quality: number) => void }) {
  const [duration, setDuration] = useState('');
  const [quality, setQuality] = useState(7);

  const handleSave = () => {
    if (!duration) return;
    onAdd(parseFloat(duration), quality);
    setDuration('');
    setQuality(7);
  };

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 space-y-4 focus-within:border-white/10 transition-all duration-500">
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 space-y-1">
          <div className="flex items-baseline gap-1">
            <input 
              type="number" 
              step="0.5"
              placeholder="0.0"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-16 bg-transparent border-none outline-none text-2xl font-light text-sky-400 placeholder:text-sky-400/10"
            />
            <span className="text-[8px] font-bold tracking-[0.1em] text-white/20 uppercase">HOURS SLEPT</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Quality</span>
            <span className="text-xs font-mono text-sky-400/80">{quality}/10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={quality}
            onChange={e => setQuality(parseInt(e.target.value))}
            className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#00FF88]"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={!duration}
          className="w-10 h-10 rounded-full bg-sky-400/5 text-sky-400 border border-sky-400/10 flex items-center justify-center disabled:opacity-5 transition-all hover:bg-sky-400 hover:text-black shrink-0"
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function MatrixTab({ entries, onDateSelect }: { entries: LogEntry[], onDateSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const start = startOfDay(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1));
    const end = startOfDay(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0));
    
    // Find previous Sundays
    const days = [];
    const firstDay = start.getDay();
    for (let i = firstDay; i > 0; i--) {
      days.push(subDays(start, i));
    }
    
    let current = start;
    while (current <= end) {
      days.push(current);
      current = new Date(current.getTime() + 86400000);
    }
    
    return days;
  }, [viewMonth]);

  const getActivity = (day: Date) => {
    const dayEntries = entries.filter(e => isSameDay(e.timestamp, day));
    const hasFood = dayEntries.some(e => e.type === 'food');
    const hasWorkout = dayEntries.some(e => e.type === 'workout');
    const hasTasks = dayEntries.some(e => e.type === 'task');
    const allTasksDone = hasTasks && dayEntries.filter(e => e.type === 'task').every(e => (e as TaskEntry).completed);

    return { hasFood, hasWorkout, hasTasks, allTasksDone, count: dayEntries.length };
  };

  return (
    <div className="px-5 space-y-8 min-h-full transition-all duration-500">
      <header className="flex justify-between items-center">
        <div>
          <span className="small-caps text-[#00FF88] !tracking-[0.3em]">Neural Analytics</span>
          <h1 className="display-light text-3xl">Matrix</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() - 1)))} className="p-2 text-white/20 hover:text-[#00FF88] transition-colors"><ChevronLeft size={20} /></button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF88]">{format(viewMonth, 'MMM yyyy')}</span>
          <button onClick={() => setViewMonth(new Date(viewMonth.setMonth(viewMonth.getMonth() + 1)))} className="p-2 text-white/20 hover:text-[#00FF88] transition-colors"><ChevronRight size={20} /></button>
        </div>
      </header>

      <section className="space-y-6">
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={`${d}-${i}`} className="text-center py-2 text-[8px] font-bold text-white/10">{d}</div>
          ))}
          {daysInMonth.map((day, i) => {
            const { hasFood, hasWorkout, hasTasks, allTasksDone, count } = getActivity(day);
            const isSelectedMonth = day.getMonth() === viewMonth.getMonth();
            const isTodayDay = isToday(day);

            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01 }}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "aspect-square rounded-xl border p-1 flex flex-col items-center justify-between transition-all relative group overflow-hidden",
                  isSelectedMonth ? "bg-white/[0.03] border-white/[0.05]" : "bg-transparent border-transparent opacity-10",
                  isTodayDay && "border-[#00FF88]/40 ring-1 ring-[#00FF88]/20"
                )}
              >
                <span className={cn("text-[9px] tabular-nums font-mono", isTodayDay ? "text-[#00FF88] font-bold" : "text-white/20 group-hover:text-white/60")}>
                  {day.getDate()}
                </span>
                
                <div className="flex gap-0.5 flex-wrap justify-center w-full">
                  {hasFood && <div className="w-1 h-1 rounded-full bg-sky-400/60" />}
                  {hasWorkout && <div className="w-1 h-1 rounded-full bg-orange-400/60" />}
                  {hasTasks && <div className={cn("w-1 h-1 rounded-full", allTasksDone ? "bg-emerald-400" : "bg-white/20")} />}
                </div>

                {count > 0 && isSelectedMonth && (
                  <motion.div 
                    layoutId={`glow-${day.toISOString()}`}
                    className="absolute inset-0 bg-[#00FF88]/5 pointer-events-none"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 py-4 bg-white/[0.02] rounded-3xl border border-white/[0.04]">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400/60" />
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Intake</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Activity</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Full Focus</span>
           </div>
        </div>
      </section>

      {/* Aggregate Stats */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bento-card p-4 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
           <span className="text-2xl font-light text-[#00FF88]">
              {entries.filter(e => e.type === 'workout' && e.timestamp > subDays(new Date(), 30).getTime()).length}
           </span>
           <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] text-center">30D Workouts</span>
        </div>
        <div className="bento-card p-4 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
           <span className="text-2xl font-light text-sky-400">
              {entries.filter(e => e.type === 'food' && e.timestamp > subDays(new Date(), 30).getTime()).length}
           </span>
           <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] text-center">30D Records</span>
        </div>
      </section>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DateNavigator({ selectedDate, onDateChange }: { selectedDate: Date, onDateChange: (d: Date) => void }) {
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 5),
      end: addDays(new Date(), 1)
    });
  }, []);

  return (
    <div className="flex justify-between items-center bg-white/[0.03] border border-white/[0.05] rounded-2xl p-1">
      {days.map((day) => {
        const active = isSameDay(day, selectedDate);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateChange(day)}
            className={cn(
              "flex-1 py-2 flex flex-col items-center rounded-xl transition-all duration-300",
              active ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]" : "text-white/20 hover:text-white/40"
            )}
          >
            <span className={cn("text-[7px] font-bold uppercase tracking-widest mb-0.5", active ? "text-black/60" : "text-white/10")}>
              {format(day, 'EEE')}
            </span>
            <span className="text-sm font-light tabular-nums">{format(day, 'd')}</span>
          </button>
        );
      })}
    </div>
  );
}

function PerformanceGraph({ entries, selectedDate }: { entries: LogEntry[], selectedDate: Date }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dayEntries = entries.filter(e => isSameDay(e.timestamp, day));
      const intake = dayEntries.reduce((sum, e) => sum + (e.type === 'food' ? (e.calories || 0) : 0), 0);
      const activity = dayEntries.reduce((sum, e) => sum + (e.type === 'workout' ? (e.calories || 0) : 0), 0);
      return {
        name: format(day, 'd'),
        intake,
        activity,
        isCurrent: isSameDay(day, selectedDate)
      };
    });
  }, [entries, selectedDate]);

  if (!isMounted) {
    return <div className="w-full h-full bg-white/[0.02] rounded-2xl animate-pulse" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FB923C" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#ffffff10', fontSize: 8, fontWeight: 700 }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#ffffff10', fontSize: 8, fontWeight: 700 }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#111', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '12px',
            fontSize: '10px'
          }}
          itemStyle={{ padding: '0' }}
          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
        />
        <Area 
          type="monotone" 
          dataKey="intake" 
          stroke="#00FF88" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorIntake)" 
          animationDuration={1500}
        />
        <Area 
          type="monotone" 
          dataKey="activity" 
          stroke="#FB923C" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorActivity)"
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function FoodQuickAdd({ onAdd }: { onAdd: (meal: FoodEntry['meal'], desc: string, nutrition?: any) => void }) {
  const [desc, setDesc] = useState('');
  const [meal, setMeal] = useState<FoodEntry['meal']>('Lunch');
  const [showMacros, setShowMacros] = useState(false);
  const [macros, setMacros] = useState({ calories: '', protein: '', carbs: '', fat: '', fiber: '' });

  const isJson = desc.trim().startsWith('{') && desc.trim().endsWith('}');
  
  const handleSave = () => {
    if (!desc.trim()) return;
    
    // Try to parse as JSON if it looks like JSON
    if (isJson) {
      try {
        const data = JSON.parse(desc.trim());
        if (data.rawInput || data.items || data.totals) {
          const nutrition = {
            calories: data.totals?.calories || 0,
            protein: data.totals?.protein || 0,
            carbs: data.totals?.carbs || 0,
            fat: data.totals?.fat || 0,
            fiber: data.totals?.fiber || 0,
            items: data.items || []
          };
          
          // Map mealType to expected meal values
          let detectedMeal = meal;
          if (data.mealType) {
            const m = data.mealType.toLowerCase();
            if (m === 'breakfast') detectedMeal = 'Breakfast';
            else if (m === 'lunch') detectedMeal = 'Lunch';
            else if (m === 'snacks' || m === 'snack') detectedMeal = 'Snacks';
            else if (m === 'dinner') detectedMeal = 'Dinner';
          }
          
          onAdd(detectedMeal, data.rawInput || desc.trim(), nutrition);
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
                { label: 'PRO', key: 'protein', color: 'text-sky-400' },
                { label: 'CHO', key: 'carbs', color: 'text-amber-400' },
                { label: 'FAT', key: 'fat', color: 'text-rose-400' },
                { label: 'FIB', key: 'fiber', color: 'text-emerald-400' }
              ].map(m => (
                <div key={m.key} className="space-y-1">
                  <span className={cn("text-[7px] font-bold tracking-[0.15em] block text-center opacity-40 uppercase", m.color)}>{m.label}</span>
                  <input 
                    type="number"
                    value={(macros as any)[m.key]}
                    onChange={e => setMacros(prev => ({ ...prev, [m.key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 text-center text-[10px] font-medium outline-none"
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
            onClick={() => setShowMacros(!showMacros)}
            className={cn(
              "px-3 py-2 rounded-full text-[8px] font-bold tracking-[0.1em] uppercase transition-all duration-300",
              showMacros ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
            )}
          >
            {showMacros ? 'Back' : 'Macros'}
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

function WorkoutQuickAdd({ onAdd }: { onAdd: (activity: string, cal: number, dur?: number) => void }) {
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

function TaskQuickAdd({ onAdd, className }: { onAdd: (desc: string) => void, className?: string }) {
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

function LogEntryCard({ entry, onDelete }: { entry: LogEntry, onDelete: () => void }) {
  const time = format(entry.timestamp, 'HH:mm');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a0a] border border-white/[0.04] rounded-2xl p-4 relative group hover:border-white/10 transition-all duration-500"
    >
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono text-white/10 tracking-widest uppercase">{time}</span>
            <div className="w-[1px] h-1.5 bg-white/5" />
            <span className={cn(
              "text-[8px] font-bold tracking-[0.2em] uppercase",
              entry.type === 'food' ? "text-sky-400/40" : entry.type === 'workout' ? "text-orange-400/40" : "text-emerald-400/40"
            )}>
              {entry.type === 'food' ? entry.meal : entry.type === 'workout' ? 'Workout' : 'Task'}
            </span>
         </div>
         <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-white/5 hover:text-red-500 transition-all duration-300 transform scale-90">
           <Trash2 size={12} />
         </button>
      </div>

      <div className="space-y-3">
        {entry.type === 'food' && (
          <div className="space-y-2">
             <p className="text-base font-extralight tracking-tight leading-snug text-white/90">{entry.description}</p>
             
             {entry.items && entry.items.length > 0 && (
               <div className="space-y-1.5 pt-1">
                 {entry.items.map((item, idx) => (
                   <div key={item.id || idx} className="flex justify-between items-center text-[10px] border-b border-white/[0.02] last:border-0 pb-1.5 last:pb-0">
                     <div className="flex flex-col">
                       <span className="font-light text-white/50">{item.name}</span>
                       <span className="text-[7px] text-white/10 uppercase tracking-widest">
                         {item.quantity?.value} {item.quantity?.unit}
                       </span>
                     </div>
                     <div className="flex gap-2">
                       <span className="text-white/20 font-mono tracking-tighter tabular-nums">
                         {item.macros?.calories ?? 0}
                         <small className="text-[6px] ml-0.5 opacity-30 uppercase font-sans">kcal</small>
                       </span>
                       <span className="text-sky-400/20 font-mono tracking-tighter tabular-nums">
                         {item.macros?.protein ?? 0}g
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {(entry.protein || entry.carbs || entry.fat || entry.calories) ? (
               <div className="flex gap-3 pt-1">
                 {[
                   { label: 'kcal', val: entry.calories, color: 'text-white' },
                   { label: 'p', val: entry.protein, color: 'text-sky-400' },
                   { label: 'c', val: entry.carbs, color: 'text-amber-400' },
                   { label: 'f', val: entry.fat, color: 'text-rose-400' },
                 ].filter(m => m.val).map(m => (
                   <div key={m.label} className="flex items-baseline gap-0.5">
                     <span className={cn("text-xs font-light opacity-60", m.color)}>{m.val}</span>
                     <span className="text-[7px] font-bold text-white/5 uppercase tracking-tighter">{m.label}</span>
                   </div>
                 ))}
               </div>
             ) : null}
          </div>
        )}
        {entry.type === 'workout' && (
          <div className="flex justify-between items-end">
             <p className="text-lg font-extralight tracking-tight flex-1 pr-4 text-white/80">{entry.activity}</p>
             <div className="text-right">
               <span className="text-xl font-light text-orange-400/80 leading-none mb-0.5 block">{entry.calories}</span>
               <span className="text-[7px] font-bold tracking-widest text-white/10 uppercase">Net Burn</span>
             </div>
          </div>
        )}
        {entry.type === 'sleep' && (
          <div className="flex justify-between items-end">
             <div className="space-y-1">
                <p className="text-lg font-extralight tracking-tight text-white/80">{entry.duration} Hours Sleep</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={cn("w-2 h-1 rounded-full", i < entry.quality ? "bg-sky-400" : "bg-white/5")} />
                  ))}
                </div>
             </div>
             <div className="text-right">
               <span className="text-xl font-light text-sky-400/80 leading-none mb-0.5 block">{entry.quality}/10</span>
               <span className="text-[7px] font-bold tracking-widest text-white/10 uppercase">Quality Index</span>
             </div>
          </div>
        )}
        {entry.type === 'task' && (
          <p className={cn("text-lg font-extralight tracking-tight", (entry as TaskEntry).completed ? "line-through text-white/10" : "text-white/80")}>
            {entry.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
