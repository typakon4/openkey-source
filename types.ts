
export interface User {
  id: string;
  username: string;
  avatar: string;
  phoneNumber?: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  timestamp: string; 
  isMine: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isSecret?: boolean;
  expiresAt?: string; // ISO String (kept for backward compatibility but not used in UI now)
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  isTyping?: boolean;
  isSecret?: boolean;
}

export interface AppContextType {
  currentUser: User;
  updateUser: (updates: Partial<User>) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  
  chats: Chat[];
  sendMessage: (chatId: string, text: string, file?: File) => void;
  createSecretChat: (userId: string) => void;
  getChat: (chatId: string) => Chat | undefined;
  deleteChat: (chatId: string) => void;
  clearChatHistory: (chatId: string) => void;
  markChatAsRead: (chatId: string) => void; 
  allUsers: User[];

  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  authError: string | null;
  
  encryptionKey: string;
}
