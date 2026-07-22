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
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError(null);
    setSuccess(null);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    else router.push('/');
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError(null);
    setSuccess(null);
    const { data, error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else if (data?.user?.identities?.length === 0) {
       setError("Account already exists. Please sign in instead.");
    } else if (data?.user && !data.session) {
      setSuccess("Account created! Please check your email to verify.");
    } else {
      router.push('/');
    }
  };

  const handleAnonymousSignIn = async () => {
    setError(null);
    setSuccess(null);
    const { error } = await signInAnonymously();
    if (error) setError(error.message);
    else router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-black text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex justify-center">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-[#00FF88]/20 blur-xl rounded-full" />
            {/* Geometric A / Mountain Form */}
            <svg viewBox="0 0 100 100" className="w-12 h-12 relative z-10 drop-shadow-[0_0_10px_rgba(0,255,136,0.8)]">
              <path d="M50 15 L90 85 L75 85 L50 40 L25 85 L10 85 Z" fill="#00FF88" />
              <path d="M35 65 L65 65 L60 75 L40 75 Z" fill="#00FF88" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extralight tracking-tight">Apex Protocol</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">Start Tracking Instantly</p>
        </div>

        {/* PRIMARY: Guest */}
        <button
          onClick={handleAnonymousSignIn}
          className="w-full bg-[#00FF88] text-black text-xs font-bold uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-[#00FF88]/90 shadow-[0_0_15px_rgba(0,255,136,0.15)] hover:shadow-[0_0_25px_rgba(0,255,136,0.3)] transition-all active:scale-[0.98]"
        >
          Continue as Guest
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-white/10" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 whitespace-nowrap">or use email</span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* SECONDARY: Email / password */}
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
              placeholder={mode === 'signin' ? "App Password" : "Create App Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-10 text-sm focus:border-[#00FF88]/40 outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-red-500 uppercase tracking-widest text-center">{error}</p>
        )}
        {success && (
          <p className="text-[10px] text-[#00FF88] uppercase tracking-[0.1em] text-center">{success}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={mode === 'signin' ? handleSignIn : handleSignUp}
            className="w-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold uppercase tracking-[0.1em] py-4 rounded-2xl hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
          >
            {mode === 'signin' ? 'Sign In with Email' : 'Create Account'}
          </button>

          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setSuccess(null);
            }}
            className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/70 transition-colors text-center pt-1"
          >
            {mode === 'signin' ? 'Need an account? Sign Up' : 'Already have one? Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
