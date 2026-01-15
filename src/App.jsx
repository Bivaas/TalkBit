import React, { useState, useEffect } from 'react';
import { FiUsers, FiLogOut, FiUser, FiShield } from 'react-icons/fi';
import Login from './Login';
import UserList from './components/userlist';
import ChatRoom from './components/chatroom';
import AdminDashboard from './components/AdminDashboard';
import { auth, db, rtdb, ADMIN_EMAIL } from './firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, deleteUser } from 'firebase/auth';
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

        const profile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email.split('@')[0], // Use displayName if available
          email: fbUser.email,
          isGuest: fbUser.isAnonymous
        };
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
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          profile.name = parsedUser.name || profile.name; // Use saved username if available
          setUser(profile);
        }
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

    // If this is a guest (anonymous) user, delete the Firebase Auth user
    // to avoid leaving orphaned guest accounts. For registered users just sign out.
    if (user?.isGuest) {
      try {
        const current = auth.currentUser;
        if (current && current.isAnonymous) {
          // Delete anonymous user account
          deleteUser(current).catch((err) => {
            console.warn('Failed to delete anonymous user, falling back to signOut', err);
            firebaseSignOut(auth).catch(console.error);
          });
        } else {
          // Not currently authenticated with Firebase for some reason; ensure sign out
          firebaseSignOut(auth).catch(console.error);
        }
      } catch (e) {
        console.warn('Error deleting anonymous user', e);
        firebaseSignOut(auth).catch(console.error);
      }
    } else {
      // Registered user - just sign out
      firebaseSignOut(auth).catch(console.error);
    }

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
    <div className="flex h-screen bg-gray-950">
      {/* User List Sidebar */}
      <div className={`${showUserList ? 'w-full md:w-72' : 'hidden md:block md:w-72'} bg-gray-950 border-r border-gray-800 flex flex-col transition-all duration-300`}>
        <div className="p-5 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <FiUsers className="text-indigo-400" size={20} /> Chats
            </h2>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="p-2 rounded-full hover:bg-red-900 transition-all duration-300 group"
                  title="Admin Dashboard"
                >
                  <FiShield className="text-red-400 group-hover:text-red-500 transition-colors" size={20} />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-900 transition-all duration-300 group"
                title="Logout"
              >
                <FiLogOut className="text-gray-400 group-hover:text-red-400 transition-colors" size={20} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-950 rounded-xl p-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-700 to-indigo-900 flex items-center justify-center text-white font-bold shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-100 truncate">{user.name}</p>
              <div className="flex items-center gap-1">
                <span className="online-indicator"></span>
                <p className="text-xs text-green-400 font-medium">Online</p>
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
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToUsers}
              className="md:hidden p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <FiUsers className="text-gray-400" size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                {activeChat === 'global' ? (
                  <>
                    <FiUser className="text-indigo-400" size={20} /> Global Chat
                  </>
                ) : (
                  <>
                    <FiUser className="text-indigo-400" size={20} /> {users.find(u => u.id === activeChat)?.name}
                  </>
                )}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {activeChat === 'global' ? 'Public • Everyone can see' : 'Direct message'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://bivaasbaral.com.np/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit my portfolio website"
              aria-label="Visit my site"
              className="flex items-center gap-2 px-3 py-1 rounded-md transition-transform duration-200 ease-out transform bg-transparent hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span className="hidden sm:inline text-xs md:text-sm text-gray-400">Made by</span>
              <span className="text-sm md:text-base font-medium text-indigo-400 leading-none">Bivaas Baral</span>
            </a>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatRoom 
            currentUser={user} 
            activeChat={activeChat}
            users={users}
            isAdmin={isAdmin}
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