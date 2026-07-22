'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, History, CheckSquare, User, Zap, Calendar, BarChart2 } from 'lucide-react';
import { startOfToday } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useDailyLog } from '@/hooks/use-daily-log';
import { useAuth } from '@/components/AuthProvider';
import { HomeTab } from '@/components/tabs/HomeTab';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { TasksTab } from '@/components/tabs/TasksTab';
import { ProtocolTab } from '@/components/tabs/ProtocolTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { PerformanceModal } from '@/components/modals/PerformanceModal';
import { ConsistencyModal } from '@/components/modals/ConsistencyModal';
import { NameGate } from '@/components/NameGate';

type Tab = 'home' | 'history' | 'tasks' | 'settings' | 'protocol';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [showPerformance, setShowPerformance] = useState(false);
  const [showConsistency, setShowConsistency] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const {
    entries,
    addFood,
    addWater,
    addWorkout,
    addTask,
    addSleep,
    toggleTask,
    deleteEntry,
    clearLogs,
    isLoaded
  } = useDailyLog();

  if (!isLoaded || authLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="small-caps !text-[#00FF88]"
        >
          Initializing Application
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  // Required first-run step: every account (guest or email) must set a display name.
  if (!user.user_metadata?.display_name) return <NameGate />;

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
        {/* Global Navigation Icons */}
        <div className="fixed top-6 right-5 z-[60] flex items-center gap-3">
          <button
            onClick={() => setShowPerformance(true)}
            className="w-10 h-10 rounded-full bg-[#111]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-[#00FF88] hover:bg-[#111] hover:border-[#00FF88]/20 transition-all active:scale-95 shadow-2xl shadow-black"
          >
            <BarChart2 size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setShowConsistency(true)}
            className="w-10 h-10 rounded-full bg-[#111]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-sky-400 hover:bg-[#111] hover:border-sky-400/20 transition-all active:scale-95 shadow-2xl shadow-black"
          >
            <Calendar size={18} strokeWidth={1.5} />
          </button>
        </div>

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
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                addTask={addTask}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab
                entries={entries}
                deleteEntry={deleteEntry}
                onDateJump={handleDateJump}
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
                addWater={addWater}
                addWorkout={addWorkout}
                addSleep={addSleep}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                entries={entries}
                onClear={clearLogs}
                user={user}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals */}
      <PerformanceModal
        isOpen={showPerformance}
        onClose={() => setShowPerformance(false)}
        entries={entries}
        selectedDate={selectedDate}
      />
      <ConsistencyModal
        isOpen={showConsistency}
        onClose={() => setShowConsistency(false)}
        entries={entries}
      />

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50">
        <nav className="bg-[#111]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-1.5 flex justify-around items-center shadow-2xl shadow-black">
          <NavItem icon={<Home strokeWidth={1.5} size={18} />} label="Daily" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Zap strokeWidth={1.5} size={18} />} label="Log" isActive={activeTab === 'protocol'} onClick={() => setActiveTab('protocol')} />
          <NavItem icon={<CheckSquare strokeWidth={1.5} size={18} />} label="Goals" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavItem icon={<History strokeWidth={1.5} size={18} />} label="Trends" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
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
