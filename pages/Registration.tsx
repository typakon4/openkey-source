import React, { useState } from 'react';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context';

const Registration: React.FC = () => {
  const { login, register, authError } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!username || !password) {
        setLocalError('Заполните все поля');
        return;
    }

    setIsLoading(true);
    try {
        if (isLogin) {
            await login(username, password);
        } else {
            await register(username, password);
        }
    } catch (e) {
        // Error handled in context, but we stop loading here
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 text-[var(--text-main)]">
      <div className="w-full max-w-md bg-[var(--bg-tertiary)] p-8 rounded-[2rem] shadow-2xl transition-colors">
        
        {/* Toggle Switcher */}
        <div className="w-full bg-[var(--bg-main)] rounded-full p-1.5 mb-10 flex relative shadow-inner">
            <button
                type="button"
                onClick={() => { setIsLogin(true); setLocalError(''); }}
                className={`flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                    isLogin ? 'bg-[var(--bg-accent)] text-white shadow-lg transform scale-100' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
            >
                Вход
            </button>
            <button
                type="button"
                onClick={() => { setIsLogin(false); setLocalError(''); }}
                className={`flex-1 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                    !isLogin ? 'bg-[var(--bg-accent)] text-white shadow-lg transform scale-100' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
            >
                Регистрация
            </button>
        </div>
        
        <h2 className="text-2xl text-center mb-8 uppercase font-semibold tracking-wide">
            {isLogin ? 'С возвращением' : 'Новый аккаунт'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="text-[var(--text-secondary)]" size={20} />
            </div>
            <input
              type="text"
              placeholder="Юзернейм"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--bg-main)] text-[var(--text-main)] pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--bg-accent)] placeholder-gray-500 transition-all font-medium"
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="text-[var(--text-secondary)]" size={20} />
            </div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-main)] text-[var(--text-main)] pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--bg-accent)] placeholder-gray-500 transition-all font-medium"
              disabled={isLoading}
            />
          </div>

          {(authError || localError) && (
             <div className="bg-red-900/30 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <span className="text-red-200 text-xs font-bold uppercase">{localError || authError}</span>
             </div>
          )}

          {!isLogin && (
             <div className="text-xs text-center text-[var(--text-secondary)] uppercase mt-4">
               Ваш аккаунт будет надежно сохранен в базе данных
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--bg-accent)] hover:opacity-90 disabled:opacity-50 text-white py-4 rounded-2xl text-lg uppercase font-medium transition-all shadow-lg active:scale-95 mt-8 tracking-wide flex justify-center items-center gap-2"
          >
            {isLoading && <Loader2 size={20} className="animate-spin" />}
            {isLogin ? 'Войти' : 'Создать'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;