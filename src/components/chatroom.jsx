import React, { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { rtdb } from '../firebase';
import { ref as rref, onValue, push, serverTimestamp, set as rset } from 'firebase/database';

function ChatRoom({ currentUser, activeChat, users }) {
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
          console.log('Message sent to global chat:', payload);
        } else {
          const chatId = [currentUser.id, activeChat].sort().join('_');
          const ref = rref(rtdb, `messages/direct/${chatId}`);
          await push(ref, payload);
          console.log('Message sent to direct chat:', chatId, payload);
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
    // First try to get from senderName field in the message itself
    // If not available, look up from users array, fallback to 'Unknown'
    const sender = users.find(u => u.id === senderId);
    return sender ? sender.name : 'Unknown';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4 opacity-50">💬</div>
            <p className="text-lg font-medium text-gray-600">No messages yet</p>
            <p className="text-sm mt-2 text-gray-500">Start the conversation!</p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <div className={`flex ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-sm`}>
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    msg.senderId === currentUser.id ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`}>
                    {(msg.senderName || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                  <p className="text-xs text-gray-600 font-semibold px-3 mb-1">
                    {msg.senderName || 'Unknown'}
                  </p>
                  <div
                    className={`message-bubble ${
                      msg.senderId === currentUser.id
                        ? 'message-bubble-own'
                        : 'message-bubble-other'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-xs mt-2 opacity-70 ${msg.senderId === currentUser.id ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:shadow-md transition-all duration-300 placeholder-gray-400"
            placeholder={`Message ${activeChat === 'global' ? 'everyone' : getSenderName(activeChat)}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-110 active:scale-95 button-hover"
          >
            <FiSend className="text-lg" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;