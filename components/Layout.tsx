import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Search, User, Settings, Shield } from 'lucide-react';
import { useApp } from '../context';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useApp();

  const isActive = (path: string) => location.pathname === path;

  // For the active state background, we use a slightly conditional approach or opacity
  const activeClass = "bg-[var(--bg-accent)] text-white shadow-lg";
  const inactiveClass = "text-[var(--text-secondary)] hover:text-[var(--text-main)]";

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col md:flex-row text-[var(--text-main)] overflow-hidden transition-colors duration-300">
      {/* Sidebar / Bottom Navigation */}
      <nav className="fixed bottom-0 w-full md:relative md:w-20 md:h-screen bg-[var(--bg-secondary)] border-t md:border-t-0 md:border-r border-[var(--border-color)] flex md:flex-col justify-around md:justify-start items-center p-2 md:py-6 z-50 transition-colors duration-300">
        
        <div className="hidden md:block mb-8 p-2 bg-[var(--bg-tertiary)] rounded-xl">
           <Shield size={24} className="text-[var(--text-main)]" />
        </div>

        <button 
          onClick={() => navigate('/')} 
          className={`p-3 rounded-2xl transition-all ${isActive('/') ? activeClass : inactiveClass}`}
        >
          <MessageSquare size={24} />
        </button>

        <button 
          onClick={() => navigate('/search')} 
          className={`p-3 rounded-2xl transition-all md:mt-4 ${isActive('/search') ? activeClass : inactiveClass}`}
        >
          <Search size={24} />
        </button>

        <button 
          onClick={() => navigate('/profile')} 
          className={`p-3 rounded-2xl transition-all md:mt-4 ${isActive('/profile') ? activeClass : inactiveClass}`}
        >
          <User size={24} />
        </button>

        <button 
          onClick={() => navigate('/settings')} 
          className={`p-3 rounded-2xl transition-all md:mt-4 ${isActive('/settings') ? activeClass : inactiveClass}`}
        >
          <Settings size={24} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;