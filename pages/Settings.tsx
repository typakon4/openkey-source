import React, { useState, useEffect } from 'react';
import { Lock, Bell, Moon, Key, LogOut, ChevronRight, User, Phone, Image as ImageIcon, Check, ShieldCheck, Database, Terminal, FileJson, Play, FlaskConical, Network, Unlock, Eye } from 'lucide-react';
import { useApp } from '../context';
import { encryptMessage, decryptMessage, getDebugInfo } from '../utils/encryption';
import { runEncryptionTests } from '../utils/tests';
import { api } from '../utils/api';

const SettingsPage: React.FC = () => {
  const { currentUser, updateUser, theme, toggleTheme, notificationsEnabled, toggleNotifications, logout, encryptionKey, allUsers } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  
  // Profile State
  const [tempName, setTempName] = useState(currentUser.username);
  const [tempPhone, setTempPhone] = useState(currentUser.phoneNumber || '');
  const [tempAvatar, setTempAvatar] = useState(currentUser.avatar);

  // Debug State
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testInput, setTestInput] = useState('Hello OpenKey');
  const [testOutput, setTestOutput] = useState('');
  
  // New Debug Tools
  const [manualDecryptInput, setManualDecryptInput] = useState('');
  const [manualDecryptOutput, setManualDecryptOutput] = useState('');
  const [sniffedMessages, setSniffedMessages] = useState<any[]>([]);
  const [snifferLoading, setSnifferLoading] = useState(false);

  useEffect(() => {
      if (showDebugModal) {
          setDebugInfo(getDebugInfo());
      }
  }, [showDebugModal]);

  const handleRunEncryptionTest = async () => {
      const start = performance.now();
      const encrypted = await encryptMessage(testInput);
      const end = performance.now();
      try {
          const parsed = JSON.parse(encrypted);
          setTestOutput(JSON.stringify(parsed, null, 2) + `\n\n// Time: ${(end - start).toFixed(2)}ms`);
      } catch (e) {
          setTestOutput(encrypted);
      }
  };

  const handleManualDecrypt = async () => {
      const decrypted = await decryptMessage(manualDecryptInput);
      setManualDecryptOutput(decrypted);
  };

  const handleSniffServer = async () => {
      setSnifferLoading(true);
      const token = localStorage.getItem('openkey_token');
      if (!token || allUsers.length === 0) {
          setSniffedMessages([{ error: "Need auth or users" }]);
          setSnifferLoading(false);
          return;
      }
      
      // Sniff messages from the first available user to show "RAW" data
      try {
          const targetUser = allUsers[0];
          const msgs = await api.getMessages(token, targetUser.id);
          // Show last 3 messages raw
          setSniffedMessages(msgs.slice(-3).map((m: any) => ({
              id: m.id,
              isSecret: m.isSecret,
              content_on_server: m.text, // This should be ciphertext
              created: m.timestamp
          })));
      } catch (e) {
          setSniffedMessages([{ error: "Failed to fetch" }]);
      } finally {
          setSnifferLoading(false);
      }
  };

  const handleSave = () => {
    updateUser({
      username: tempName,
      phoneNumber: tempPhone,
      avatar: tempAvatar
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(currentUser.username);
    setTempPhone(currentUser.phoneNumber || '');
    setTempAvatar(currentUser.avatar);
    setIsEditing(false);
  };

  return (
    <div className="h-full bg-[var(--bg-main)] p-6 flex flex-col overflow-y-auto no-scrollbar pb-20 text-[var(--text-main)] relative">
      <div className="flex justify-between items-center mb-8 pl-2">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Настройки</h1>
        {isEditing ? (
          <div className="flex gap-4">
             <button onClick={handleCancel} className="text-[var(--text-secondary)] text-sm uppercase font-bold">Отмена</button>
             <button onClick={handleSave} className="text-green-500 text-sm uppercase font-bold">Сохранить</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-[var(--text-secondary)] text-sm uppercase font-bold">Изм.</button>
        )}
      </div>

      {/* Profile Card */}
      <div className="flex flex-col gap-4 mb-10 p-6 bg-[var(--bg-tertiary)] rounded-3xl shadow-sm transition-colors">
         <div className="flex items-center gap-6">
            <div className="relative">
              <img src={isEditing ? tempAvatar : currentUser.avatar} className="w-20 h-20 rounded-full object-cover border-4 border-[var(--bg-main)]" alt="Avatar" />
              {isEditing && (
                 <div className="absolute -bottom-1 -right-1 bg-[var(--bg-accent)] p-1.5 rounded-full text-white">
                    <ImageIcon size={12} />
                 </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
                {isEditing ? (
                  <>
                    <input 
                      type="text" 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-xl text-lg font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[var(--bg-accent)]"
                      placeholder="Имя пользователя"
                    />
                    <input 
                      type="text" 
                      value={tempAvatar}
                      onChange={(e) => setTempAvatar(e.target.value)}
                      className="w-full bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-1 rounded-lg text-xs font-mono focus:outline-none"
                      placeholder="URL аватарки"
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold uppercase">{currentUser.username}</h2>
                  </>
                )}
            </div>
         </div>
         
         <div className="mt-2 border-t border-[var(--bg-main)] pt-4">
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-[var(--text-secondary)]" />
              {isEditing ? (
                 <input 
                    type="tel"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    className="flex-1 bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2 rounded-xl text-sm font-medium uppercase focus:outline-none focus:ring-2 focus:ring-[var(--bg-accent)]"
                    placeholder="+7 (999) 000-00-00"
                 />
              ) : (
                 <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">{currentUser.phoneNumber || 'Не указан'}</p>
              )}
            </div>
         </div>
      </div>

      <div className="space-y-4">
          <Section title="Безопасность">
             <SettingItem 
                icon={<Key size={20} />} 
                label="Публичный ключ" 
                value="Показать"
                onClick={() => setShowKeyModal(true)}
             />
             <SettingItem 
                icon={<Database size={20} />} 
                label="Протокол шифрования" 
                value="AES-GCM"
                onClick={() => setShowDebugModal(true)}
             />
             <SettingItem icon={<Lock size={20} />} label="Код-пароль" value="Вкл" />
          </Section>

          <Section title="Приложение">
             <SettingItem 
                icon={<Bell size={20} />} 
                label="Уведомления" 
                toggle 
                active={notificationsEnabled} 
                onToggle={toggleNotifications}
             />
             <SettingItem 
                icon={<Moon size={20} />} 
                label="Темная тема" 
                toggle 
                active={theme === 'dark'} 
                onToggle={toggleTheme}
             />
          </Section>
          
          <button 
             onClick={logout}
             className="w-full mt-8 p-4 bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-900/50 transition uppercase font-bold text-sm"
          >
             <LogOut size={18} />
             Выйти из аккаунта
          </button>
      </div>

      {/* Encryption Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[var(--bg-secondary)] w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-[var(--border-color)] flex flex-col items-center text-center transform transition-all scale-100 ring-1 ring-white/10">
              <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <ShieldCheck size={40} className="text-green-500" />
              </div>
              
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-[var(--text-main)]">Отпечаток ключа</h3>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase mb-8 leading-relaxed px-4 font-bold tracking-wide">
                Сравните этот код с кодом на устройстве собеседника для подтверждения безопасности
              </p>
              
              <div 
                className="w-full bg-[var(--bg-main)] p-6 rounded-2xl mb-8 relative group cursor-pointer border border-[var(--border-color)] hover:border-[var(--bg-accent)] transition-colors"
                onClick={() => {
                    navigator.clipboard.writeText(encryptionKey);
                }}
              >
                 <code className="text-[var(--text-main)] font-mono text-xl font-bold break-all tracking-widest block text-center shadow-lg">
                    {encryptionKey}
                 </code>
              </div>

              <button 
                onClick={() => setShowKeyModal(false)}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg transition-all text-sm"
              >
                Я защищен!
              </button>
           </div>
        </div>
      )}

      {/* Debug / Crypto Inspector Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[var(--bg-secondary)] w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[90vh] p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden ring-1 ring-white/10">
              <div className="flex justify-between items-center mb-6 px-2">
                 <div className="flex items-center gap-3">
                    <Terminal size={24} className="text-[var(--bg-accent)]" />
                    <h3 className="text-lg font-bold uppercase tracking-widest">Crypto Inspector</h3>
                 </div>
                 <button onClick={() => setShowDebugModal(false)} className="text-[var(--text-secondary)] hover:text-white transition">Закрыть</button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-2">
                  
                  {/* Status Card */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[var(--bg-tertiary)] p-4 rounded-2xl">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)] mb-1">Status</div>
                        <div className="font-mono text-sm font-bold text-green-500">Active</div>
                     </div>
                     <div className="bg-[var(--bg-tertiary)] p-4 rounded-2xl">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)] mb-1">Algorithm</div>
                        <div className="font-mono text-sm font-bold">AES-GCM-256</div>
                     </div>
                  </div>

                  {/* Manual Decrypt Tool */}
                  <div className="bg-[var(--bg-main)] p-4 rounded-3xl border border-[var(--border-color)]">
                      <div className="flex items-center gap-2 mb-4">
                          <Unlock size={16} className="text-[var(--bg-accent)]" />
                          <span className="text-xs font-bold uppercase">Ручная дешифровка</span>
                      </div>
                      <div className="flex flex-col gap-2">
                          <input 
                            type="text" 
                            value={manualDecryptInput}
                            onChange={(e) => setManualDecryptInput(e.target.value)}
                            className="bg-[var(--bg-tertiary)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                            placeholder="Вставьте зашифрованную строку (Base64)..."
                          />
                          <button onClick={handleManualDecrypt} className="bg-[var(--bg-accent)] text-white p-2 rounded-xl text-xs font-bold uppercase w-full">Расшифровать</button>
                      </div>
                      {manualDecryptOutput && (
                          <div className="mt-2 bg-[#1a1a1a] p-3 rounded-xl font-mono text-xs text-green-400 break-words">
                              {manualDecryptOutput}
                          </div>
                      )}
                  </div>

                  {/* Server Sniffer */}
                  <div className="bg-[var(--bg-main)] p-4 rounded-3xl border border-[var(--border-color)]">
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                              <Network size={16} className="text-red-500" />
                              <span className="text-xs font-bold uppercase">Сниффер (Серверные данные)</span>
                          </div>
                          <button onClick={handleSniffServer} className="bg-red-900/40 text-red-400 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                              {snifferLoading ? 'Загрузка...' : 'Перехватить'}
                          </button>
                      </div>
                      
                      <div className="bg-[#1a1a1a] p-4 rounded-xl font-mono text-[10px] text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {sniffedMessages.length > 0 ? (
                              JSON.stringify(sniffedMessages, null, 2)
                          ) : (
                              '// Нажмите перехватить, чтобы увидеть реальные зашифрованные данные из БД'
                          )}
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                          * Для проверки скопируйте "content_on_server" из ответа выше и вставьте в "Ручную дешифровку".
                      </p>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-3 pl-2">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const SettingItem: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    value?: string; 
    toggle?: boolean; 
    active?: boolean; 
    onToggle?: () => void;
    onClick?: () => void;
}> = ({ icon, label, value, toggle, active, onToggle, onClick }) => (
    <div 
      onClick={toggle ? onToggle : onClick}
      className={`flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-2xl cursor-pointer hover:bg-opacity-80 transition group ${!toggle && !onClick ? 'cursor-default' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className="text-[var(--text-secondary)] group-hover:text-[var(--text-main)] transition">{icon}</div>
            <span className="font-medium text-sm uppercase text-[var(--text-main)]">{label}</span>
        </div>
        
        {toggle ? (
            <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-green-500' : 'bg-gray-400'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`}></div>
            </div>
        ) : (
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-[var(--text-secondary)] uppercase">{value}</span>}
                <ChevronRight size={16} className="text-[var(--text-secondary)]" />
            </div>
        )}
    </div>
);

export default SettingsPage;