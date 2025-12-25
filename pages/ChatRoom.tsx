import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical, Send, Paperclip, Trash2, BellOff, Video, Search, Trash, X, File, Download, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../context';
import { BASE_URL } from '../utils/api';
import { decryptFile } from '../utils/encryption';

// --- SECURE ATTACHMENT COMPONENT ---
// Downloads encrypted blob, decrypts it, and renders local object URL
const SecureAttachment: React.FC<{ url: string; type: string; isSecret: boolean }> = ({ url, type, isSecret }) => {
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    useEffect(() => {
        if (!isSecret) {
            setDecryptedUrl(fullUrl);
            return;
        }

        const fetchAndDecrypt = async () => {
            setLoading(true);
            try {
                const response = await fetch(fullUrl);
                const encryptedBlob = await response.blob();
                
                // Mime Type guessing based on extension isn't perfect here, defaulting to png/generic
                const mime = type === 'image' ? 'image/png' : 'application/octet-stream';
                
                const decryptedBlob = await decryptFile(encryptedBlob, mime);
                const objUrl = URL.createObjectURL(decryptedBlob);
                setDecryptedUrl(objUrl);
            } catch (e) {
                console.error("Failed to decrypt image", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAndDecrypt();

        return () => {
            // Cleanup blob url on unmount
            if (decryptedUrl && decryptedUrl.startsWith('blob:')) {
                URL.revokeObjectURL(decryptedUrl);
            }
        };
    }, [url, isSecret]);

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-green-500" /></div>;
    if (error) return <div className="p-4 bg-red-900/20 text-red-500 rounded-xl text-xs">Ошибка расшифровки файла</div>;
    if (!decryptedUrl) return null;

    if (type === 'image') {
        return (
            <div className="mb-2 rounded-xl overflow-hidden bg-black/10 relative group">
                <img 
                    src={decryptedUrl} 
                    alt="attachment" 
                    className={`max-w-full h-auto object-cover max-h-[300px] ${isSecret ? 'opacity-90 hover:opacity-100 transition' : ''}`}
                    loading="lazy"
                />
                {isSecret && <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><Lock size={12} className="text-green-400" /></div>}
            </div>
        );
    }

    return (
        <a href={decryptedUrl} download="secret_file" className="flex items-center gap-3 bg-black/10 p-3 rounded-xl mb-2 hover:bg-black/20 transition">
            <div className={`p-2 rounded-lg text-white ${isSecret ? 'bg-green-600' : 'bg-[var(--bg-accent)]'}`}>
                <File size={20} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase truncate">
                {type === 'video' ? 'Видео (шифр)' : 'Файл (шифр)'}
                </div>
                <div className="text-[10px] opacity-70 uppercase">Нажмите для скачивания</div>
            </div>
            <Download size={16} />
        </a>
    );
};


const ChatRoom: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getChat, sendMessage, deleteChat, clearChatHistory, markChatAsRead } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatInfo = id ? getChat(id) : undefined;
  
  const messages = chatInfo?.messages || [];
  const isSecret = chatInfo?.isSecret || false;
  const isTyping = chatInfo?.isTyping || false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, selectedFile]); 

  useEffect(() => {
      if (id && chatInfo?.unreadCount && chatInfo.unreadCount > 0) {
          markChatAsRead(id);
      }
  }, [id, chatInfo?.unreadCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
             setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const handleSend = () => {
    if ((!inputValue.trim() && !selectedFile) || !id) return;
    sendMessage(id, inputValue, selectedFile || undefined);
    setInputValue('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      <header className={`h-20 flex items-center justify-between px-4 shadow-sm shrink-0 z-20 transition-colors ${isSecret ? 'bg-[#1a2e1a] border-b border-green-900/50' : 'bg-[var(--bg-secondary)]'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="md:hidden text-[var(--text-main)]">
            <ChevronLeft size={28} />
          </button>
          
          <div className="relative">
             <img 
                src={chatInfo.user.avatar} 
                alt="Avatar" 
                className={`w-12 h-12 rounded-full object-cover ${isSecret ? 'border-2 border-green-500' : 'bg-gray-300'}`}
            />
            {chatInfo.user.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-[var(--bg-secondary)]"></div>}
          </div>
          
          <div className="flex flex-col">
            <h2 className={`text-lg uppercase font-bold tracking-wide leading-tight flex items-center gap-2 ${isSecret ? 'text-green-500' : 'text-[var(--text-main)]'}`}>
              {isSecret && <Lock size={16} />}
              {chatInfo.user.username}
            </h2>
            <span className={`text-xs uppercase font-medium transition-colors ${isTyping ? 'text-[var(--bg-accent)]' : (isSecret ? 'text-green-500/60' : 'text-[var(--text-secondary)]')}`}>
              {isTyping ? 'Печатает...' : (isSecret ? 'E2E Шифрование' : (chatInfo.user.isOnline ? 'В сети' : 'Был(а) недавно'))}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-full transition-colors"
                >
                    <MoreVertical className={`cursor-pointer ${isSecret ? 'text-green-500' : 'text-[var(--text-secondary)]'}`} />
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
        </div>
      </header>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar ${isSecret ? 'bg-[#0f1a0f]' : ''}`}>
        {isSecret && messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-40">
                <div className="bg-green-900/20 p-6 rounded-full mb-4 border border-green-500/20">
                    <Lock size={48} className="text-green-500" />
                </div>
                <p className="text-green-500 uppercase font-bold text-center px-6">
                    Сообщения в этом чате шифруются на вашем устройстве.
                </p>
                <p className="text-green-500/60 text-xs text-center mt-2 max-w-xs">
                    Сервер не видит содержимое переписки.
                </p>
            </div>
        )}

        {messages.map((msg) => (
        <div 
            key={msg.id} 
            className={`flex w-full ${msg.isMine ? 'justify-end' : 'justify-start'}`}
        >
            <div 
            className={`max-w-[80%] md:max-w-[60%] p-4 rounded-[1.5rem] shadow-sm relative group flex flex-col transition-all duration-300
                ${msg.isMine 
                ? (isSecret ? 'bg-green-800 text-white rounded-br-sm' : 'bg-[var(--bg-message-mine)] text-[#2D2D2D] rounded-br-sm')
                : (isSecret ? 'bg-[#1a2e1a] text-green-100 border border-green-500/20 rounded-bl-sm' : 'bg-[var(--bg-secondary)] text-[var(--text-main)] rounded-bl-sm')
                }`}
            >
            
            {msg.attachmentUrl && (
                <SecureAttachment 
                    url={msg.attachmentUrl} 
                    type={msg.attachmentType || 'file'} 
                    isSecret={isSecret} 
                />
            )}

            {msg.text && (
                <div className="text-sm md:text-base font-medium break-words leading-relaxed">
                    {msg.text}
                </div>
            )}

            <div className={`flex items-center justify-end gap-1 mt-1 opacity-60`}>
                <div className={`text-[10px] font-bold uppercase ${msg.isMine ? (isSecret ? 'text-green-200' : 'text-black') : (isSecret ? 'text-green-500' : 'text-[var(--text-secondary)]')}`}>
                    {formatMessageTime(msg.timestamp)}
                    {msg.isMine && (
                        <span className="ml-1">
                            {msg.status === 'read' ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>
            </div>
            </div>
        </div>
        ))}
        
        {/* Typing Bubble */}
        {isTyping && (
             <div className="flex w-full justify-start">
                 <div className={`p-4 rounded-[1.5rem] rounded-bl-sm flex gap-1 items-center h-12 ${isSecret ? 'bg-[#1a2e1a]' : 'bg-[var(--bg-secondary)]'}`}>
                     <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${isSecret ? 'bg-green-500' : 'bg-[var(--text-secondary)]'}`}></div>
                     <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${isSecret ? 'bg-green-500' : 'bg-[var(--text-secondary)]'}`}></div>
                     <div className={`w-2 h-2 rounded-full animate-bounce ${isSecret ? 'bg-green-500' : 'bg-[var(--text-secondary)]'}`}></div>
                 </div>
             </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 mb-16 md:mb-0 transition-colors z-10 flex flex-col gap-2 ${isSecret ? 'bg-[#0f1a0f]' : 'bg-[var(--bg-main)]'}`}>
        {/* Selected File Preview */}
        {selectedFile && (
            <div className={`mx-2 p-3 rounded-xl flex justify-between items-center animate-in slide-in-from-bottom-2 ${isSecret ? 'bg-green-900/30' : 'bg-[var(--bg-tertiary)]'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-white ${isSecret ? 'bg-green-600' : 'bg-[var(--bg-accent)]'}`}>
                        {selectedFile.type.startsWith('image/') ? <File size={16} /> : <File size={16} />}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-sm font-bold truncate max-w-[200px] ${isSecret ? 'text-green-100' : 'text-[var(--text-main)]'}`}>{selectedFile.name}</span>
                        {isSecret && <span className="text-[10px] text-green-400 uppercase">Будет зашифровано</span>}
                    </div>
                </div>
                <button 
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className={`p-1 rounded-full ${isSecret ? 'hover:bg-green-900 text-green-500' : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
                >
                    <X size={16} />
                </button>
            </div>
        )}

        <div className={`w-full h-16 rounded-full flex items-center px-2 shadow-lg ring-1 relative transition-colors ${isSecret ? 'bg-[#1a2e1a] ring-green-900' : 'bg-[var(--bg-secondary)] ring-white/5'}`}>
           <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleFileSelect}
           />
           
           <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 transition rounded-full hover:bg-opacity-50 ${selectedFile ? (isSecret ? 'text-green-400' : 'text-[var(--bg-accent)]') : (isSecret ? 'text-green-700 hover:bg-green-900' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]')}`}
            >
                <Paperclip size={24} />
           </button>
           
           <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={selectedFile ? "Добавить подпись..." : (isSecret ? "Секретное сообщение..." : "Сообщение...")}
            className={`flex-1 bg-transparent px-2 focus:outline-none font-medium uppercase tracking-wide placeholder-opacity-50 ${isSecret ? 'text-green-100 placeholder-green-700' : 'text-[var(--text-main)] placeholder-[var(--text-secondary)]'}`}
           />
           
           <button 
            onClick={handleSend}
            disabled={!inputValue.trim() && !selectedFile}
            className={`p-3 rounded-full text-white transition ml-2 shadow-md ${inputValue.trim() || selectedFile ? (isSecret ? 'bg-green-600 hover:scale-105 active:scale-95' : 'bg-[var(--bg-accent)] hover:scale-105 active:scale-95') : 'bg-[#4A4A4A] cursor-not-allowed opacity-50'}`}
           >
             <Send size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;