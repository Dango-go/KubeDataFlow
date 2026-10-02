import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail, ShieldCheck, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { KubeDataFlowLogo } from '../common/KubeDataFlowLogo';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (authMode === 'register' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'register') {
        try {
          await apiClient.register(email, password);
          setSuccessMsg('Account created successfully! Logging in...');
          await new Promise((res) => setTimeout(res, 400));
        } catch (regErr: any) {
          // If email is already registered in Postgres, attempt direct login with provided credentials
          if (regErr?.message?.toLowerCase().includes('already registered')) {
            await apiClient.login(email, password);
            setIsLoading(false);
            onLoginSuccess();
            return;
          }
          throw regErr;
        }
        await apiClient.login(email, password);
      } else {
        await apiClient.login(email, password);
      }
      setIsLoading(false);
      onLoginSuccess();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center items-center p-6 relative overflow-hidden text-slate-100">
      {/* Background Neon Glowing Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-sky/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-bg-card rounded-3xl border border-accent-darkBorder p-8 shadow-2xl shadow-black relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <KubeDataFlowLogo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {authMode === 'login' ? 'Sign In to KubeDataFlow' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Cloud Database Management Platform</p>
        </div>

        {/* MODE TOGGLE TABS (Sign In / Register) */}
        <div className="grid grid-cols-2 p-1 bg-bg-main rounded-2xl border border-accent-darkBorder mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-brand-blue text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-fadeIn font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form (Fields as in app/auth-service: email & password) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Work Email (email)
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky transition-all placeholder:text-slate-600 font-semibold"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password (password)
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky transition-all placeholder:text-slate-600 font-semibold"
                placeholder="••••••••"
              />
            </div>
          </div>

          {authMode === 'register' && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky transition-all placeholder:text-slate-600 font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {authMode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-bg-main text-brand-blue focus:ring-brand-sky" />
                Remember me
              </label>
              <a href="#forgot" className="text-brand-sky hover:underline font-semibold">Forgot password?</a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center justify-center gap-2 transition-all mt-4"
          >
            {isLoading ? (
              <span>{authMode === 'login' ? 'Authenticating...' : 'Registering Account...'}</span>
            ) : (
              <>
                <span>{authMode === 'login' ? 'Sign In to Console' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
