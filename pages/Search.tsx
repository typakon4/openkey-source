import React, { useState } from 'react';
import { Search as SearchIcon, X, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { chats } = useApp(); // Chats now contain all users from DB due to our sync logic

  // Filter users based on query
  // We exclude 'saved' chat from search results usually, but kept for logic simplicity
  const filteredUsers = chats
    .map(chat => chat.user)
    .filter(u => 
      u.id !== 'saved' && 
      u.username.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="h-full bg-[var(--bg-main)] p-6 flex flex-col text-[var(--text-main)]">
       <h1 className="text-2xl font-bold tracking-widest uppercase mb-6 pl-2">Поиск</h1>
       
       <div className="relative mb-8">
         <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
         <input 
            type="text" 
            placeholder="Поиск пользователей..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-main)] pl-12 pr-10 py-4 rounded-2xl focus:outline-none placeholder-gray-500 font-medium uppercase transition-colors"
         />
         {query && (
            <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            >
                <X size={20} />
            </button>
         )}
       </div>

       <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
          {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                    <div key={user.id} onClick={() => navigate(`/chat/${user.id}`)} className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-2xl cursor-pointer hover:bg-opacity-80 transition group">
                        <div className="flex items-center gap-4">
                            <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full bg-gray-500 object-cover border border-[var(--border-color)]" />
                            <div>
                                <div className="font-bold text-[var(--text-main)] uppercase">{user.username}</div>
                                <div className="text-xs text-[var(--text-secondary)] uppercase">OpenKey User</div>
                            </div>
                        </div>
                        <MessageSquare size={18} className="text-[var(--text-secondary)] group-hover:text-[var(--bg-accent)] transition-colors" />
                    </div>
                ))
          ) : (
              <div className="text-center text-[var(--text-secondary)] mt-20">
                  <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="uppercase text-sm tracking-wide">
                      {query ? 'Никого не найдено' : 'Здесь будут все пользователи'}
                  </p>
              </div>
          )}
       </div>
    </div>
  );
};

export default SearchPage;