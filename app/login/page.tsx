'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, signInAnonymously } from '@/backend/auth';
import { motion } from 'motion/react';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async () => {
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    else router.push('/');
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Email and password are required for registration.');
      return;
    }
    setError(null);
    const { data, error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else if (data?.user && !data.session) {
      setError('Registration successful! Please check your email for a confirmation link before signing in.');
    } else {
      router.push('/');
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    const { error } = await signInAnonymously();
    if (error) {
      if (error.message.includes('anonymous')) {
        setError('Guest access is not enabled in the security settings. Please authorize via email.');
      } else {
        setError(error.message);
      }
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black text-white p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extralight tracking-tight">Access</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">System Authentication</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 text-white/20" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-10 text-sm focus:border-[#00FF88]/40 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-white/20" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-10 text-sm focus:border-[#00FF88]/40 outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-red-500 uppercase tracking-widest text-center px-4 leading-relaxed font-bold">{error}</p>
        )}

        <div className="space-y-3">
          <div className="flex gap-3">
            <button 
              onClick={handleSignIn} 
              className="flex-1 bg-[#00FF88] text-black text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-[#00FF88]/90 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
            <button 
              onClick={handleSignUp} 
              className="flex-1 bg-white/5 text-white text-[10px] font-bold uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Sign Up
            </button>
          </div>
          
          <button 
            onClick={handleGuestSignIn} 
            className="w-full bg-white/[0.02] border border-white/5 text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] py-4 rounded-2xl hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            Access as Guest
          </button>
        </div>
      </motion.div>
    </div>
  );
}
