import React from 'react';
import { FiMessageCircle } from 'react-icons/fi';

function UserList({ users, activeChat, onUserSelect, currentUserId }) {
  const handleGlobalChat = () => {
    onUserSelect('global');
  };

  const onlineUsers = users.filter(user => user.isOnline && user.id !== currentUserId);
  const offlineUsers = users.filter(user => !user.isOnline && user.id !== currentUserId);

  return (
    <div className="p-3 space-y-4">
      {/* Global Chat Option */}
      <button
        onClick={handleGlobalChat}
        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 user-card ${
          activeChat === 'global' 
            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md' 
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="flex-shrink-0">
          <FiMessageCircle className="text-xl" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold"># Global Chat</p>
          <p className={`text-xs ${activeChat === 'global' ? 'text-indigo-100' : 'text-gray-500'}`}>
            Everyone can see
          </p>
        </div>
      </button>
      
      {/* Online Users Section */}
      {onlineUsers.length > 0 && (
        <div>
          <h3 className="px-3 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            🟢 Online ({onlineUsers.length})
          </h3>
          <div className="space-y-2">
            {onlineUsers.map(user => (
              <button
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 user-card ${
                  activeChat === user.id 
                    ? 'bg-indigo-50 border border-indigo-300 shadow-md' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    activeChat === user.id ? 'bg-indigo-500' : 'bg-emerald-500'
                  } shadow-sm`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{user.name}</p>
                  <p className="text-xs text-green-600 font-medium">Active now</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Offline Users Section */}
      {offlineUsers.length > 0 && (
        <div>
          <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            ⚪ Offline ({offlineUsers.length})
          </h3>
          <div className="space-y-2">
            {offlineUsers.map(user => (
              <button
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 user-card opacity-70 ${
                  activeChat === user.id 
                    ? 'bg-indigo-50 border border-indigo-300' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500 font-medium">Offline</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList;