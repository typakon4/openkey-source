import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User, AppContextType, Chat, Message } from './types';
import { CURRENT_USER as DEFAULT_USER, INITIAL_CHATS, BOT_RESPONSES } from './constants';
import { encryptMessage, decryptMessage } from './utils/encryption';
import { api } from './utils/api';

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to generate a fake hex fingerprint
const generateSessionKey = () => {
  return Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase()
  ).join(' ');
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('openkey_token'));
  const [authError, setAuthError] = useState<string | null>(null);

  // --- USER & SETTINGS STATE ---
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('openkey_user');
    return saved ? JSON.parse(saved) : { ...DEFAULT_USER, phoneNumber: '+7 (999) 000-00-00' };
  });

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('openkey_token');
      if (token) {
        try {
          const data = await api.getMe(token);
          setCurrentUser(prev => ({ ...prev, ...data.user }));
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Token invalid:", e);
          logout();
        }
      }
    };
    verifyToken();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setAuthError(null);
      const data = await api.login(username, password);
      completeAuth(data);
    } catch (e: any) {
      setAuthError(e.message || 'Ошибка входа');
      throw e;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      setAuthError(null);
      const data = await api.register(username, password);
      completeAuth(data);
    } catch (e: any) {
      setAuthError(e.message || 'Ошибка регистрации');
      throw e;
    }
  };

  const completeAuth = (data: any) => {
    localStorage.setItem('openkey_token', data.token);
    setAuthToken(data.token);
    setCurrentUser(data.user);
    localStorage.setItem('openkey_user', JSON.stringify(data.user));
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('openkey_token');
    localStorage.removeItem('openkey_session'); // cleanup legacy
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('openkey_theme') as 'dark' | 'light') || 'dark';
  });
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Generated once per session (page load)
  const [encryptionKey] = useState<string>(generateSessionKey());

  // --- DATA / CHATS STATE ---
  const [chats, setChats] = useState<Chat[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const isInitialLoad = useRef(true);

  // --- ASYNC LOADING (DECRYPTION) ---
  useEffect(() => {
    // Only load chats if authenticated
    if (!isAuthenticated) return;

    const loadChats = async () => {
      const saved = localStorage.getItem('openkey_chats');
      let chatsToLoad: Chat[] = [];

      if (saved) {
        try {
          const parsedChats: Chat[] = JSON.parse(saved);
          chatsToLoad = await Promise.all(parsedChats.map(async (chat) => {
            const decryptedMessages = await Promise.all(chat.messages.map(async (msg) => {
              return {
                ...msg,
                text: await decryptMessage(msg.text)
              };
            }));
            
            const decryptedLastMessage = await decryptMessage(chat.lastMessage);

            return {
              ...chat,
              messages: decryptedMessages,
              lastMessage: decryptedLastMessage
            };
          }));
        } catch (e) {
          console.error("Failed to parse chats", e);
          chatsToLoad = INITIAL_CHATS;
        }
      } else {
        chatsToLoad = INITIAL_CHATS;
      }
      
      setChats(chatsToLoad);
      setIsDataLoaded(true);
      setTimeout(() => { isInitialLoad.current = false; }, 500);
    };

    loadChats();
  }, [isAuthenticated]);

  // --- ASYNC SAVING (ENCRYPTION) ---
  useEffect(() => {
    if (isInitialLoad.current || !isDataLoaded || !isAuthenticated) return;

    const saveChats = async () => {
      const chatsToSave = JSON.parse(JSON.stringify(chats)) as Chat[];

      const encryptedChats = await Promise.all(chatsToSave.map(async (chat) => {
         const encryptedMessages = await Promise.all(chat.messages.map(async (msg) => {
            return {
                ...msg,
                text: await encryptMessage(msg.text)
            };
         }));

         const encryptedLastMessage = await encryptMessage(chat.lastMessage);

         return {
             ...chat,
             messages: encryptedMessages,
             lastMessage: encryptedLastMessage
         };
      }));

      localStorage.setItem('openkey_chats', JSON.stringify(encryptedChats));
    };

    const timeoutId = setTimeout(() => {
        saveChats();
    }, 500); 

    return () => clearTimeout(timeoutId);
  }, [chats, isDataLoaded, isAuthenticated]);

  // Persist User
  useEffect(() => {
    if(isAuthenticated) {
        localStorage.setItem('openkey_user', JSON.stringify(currentUser));
    }
  }, [currentUser, isAuthenticated]);

  // Persist Theme
  useEffect(() => {
    localStorage.setItem('openkey_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }, [theme]);

  // --- LOGIC ---

  const updateUser = (updates: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const getChat = (chatId: string) => {
    return chats.find(c => c.id === chatId);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
  };

  const clearChatHistory = (chatId: string) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [],
          lastMessage: '',
          lastMessageTime: new Date().toISOString()
        };
      }
      return c;
    }));
  };

  // Local rule-based auto-reply system
  // Completely offline, no external API needed
  const getSmartResponse = (lastUserMessage: string): string => {
    const lower = lastUserMessage.toLowerCase().trim();
    
    // Simple logic patterns
    if (lower === 'привет' || lower.includes('hello') || lower.includes('хай')) {
        return "Привет! Рад тебя видеть.";
    }
    if (lower.includes('как дела') || lower.includes('как жизнь')) {
        return "Все отлично, системы работают стабильно. А у тебя?";
    }
    if (lower.includes('кто ты')) {
        return "Я твой друг в OpenKey.";
    }
    if (lower.includes('ключ') || lower.includes('безопасн') || lower.includes('шифр')) {
        return "Все сообщения шифруются AES-GCM. Ключи только на твоем устройстве.";
    }
    if (lower.includes('пока') || lower.includes('спокойной')) {
        return "До связи!";
    }
    if (lower === '?') {
        return "Чем могу помочь?";
    }

    // Default random responses
    const responses = BOT_RESPONSES;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = (chatId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: text,
      timestamp: new Date().toISOString(),
      isMine: true,
      status: 'sent'
    };

    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: text,
            lastMessageTime: newMessage.timestamp,
            isTyping: chatId !== 'saved'
          };
        }
        return chat;
      }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    });

    // Simulate network delay and reply
    if (chatId !== 'saved') {
        const typingDelay = 1500 + Math.random() * 2000;
        setTimeout(() => {
            receiveMessage(chatId, text);
        }, typingDelay);
    }
  };

  const receiveMessage = (chatId: string, userText: string) => {
    // Generate response locally
    const responseText = getSmartResponse(userText);
    
    const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: chatId,
        text: responseText,
        timestamp: new Date().toISOString(),
        isMine: false,
        status: 'read'
    };

    setChats(prevChats => {
        return prevChats.map(chat => {
            if (chat.id === chatId) {
                return {
                    ...chat,
                    messages: [...chat.messages, replyMessage],
                    lastMessage: responseText,
                    lastMessageTime: replyMessage.timestamp,
                    unreadCount: 0,
                    isTyping: false
                };
            }
            return chat;
        }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    });
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, 
      updateUser, 
      theme, 
      toggleTheme, 
      notificationsEnabled, 
      toggleNotifications,
      chats,
      sendMessage,
      getChat,
      deleteChat,
      clearChatHistory,
      isAuthenticated,
      login,
      register,
      logout,
      authError,
      encryptionKey
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};