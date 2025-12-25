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
  timestamp: string; // Changed to string for easier JSON serialization
  isMine: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  isTyping?: boolean; // UI state for typing indicator
}

export interface AppContextType {
  currentUser: User;
  updateUser: (updates: Partial<User>) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  
  // New Data Logic
  chats: Chat[];
  sendMessage: (chatId: string, text: string) => void;
  getChat: (chatId: string) => Chat | undefined;
  deleteChat: (chatId: string) => void;
  clearChatHistory: (chatId: string) => void;

  // Auth
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  authError: string | null;
  
  // Security
  encryptionKey: string;
}