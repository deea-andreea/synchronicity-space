import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListeningSpacePage.css';
import { getFriends } from '../api/authApi';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import Avatar from '../components/Avatar';

export const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export default function ListeningSpacePage({ currentUser, albums = [] }: { currentUser: any, albums?: any[] }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // --- CO-SPIN WORKFLOW STATES ---
  const [showSpinManager, setShowSpinManager] = useState(false);
  const [selectedSpinFriends, setSelectedSpinFriends] = useState<string[]>([]);
  const [isSpinActive, setIsSpinActive] = useState<boolean>(() => {
    return !!localStorage.getItem('active_spin_id');
  });
  const [currentSpinId, setCurrentSpinId] = useState<string>(() => {
    return localStorage.getItem('active_spin_id') || "";
  });
  const [activeSpinUsers, setActiveSpinUsers] = useState<any[]>([]); // Tracks active users in the room
  const [spinInvite, setSpinInvite] = useState<any>(null);
  const [invitedFriendsData, setInvitedFriendsData] = useState<any[]>(() => {
    const saved = localStorage.getItem('spin_invited_friends');
    return saved ? JSON.parse(saved) : [];
  });
  const [spinHostName, setSpinHostName] = useState<string>(() => {
    return localStorage.getItem('spin_host_name') || "host";
  });

  // --- AVATAR STATES ---
  const [avatarPositions, setAvatarPositions] = useState<Record<string, { x: number, y: number, name: string, type: 'boy' | 'girl', direction?: string, isWalking?: boolean }>>({});
  const [myAvatarType] = useState<'boy' | 'girl'>(() => currentUser?.avatar || (localStorage.getItem('user_avatar') as 'boy' | 'girl') || 'boy');
  const [myName] = useState(() => currentUser?.username || localStorage.getItem('user_display_name') || "Guest");

  // Track my latest position in a ref to avoid dependency cycles when broadcasting to new users
  const myPosRef = useRef<{ x: number, y: number, direction: string, isWalking: boolean }>({
    x: window.innerWidth / 2, y: window.innerHeight - 100, direction: 'down', isWalking: false
  });

  // --- POLL STATES ---
  const [pollSuggestions, setPollSuggestions] = useState<{ userId: string, username: string, track: any, album: any, trackIndex: number, votes: string[] }[]>(() => {
    const saved = localStorage.getItem('poll_suggestions');
    return saved ? JSON.parse(saved) : [];
  });

  // --- PROXIMITY CHAT STATES ---
  const PROXIMITY_THRESHOLD = 150; // pixels
  const [nearbyUserIds, setNearbyUserIds] = useState<string[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showProximityChat, setShowProximityChat] = useState(false);
  const [proxyChatMessages, setProxyChatMessages] = useState<any[]>([]);
  const [proxyChatInput, setProxyChatInput] = useState('');
  const proxyChatEndRef = useRef<HTMLDivElement>(null);

  // --- VINYL PLAYER STATES ---
  const [playingAlbum, setPlayingAlbum] = useState<any | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('poll_suggestions', JSON.stringify(pollSuggestions));
  }, [pollSuggestions]);

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

  // Unified active room resolution (prevents room splits)
  const activeRoomId = currentSpinId || currentSessionId;

  // --- CHAT SESSION SOCKETS ---
  useEffect(() => {
    if (!isSessionActive || !currentSessionId) return;

    const joinSession = () => {
      console.log("Re-joining chat session room:", currentSessionId);
      socket.emit("join_session", currentSessionId);
    };

    if (socket.connected) {
      joinSession();
    }

    socket.off("connect", joinSession);
    socket.on("connect", joinSession);

    const onReceiveMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.off("receive_message", onReceiveMessage);
    socket.on("receive_message", onReceiveMessage);

    return () => {
      socket.off("connect", joinSession);
      socket.off("receive_message", onReceiveMessage);
    };
  }, [isSessionActive, currentSessionId]);

  // --- SHARED SPIN PRESENCE SOCKETS ---
  useEffect(() => {
    if (!isSpinActive || !currentSpinId) return;

    const joinRoom = () => {
      console.log("Joining spin presence room:", currentSpinId);
      socket.emit("join_spin_presence", {
        spinId: currentSpinId,
        userId: currentUser.id,
        username: currentUser.username
      });
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.off("connect", joinRoom);
    socket.on("connect", joinRoom);

    const onPresenceUpdate = (activeUsers: any[]) => {
      setActiveSpinUsers(activeUsers);
    };

    socket.off("spin_presence_update", onPresenceUpdate);
    socket.on("spin_presence_update", onPresenceUpdate);

    return () => {
      if (currentSpinId) {
        socket.emit("leave_spin_presence", { spinId: currentSpinId, userId: currentUser.id });
      }
      socket.off("connect", joinRoom);
      socket.off("spin_presence_update", onPresenceUpdate);
    };
  }, [isSpinActive, currentSpinId, currentUser?.id, currentUser?.username]);

  // --- SHARED LISTENERS (registered once, always active) ---
  useEffect(() => {
    const onAvatarMoved = (data: any) => {
      setAvatarPositions((prev) => ({
        ...prev,
        [data.userId]: { x: data.x, y: data.y, name: data.name, type: data.type, direction: data.direction, isWalking: data.isWalking }
      }));
    };

    const onSyncPoll = (suggestions: any[]) => {
      setPollSuggestions(suggestions);
    };

    const onChatReady = ({ chatId, messages: history }: any) => {
      setActiveChatId(chatId);
      setProxyChatMessages(history || []);
      setShowProximityChat(true);
    };

    const onProximityMsg = ({ msg }: any) => {
      setProxyChatMessages(prev => [...prev, msg]);
    };

    const onReceivePlaybackSync = ({ album, trackIndex }: any) => {
      setPlayingAlbum(album);
      setCurrentTrackIndex(trackIndex);
    };

    socket.on("avatar_moved", onAvatarMoved);
    socket.on("sync_poll", onSyncPoll);
    socket.on("chat_ready", onChatReady);
    socket.on("receive_proximity_message", onProximityMsg);
    socket.on("receive_playback_sync", onReceivePlaybackSync);

    return () => {
      socket.off("avatar_moved", onAvatarMoved);
      socket.off("sync_poll", onSyncPoll);
      socket.off("chat_ready", onChatReady);
      socket.off("receive_proximity_message", onProximityMsg);
      socket.off("receive_playback_sync", onReceivePlaybackSync);
    };
  }, []);

  // Broadcast my position to everyone whenever room membership changes
  useEffect(() => {
    if (isSpinActive && currentSpinId && currentUser) {
      socket.emit("move_avatar", {
        roomId: currentSpinId,
        userId: currentUser.id,
        x: myPosRef.current.x,
        y: myPosRef.current.y,
        name: myName,
        type: myAvatarType,
        direction: myPosRef.current.direction,
        isWalking: myPosRef.current.isWalking
      });
    }
  }, [activeSpinUsers, isSpinActive, currentSpinId, currentUser, myName, myAvatarType]);

  // --- PROXIMITY DETECTION ---
  useEffect(() => {
    if (!currentUser?.id) return;
    const myPos = avatarPositions[currentUser.id];
    if (!myPos) return;
    const nearby = Object.entries(avatarPositions)
      .filter(([uid]) => uid !== String(currentUser.id))
      .filter(([, pos]) => {
        const dx = pos.x - myPos.x;
        const dy = pos.y - myPos.y;
        return Math.sqrt(dx * dx + dy * dy) < PROXIMITY_THRESHOLD;
      })
      .map(([uid]) => uid);
    setNearbyUserIds(nearby);
    if (nearby.length === 0) {
      setShowProximityChat(false);
    }
  }, [avatarPositions, currentUser?.id]);

  const handleStartChat = () => {
    const participants = [String(currentUser.id), ...nearbyUserIds];
    socket.emit("request_nearby_chat", { roomId: activeRoomId, participants });
  };

  const sendProximityMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proxyChatInput.trim() || !activeChatId) return;
    socket.emit("send_proximity_message", {
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      text: proxyChatInput
    });
    setProxyChatInput('');
  };

  // --- LISTENERS FOR INVITES ---
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log("Listening for invites for user:", currentUser.username);

    const onReceiveInvite = (invite: any) => {
      console.log("!!! CHAT INVITE RECEIVED ON CLIENT:", invite);
      setActiveInvite(invite);
    };

    const onReceiveSpinInvite = (invite: any) => {
      console.log("!!! SPIN INVITE RECEIVED ON CLIENT:", invite);
      setSpinInvite(invite);
    };

    socket.on("receive_invite", onReceiveInvite);
    socket.on("receive_spin_invite", onReceiveSpinInvite);

    return () => {
      socket.off("receive_invite", onReceiveInvite);
      socket.off("receive_spin_invite", onReceiveSpinInvite);
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

  const handleStopSession = () => {
    if (currentSessionId) {
      socket.emit("leave_session", currentSessionId);
    }
    localStorage.removeItem('active_session_id');
    localStorage.removeItem('poll_suggestions');
    setPollSuggestions([]);
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
    localStorage.removeItem('spin_host_name');
    localStorage.removeItem('poll_suggestions');
    setPollSuggestions([]);
    setCurrentSpinId("");
    setIsSpinActive(false);
    setInvitedFriendsData([]);
    setActiveSpinUsers([]);
    setPlayingAlbum(null);
  };

  const handleStartSession = () => {
    handleStopSpin();

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
    handleStopSpin();

    const targetSessionId = activeInvite.sessionId;
    localStorage.setItem('active_session_id', targetSessionId);

    socket.emit("join_session", targetSessionId);
    setMessages([]);
    setCurrentSessionId(targetSessionId);
    setIsSessionActive(true);
    setShowManager(true);
    setActiveInvite(null);
  };

  // --- CO-SPIN WORKFLOW HANDLERS ---
  const handleStartSpin = () => {
    handleStopSession();

    const sessionId = `spin-${currentUser.id}`;
    localStorage.setItem('active_spin_id', sessionId);

    const invitedList = friends.filter(f => selectedSpinFriends.includes(f.id));
    setInvitedFriendsData(invitedList);
    localStorage.setItem('spin_invited_friends', JSON.stringify(invitedList));
    localStorage.setItem('spin_host_name', currentUser.username);
    setSpinHostName(currentUser.username);

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
    handleStopSession();

    const targetSessionId = spinInvite.sessionId;
    const invitedList = spinInvite.invitedFriends || [];

    localStorage.setItem('active_spin_id', targetSessionId);
    localStorage.setItem('spin_invited_friends', JSON.stringify(invitedList));
    localStorage.setItem('spin_host_name', spinInvite.senderName);
    setSpinHostName(spinInvite.senderName);

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

  // --- PLAYBACK SELECTION & SYNC ---
  const handlePlayAlbum = (album: any, trackIndex: number = 0) => {
    setPlayingAlbum(album);
    setCurrentTrackIndex(trackIndex);

    if (activeRoomId) {
      socket.emit("sync_playback", {
        spinId: activeRoomId,
        album: album,
        trackIndex: trackIndex
      });
    }
  };

  const handleNextTrack = () => {
    if (pollSuggestions.length > 0) {
      let winner = pollSuggestions[0];
      for (const s of pollSuggestions) {
        if (s.votes.length > winner.votes.length) winner = s;
      }
      handlePlayAlbum(winner.album, winner.trackIndex);

      setPollSuggestions([]);
      localStorage.removeItem('poll_suggestions');
      if (activeRoomId) {
        socket.emit("clear_poll", { roomId: activeRoomId });
      }
      return;
    }

    if (playingAlbum && currentTrackIndex < playingAlbum.Tracks.length - 1) {
      const nextIndex = currentTrackIndex + 1;
      handlePlayAlbum(playingAlbum, nextIndex);
    }
  };

  const handleSuggestTrack = (album: any, trackIndex: number) => {
    if (!activeRoomId) return;
    if (pollSuggestions.some(s => String(s.userId) === String(currentUser.id))) return;

    // Clean and sanitize the album object to remove any nested Sequelize circular instances
    const sanitizedSuggestion = {
      userId: String(currentUser.id),
      username: currentUser.username,
      track: {
        id: album.Tracks[trackIndex].id,
        title: album.Tracks[trackIndex].title
      },
      album: {
        id: album.id,
        title: album.title,
        coverURL: album.coverURL,
        Tracks: album.Tracks.map((t: any) => ({
          id: t.id,
          title: t.title
        }))
      },
      trackIndex
    };

    socket.emit("add_suggestion", { roomId: activeRoomId, suggestion: sanitizedSuggestion });
  };

  const handleVote = (suggestionUserId: string) => {
    if (!activeRoomId) return;
    socket.emit("toggle_vote", {
      roomId: activeRoomId,
      userId: String(currentUser.id),
      suggestionUserId: String(suggestionUserId)
    });
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      const prevIndex = currentTrackIndex - 1;
      handlePlayAlbum(playingAlbum, prevIndex);
    }
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

  const quickPicks = albums.slice(0, 3);
  const hostId = currentSpinId.startsWith("spin-") ? currentSpinId.substring(5) : null;

  // Type-Safe string-based presence tracking (fixes Object.keys vs integer database IDs)
  const activeSpinUserIds = activeSpinUsers.map(String);

  const offlineFriends = invitedFriendsData.filter(friend => {
    if (String(friend.id) === String(currentUser.id)) return false;
    return !activeSpinUserIds.includes(String(friend.id));
  });

  return (
    <div className="listening-container">
      {activeInvite && (
        <div className="invite-notification" style={{ border: '1px solid #333', background: '#111', color: '#eee' }}>
          <div className="invite-text">
            <span className="blink" style={{ color: '#888', marginRight: '6px' }}>●</span> {activeInvite.message}
          </div>
          <div className="invite-actions">
            <button className="join-btn" onClick={handleAcceptInvite} style={{ background: '#222', color: '#fff', border: '1px solid #444' }}>JOIN</button>
            <button className="ignore-btn" onClick={() => setActiveInvite(null)} style={{ background: 'transparent', color: '#888', border: 'none' }}>IGNORE</button>
          </div>
        </div>
      )}

      {spinInvite && (
        <div className="invite-notification spin-notification" style={{ border: '1px solid #333', background: '#111', color: '#eee' }}>
          <div className="invite-text">
            <span className="blink" style={{ color: '#888', marginRight: '6px' }}>●</span> {spinInvite.senderName} wants to spin records together!
          </div>
          <div className="invite-actions">
            <button className="join-btn spin-btn" onClick={handleAcceptSpinInvite} style={{ background: '#222', color: '#fff', border: '1px solid #444' }}>JOIN SPIN</button>
            <button className="ignore-btn" onClick={() => setSpinInvite(null)} style={{ background: 'transparent', color: '#888', border: 'none' }}>IGNORE</button>
          </div>
        </div>
      )}

      <button className="manage-sessions-btn" onClick={() => setShowManager(!showManager)}>
        {showManager ? "✖" : "chat"}
      </button>

      <button className="manage-spin-btn" onClick={() => setShowSpinManager(!showSpinManager)}>
        {showSpinManager ? "✖" : (isSpinActive ? "spin status" : "shared spin")}
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

      {showSpinManager && (
        <div className="retro-spin-box">
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

      {isSpinActive && (
        <div className="presence-grid">
          <div className="presence-card active">
            <div className="status-indicator"></div>
            <span className="username">{currentUser.username} (You)</span>
            <span className="badge">ACTIVE</span>
          </div>

          {hostId && String(hostId) !== String(currentUser.id) && activeSpinUserIds.includes(String(hostId)) && (
            <div className="presence-card active">
              <div className="status-indicator"></div>
              <span className="username">{spinHostName}</span>
              <span className="badge">ACTIVE</span>
            </div>
          )}

          {invitedFriendsData
            .filter(friend => String(friend.id) !== String(currentUser.id) && activeSpinUserIds.includes(String(friend.id)) && String(friend.id) !== String(hostId))
            .map(friend => (
              <div key={friend.id} className="presence-card active">
                <div className="status-indicator"></div>
                <span className="username">{friend.username}</span>
                <span className="badge">ACTIVE</span>
              </div>
            ))
          }

          {hostId && String(hostId) !== String(currentUser.id) && !activeSpinUserIds.includes(String(hostId)) && (
            <div className="presence-card inactive">
              <div className="status-indicator"></div>
              <span className="username">{spinHostName}</span>
              <span className="badge">OFFLINE</span>
            </div>
          )}

          {offlineFriends.map(friend => (
            <div key={friend.id} className="presence-card inactive">
              <div className="status-indicator"></div>
              <span className="username">{friend.username}</span>
              <span className="badge">OFFLINE</span>
            </div>
          ))}
        </div>
      )}

      {/* MONOCHROME SONG POLL UI */}
      {activeRoomId && (
        <div className="poll-container" style={{ position: 'absolute', top: '100px', left: '20px', background: 'rgba(15,15,15,0.95)', border: '1px solid #333', padding: '16px', borderRadius: '8px', zIndex: 1000, color: '#aaa', width: '280px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', fontFamily: "'Courier New', Courier, monospace" }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', borderBottom: '1px solid #333', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#eee' }}>💿 Up Next Poll</h3>
          {pollSuggestions.length < 10 && !pollSuggestions.some(s => String(s.userId) === String(currentUser.id)) && (
            <div className="suggest-section" style={{ marginBottom: '12px' }}>
              <select style={{ width: '100%', padding: '8px', background: '#111', color: '#aaa', border: '1px solid #333', borderRadius: '4px', fontFamily: 'inherit', outline: 'none' }} onChange={(e) => {
                const parts = e.target.value.split('-');
                if (parts.length === 2) {
                  const albumId = parts[0];
                  const trackIdx = parseInt(parts[1]);
                  const album = albums.find(a => String(a.id) === albumId);
                  if (album) handleSuggestTrack(album, trackIdx);
                  e.target.value = "";
                }
              }} defaultValue="">
                <option value="" disabled>Suggest a track...</option>
                {albums.map(a =>
                  a.Tracks?.map((t: any, idx: number) => (
                    <option key={`${a.id}-${idx}`} value={`${a.id}-${idx}`}>{a.title} - {t.title}</option>
                  ))
                )}
              </select>
            </div>
          )}
          <div className="suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {pollSuggestions.map(s => (
              <div key={s.userId} className="suggestion-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', background: '#1a1a1a', padding: '8px', borderRadius: '6px', borderLeft: '2px solid #444' }}>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px', color: '#eee' }}>
                  {s.track?.title || "Unknown"} <small style={{ color: '#666', display: 'block', marginTop: '2px' }}>Suggested by {s.username}</small>
                </span>
                <button
                  onClick={() => handleVote(s.userId)}
                  style={{ background: s.votes.includes(currentUser.id) ? '#444' : '#222', color: s.votes.includes(currentUser.id) ? '#fff' : '#888', border: '1px solid #333', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', transition: 'all 0.15s' }}
                >
                  {s.votes.includes(currentUser.id) ? `voted [${s.votes.length}]` : `vote [${s.votes.length}]`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wall-player-container">
        <div className="wall-vinyl-section">
          <div className="vinyl-wrapper">
            <img
              src="/logo-vinyl.svg"
              alt="Vinyl"
              className={`spinning-vinyl ${playingAlbum ? "is-spinning" : ""}`}
            />
            {playingAlbum && (
              <img
                src={playingAlbum.coverURL}
                className={`wall-vinyl-label ${playingAlbum ? "is-spinning" : ""}`}
                alt="label"
              />
            )}
          </div>
        </div>

        {!playingAlbum ? (
          <div className="wall-record-shelf">
            <span className="shelf-hint">select a record:</span>
            <div className="shelf-album-covers">
              {quickPicks.map(album => (
                <img
                  key={album.id}
                  src={album.coverURL}
                  alt={album.title}
                  className="shelf-cover"
                  onClick={() => handlePlayAlbum(album, 0)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="wall-playback-controls">
            <span className="wall-track-title">
              {playingAlbum.Tracks[currentTrackIndex]?.title || "Loading track..."}
            </span>
            <div className="wall-playback-btns">
              <button onClick={handlePrevTrack}>
                <img src="/before-track-icon.svg" style={{ width: '15px' }} />
              </button>
              <button className="play-btn" onClick={() => setPlayingAlbum(null)}>
                <img src="/next-track-icon.svg" style={{ width: '15px', transform: 'rotate(90deg)' }} />
              </button>
              <button onClick={handleNextTrack}>
                <img src="/next-track-icon.svg" style={{ width: '15px' }} />
              </button>
            </div>
          </div>
        )}
      </div>

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

        {activeRoomId && (
          <>
            <Avatar
              type={avatarPositions[currentUser.id]?.type || myAvatarType}
              name={avatarPositions[currentUser.id]?.name || myName}
              targetX={avatarPositions[currentUser.id]?.x || window.innerWidth / 2}
              targetY={avatarPositions[currentUser.id]?.y || window.innerHeight - 100}
              isMe={true}
              onMove={(x, y, dir, isWalking) => {
                if (!isSessionActive && !isSpinActive) return;
                myPosRef.current = { x, y, direction: dir, isWalking };
                socket.emit("move_avatar", { roomId: activeRoomId, userId: currentUser.id, x, y, name: myName, type: myAvatarType, direction: dir, isWalking });
              }}
            />
            {Object.entries(avatarPositions).map(([userId, pos]) => {
              if (String(userId) === String(currentUser.id)) return null;
              return (
                <Avatar
                  key={userId}
                  type={pos.type}
                  name={pos.name}
                  targetX={pos.x}
                  targetY={pos.y}
                  isMe={false}
                  targetDirection={pos.direction}
                  targetIsWalking={pos.isWalking}
                />
              );
            })}
          </>
        )}
      </div>

      {activeRoomId && nearbyUserIds.length > 0 && (
        <button
          onClick={handleStartChat}
          style={{
            position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 2000, background: 'rgba(20,20,20,0.95)',
            color: '#ccc', border: '1px solid #333', borderRadius: '20px', padding: '10px 24px',
            fontFamily: "'Courier New', Courier, monospace", fontWeight: 'normal',
            fontSize: '13px', cursor: 'pointer', letterSpacing: '0.5px',
            backdropFilter: 'blur(8px)'
          }}
        >
          start chat ({nearbyUserIds.length + 1})
        </button>
      )}

      {showProximityChat && activeChatId && (
        <div style={{
          position: 'fixed', right: '20px', top: '80px', width: '290px', height: '400px',
          background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(12px)',
          border: '1px solid #333', borderRadius: '10px', zIndex: 2000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: "'Courier New', Courier, monospace", boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111' }}>
            <span style={{ color: '#888', fontWeight: 'normal', fontSize: '12px', letterSpacing: '0.5px' }}>nearby chat</span>
            <button onClick={() => setShowProximityChat(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px' }}>✖</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {proxyChatMessages.length === 0 && (
              <p style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '30px' }}>No messages yet. Say hi!</p>
            )}
            {proxyChatMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: String(m.senderId) === String(currentUser.id) ? 'flex-end' : 'flex-start' }}>
                <span style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>{String(m.senderId) === String(currentUser.id) ? 'you' : m.senderName}</span>
                <div style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: '10px',
                  background: String(m.senderId) === String(currentUser.id) ? '#333' : '#222',
                  color: '#fff',
                  fontSize: '13px', wordBreak: 'break-word', border: '1px solid #444'
                }}>{m.text}</div>
              </div>
            ))}
            <div ref={proxyChatEndRef} />
          </div>
          <form onSubmit={sendProximityMessage} style={{ display: 'flex', borderTop: '1px solid #222', padding: '8px' }}>
            <input
              value={proxyChatInput}
              onChange={e => setProxyChatInput(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
            />
            <button type="submit" style={{ marginLeft: '6px', background: '#333', border: '1px solid #444', borderRadius: '6px', padding: '8px 14px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>→</button>
          </form>
        </div>
      )}
    </div>
  );
}