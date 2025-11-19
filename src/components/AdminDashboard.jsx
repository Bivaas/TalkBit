import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiUsers, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import { rtdb } from '../firebase';
import { ref as rref, onValue, remove, set as rset } from 'firebase/database';

function AdminDashboard({ isAdmin, onClose }) {
  const [users, setUsers] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

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

  const handleDeleteSelectedUsers = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete the selected users? This cannot be undone!')) {
      try {
        for (const userId of selectedUsers) {
          await remove(rref(rtdb, `presence/${userId}`));
        }
        setSelectedUsers([]);
        alert('Selected users have been deleted.');
      } catch (err) {
        console.error('Failed to delete selected users:', err);
        alert('Failed to delete selected users.');
      }
    }
  };

  const handleDeleteAllUsers = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL users? This cannot be undone!')) {
      try {
        await remove(rref(rtdb, 'presence'));
        alert('All users have been deleted.');
      } catch (err) {
        console.error('Failed to delete all users:', err);
        alert('Failed to delete all users.');
      }
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

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="frosted-card minimal-shadow w-full max-w-4xl max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-gray-900 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🔒 Admin Dashboard
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-800 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'border-b-2 border-red-500 text-red-300 bg-gray-900'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FiUsers size={18} /> Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'messages'
                ? 'border-b-2 border-red-500 text-red-300 bg-gray-900'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FiMessageSquare size={18} /> Global Chat ({globalMessages.length})
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="frosted-card minimal-shadow p-4 mb-6">
                <p className="text-red-200 font-semibold text-sm">Total Active Users: {users.length}</p>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleDeleteSelectedUsers}
                    disabled={selectedUsers.length === 0}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold disabled:opacity-50"
                  >
                    Delete Selected Users
                  </button>
                  <button
                    onClick={handleDeleteAllUsers}
                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold"
                  >
                    Delete All Users
                  </button>
                </div>
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
                      className="flex items-center justify-between frosted-card minimal-shadow p-4 rounded-lg transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="form-checkbox h-5 w-5 text-red-500 bg-gray-900 border-gray-700"
                        />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-700 to-indigo-900 flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-100">{user.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">
                            {user.id.startsWith('guest_') || user.isGuest ? '🟢 Guest' : '🔒 Registered'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.online
                            ? 'bg-green-900 text-green-300'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {user.online ? '🟢 Online' : '⚪ Offline'}
                        </span>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-2 bg-red-900 text-red-300 hover:bg-red-800 rounded-lg transition-colors"
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
              <div className="flex items-center justify-between frosted-card minimal-shadow p-4 mb-6">
                <p className="text-yellow-200 font-semibold text-sm">Total Messages: {globalMessages.length}</p>
                <button
                  onClick={handleClearAllGlobalMessages}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold flex items-center gap-2"
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
                      className="frosted-card minimal-shadow p-4 rounded-lg transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-100">{msg.senderName || 'Unknown'}</p>
                          <p className="text-gray-200 text-sm mt-2">{msg.text}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2 bg-red-900 text-red-300 hover:bg-red-800 rounded-lg transition-colors ml-4 flex-shrink-0"
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
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="frosted-card minimal-shadow p-6 max-w-sm">
              <h3 className="text-lg font-bold text-gray-100 mb-4">Delete User?</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this user? They will be removed from the system.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-semibold"
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
