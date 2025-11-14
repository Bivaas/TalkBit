import React, { useState, useEffect } from 'react';
import { FiUsers, FiLogOut, FiUser, FiShield } from 'react-icons/fi';
import Login from './Login';
import UserList from './components/userlist';
import ChatRoom from './components/chatroom';
import AdminDashboard from './components/AdminDashboard';
import { auth, db, rtdb, ADMIN_EMAIL } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref as rref, onValue as rOnValue, set as rset, onDisconnect, serverTimestamp } from 'firebase/database';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [activeChat, setActiveChat] = useState('global'); // 'global' or userId
  const [showUserList, setShowUserList] = useState(true);

  // Users list (populated from RTDB presence)
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Subscribe to Firebase auth state
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Check if user is admin
        const isAdminUser = fbUser.email === ADMIN_EMAIL;
        setIsAdmin(isAdminUser);

        const profile = { id: fbUser.uid, name: fbUser.email ? fbUser.email.split('@')[0] : fbUser.displayName || 'User', email: fbUser.email, isGuest: fbUser.isAnonymous };
        setUser(profile);
        localStorage.setItem('chatUser', JSON.stringify(profile));

        // set RTDB presence and onDisconnect for both anonymous and registered users
        try {
          const presenceRef = rref(rtdb, `presence/${fbUser.uid}`);
          await rset(presenceRef, { name: profile.name, isGuest: fbUser.isAnonymous, online: true, lastSeen: serverTimestamp() });
          onDisconnect(presenceRef).set({ online: false, lastSeen: serverTimestamp() });
        } catch (e) {
          console.warn('Failed to set rtdb presence', e);
        }
      } else {
        // No firebase user; try local guest
        setIsAdmin(false);
        const savedUser = localStorage.getItem('chatUser');
        if (savedUser) setUser(JSON.parse(savedUser));
      }
    });

    // Subscribe to RTDB presence node for both guests and registered users
    const presenceRef = rref(rtdb, 'presence');
    const unsubPresence = rOnValue(presenceRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.keys(val).map(key => ({ id: key, name: val[key].name || 'Unknown', isOnline: !!val[key].online, isGuest: !!val[key].isGuest }));
      setUsers(arr);
    }, (err) => {
      console.warn('RTDB presence error', err);
    });

    return () => {
      unsubAuth();
      unsubPresence();
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('chatUser', JSON.stringify(userData));
    // Presence is already set in Login.jsx via Firebase auth callback, so no need to duplicate here
  };

  const handleLogout = () => {
    // Set presence offline in RTDB and sign out
    if (user) {
      try {
        const presenceRef = rref(rtdb, `presence/${user.id}`);
        rset(presenceRef, { name: user.name, isGuest: user.isGuest, online: false, lastSeen: serverTimestamp() }).catch(console.error);
      } catch (e) {
        console.warn('Failed to set presence offline', e);
      }
    }

    // Sign out from Firebase
    firebaseSignOut(auth).catch(console.error);

    setUser(null);
    setIsAdmin(false);
    setShowAdminDashboard(false);
    localStorage.removeItem('chatUser');
  };

  const handleUserSelect = (userId) => {
    setActiveChat(userId);
    // On mobile, hide user list after selecting a user
    if (window.innerWidth < 768) {
      setShowUserList(false);
    }
  };

  const handleBackToUsers = () => {
    setActiveChat('global');
    setShowUserList(true);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* User List Sidebar */}
      <div className={`${showUserList ? 'w-full md:w-72' : 'hidden md:block md:w-72'} bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300`}>
        <div className="p-5 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiUsers className="text-indigo-600" size={20} /> Chats
            </h2>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="p-2 rounded-full hover:bg-red-100 transition-all duration-300 group"
                  title="Admin Dashboard"
                >
                  <FiShield className="text-red-600 group-hover:text-red-700 transition-colors" size={20} />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 transition-all duration-300 group"
                title="Logout"
              >
                <FiLogOut className="text-gray-600 group-hover:text-red-500 transition-colors" size={20} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <div className="flex items-center gap-1">
                <span className="online-indicator"></span>
                <p className="text-xs text-green-600 font-medium">Online</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <UserList 
            users={users} 
            activeChat={activeChat}
            onUserSelect={handleUserSelect}
            currentUserId={user.id}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToUsers}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiUsers className="text-gray-600" size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {activeChat === 'global' ? (
                  <>
                    <FiUser className="text-indigo-600" size={20} /> Global Chat
                  </>
                ) : (
                  <>
                    <FiUser className="text-indigo-600" size={20} /> {users.find(u => u.id === activeChat)?.name}
                  </>
                )}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {activeChat === 'global' ? 'Public • Everyone can see' : 'Direct message'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ChatRoom 
            currentUser={user} 
            activeChat={activeChat}
            users={users}
          />
        </div>
      </div>

    {/* Admin Dashboard Modal */}
    {showAdminDashboard && (
      <AdminDashboard 
        isAdmin={isAdmin} 
        onClose={() => setShowAdminDashboard(false)} 
      />
    )}
  </div>
  );
}

export default App;