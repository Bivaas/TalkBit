import React, { useState } from 'react';
import { FiMessageSquare, FiUser, FiLock, FiMail } from 'react-icons/fi';
import { auth, db, rtdb } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      // Set RTDB presence for Google signed-in user
      const presenceRef = rref(rtdb, `presence/${user.uid}`);
      await rset(presenceRef, {
        name: user.displayName || 'Google User',
        isGuest: false,
        online: true,
        lastSeen: serverTimestamp(),
      });
      onDisconnect(presenceRef).set({
        name: user.displayName || 'Google User',
        isGuest: false,
        online: false,
        lastSeen: serverTimestamp(),
      });

      onLogin({
        id: user.uid,
        name: user.displayName || 'Google User',
        email: user.email,
        isGuest: false,
      });
    } catch (err) {
      setError('Failed to sign in with Google: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="frosted-card minimal-shadow overflow-hidden">
          <div className="relative p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
            <div className="relative flex justify-center mb-6">
              <div className="p-4 bg-white bg-opacity-10 backdrop-blur-md rounded-full">
                <FiMessageSquare className="text-4xl text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center">Chat</h2>
            <p className="text-center mt-3 text-gray-300 text-sm">
              {isCreatingAccount ? 'Create your account' : showSignIn ? 'Sign in to your account' : 'Join the conversation'}
            </p>
          </div>
          <div className="p-8">
            {error && (
              <div className="mb-5 p-4 bg-red-900 bg-opacity-30 text-red-200 rounded-lg text-sm border border-red-700 animate-fadeInUp">
                {error}
              </div>
            )}
            <form onSubmit={isCreatingAccount ? handleCreateAccount : (showSignIn ? handleSignIn : handleQuickLogin)} className="space-y-5">
              {(!showSignIn || isCreatingAccount) && (
                <div>
                  <label className="block text-gray-200 text-sm font-semibold mb-2" htmlFor="username">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="text-indigo-300" size={18} />
                    </div>
                    <input
                      id="username"
                      type="text"
                      className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-900 text-gray-100 placeholder-gray-400 focus:bg-gray-800"
                      placeholder="Choose your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              )}
              {isCreatingAccount && (
                <>
                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2" htmlFor="email">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="text-indigo-300" size={18} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-900 text-gray-100 placeholder-gray-400 focus:bg-gray-800"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="text-indigo-300" size={18} />
                      </div>
                      <input
                        id="password"
                        type="password"
                        className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-900 text-gray-100 placeholder-gray-400 focus:bg-gray-800"
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
                    className="text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors duration-300"
                  >
                    Have an account? Sign in
                  </button>
                </div>
              )}
              {showSignIn && !isCreatingAccount && (
                <>
                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2" htmlFor="email">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiMail className="text-indigo-300" size={18} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-900 text-gray-100 placeholder-gray-400 focus:bg-gray-800"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-200 text-sm font-semibold mb-2" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FiLock className="text-indigo-300" size={18} />
                      </div>
                      <input
                        id="password"
                        type="password"
                        className="w-full pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-gray-900 text-gray-100 placeholder-gray-400 focus:bg-gray-800"
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
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] button-hover mt-2"
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
                className="text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors duration-300"
              >
                {isCreatingAccount 
                  ? '← Back to login' 
                  : 'Create an account'}
              </button>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-gray-900 text-gray-100 font-semibold py-3 px-4 rounded-lg border border-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-3"
                style={{ fontFamily: 'Roboto, Arial, sans-serif', fontWeight: 500 }}
              >
                <span className="flex items-center justify-center w-6 h-6 bg-white bg-opacity-10 rounded-full">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48">
        <g>
          <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-4.1 5.2-7.3 5.2-4.4 0-8-3.6-8-8s3.6-8 8-8c1.9 0 3.6.7 5 1.8l6-6C36.2 9.5 30.5 7 24 7 13.5 7 5 15.5 5 26s8.5 19 19 19 19-8.5 19-19c0-1.3-.1-2.5-.4-3.5z"/>
          <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 6 .9 8.3 2.5l6.2-6.2C34.6 5.5 29.6 3 24 3 15.1 3 7.6 8.7 6.3 14.7z"/>
          <path fill="#FBBC05" d="M24 45c5.5 0 10.5-2.1 14.3-5.7l-6.6-5.4C29.9 36.7 27.1 37.5 24 37.5c-5.1 0-9.5-3.1-11.2-7.5l-6.5 5C7.6 43.3 15.1 45 24 45z"/>
          <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-4.1 5.2-7.3 5.2-4.4 0-8-3.6-8-8s3.6-8 8-8c1.9 0 3.6.7 5 1.8l6-6C36.2 9.5 30.5 7 24 7 13.5 7 5 15.5 5 26s8.5 19 19 19 19-8.5 19-19c0-1.3-.1-2.5-.4-3.5z" opacity=".3"/>
        </g>
      </svg>
    </span>
    <span>Sign in with Google</span>
  </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;