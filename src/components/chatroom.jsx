import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import { rtdb } from '../firebase';
import { ref as rref, onValue, push, serverTimestamp, set as rset, remove } from 'firebase/database';

function ChatRoom({ currentUser, activeChat, users, isAdmin }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to RTDB messages for either global or direct chat
  useEffect(() => {
    let off;
    if (currentUser) {
      if (activeChat === 'global') {
        const messagesRef = rref(rtdb, 'messages/global');
        off = onValue(messagesRef, (snap) => {
          const val = snap.val() || {};
          const arr = Object.keys(val).map(k => ({ id: k, ...val[k] }));
          arr.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(arr.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : null })));
        });
      } else {
        const chatId = [currentUser.id, activeChat].sort().join('_');
        const messagesRef = rref(rtdb, `messages/direct/${chatId}`);
        off = onValue(messagesRef, (snap) => {
          const val = snap.val() || {};
          const arr = Object.keys(val).map(k => ({ id: k, ...val[k] }));
          arr.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(arr.map(m => ({ ...m, timestamp: m.timestamp ? new Date(m.timestamp) : null })));
        });
      }
    }

    return () => off && off();
  }, [currentUser, activeChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const newMessage = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: message,
      timestamp: new Date(),
      chatType: activeChat === 'global' ? 'global' : 'direct',
      receiverId: activeChat === 'global' ? null : activeChat,
    };
    // Optimistically add message locally so guest sees it immediately
    const localMsg = { id: Date.now().toString(), ...newMessage, timestamp: new Date() };
    setMessages(prev => [...prev, localMsg]);
    setMessage('');
    inputRef.current?.focus();
    // Persist message in Realtime Database (works for guests and authenticated users)
    (async () => {
      try {
        const payload = {
          ...newMessage,
          chatId: activeChat === 'global' ? 'global' : [currentUser.id, activeChat].sort().join('_'),
          timestamp: Date.now(),
        };
        if (activeChat === 'global') {
          const ref = rref(rtdb, 'messages/global');
          await push(ref, payload);
        } else {
          const chatId = [currentUser.id, activeChat].sort().join('_');
          const ref = rref(rtdb, `messages/direct/${chatId}`);
          await push(ref, payload);
        }
      } catch (err) {
        console.error('Failed to send message to RTDB:', err);
        alert('Failed to send message. Check console for details. Make sure RTDB rules allow authenticated writes.');
      }
    })();
  };

  // Filter messages based on active chat
  const filteredMessages = messages.filter(msg => {
    if (activeChat === 'global') return msg.chatType === 'global' || msg.chatId === 'global';
    // For direct chats, match chatId or sender/receiver fallback for local messages
    const chatId = [currentUser.id, activeChat].sort().join('_');
    if (msg.chatId) return msg.chatId === chatId;
    return (
      msg.chatType === 'direct' && ((msg.senderId === currentUser.id && msg.receiverId === activeChat) || (msg.senderId === activeChat && msg.receiverId === currentUser.id))
    );
  });

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderName = (senderId) => {
    const sender = users.find(u => u.id === senderId);
    return sender ? sender.name : 'Unknown';
  };

  const handleDeleteMessage = async (messageId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      if (activeChat === 'global') {
        await remove(rref(rtdb, `messages/global/${messageId}`));
      } else {
        const chatId = [currentUser.id, activeChat].sort().join('_');
        await remove(rref(rtdb, `messages/direct/${chatId}/${messageId}`));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message. Make sure you have admin permissions.');
    }
  };

  // Prevent guests from accessing private DM
  if (activeChat !== 'global' && currentUser.isGuest) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500">
        <p className="text-lg font-medium">Private messaging is available only for registered users.</p>
        <p className="text-sm mt-2">Please sign in to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4 opacity-40 animate-pulse">💬</div>
            <p className="text-lg font-medium text-gray-400">No messages yet</p>
            <p className="text-sm mt-2 text-gray-600">Start the conversation!</p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <div className={`flex ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-sm`}
                style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg ${
                    msg.senderId === currentUser.id ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}>
                    {(msg.senderName || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                  <p className="text-xs text-gray-400 font-semibold px-3 mb-1">
                    {msg.senderName || 'Unknown'}
                  </p>
                  <div className="relative group">
                    <div
                      className={`frosted-card minimal-shadow p-3 ${
                        msg.senderId === currentUser.id
                          ? 'bg-indigo-900/60 text-indigo-100'
                          : 'bg-gray-800/60 text-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-xs mt-2 opacity-70 ${msg.senderId === currentUser.id ? 'text-indigo-300' : 'text-gray-400'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                        title="Delete message"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Message Input */}
      <div className="border-t border-gray-800 p-4 bg-gray-900">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-3 border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:shadow-md transition-all duration-300 placeholder-gray-400 bg-gray-800 text-gray-100"
            placeholder={`Message ${activeChat === 'global' ? 'everyone' : getSenderName(activeChat)}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="p-3 bg-indigo-700 text-white rounded-full hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-110 active:scale-95 button-hover"
          >
            <FiSend className="text-lg" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;