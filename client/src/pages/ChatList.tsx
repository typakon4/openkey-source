import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Users, Phone, Bookmark, Settings, User } from 'lucide-react';
import { useApp } from '../context';

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { chats } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action: string) => {
    setIsMenuOpen(false);
    switch(action) {
        case 'contacts':
            navigate('/search');
            break;
        case 'settings':
            navigate('/settings');
            break;
        case 'saved':
            navigate('/chat/saved');
            break;
        case 'group':
            alert('Создание групп пока недоступно');
            break;
        case 'calls':
            alert('Звонки пока недоступны');
            break;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] p-4 text-[var(--text-main)] relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pl-2 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-widest uppercase">Чаты</h1>
          <span className="bg-[var(--bg-tertiary)] text-xs px-3 py-1 rounded-full text-[var(--text-secondary)] uppercase cursor-pointer hover:bg-[var(--bg-secondary)] transition">
            Сортировать
          </span>
        </div>
        
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full transition-colors"
            >
                <MoreVertical className="text-[var(--text-secondary)] cursor-pointer" />
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-color)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-2">
                        <button onClick={() => handleMenuAction('group')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <Users size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Новая группа</span>
                        </button>
                        <button onClick={() => handleMenuAction('contacts')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <User size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Контакты</span>
                        </button>
                         <button onClick={() => handleMenuAction('calls')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <Phone size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Звонки</span>
                        </button>
                        <button onClick={() => handleMenuAction('saved')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <Bookmark size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Избранное</span>
                        </button>
                        <div className="h-px bg-[var(--border-color)] my-1 mx-2"></div>
                        <button onClick={() => handleMenuAction('settings')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <Settings size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Настройки</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-20 md:pb-0">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => navigate(`/chat/${chat.id}`)}
            className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] hover:bg-opacity-80 rounded-[2rem] cursor-pointer transition-colors group"
          >
            <div className="relative flex-shrink-0">
               <img 
                src={chat.user.avatar} 
                alt={chat.user.username} 
                className="w-14 h-14 rounded-full object-cover bg-gray-400 border-2 border-[var(--bg-main)]"
              />
              {chat.user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--bg-tertiary)]"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-[var(--text-main)] font-bold text-sm uppercase truncate">
                  {chat.user.username}
                </h3>
                <span className="text-[var(--text-secondary)] text-[10px] font-bold uppercase">
                    {formatTime(chat.lastMessageTime)}
                </span>
              </div>
              <p className={`text-xs font-semibold truncate uppercase tracking-tight ${chat.isTyping ? 'text-[var(--bg-accent)] animate-pulse' : 'text-[var(--text-secondary)]'}`}>
                {chat.isTyping ? 'Печатает...' : chat.lastMessage}
              </p>
            </div>

            {chat.unreadCount > 0 && (
               <div className="w-6 h-6 bg-[var(--bg-main)] rounded-full flex items-center justify-center shrink-0">
                 <span className="text-[var(--text-main)] text-xs font-bold">{chat.unreadCount}</span>
               </div>
            )}
          </div>
        ))}
        
        {/* Placeholder if empty or just filler */}
        {chats.length < 5 && [1, 2, 3].map((i) => (
           <div key={`placeholder-${i}`} className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] opacity-20 rounded-[2rem]">
              <div className="w-14 h-14 rounded-full bg-gray-400"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-400 rounded w-1/3"></div>
                <div className="h-3 bg-gray-400 rounded w-1/2"></div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;