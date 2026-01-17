import React, { useState } from 'react';
import { ShieldCheck, Home, Briefcase, Sun, Moon, Eye, EyeOff, X } from 'lucide-react';

type LoginMode = 'admin' | 'resident';

interface AdminCredentials {
  login: string;
  haslo: string;
}

interface ResidentCredentials {
  email: string;
  numer: string;
}

interface LoginFormProps {
  onAdminLogin: (credentials: AdminCredentials) => Promise<void>;
  onResidentLogin: (credentials: ResidentCredentials) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onAdminLogin,
  onResidentLogin,
  isDarkMode,
  toggleDarkMode,
  isLoading,
  error,
  onClearError,
}) => {
  const [loginMode, setLoginMode] = useState<LoginMode>('resident');
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>({ login: '', haslo: '' });
  const [resCreds, setResCreds] = useState<ResidentCredentials>({ email: '', numer: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'admin') {
      await onAdminLogin(adminCreds);
    } else {
      await onResidentLogin(resCreds);
    }
  };

  const inputClassName = `w-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50 
    dark:bg-slate-800 rounded-2xl p-4 focus:border-blue-600 outline-none font-bold text-sm dark:text-white transition-colors`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 font-sans transition-colors duration-500">
      {/* Error notification - bottom right */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-2 fade-in duration-300">
          <div className="flex items-center gap-3 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-red-500/30">
            <span className="font-bold text-sm">{error}</span>
            {onClearError && (
              <button onClick={onClearError} className="ml-2 hover:bg-white/20 p-1.5 rounded-xl transition-colors">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />

        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-10">
          Zaloguj się
        </h1>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-10">
          <button
            type="button"
            onClick={() => setLoginMode('resident')}
            className={`flex-1 py-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all
              ${loginMode === 'resident' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Home size={16} /> Mieszkaniec
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('admin')}
            className={`flex-1 py-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all
              ${loginMode === 'admin' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Briefcase size={16} /> Administracja
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {loginMode === 'admin' ? (
            <>
              <input
                type="text"
                placeholder="Login administratora"
                required
                className={inputClassName}
                value={adminCreds.login}
                onChange={e => setAdminCreds(prev => ({ ...prev, login: e.target.value }))}
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Hasło"
                  required
                  className={inputClassName + ' pr-14'}
                  value={adminCreds.haslo}
                  onChange={e => setAdminCreds(prev => ({ ...prev, haslo: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Adres email"
                required
                className={inputClassName}
                value={resCreds.email}
                onChange={e => setResCreds(prev => ({ ...prev, email: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Numer mieszkania (np. 1A, 2B)"
                required
                className={inputClassName}
                value={resCreds.numer}
                onChange={e => setResCreds(prev => ({ ...prev, numer: e.target.value }))}
              />
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs 
              tracking-widest shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logowanie...
              </>
            ) : (
              'Zaloguj się'
            )}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-colors"
            aria-label={isDarkMode ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};
