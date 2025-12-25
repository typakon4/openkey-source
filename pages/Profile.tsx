import React from 'react';
import { MOCK_FRIENDS } from '../constants';
import { Phone, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import { useApp } from '../context';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Функция звонков находится в бета-тесте');
  };

  const handleMessage = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    navigate(`/chat/${friendId}`);
  };

  return (
    <div className="h-full bg-[var(--bg-main)] text-[var(--text-main)] p-4 md:p-8 flex flex-col overflow-y-auto no-scrollbar pb-24 md:pb-8">
      
      {/* Top Name Bar */}
      <div className="w-full bg-[var(--bg-accent)] h-16 rounded-xl mb-6 flex items-center justify-center shadow-lg text-white">
        <h1 className="text-xl uppercase font-semibold tracking-widest">{currentUser.username}</h1>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Friends List */}
        <div className="md:col-span-3 bg-[var(--bg-secondary)] rounded-[2rem] p-5 flex flex-col shadow-inner h-[400px] md:h-auto overflow-hidden">
          <div className="text-xs uppercase text-[var(--text-secondary)] mb-4 border-b border-[var(--border-color)] pb-2">Друзья</div>
          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
            {MOCK_FRIENDS.map((friend) => (
              <div key={friend.id} className="flex justify-between items-center group cursor-pointer" onClick={() => navigate(`/chat/${friend.id}`)}>
                <span className="text-sm font-medium truncate w-24 text-[var(--text-main)] group-hover:text-[var(--text-secondary)] transition">{friend.username}</span>
                <div className="flex gap-2">
                  <button onClick={handleCall} className="hover:scale-110 transition">
                      <Phone size={14} className="text-[var(--text-secondary)] hover:text-[var(--text-main)]" />
                  </button>
                  <button onClick={(e) => handleMessage(e, friend.id)} className="hover:scale-110 transition">
                      <MessageCircle size={14} className="text-[var(--text-secondary)] hover:text-[var(--text-main)]" />
                  </button>
                </div>
              </div>
            ))}
            {/* Fillers to look like list */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={`fill-${i}`} className="text-sm text-[var(--text-secondary)] opacity-50 uppercase">имя фамилия</div>
            ))}
          </div>
        </div>

        {/* Middle Column: Avatar & Gallery */}
        <div className="md:col-span-6 flex flex-col gap-6">
            {/* Big Avatar Box */}
            <div className="bg-[var(--bg-tertiary)] rounded-[3rem] aspect-square flex items-center justify-center shadow-xl relative overflow-hidden group">
                <img 
                    src={currentUser.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500" 
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                     <span className="text-4xl text-white/80 uppercase font-bold drop-shadow-md">Аватарка</span>
                </div>
            </div>

            {/* Photo Gallery Box */}
            <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] p-6 shadow-sm">
                <div className="text-center text-xs uppercase font-bold text-[var(--text-main)] mb-4">Фото</div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-[3/4] bg-[var(--bg-tertiary)] rounded-xl hover:opacity-80 transition cursor-pointer"></div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Settings Area Placeholder */}
        <div 
          onClick={() => navigate('/settings')}
          className="md:col-span-3 bg-[var(--bg-secondary)] rounded-[2rem] p-5 flex flex-col h-[300px] md:h-auto shadow-sm relative cursor-pointer hover:bg-opacity-80 transition"
        >
           <div className="absolute top-4 right-4 text-xs text-[var(--text-secondary)] uppercase opacity-70">настройки</div>
           <div className="flex-1 flex items-center justify-center">
               <SettingsIcon size={48} className="text-[var(--text-secondary)] opacity-50" />
           </div>
           <div className="text-center text-xs text-[var(--text-secondary)] mt-4 uppercase">
                Приватность и безопасность
           </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;