
import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiUsers, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import { rtdb } from '../firebase';
import { ref as rref, onValue, remove, set as rset } from 'firebase/database';

function AdminDashboard({ isAdmin, onClose }) {
  const [users, setUsers] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch all users from presence
  useEffect(() => {
    const presenceRef = rref(rtdb, 'presence');
    const unsubUsers = onValue(presenceRef, (snap) => {
      const val = snap.val() || {};
      const userList = Object.keys(val).map(key => ({ id: key, ...val[key] }));
      setUsers(userList);
    });

    return () => unsubUsers();
  }, []);

  // Fetch all global messages
  useEffect(() => {
    const messagesRef = rref(rtdb, 'messages/global');
    const unsubMessages = onValue(messagesRef, (snap) => {
      const val = snap.val() || {};
      const messageList = Object.keys(val).map(key => ({ id: key, ...val[key] }));
      setGlobalMessages(messageList);
    });

    return () => unsubMessages();
  }, []);

  const handleDeleteUser = async (userId) => {
    try {
      await remove(rref(rtdb, `presence/${userId}`));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await remove(rref(rtdb, `messages/global/${messageId}`));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  };

  const handleClearAllGlobalMessages = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL global messages? This cannot be undone!')) {
      try {
        await remove(rref(rtdb, 'messages/global'));
        alert('All global messages have been deleted');
      } catch (err) {
        console.error('Failed to clear global chat:', err);
        alert('Failed to clear global chat');
      }
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🔐 Admin Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'border-b-2 border-red-600 text-red-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiUsers size={18} /> Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'messages'
                ? 'border-b-2 border-red-600 text-red-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiMessageSquare size={18} /> Global Chat ({globalMessages.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-semibold text-sm">Total Active Users: {users.length}</p>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiUsers size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No users online</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-600">
                              {user.id.startsWith('guest_') || user.isGuest ? '🟢 Guest' : '🔐 Registered'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.online
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.online ? '🟢 Online' : '⚪ Offline'}
                        </span>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-semibold text-sm">Total Messages: {globalMessages.length}</p>
                <button
                  onClick={handleClearAllGlobalMessages}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <FiTrash2 size={18} /> Clear All Messages
                </button>
              </div>

              {globalMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiMessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No messages in global chat</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {globalMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{msg.senderName || 'Unknown'}</p>
                          <p className="text-gray-700 text-sm mt-2">{msg.text}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors ml-4 flex-shrink-0"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Delete User?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user? They will be removed from the system.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
