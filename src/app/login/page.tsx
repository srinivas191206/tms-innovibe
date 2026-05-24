'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Users, Briefcase, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill seed accounts for reviewer ease-of-use
  const SEED_ACCOUNTS = [
    {
      role: 'ADMIN',
      title: 'Portal Admin',
      email: 'admin@innovibe.com',
      pass: 'admin123',
      icon: Shield,
      color: 'border-indigo-100 hover:border-indigo-500 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50/70'
    },
    {
      role: 'DEPT_HEAD',
      title: 'Dept Head',
      email: 'head@innovibe.com',
      pass: 'head123',
      icon: Briefcase,
      color: 'border-emerald-100 hover:border-emerald-500 text-emerald-600 bg-emerald-50/30 hover:bg-emerald-50/70'
    },
    {
      role: 'EMPLOYEE',
      title: 'Employee',
      email: 'employee@innovibe.com',
      pass: 'employee123',
      icon: Users,
      color: 'border-violet-100 hover:border-violet-500 text-violet-600 bg-violet-50/30 hover:bg-violet-50/70'
    }
  ];

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (errorParam) {
      if (errorParam === 'CredentialsSignin') {
        setErrorMsg('Invalid email or password. Please try again.');
      } else if (errorParam === 'Unauthorized') {
        setErrorMsg('Access denied. Log in with an authorized account.');
      } else {
        setErrorMsg(errorParam);
      }
    }
  }, [errorParam]);

  const handleQuickFill = (acc: typeof SEED_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg(res.error || 'Invalid credentials.');
      } else {
        router.refresh();
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg('An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row items-stretch select-none bg-radial from-[#1e1b4b] to-[#020617] text-white">
      {/* 1. Left side visual brand banner */}
      <div className="md:flex md:w-1/2 flex-col justify-between p-12 bg-cover bg-center bg-no-repeat relative overflow-hidden shrink-0 border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/70 to-slate-950/90 mix-blend-multiply z-0"></div>
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

        <div className="relative z-10">
          <span className="font-extrabold text-2xl tracking-wider text-indigo-400 font-outfit uppercase">INNOVIBE</span>
        </div>

        <div className="relative z-10 space-y-4 my-auto py-12 md:py-0 max-w-lg">
          <h2 className="text-4xl md:text-5xl font-extrabold font-outfit leading-tight tracking-tight">
            The Smart, AI-Driven <span className="gradient-text">TMS & Attendance</span> Portal.
          </h2>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-light">
            An all-in-one corporate environment for real-time AI face recognition attendance, intelligent office lateness auditing, and visual project task boards.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Innovibe Systems. Production-Ready Deployment.
        </div>
      </div>

      {/* 2. Right side login card panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-slate-50 text-slate-900">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl relative z-10">
          <div className="text-center">
            <h3 className="text-2xl font-bold font-outfit text-slate-900">Welcome Back</h3>
            <p className="text-xs text-slate-500 mt-1">Sign in below to unlock your personalized workplace.</p>
          </div>

          {/* Seed accounts cards */}
          <div className="space-y-2.5">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Developer Quick Fill Accounts</label>
            <div className="grid grid-cols-3 gap-2.5">
              {SEED_ACCOUNTS.map((acc) => {
                const AccIcon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer ${acc.color}`}
                  >
                    <AccIcon className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold tracking-wide leading-tight text-slate-700">{acc.title}</p>
                      <p className="text-[8px] text-slate-400 leading-none mt-0.5">{acc.pass}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs text-slate-600 font-semibold">Corporate Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs text-slate-600 font-semibold">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg-indigo text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all disabled:opacity-50 text-sm mt-6 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating secure tokens...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-radial from-[#1e1b4b] to-[#020617] text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
