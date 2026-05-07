import React, { useEffect, useState, useRef } from 'react';
import './ListeningSpacePage.css';
import { getFriends } from '../api/authApi';
import { io } from 'socket.io-client';

const socket = io("http://172.20.10.3:3000");

export default function ListeningSpacePage({ currentUser }: { currentUser: any }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Friends
  useEffect(() => {
    if (currentUser?.id) {
      getFriends(currentUser.id)
        .then(data => setFriends(data))
        .catch(err => console.error(err.message));
    }
  }, [currentUser?.id]);

  // Socket Logic
  useEffect(() => {
    const sessionId = `session-${currentUser?.id}`;

    if (isSessionActive && currentSessionId) {
      socket.emit("join_session", sessionId);
      socket.on("receive_message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    }

    return () => {
      socket.off("receive_message");
    };
  }, [isSessionActive, currentUser?.id]);


  const sendMessage = (e: React.FormEvent) => {
  e.preventDefault();
  
  console.log("Current Session ID:", currentSessionId);
  console.log("Input text:", input);

  if (!input.trim()) return;
  if (!currentSessionId) {
    console.error("No Session ID found! You aren't in a room.");
    return;
  }

  const msgData = {
    senderId: currentUser.id,
    senderName: currentUser.username,
    sessionId: currentSessionId, 
    text: input,
  };

  socket.emit("send_message", msgData);
  setInput("");
};

  const [activeInvite, setActiveInvite] = useState<any>(null);

  const handleStartSession = () => {
    const sessionId = `session-${currentUser.id}`;

    // 1. Tell the server to invite the selected friends
    socket.emit("send_invite", {
      senderName: currentUser.username,
      friendIds: selectedFriends,
      sessionId: sessionId
    });

    // 2. Open the chat for yourself
    setCurrentSessionId(sessionId);
    setIsSessionActive(true);
  };

  useEffect(() => {
    // Register this user for private messages
    if (currentUser?.id) {
      socket.emit("register_user", currentUser.id);
    }

    // Listen for incoming invites
    socket.on("receive_invite", (invite) => {
      setActiveInvite(invite);
      // Optional: Auto-hide after 10 seconds
      // setTimeout(() => setActiveInvite(null), 10000);
    });

    return () => { socket.off("receive_invite"); };
  }, [currentUser?.id]);

  const handleAcceptInvite = () => {
  const targetSessionId = activeInvite.sessionId; 
  
  console.log("Accepting invite. Joining room:", targetSessionId);

  socket.emit("join_session", targetSessionId);

  setMessages([]); 
  setCurrentSessionId(targetSessionId); 
  setIsSessionActive(true);
  setShowManager(true);
  setActiveInvite(null); 
};
  return (
    <div className="listening-container">
      {activeInvite && (
        <div className="invite-notification">
          <div className="invite-text">
            <span className="blink">●</span> {activeInvite.message}
          </div>
          <div className="invite-actions">
            <button className="join-btn" onClick={handleAcceptInvite}>JOIN</button>
            <button className="ignore-btn" onClick={() => setActiveInvite(null)}>IGNORE</button>
          </div>
        </div>
      )}
      <button className="manage-sessions-btn" onClick={() => setShowManager(!showManager)}>
        {showManager ? "✖" : "Manage Sessions"}
      </button>

      {/* THE BLACK CHAT RECTANGLE */}
      {showManager && (
        <div className="retro-chat-box">
          {!isSessionActive ? (
            /* PHASE 1: FRIEND SELECTION */
            <div className="setup-view">
              <h3>SELECT FRIENDS</h3>
              <div className="friends-list">
                {friends.map(f => (
                  <div
                    key={f.id}
                    className={`friend-option ${selectedFriends.includes(f.id) ? 'active' : ''}`}
                    onClick={() => setSelectedFriends(prev =>
                      prev.includes(f.id) ? prev.filter(id => id !== f.id) : [...prev, f.id]
                    )}
                  >
                    {f.username}
                  </div>
                ))}
              </div>
              <button
                className="start-session-btn"
                disabled={selectedFriends.length === 0}
                onClick={handleStartSession}
              >
                START SESSION
              </button>
            </div>
          ) : (
            /* PHASE 2: THE CHAT (Matching your image) */
            <div className="chat-view">
              <div className="message-history">
                {messages.map((m, i) => (
                  <div key={i} className={`message-entry ${m.senderId === currentUser.id ? 'me' : 'them'}`}>
                    <span className="sender-name">
                      {m.senderId === currentUser.id ? 'me:' : `${m.senderName || 'friend'}:`}
                    </span>
                    <p className="message-text">{m.text}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendMessage} className="message-input-area">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="your text here..."
                />
                <button type="submit">Send</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ROOM STAGE */}
      <div className="room-stage">
        <div className="retro-overlay"></div>
        <div className="room-wrapper">
          <div className="wall back-wall"><div className="ambient-glow"></div></div>
          <div className="wall left-wall"></div>
          <div className="wall right-wall"></div>
          <div className='left-furniture'>
            <img className="couch" src="couch.svg" alt="couch" />
            <img className="plant" src="plant.svg" alt="plant" />
          </div>
          <img className='rug' src="rug.svg" alt="rug" />
          <div className="floor"><div className="floor-texture-layer"></div></div>
          <div className="ceiling"></div>
        </div>
      </div>
    </div>
  );
}