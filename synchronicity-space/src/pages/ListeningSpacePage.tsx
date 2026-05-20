import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListeningSpacePage.css';
import { getFriends } from '../api/authApi';
import { io } from 'socket.io-client';

const socket = io(`https://${window.location.hostname}:3000`);

export default function ListeningSpacePage({ currentUser }: { currentUser: any }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return localStorage.getItem('active_session_id') || "";
  });

  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    return !!localStorage.getItem('active_session_id');
  });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const navigate = useNavigate();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentUser?.id) {
      getFriends(currentUser.id)
        .then(data => setFriends(data))
        .catch(err => console.error(err.message));
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (isSessionActive && currentSessionId) {
      console.log("Re-joining session room:", currentSessionId);
      socket.emit("join_session", currentSessionId);

      socket.on("receive_message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    }

    return () => {
      socket.off("receive_message");
    };
  }, [isSessionActive, currentSessionId]);


  useEffect(() => {
    if (!currentUser?.id) return;

    console.log("Listening for invites for user:", currentUser.username);

    socket.on("receive_invite", (invite) => {
      console.log("!!! INVITE RECEIVED ON CLIENT:", invite); // DEBUG LOG
      setActiveInvite(invite);
    });

    return () => {
      console.log("Cleaning up invite listener");
      socket.off("receive_invite");
    };
  }, [currentUser?.id]);

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

    localStorage.setItem('active_session_id', sessionId);

    socket.emit("send_invite", {
      senderName: currentUser.username,
      friendIds: selectedFriends,
      sessionId: sessionId
    });

    setCurrentSessionId(sessionId);
    setIsSessionActive(true);
    setSelectedFriends([])
  };

  const handleAcceptInvite = () => {
    const targetSessionId = activeInvite.sessionId;

    localStorage.setItem('active_session_id', targetSessionId);

    socket.emit("join_session", targetSessionId);
    setMessages([]);
    setCurrentSessionId(targetSessionId);
    setIsSessionActive(true);
    setShowManager(true);
    setActiveInvite(null);
  };

  const handleStopSession = () => {
    if (currentSessionId) {
      socket.emit("leave_session", currentSessionId); // Optional: tell server you're leaving
    }

    localStorage.removeItem('active_session_id');
    setCurrentSessionId("");
    setIsSessionActive(false);
    setMessages([]);
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    const onConnect = () => {
      console.log("Socket connected, registering user:", currentUser.id);
      socket.emit("register_user", currentUser.id);
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, [currentUser?.id]);

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
        {showManager ? "✖" : "chat"}
      </button>

      {showManager && (
        <div className="retro-chat-box">
          {!isSessionActive ? (
            <div className="setup-view">
              <h3>SELECT FRIENDS</h3>
              <div className="friends-list">
                {friends.map(f => {
                  const isSelected = selectedFriends.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`friend-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedFriends(prev =>
                        isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id]
                      )}
                    >
                      <span className="checkbox">{isSelected ? '[X]' : '[ ]'}</span>
                      <span className="username">{f.username}</span>
                    </div>
                  );
                })}
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
            <div className="chat-view">
              <button className="stop-session-btn" onClick={handleStopSession}>
                EXIT SESSION
              </button>
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

      <div className="room-stage">
        <button className="back-home-btn" onClick={() => navigate("/home")}>
          ← BACK TO HOME
        </button>
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