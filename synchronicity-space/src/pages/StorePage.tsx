import { useEffect, useState } from "react";
import type { Album } from "../models/Album";
import type { Track } from "../models/Track";
import "./StorePage.css"; 

interface StoreProps {
  albums: Album[];
  onOrder: (id: string) => void;
  onUpdateTracks: (albumId: string, updatedTracks: Track[]) => void;
}

export default function StorePage({ albums, onOrder, onUpdateTracks }: StoreProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);
  const [albumsPerPage, setAlbumsPerPage] = useState(() => {
  const width = window.innerWidth;
  if (width < 768) return 2;
  if (width < 1200) return 6;
  return 8;
});

useEffect(() => {
  const updateAlbumsPerPage = () => {
    const width = window.innerWidth;
    if (width < 768) {
      setAlbumsPerPage(2);
    } else if (width < 1200) {
      setAlbumsPerPage(6);
    } else {
      setAlbumsPerPage(8);
    }
  };

  window.addEventListener("resize", updateAlbumsPerPage);
  return () => window.removeEventListener("resize", updateAlbumsPerPage);
}, []);

  const totalPages = Math.ceil(albums.length / albumsPerPage);

const visibleAlbums = albums.slice(
  currentPage * albumsPerPage, 
  (currentPage + 1) * albumsPerPage
);

  console.log(visibleAlbums);

    const addTrack = () => {
    const trimmedTitle = newTrackTitle.trim();

    if (trimmedTitle.length < 2) {
        return alert("Track title is too short (min 2 chars).");
    }
    if (trimmedTitle.length > 40) {
        return alert("Track title is too long (max 40 chars).");
    }
    const isDuplicate = selectedAlbum?.tracks.some(
        t => t.title.toLowerCase() === trimmedTitle.toLowerCase()
    );

    if (isDuplicate) {
        setValidationError("This song is already on the tracklist!");
    return;
    }

    if (selectedAlbum) {
        const newTrack: Track = {
        id: `track-${Date.now()}`,
        title: newTrackTitle,
        trackNumber: selectedAlbum.tracks.length + 1
        };
        const updatedTracks = [...selectedAlbum.tracks, newTrack];
        onUpdateTracks(selectedAlbum.id, updatedTracks);
        setSelectedAlbum({ ...selectedAlbum, tracks: updatedTracks });
        setNewTrackTitle("");
    }
    };

  const removeTrack = (trackId: string) => {
    if (selectedAlbum) {
      const updatedTracks = selectedAlbum.tracks
        .filter(t => t.id !== trackId)
        .map((t, i) => ({ ...t, trackNumber: i + 1 }));
      onUpdateTracks(selectedAlbum.id, updatedTracks);
      setSelectedAlbum({ ...selectedAlbum, tracks: updatedTracks });
    }
  };

  return (
    <div className="library-container"> 
      <img className="store-text" src="/store-text.svg"/>

      <div className="master-view">
        <button 
          className="nav-arrow left" 
          disabled={currentPage === 0} 
          onClick={() => setCurrentPage(p => p - 1)}
        >
          <svg viewBox="0 0 100 100"><polygon points="80,20 20,50 80,80" /></svg>
        </button>

        <div className="album-grid">
          {visibleAlbums.map((album) => (
            <div 
              key={album.id} 
              className={`album-card ${album.status === 'delivering' ? 'is-delivering' : ''}`} 
              onClick={() => album.status !== 'delivering' && setSelectedAlbum(album)}
            >
              {album.status === 'delivering' && <div className="delivery-badge">DELIVERING...</div>}
              <div className="album-image">
                <img src="/vinyl.png" className="vinyl-record" alt="vinyl" />
                <img src={album.coverImage} className="album-cover" alt={album.title} />
              </div>
              <div className="album-card-text">
                <h3>{album.title}</h3>
                <p>{album.artist}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="nav-arrow right" 
          disabled={currentPage >= totalPages - 1 || totalPages === 0} 
          onClick={() => setCurrentPage(p => p + 1)}
        >
          <svg viewBox="0 0 100 100"><polygon points="20,20 80,50 20,80" /></svg>
        </button>
      </div>

      {selectedAlbum && (
        <div className="detail-overlay" onClick={() => {setSelectedAlbum(null); setIsEditing(false);}}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => {setSelectedAlbum(null); setIsEditing(false);}}>X</button>
            
            <div className="detail-content">
              <div className="detail-info">
                    <div className="tracklist">
                      <img src="/track-list-text.svg" alt="Track List"/>
                      <ul>
                        {selectedAlbum.tracks.map(track => (
                          <li key={track.id}>{track.trackNumber}. {track.title}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="start-listening">
                      <button className="button-text" onClick={() => {onOrder(selectedAlbum.id); setSelectedAlbum(null);}}>
                        ORDER NOW
                      </button>
                    </div>
                

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}