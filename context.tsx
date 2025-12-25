
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, AppContextType, Chat, Message } from './types';
import { CURRENT_USER as DEFAULT_USER, INITIAL_CHATS } from './constants';
import { api } from './utils/api';
import { encryptMessage, decryptMessage, encryptFile } from './utils/encryption';
import { useNavigate } from 'react-router-dom';

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('openkey_user');
    return saved ? JSON.parse(saved) : { ...DEFAULT_USER, phoneNumber: '+7 (999) 000-00-00' };
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('openkey_theme') as 'dark' | 'light') || 'dark';
  });
  
  // APPLY THEME TO BODY
  useEffect(() => {
    localStorage.setItem('openkey_theme', theme);
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
  }, [theme]);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Persist the visual encryption key (Identity Key)
  const [encryptionKey] = useState<string>(() => {
      const savedKey = localStorage.getItem('openkey_device_fingerprint');
      if (savedKey) return savedKey;
      
      const newKey = generateSessionKey();
      localStorage.setItem('openkey_device_fingerprint', newKey);
      return newKey;
  });

  // --- DATA STATE ---
  const [chats, setChats] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('openkey_token');
      if (token) {
        try {
          const data = await api.getMe(token);
          setCurrentUser(prev => ({ ...prev, ...data.user }));
          setAuthToken(token);
          setIsAuthenticated(true);
        } catch (e) {
          logout();
        }
      }
    };
    verifyToken();
  }, []);

  // --- POLLING / SYNC LOGIC ---
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    let isMounted = true;

    const syncData = async () => {
        try {
            const users = await api.getAllUsers(authToken);
            if (isMounted) setAllUsers(users);
            
            // Build chats list (Normal and Secret combined in UI list)
            let processedChats: Chat[] = [];

            for (const u of users) {
                const rawMessages = await api.getMessages(authToken, u.id);
                
                // --- DECRYPTION STEP ---
                // We must decrypt messages here before separating them
                const messages: Message[] = await Promise.all(rawMessages.map(async (m: any) => {
                    let decryptedText = m.text;
                    if (m.isSecret && m.text) {
                        decryptedText = await decryptMessage(m.text);
                    }
                    return {
                        id: m.id,
                        senderId: m.senderId,
                        text: decryptedText,
                        attachmentUrl: m.attachmentUrl,
                        attachmentType: m.attachmentType,
                        timestamp: m.timestamp,
                        isMine: m.isMine,
                        status: m.status,
                        isSecret: m.isSecret,
                        expiresAt: m.expiresAt
                    } as Message;
                }));

                // 1. Separate Normal and Secret messages
                const normalMsgs = messages.filter((m) => !m.isSecret);
                const secretMsgs = messages.filter((m) => m.isSecret);

                // 2. Process Normal Chat
                if (normalMsgs.length > 0) {
                    const lastMsg = normalMsgs[normalMsgs.length - 1];
                    let lastMsgText = 'Нет сообщений';
                    if (lastMsg) {
                        if (lastMsg.text) lastMsgText = lastMsg.text;
                        else if (lastMsg.attachmentType === 'image') lastMsgText = '📷 Фото';
                        else if (lastMsg.attachmentType === 'file') lastMsgText = '📎 Файл';
                    }
                    const unreadCount = normalMsgs.filter((m) => !m.isMine && m.status !== 'read').length;

                    processedChats.push({
                        id: u.id,
                        user: { ...u }, 
                        lastMessage: lastMsgText,
                        lastMessageTime: lastMsg ? lastMsg.timestamp : new Date().toISOString(),
                        unreadCount: unreadCount,
                        messages: normalMsgs,
                        isSecret: false
                    });
                }

                // 3. Process Secret Chat
                if (secretMsgs.length > 0) {
                     const lastMsg = secretMsgs[secretMsgs.length - 1];
                     const unreadCount = secretMsgs.filter((m) => !m.isMine && m.status !== 'read').length;

                     processedChats.push({
                        id: `secret_${u.id}`, // Unique ID for secret chat
                        user: { ...u, username: `${u.username}` }, // UI handles secret indicator
                        lastMessage: lastMsg ? '🔒 Зашифровано' : 'Секретный чат',
                        lastMessageTime: lastMsg ? lastMsg.timestamp : new Date().toISOString(),
                        unreadCount: unreadCount,
                        messages: secretMsgs,
                        isSecret: true
                    });
                }
            }
            
            if (isMounted) {
                // Merge with existing state to preserve temp chats if sync hasn't caught up
                setChats(prev => {
                    // Find temp chats in prev that are NOT in processedChats
                    const tempChats = prev.filter(c => 
                        !processedChats.find(pc => pc.id === c.id) && c.messages.length === 0
                    );
                    
                    const final = [...processedChats, ...tempChats];
                    final.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
                    return final;
                });
            }
        } catch (e) {
            console.error("Sync error", e);
        }
    };

    syncData();
    const intervalId = setInterval(syncData, 2000);

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  }, [isAuthenticated, authToken]);


  // --- AUTH ACTIONS ---

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
    // We do NOT clear openkey_device_fingerprint so the key remains same for this browser
    setAuthToken(null);
    setIsAuthenticated(false);
    setChats([]);
  };

  // --- ACTIONS ---

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
      alert("Очистка истории на сервере пока не доступна в демо");
  };

  const markChatAsRead = async (chatId: string) => {
      if (!authToken) return;
      
      let partnerId = chatId;
      if (chatId.startsWith('secret_')) {
          partnerId = chatId.replace('secret_', '');
      }

      setChats(prev => prev.map(c => {
          if (c.id === chatId) {
              return { ...c, unreadCount: 0 };
          }
          return c;
      }));
      try {
          await api.markAsRead(authToken, partnerId);
      } catch (e) {
          console.error("Failed to mark as read", e);
      }
  };

  const createSecretChat = (userId: string) => {
      const existing = chats.find(c => c.id === `secret_${userId}`);
      if (existing) return; 

      const user = allUsers.find(u => u.id === userId);
      if (!user) return;

      const newChat: Chat = {
          id: `secret_${userId}`,
          user: user,
          lastMessage: 'Секретный чат создан',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          messages: [],
          isSecret: true
      };

      setChats(prev => [newChat, ...prev]);
  };

  const sendMessage = async (chatId: string, text: string, file?: File) => {
    if (!authToken) return;

    let attachmentUrl = undefined;
    let attachmentType = undefined;

    const isSecret = chatId.startsWith('secret_');
    const realReceiverId = isSecret ? chatId.replace('secret_', '') : chatId;

    if (file) {
        try {
            let fileToUpload = file;
            
            // --- ENCRYPTION STEP FOR FILES ---
            if (isSecret) {
                try {
                    const encryptedBlob = await encryptFile(file);
                    // Create a generic file object for upload, name it .enc to signal intent
                    fileToUpload = new File([encryptedBlob], file.name + '.enc', { type: 'text/plain' });
                } catch (encErr) {
                    console.error("Encryption file error", encErr);
                    alert("Ошибка шифрования файла. Проверьте соединение.");
                    return;
                }
            }

            const uploadRes = await api.uploadFile(authToken, fileToUpload);
            attachmentUrl = uploadRes.url;
            
            // Force type to client expectation based on original file
            if (file.type.startsWith('image/')) attachmentType = 'image';
            else if (file.type.startsWith('video/')) attachmentType = 'video';
            else attachmentType = 'file';

        } catch (e) {
            console.error("File upload failed", e);
            alert("Ошибка загрузки файла на сервер");
            return;
        }
    }

    // --- ENCRYPTION STEP FOR TEXT ---
    let contentToSend = text;
    if (isSecret && text) {
        contentToSend = await encryptMessage(text);
    }

    // 2. Optimistic Update (Show plain text to user immediately)
    const tempId = Date.now().toString();
    const tempMsg: Message = {
        id: tempId,
        senderId: currentUser.id,
        text: text, // We show plain text in local state
        attachmentUrl: attachmentUrl, 
        attachmentType: attachmentType as any,
        timestamp: new Date().toISOString(),
        isMine: true,
        status: 'sent',
        isSecret: isSecret
    };

    setChats(prev => prev.map(c => {
        if (c.id === chatId) {
            return {
                ...c,
                messages: [...c.messages, tempMsg],
                lastMessage: isSecret ? '🔒 Зашифровано' : (text || (attachmentType === 'image' ? '📷 Фото' : '📎 Файл')),
                lastMessageTime: tempMsg.timestamp
            };
        }
        return c;
    }));

    // 3. Send Message API (Send Ciphertext if secret)
    try {
        await api.sendMessage(authToken, realReceiverId, contentToSend, attachmentUrl, attachmentType, isSecret);
    } catch (e) {
        console.error("Send failed", e);
    }
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
      createSecretChat,
      getChat,
      deleteChat,
      clearChatHistory,
      markChatAsRead,
      allUsers,
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
