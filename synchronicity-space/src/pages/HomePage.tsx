import { useEffect, useState } from "react";
import "./HomePage.css";
import type { Album } from "../models/Album";
import { useSpotify } from "./Spotify"; // Your context hook
import { playSpotifyAlbum } from "../App"; // Import the play function you wrote
import type { Note } from "../models/Note";
import { mockNotes } from "../data/mockNotes";
import { mockUsers } from "../data/mockUsers";
import { trackListening, updateNoteCount } from "../utils/tracking";

import { fetchNotes, createNote, updateNote, deleteNote, type PaginatedNotes } from "../api/notesApi"

interface HomeProps {
  albums: Album[];
  activeAlbum: Album | null;
  onPlayAlbum: (album: Album) => void;
}

export default function HomePage({ albums, activeAlbum, onPlayAlbum }: HomeProps) {
  const [playingAlbum, setPlayingAlbum] = useState<Album | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [noteError, setNoteError] = useState("");


  // const { player, deviceId } = useSpotify();
  const player = null;
  const deviceId = null;

  const token = "BQCh0fSs1LhN4Sy70tJ573EstDSYtCZJAm8Cf8SVO_kbbVWAtwK9w5iWM40HUYFcw-MdBFKQy1St6U5JS6jT8j-4K64wTopP6uC6azIabzCPGN_X8YuodTKBysjF9pblGu2-lelZAyltzqdhkCNhZ1F3GqCKYBozg0qtUNSCE24uKXXwOyhq4sUbWBn7V5VkIL_mAqUnnFwYYTpZauXLngeWOx_QJf5uwLXy8KdM11tRT7CEN64l0M6yzd6-GwtEed_uDvdkcg"
  const quickPicks = albums.slice(0, 3);

  const handleAlbumSelect = async (album: Album) => {

    onPlayAlbum(album);
    setCurrentTrackIndex(0);

    const ALBUM_URI = "spotify:album:1nG8mArxQsJplIY6w50aQg";

    try {
      if (deviceId && token) {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: "PUT",
          body: JSON.stringify({ context_uri: ALBUM_URI, offset: { position: 0 } }),
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      console.warn("Spotify playback failed, but UI will still update.");
    }
  };

  const handleNextTrack = () => {
    if (playingAlbum && currentTrackIndex < playingAlbum.tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      player?.nextTrack();
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
      player?.previousTrack();
    }
  };

  const [displayNotes, setDisplayNotes] = useState<Note[]>([]);
  const [notePage, setNotePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const notesPerPage = 2;

  const [fetchError, setFetchError] = useState("");

  const currentTrackId = playingAlbum?.tracks[currentTrackIndex]?.id;

  useEffect(() => {
    if (!currentTrackId || !playingAlbum) {
      setDisplayNotes([]);
      console.log("here");
      return;
    }


    setFetchError("");
    fetchNotes({
      trackId: currentTrackId,
      albumId: playingAlbum.id,
      page: notePage,
      pageSize: notesPerPage
    })
      .then((data: PaginatedNotes) => {
        setDisplayNotes(data.items);
        setTotalPages(data.totalPages);
      })
      .catch(() => setFetchError("Could not load notes from server"));
  }, [currentTrackId, notePage]);

  useEffect(() => {
    setNotePage(1);
  }, [currentTrackId]);

  const [newNoteText, setNewNoteText] = useState("");

  const isValidNote = (text: string) => {
    return text.trim().length >= 5 && text.trim().length <= 100;
  }

  const onPostNote = async () => {
    if (!isValidNote(newNoteText)) {
      setNoteError("Note must be between 5 and 100 characters.");
      return;
    }
    if (!currentTrackId || !playingAlbum) return;

    setNoteError("");
    try {
      console.log(newNoteText);
      const created = await createNote({
        userId: currentUser.id,
        trackId: currentTrackId,
        albumId: playingAlbum.id,
        text: newNoteText,
      });
      setDisplayNotes((prev) => [created, ...prev]);
      setNewNoteText("");
      updateNoteCount(1);
    }
    catch (err: any) {
      setNoteError(err.message ?? "Something went wrong posting the note.");
    }
  }

  const getUserById = (id: string) => mockUsers.find((u) => u.id === id);
  const currentUser = mockUsers.find((u) => u.id === "1") || mockUsers[0];

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const closeNotes = () => {
    setShowOverlay(false);
    setSelectedNote(null);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id, currentUser.id);
      setDisplayNotes((prev) => prev.filter((n) => n.id !== id));
      setSelectedNote(null);
      updateNoteCount(-1);
    }
    catch (err: any) {
      setNoteError(err.message ?? "Could not delete note.");
    };
  }

  const startEditing = () => {
    if (selectedNote) {
      setEditText(selectedNote.text);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedNote) return;
    if (!isValidNote(editText)) {
      setNoteError("Note must be between 5 and 300 characters.");
      return;
    }

    setNoteError("");
    try {
      const updated = await updateNote(selectedNote.id, editText, currentUser.id);
      setDisplayNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
      setSelectedNote(updated);
      setIsEditing(false);
    } catch (err: any) {
      setNoteError(err.message ?? "Could not save note.");
    }
  };

  useEffect(() => {
    if (activeAlbum) {
      setPlayingAlbum(activeAlbum);
      setCurrentTrackIndex(0);
    }
  }, [activeAlbum]);

  useEffect(() => {
    if (playingAlbum) trackListening(playingAlbum);
  }, [playingAlbum?.id]);


  return (
    <div className="container">
      <main className="content">
        <div className="right-section">
          <div className="vinyl-section">
            <img className="turntable-image" src="/turntable.svg" alt="turntable" />

            <div className={`disk-container ${playingAlbum ? "is-spinning" : ""}`}>
              <img src="/logo-vinyl.svg" alt="Vinyl" className="disk-image" />
              {playingAlbum && (
                <div>
                  <img src="/vinyl.svg" alt="Vinyl" className="disk-image" />
                  <img src={playingAlbum.coverImage} className="vinyl-label" alt="label" />
                </div>
              )}
            </div>

            <img
              src="/needle.png"
              className={`needle-image ${playingAlbum ? "needle-on" : ""}`}
              alt="needle"
            />
          </div>
        </div>

        <div className="left-section">
          <div className={`fade-wrapper ${playingAlbum ? "out" : "in"}`}>
            {!playingAlbum ? (
              <>
                <h2 className="title">Quick Picks</h2>
                <div className="quick-picks-grid">
                  {quickPicks.map((album) => (
                    <div
                      key={album.id}
                      className="quick-pick-card"
                      onClick={() => handleAlbumSelect(album)}
                    >
                      <img src={album.coverImage} alt={album.title} />
                      <div className="quick-pick-info">
                        <h3>{album.title}</h3>
                        <p>{album.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="player-view">
                <h1 className="playing-title">{playingAlbum.title}</h1>
                <p className="playing-artist">{playingAlbum.artist}</p>

                <div className="player-controls-row">
                  <img
                    src="/note.png" className="note-image" alt="note"
                    onClick={() => setShowOverlay(true)}
                    style={{ cursor: 'pointer' }} />
                  <div className="track-info">
                    <p className="track-name">
                      {playingAlbum.tracks[currentTrackIndex]?.title || "Loading track..."}
                    </p>

                    <div className="progress-bar">
                      <img src="/line.svg" />
                      <div className="progress-fill"></div>
                    </div>


                    <div className="playback-btns">
                      <button onClick={handlePrevTrack}>
                        <img src="/before-track-icon.svg" />
                      </button>
                      <button className="play-btn" onClick={() => player?.togglePlay()}>
                        <img src="/circle.svg" />
                      </button>
                      <button onClick={handleNextTrack}>
                        <img src="/next-track-icon.svg" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="options-section">
            <div className="browse-button">
              <img className="vinyl-img" src="../vinyl-stack.svg" />
              <div>
                <p>browse</p>
                <h2>library</h2>
              </div>
            </div>
            <div className="browse-button">
              <img className="headphones-img" src="../headphones2.svg" />
              <div>
                <p>start</p>
                <h2>shared spin</h2>
              </div>
            </div>
          </div>
          {showOverlay && (
            <div className="detail-overlay" onClick={closeNotes}>
              <div className="modals-container" onClick={(e) => e.stopPropagation()}>

                <div className="detail-modal-note">
                  <button className="close-button-note" onClick={closeNotes}>X</button>
                  <div className="detail-content-note">
                    <h2 className="overlay-title">Notes on {playingAlbum?.tracks[currentTrackIndex]?.title}</h2>
                    <div className="notes-list">
                      {fetchError && <p className="error-text">{fetchError}</p>}
                      {!fetchError && displayNotes.length === 0 && (
                        <p className="empty-text">No notes yet. Be the first!</p>
                      )}
 
                      {displayNotes.map((note) => {
                        const user = getUserById(note.userId);
                        return (
                          <div
                            key={note.id}
                            className={`note-entry ${user?.id === "1" ? "is-me" : ""} ${
                              selectedNote?.id === note.id ? "active-note" : ""
                            }`}
                            onClick={() => setSelectedNote(note)}
                          >
                            <div className="note-body">
                              <p>{note.text.substring(0, 30)}...</p>
                              <span className="note-author">-{user?.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="note-pagination">
                        <button
                          disabled={notePage === 1}
                          onClick={() => setNotePage((prev) => prev - 1)}
                          className="page-arrow"
                        >
                          {"<"}
                        </button>
                        <span className="page-indicator">
                          {notePage} / {totalPages}
                        </span>
                        <button
                          disabled={notePage >= totalPages}
                          onClick={() => setNotePage((prev) => prev + 1)}
                          className="page-arrow"
                        >
                          {">"}
                        </button>
                      </div>
                    )}
                    <div className="add-note-container">
                      <textarea
                        className="note-input"
                        placeholder="My thoughts on the track: ..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                      />
                      <button className="add-button-retro" onClick={onPostNote}>
                        +
                      </button>
                    </div>
                    {noteError && <p className="error-text">{noteError}</p>}
                  </div>
                </div>

                {selectedNote && (
                  <div className="simple-detail-rect">
                    <button className="close-button-detail" onClick={() => { setSelectedNote(null); setIsEditing(false); }}>X</button>

                    <div className="detail-content-note">
                      <h2 className="overlay-title">{isEditing ? "Editing Note" : "Full Note"}</h2>

                      <div className="full-note-scroll">
                        {isEditing ? (
                          <div>
                            <textarea
                              className="note-edit-textarea"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                            />
                            {noteError && <p className="error-text">{noteError}</p>}
                          </div>
                        ) : (
                          <p className="full-note-text">"{selectedNote.text}"</p>
                        )}
                      </div>

                      <div className="full-note-footer">
                        <p>By: {getUserById(selectedNote.userId)?.name}</p>
                        <p>Date: {new Date(selectedNote.createdAt).toLocaleDateString()}</p>

                        {selectedNote.userId === currentUser.id && (
                          <div className="note-actions">
                            {isEditing ? (
                              <>
                                <button className="action-btn save" onClick={handleSaveEdit}>Save</button>
                                <button className="action-btn cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="action-btn edit" onClick={startEditing}>Edit</button>
                                <button className="action-btn delete" onClick={() => handleDeleteNote(selectedNote.id)}>Delete</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}