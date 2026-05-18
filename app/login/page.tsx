'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/backend/auth';

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
     const { error } = await signUp(email, password);
     if (error) setError(error.message);
     else router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login / Sign Up</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 mb-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mb-2"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button onClick={handleSignIn} className="bg-blue-500 text-white p-2 mb-2 w-full">Sign In</button>
      <button onClick={handleSignUp} className="bg-green-500 text-white p-2 w-full">Sign Up</button>
    </div>
  );
}
