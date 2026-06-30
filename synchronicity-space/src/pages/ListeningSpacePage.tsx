import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListeningSpacePage.css';
import { getFriends } from '../api/authApi';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

export const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export default function ListeningSpacePage({ currentUser }: { currentUser: any }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // --- NEW WORKFLOW STATES FOR SHARED SPIN ---
  const [showSpinManager, setShowSpinManager] = useState(false);
  const [selectedSpinFriends, setSelectedSpinFriends] = useState<string[]>([]);
  const [isSpinActive, setIsSpinActive] = useState<boolean>(() => {
    return !!localStorage.getItem('active_spin_id');
  });
  const [currentSpinId, setCurrentSpinId] = useState<string>(() => {
    return localStorage.getItem('active_spin_id') || "";
  });
  const [activeSpinUsers, setActiveSpinUsers] = useState<string[]>([]); // Tracks active user IDs in the room
  const [spinInvite, setSpinInvite] = useState<any>(null);
  const [invitedFriendsData, setInvitedFriendsData] = useState<any[]>(() => {
    const saved = localStorage.getItem('spin_invited_friends');
    return saved ? JSON.parse(saved) : [];
  });

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

  // --- CHAT SESSION SOCKETS ---
  useEffect(() => {
    if (isSessionActive && currentSessionId) {
      console.log("Re-joining chat session room:", currentSessionId);
      socket.emit("join_session", currentSessionId);

      socket.on("receive_message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    }

    return () => {
      socket.off("receive_message");
    };
  }, [isSessionActive, currentSessionId]);

  // --- NEW: SHARED SPIN PRESENCE SOCKETS ---
  useEffect(() => {
    if (isSpinActive && currentSpinId) {
      console.log("Joining spin presence room:", currentSpinId);
      
      socket.emit("join_spin_presence", { 
        spinId: currentSpinId, 
        userId: currentUser.id,
        username: currentUser.username
      });

      socket.on("spin_presence_update", (activeUserIds: string[]) => {
        console.log("Presence update received:", activeUserIds);
        setActiveSpinUsers(activeUserIds);
      });
    }

    return () => {
      if (currentSpinId) {
        socket.emit("leave_spin_presence", { spinId: currentSpinId, userId: currentUser.id });
      }
      socket.off("spin_presence_update");
    };
  }, [isSpinActive, currentSpinId, currentUser?.id, currentUser?.username]);

  // --- LISTENERS FOR INVITES ---
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log("Listening for invites for user:", currentUser.username);

    socket.on("receive_invite", (invite) => {
      console.log("!!! CHAT INVITE RECEIVED ON CLIENT:", invite);
      setActiveInvite(invite);
    });

    socket.on("receive_spin_invite", (invite) => {
      console.log("!!! SPIN INVITE RECEIVED ON CLIENT:", invite);
      setSpinInvite(invite);
    });

    return () => {
      console.log("Cleaning up invite listeners");
      socket.off("receive_invite");
      socket.off("receive_spin_invite");
    };
  }, [currentUser?.id, currentUser?.username]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

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
    setSelectedFriends([]);
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

  // --- NEW: SHARED SPIN WORKFLOW HANDLERS ---
  const handleStartSpin = () => {
    const sessionId = `spin-${currentUser.id}`;
    localStorage.setItem('active_spin_id', sessionId);

    const invitedList = friends.filter(f => selectedSpinFriends.includes(f.id));
    setInvitedFriendsData(invitedList);
    localStorage.setItem('spin_invited_friends', JSON.stringify(invitedList));

    socket.emit("send_spin_invite", {
      senderName: currentUser.username,
      friendIds: selectedSpinFriends,
      sessionId: sessionId,
      invitedFriends: invitedList
    });

    setCurrentSpinId(sessionId);
    setIsSpinActive(true);
    setSelectedSpinFriends([]);
    setShowSpinManager(false);
  };

  const handleAcceptSpinInvite = () => {
    const targetSessionId = spinInvite.sessionId;
    const invitedList = spinInvite.invitedFriends || [];

    localStorage.setItem('active_spin_id', targetSessionId);
    localStorage.setItem('spin_invited_friends', JSON.stringify(invitedList));

    socket.emit("join_spin_presence", {
      spinId: targetSessionId,
      userId: currentUser.id,
      username: currentUser.username
    });

    setInvitedFriendsData(invitedList);
    setCurrentSpinId(targetSessionId);
    setIsSpinActive(true);
    setSpinInvite(null);
  };

  const handleStopSession = () => {
    if (currentSessionId) {
      socket.emit("leave_session", currentSessionId);
    }

    localStorage.removeItem('active_session_id');
    setCurrentSessionId("");
    setIsSessionActive(false);
    setMessages([]);
  };

  const handleStopSpin = () => {
    if (currentSpinId) {
      socket.emit("leave_spin_presence", { spinId: currentSpinId, userId: currentUser.id });
    }

    localStorage.removeItem('active_spin_id');
    localStorage.removeItem('spin_invited_friends');
    setCurrentSpinId("");
    setIsSpinActive(false);
    setInvitedFriendsData([]);
    setActiveSpinUsers([]);
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

      {/* Shared Spin Session Invite Notification */}
      {spinInvite && (
        <div className="invite-notification spin-notification">
          <div className="invite-text">
            <span className="blink">●</span> {spinInvite.senderName} wants to spin records together!
          </div>
          <div className="invite-actions">
            <button className="join-btn spin-btn" onClick={handleAcceptSpinInvite}>JOIN SPIN</button>
            <button className="ignore-btn" onClick={() => setSpinInvite(null)}>IGNORE</button>
          </div>
        </div>
      )}

      <div className="controls-button-group">
        <button className="manage-sessions-btn" onClick={() => { setShowManager(!showManager); setShowSpinManager(false); }}>
          {showManager ? "✖" : "chat"}
        </button>

        <button className="manage-spin-btn" onClick={() => { setShowSpinManager(!showSpinManager); setShowManager(false); }}>
          {showSpinManager ? "✖" : (isSpinActive ? "spin status" : "shared spin")}
        </button>
      </div>

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

      {/* SPIN MANAGER OVERLAY (NO CHAT) */}
      {showSpinManager && (
        <div className="retro-chat-box spin-manager-box">
          {!isSpinActive ? (
            <div className="setup-view">
              <h3>SELECT SPIN PARTNERS</h3>
              <p className="sub-header-desc">Invite up to 5 friends to populate your virtual room</p>
              <div className="friends-list">
                {friends.map(f => {
                  const isSelected = selectedSpinFriends.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`friend-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedSpinFriends(prev =>
                        isSelected ? prev.filter(id => id !== f.id) : (prev.length < 5 ? [...prev, f.id] : prev)
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
                disabled={selectedSpinFriends.length === 0}
                onClick={handleStartSpin}
              >
                INVITE TO SPIN
              </button>
            </div>
          ) : (
            <div className="setup-view">
              <h3>ACTIVE SHARED SPIN</h3>
              <p className="sub-header-desc">You are listening in a group room. Statuses are pinned to your room wall.</p>
              <button className="stop-session-btn spin-stop-btn" onClick={handleStopSpin}>
                STOP SHARED SPIN
              </button>
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
          <div className="wall back-wall">
            <div className="ambient-glow"></div>

            {/* FLOATING PRESENCE CARDS ON BACK WALL */}
            {isSpinActive && (
              <div className="presence-grid">
                {/* Include Host (Self) card */}
                <div className="presence-card active">
                  <div className="status-indicator"></div>
                  <span className="username">{currentUser.username} (You)</span>
                  <span className="badge">ACTIVE</span>
                </div>

                {/* Friends card indicators */}
                {invitedFriendsData.map(friend => {
                  const isOnline = activeSpinUsers.includes(friend.id);
                  return (
                    <div key={friend.id} className={`presence-card ${isOnline ? 'active' : 'inactive'}`}>
                      <div className="status-indicator"></div>
                      <span className="username">{friend.username}</span>
                      <span className="badge">{isOnline ? 'ACTIVE' : 'OFFLINE'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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