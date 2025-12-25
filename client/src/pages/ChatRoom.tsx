import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, Send, Paperclip, Trash2, BellOff, Video, Search, Trash } from 'lucide-react';
import { useApp } from '../context';

const ChatRoom: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getChat, sendMessage, deleteChat, clearChatHistory } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get dynamic chat data
  const chatInfo = id ? getChat(id) : undefined;
  const messages = chatInfo?.messages || [];
  const isTyping = chatInfo?.isTyping || false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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

  const handleSend = () => {
    if (!inputValue.trim() || !id) return;
    sendMessage(id, inputValue);
    setInputValue('');
  };

  const handleMenuAction = (action: string) => {
      setIsMenuOpen(false);
      if (!id) return;

      switch (action) {
          case 'clear':
              if (confirm('Вы уверены, что хотите очистить историю?')) {
                clearChatHistory(id);
              }
              break;
          case 'delete':
              if (confirm('Удалить этот чат?')) {
                deleteChat(id);
                navigate('/');
              }
              break;
          case 'mute':
              alert('Уведомления отключены');
              break;
      }
  };

  if (!chatInfo) return <div className="p-10 text-[var(--text-main)]">Чат не найден...</div>;

  const formatMessageTime = (isoString: string) => {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-main)]">
      {/* Chat Header */}
      <header className="h-20 bg-[var(--bg-secondary)] flex items-center justify-between px-4 shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="md:hidden text-[var(--text-main)]">
            <ChevronLeft size={28} />
          </button>
          
          <div className="relative">
             <img 
                src={chatInfo.user.avatar} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full bg-gray-300 object-cover" 
            />
            {chatInfo.user.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-[var(--bg-secondary)]"></div>}
          </div>
          
          
          <div className="flex flex-col">
            <h2 className="text-[var(--text-main)] text-lg uppercase font-bold tracking-wide leading-tight">
              {chatInfo.user.username}
            </h2>
            <span className={`text-xs uppercase font-medium transition-colors ${isTyping ? 'text-[var(--bg-accent)]' : 'text-[var(--text-secondary)]'}`}>
              {isTyping ? 'Печатает...' : (chatInfo.user.isOnline ? 'В сети' : 'Был(а) недавно')}
            </span>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full transition-colors"
            >
                <MoreVertical className="text-[var(--text-secondary)] cursor-pointer" />
            </button>

            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-color)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-2">
                        <button onClick={() => handleMenuAction('video')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <Video size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Видеозвонок</span>
                        </button>
                        <button onClick={() => handleMenuAction('search')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <Search size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Поиск</span>
                        </button>
                        <button onClick={() => handleMenuAction('mute')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors">
                            <BellOff size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Без звука</span>
                        </button>
                        <div className="h-px bg-[var(--border-color)] my-1 mx-2"></div>
                        <button onClick={() => handleMenuAction('clear')} className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors text-[var(--text-main)]">
                            <Trash2 size={18} className="text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium uppercase">Очистить историю</span>
                        </button>
                        <button onClick={() => handleMenuAction('delete')} className="w-full px-4 py-3 text-left hover:bg-red-900/20 flex items-center gap-3 transition-colors text-red-500">
                            <Trash size={18} />
                            <span className="text-sm font-bold uppercase">Удалить чат</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length > 0 ? (
            messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex w-full ${msg.isMine ? 'justify-end' : 'justify-start'}`}
            >
                <div 
                className={`max-w-[80%] md:max-w-[60%] p-4 rounded-[1.5rem] shadow-sm relative group
                    ${msg.isMine 
                    ? 'bg-[var(--bg-message-mine)] text-[#2D2D2D] rounded-br-sm' 
                    : 'bg-[var(--bg-secondary)] text-[var(--text-main)] rounded-bl-sm'
                    }`}
                >
                <div className="text-sm md:text-base font-medium break-words leading-relaxed">
                    {msg.text}
                </div>
                <div className={`text-[10px] font-bold mt-1 text-right uppercase opacity-60 ${msg.isMine ? 'text-black' : 'text-[var(--text-secondary)]'}`}>
                    {formatMessageTime(msg.timestamp)}
                    {msg.isMine && (
                        <span className="ml-1">
                            {msg.status === 'read' ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
                </div>
            </div>
            ))
        ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
                <div className="bg-[var(--bg-secondary)] p-6 rounded-full mb-4">
                    <Trash2 size={48} className="text-[var(--text-main)]" />
                </div>
                <p className="text-[var(--text-secondary)] uppercase font-bold">История чиста</p>
            </div>
        )}
        
        {/* Typing Bubble */}
        {isTyping && (
             <div className="flex w-full justify-start">
                 <div className="bg-[var(--bg-secondary)] p-4 rounded-[1.5rem] rounded-bl-sm flex gap-1 items-center h-12">
                     <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                     <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce"></div>
                 </div>
             </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--bg-main)] mb-16 md:mb-0 transition-colors z-10">
        <div className="w-full h-16 bg-[var(--bg-secondary)] rounded-full flex items-center px-2 shadow-lg ring-1 ring-white/5">
           <button className="p-3 text-[var(--text-secondary)] hover:text-[var(--text-main)] transition">
            <Paperclip size={24} />
           </button>
           
           <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent text-[var(--text-main)] placeholder-[var(--text-secondary)] px-2 focus:outline-none font-medium uppercase tracking-wide"
           />
           
           <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`p-3 rounded-full text-white transition ml-2 shadow-md ${inputValue.trim() ? 'bg-[var(--bg-accent)] hover:scale-105 active:scale-95' : 'bg-[#4A4A4A] cursor-not-allowed opacity-50'}`}
           >
             <Send size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;