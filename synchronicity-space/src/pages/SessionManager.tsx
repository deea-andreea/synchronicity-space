import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './SessionManager.css';
import { API_BASE_URL } from '../config';

export const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export default function SessionManager({ currentUser, friendsList }) {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  
  // Use a stable session ID (for this demo, we'll generate one when starting)
  const [currentSessionId, setCurrentSessionId] = useState("");

  useEffect(() => {
    if (isSessionActive) {
      socket.emit("join_session", currentSessionId);
      socket.on("receive_group_message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    }
    return () => { socket.off("receive_group_message"); };
  }, [isSessionActive, currentSessionId]);

  const handleStartSession = () => {
    if (selectedFriends.length > 0) {
      // In a real app, you'd generate this or get it from the backend
      setCurrentSessionId(`session-${currentUser.id}`);
      setIsSessionActive(true);
    }
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : 
      (prev.length < 5 ? [...prev, id] : prev)
    );
  };

  // Inside SessionManager.tsx
useEffect(() => {
  if (isSessionActive) {
    socket.emit("join_session", currentSessionId);

    // MATCH YOUR SERVER: "receive_message"
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  }
  return () => { socket.off("receive_message"); };
}, [isSessionActive, currentSessionId]);

const sendMessage = (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim()) return;

  const messageData = {
    senderId: currentUser.id,
    sessionId: currentSessionId,
    text: input,
    timestamp: new Date().toISOString()
  };

  // MATCH YOUR SERVER: "send_message"
  socket.emit("send_message", messageData);
  setInput("");
};

  return (
    <>
      {/* PHASE 1: SELECTION OVERLAY */}
      {!isSessionActive && (
        <div className="selection-overlay">
          <div className="selection-card">
            <h2>Start a Listening Session</h2>
            <p>Select up to 5 friends:</p>
            <div className="friends-grid">
              {friendsList.map(friend => (
                <label key={friend.id} className={`friend-item ${selectedFriends.includes(friend.id) ? 'selected' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                  />
                  {friend.username}
                </label>
              ))}
            </div>
            <button 
              className="start-btn" 
              disabled={selectedFriends.length === 0}
              onClick={handleStartSession}
            >
              Start Session
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: CHAT RECTANGLE (RIGHT SIDE) */}
      {isSessionActive && (
        <div className="chat-rectangle">
          <div className="chat-header">Session Chat</div>
          <div className="chat-history">
            {messages.map((m, i) => (
              <div key={i} className={m.senderId === currentUser.id ? "msg-me" : "msg-them"}>
                <span className="sender-tag">{m.senderId === currentUser.id ? "Me" : "Friend"}:</span>
                <p>{m.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="chat-input">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message friends..." />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
}