import { User, Chat, Message } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  username: 'Алексей Петров',
  avatar: 'https://picsum.photos/200',
  isOnline: true,
};

export const MOCK_FRIENDS: User[] = [
  { id: '1', username: 'Крейс Роман', avatar: 'https://picsum.photos/201', isOnline: true },
  { id: '2', username: 'Всеволод', avatar: 'https://picsum.photos/202', isOnline: false },
  { id: '3', username: 'Мария Иванова', avatar: 'https://picsum.photos/203', isOnline: true },
  { id: '4', username: 'Дмитрий К.', avatar: 'https://picsum.photos/204', isOnline: false },
];

const INITIAL_MESSAGES_1: Message[] = [
  { id: '1', senderId: '1', text: 'Привет! Добро пожаловать в OpenKey.', timestamp: new Date(Date.now() - 10000000).toISOString(), isMine: false, status: 'read' },
  { id: '2', senderId: 'me', text: 'Спасибо! Здесь правда безопасно?', timestamp: new Date(Date.now() - 9000000).toISOString(), isMine: true, status: 'read' },
  { id: '3', senderId: '1', text: 'Абсолютно. Сквозное шифрование включено по умолчанию.', timestamp: new Date(Date.now() - 8000000).toISOString(), isMine: false, status: 'read' },
];

const INITIAL_MESSAGES_2: Message[] = [
  { id: '1', senderId: '2', text: 'Боже я криптомиллионер, какой я крутой', timestamp: new Date(Date.now() - 3600000).toISOString(), isMine: false, status: 'read' },
];

const SAVED_MESSAGES_USER: User = {
    id: 'saved',
    username: 'Избранное',
    avatar: 'https://ui-avatars.com/api/?name=Saved+Messages&background=3E3E3E&color=fff&font-size=0.5', // Placeholder icon
    isOnline: true
};

// Initial State for the "Database"
export const INITIAL_CHATS: Chat[] = [
  {
    id: 'saved',
    user: SAVED_MESSAGES_USER,
    lastMessage: 'Ваши сохраненные сообщения',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0,
    messages: [
        { id: '0', senderId: 'me', text: 'Здесь можно хранить заметки.', timestamp: new Date().toISOString(), isMine: true, status: 'read'}
    ]
  },
  {
    id: '1',
    user: MOCK_FRIENDS[0],
    lastMessage: 'Твои ключи находятся только на твоем устройстве.',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 0,
    messages: [
      ...INITIAL_MESSAGES_1,
      { id: '4', senderId: '1', text: 'Твои ключи находятся только на твоем устройстве.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isMine: false, status: 'read' }
    ]
  },
  {
    id: '2',
    user: MOCK_FRIENDS[1],
    lastMessage: 'Боже я криптомиллионер, какой я крутой',
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 2,
    messages: INITIAL_MESSAGES_2
  },
  {
    id: '3',
    user: MOCK_FRIENDS[2],
    lastMessage: 'Привет, как дела?',
    lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 1,
    messages: [
      { id: '1', senderId: '3', text: 'Привет, как дела?', timestamp: new Date(Date.now() - 86400000).toISOString(), isMine: false, status: 'read' }
    ]
  },
];

export const BOT_RESPONSES = [
  "Интересно...",
  "Согласен с тобой.",
  "А что было дальше?",
  "Ха-ха, круто!",
  "Сейчас немного занят, напишу позже.",
  "Серьезно?",
  "Это конфиденциальная информация 🔒",
  "Окей.",
  "Понял.",
  "👍"
];