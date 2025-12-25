import React from 'react';
import { Shield } from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-6 text-center text-[var(--text-main)]">
      <div className="max-w-2xl flex flex-col items-center">
        <Shield size={64} className="mb-6 text-[var(--text-secondary)]" />
        <h1 className="text-3xl md:text-5xl font-medium mb-6 uppercase tracking-wider">
          Добро пожаловать в OpenKey
        </h1>
        <p className="text-[var(--text-secondary)] mb-12 max-w-lg leading-relaxed text-sm md:text-base uppercase">
          Безопасный мессенджер нового поколения. <br/>
          Сквозное шифрование всех сообщений и вложений. <br/>
          Ваша приватность — наш главный приоритет.
        </p>

        <button 
          onClick={onStart}
          className="bg-[var(--bg-accent)] hover:opacity-90 text-white px-12 py-4 rounded-full text-lg md:text-xl uppercase tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          Начать общение
        </button>
      </div>
    </div>
  );
};

export default Welcome;