import React, { useState } from 'react';
import { ShieldCheck, Home, Briefcase, Sun, Moon } from 'lucide-react';

type LoginMode = 'admin' | 'resident';

interface AdminCredentials {
  login: string;
  haslo: string;
}

interface ResidentCredentials {
  imie: string;
  nazwisko: string;
  numer: string;
}

interface LoginFormProps {
  onAdminLogin: (credentials: AdminCredentials) => Promise<void>;
  onResidentLogin: (credentials: ResidentCredentials) => Promise<void>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onAdminLogin,
  onResidentLogin,
  isDarkMode,
  toggleDarkMode,
  isLoading,
}) => {
  const [loginMode, setLoginMode] = useState<LoginMode>('resident');
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>({ login: '', haslo: '' });
  const [resCreds, setResCreds] = useState<ResidentCredentials>({ imie: '', nazwisko: '', numer: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMode === 'admin') {
      await onAdminLogin(adminCreds);
    } else {
      await onResidentLogin(resCreds);
    }
  };

  const inputClassName = `w-full border-2 border-slate-100 dark:border-slate-800 bg-slate-50 
    dark:bg-slate-800 rounded-2xl p-4 focus:border-blue-600 outline-none font-bold text-sm dark:text-white`;

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 font-sans transition-colors duration-500">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
        
        <div className="bg-blue-600/10 p-5 rounded-3xl inline-block mb-6 shadow-lg shadow-blue-500/10">
          <ShieldCheck size={44} className="text-blue-600" />
        </div>
        
        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-8 leading-tight">
          System zarządzania spółdzielnią mieszkaniową
        </h1>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => setLoginMode('resident')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all
              ${loginMode === 'resident' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Home size={14} /> Mieszkaniec
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('admin')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all
              ${loginMode === 'admin' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            <Briefcase size={14} /> Administracja
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
              <input
                type="password"
                placeholder="Hasło"
                required
                className={inputClassName}
                value={adminCreds.haslo}
                onChange={e => setAdminCreds(prev => ({ ...prev, haslo: e.target.value }))}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Imię"
                required
                className={inputClassName}
                value={resCreds.imie}
                onChange={e => setResCreds(prev => ({ ...prev, imie: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Nazwisko"
                required
                className={inputClassName}
                value={resCreds.nazwisko}
                onChange={e => setResCreds(prev => ({ ...prev, nazwisko: e.target.value }))}
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
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] 
              tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 transition-colors"
            aria-label={isDarkMode ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
