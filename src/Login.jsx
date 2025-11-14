import React, { useState } from 'react';
import { FiMessageSquare, FiUser, FiLock, FiMail } from 'react-icons/fi';
import { auth, db, rtdb } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref as rref, set as rset, onDisconnect, serverTimestamp } from 'firebase/database';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [error, setError] = useState('');

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    // Guest login: Sign in anonymously with Firebase so messages persist server-side
    setError('');
    try {
      const userCredential = await signInAnonymously(auth);
      const { user } = userCredential;

      // Set presence in RTDB
      const presenceRef = rref(rtdb, `presence/${user.uid}`);
      await rset(presenceRef, { name: username, isGuest: true, online: true, lastSeen: serverTimestamp() });
      onDisconnect(presenceRef).set({ name: username, isGuest: true, online: false, lastSeen: serverTimestamp() });

      // Return the logged-in guest profile with real Firebase UID
      onLogin({ id: user.uid, name: username, isGuest: true });
    } catch (err) {
      setError('Failed to join as guest: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: username,
        email: user.email,
        isOnline: true,
        createdAt: new Date(),
      });

      // Also set RTDB presence
      try {
        const presenceRef = rref(rtdb, `presence/${user.uid}`);
        await rset(presenceRef, { name: username, isGuest: false, online: true, lastSeen: serverTimestamp() });
        onDisconnect(presenceRef).set({ name: username, isGuest: false, online: false, lastSeen: serverTimestamp() });
      } catch (e) {
        console.warn('Failed to set presence for new user', e);
      }

      onLogin({ id: user.uid, name: username, email: user.email, isGuest: false });
    } catch (err) {
      setError(err.message || 'Failed to create account');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;
      const name = user.email ? user.email.split('@')[0] : user.displayName || 'User';

      // Set RTDB presence for signed in user
      try {
        const presenceRef = rref(rtdb, `presence/${user.uid}`);
        await rset(presenceRef, { name, isGuest: false, online: true, lastSeen: serverTimestamp() });
        onDisconnect(presenceRef).set({ name, isGuest: false, online: false, lastSeen: serverTimestamp() });
      } catch (e) {
        console.warn('Failed to set presence on sign-in', e);
      }

      onLogin({ id: user.uid, name, email: user.email, isGuest: false });
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="relative p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative flex justify-center mb-6">
              <div className="p-4 bg-white bg-opacity-20 backdrop-blur-md rounded-full">
                <FiMessageSquare className="text-4xl text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center">Chat</h2>
            <p className="text-center mt-3 text-indigo-100 text-sm">
              {isCreatingAccount ? 'Create your account' : showSignIn ? 'Sign in to your account' : 'Join the conversation'}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 animate-fadeInUp">
                {error}
              </div>
            )}

            <form onSubmit={isCreatingAccount ? handleCreateAccount : (showSignIn ? handleSignIn : handleQuickLogin)} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="text-indigo-400" size={18} />
                  </div>
                  <input
                    id="username"
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                    placeholder="Choose your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {isCreatingAccount && (
                <>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="text-indigo-400" size={18} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="text-indigo-400" size={18} />
                      </div>
                      <input
                        id="password"
                        type="password"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* For guest (default) we only ask username. Offer sign-in toggle. */}
              {!isCreatingAccount && !showSignIn && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSignIn(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors duration-300"
                  >
                    Have an account? Sign in
                  </button>
                </div>
              )}

              {showSignIn && !isCreatingAccount && (
                <>
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="text-indigo-400" size={18} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="text-indigo-400" size={18} />
                      </div>
                      <input
                        id="password"
                        type="password"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] button-hover mt-2"
              >
                {isCreatingAccount ? 'Create Account' : (showSignIn ? 'Sign In' : 'Join as Guest')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsCreatingAccount(!isCreatingAccount);
                  setShowSignIn(false);
                  setError('');
                }}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors duration-300"
              >
                {isCreatingAccount 
                  ? '← Back to login' 
                  : 'Create an account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;