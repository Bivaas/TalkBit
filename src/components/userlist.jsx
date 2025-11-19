import React, { useState } from 'react';
import { FiMessageCircle } from 'react-icons/fi';

function UserList({ users, activeChat, onUserSelect, currentUserId }) {
  const [isOfflineExpanded, setIsOfflineExpanded] = useState(false);

  const handleGlobalChat = () => {
    onUserSelect('global');
  };

  const toggleOfflineUsers = () => {
    setIsOfflineExpanded(!isOfflineExpanded);
  };

  const onlineUsers = users.filter(user => user.isOnline && user.id !== currentUserId);
  const offlineUsers = users.filter(user => !user.isOnline && user.id !== currentUserId);

  // Filter out guests for private DM
  const filteredOnlineUsers = onlineUsers.filter(user => !user.isGuest);
  const filteredOfflineUsers = offlineUsers.filter(user => !user.isGuest);

  return (
    <div className="p-3 space-y-4 bg-gray-900">
      {/* Global Chat Option */}
      <button
        onClick={handleGlobalChat}
        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 user-card minimal-shadow ${
          activeChat === 'global' 
            ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 text-white' 
            : 'bg-gray-900 text-gray-200'
        }`}
      >
        <div className="flex-shrink-0">
          <FiMessageCircle className="text-xl" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold"># Global Chat</p>
          <p className={`text-xs ${activeChat === 'global' ? 'text-indigo-200' : 'text-gray-400'}`}>
            Everyone can see
          </p>
        </div>
      </button>
      {/* Online Users Section */}
      {filteredOnlineUsers.length > 0 && (
        <div>
          <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            🟢 Online ({filteredOnlineUsers.length})
          </h3>
          <div className="space-y-2">
            {filteredOnlineUsers.map(user => (
              <button
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 user-card minimal-shadow ${
                  activeChat === user.id 
                    ? 'bg-indigo-900/60 text-indigo-100' 
                    : 'bg-gray-900 text-gray-200'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    activeChat === user.id ? 'bg-indigo-700' : 'bg-emerald-700'
                  } shadow-sm`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate text-sm">{user.name}</p>
                  <p className="text-xs text-green-300 font-medium">Active now</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Offline Users Section */}
      {filteredOfflineUsers.length > 0 && (
        <div>
          <h3 
            className="px-3 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center cursor-pointer"
            onClick={toggleOfflineUsers}
          >
            ⚪ Offline ({filteredOfflineUsers.length})
            <span className="ml-2 text-sm">
              {isOfflineExpanded ? '▼' : '▶'}
            </span>
          </h3>
          {isOfflineExpanded && (
            <div className="space-y-2">
              {filteredOfflineUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onUserSelect(user.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 user-card minimal-shadow opacity-70 ${
                    activeChat === user.id 
                      ? 'bg-indigo-900/60 text-indigo-100' 
                      : 'bg-gray-900 text-gray-400'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-600 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500 font-medium">Offline</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserList;