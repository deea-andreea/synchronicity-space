import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Add this for navigation
import type { Album } from "../models/Album";
import "./LibraryPage.css";

interface LibraryProps {
  albums: Album[];
  onRemove: (id: string) => void;
  onPlayAlbum: (album: Album) => void;
}

export default function LibraryPage({ albums, onRemove, onPlayAlbum }: LibraryProps) {

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
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

  const handleRemoveClick = (id: string) => {
    onRemove(id);
    setSelectedAlbum(null);

    if (visibleAlbums.length === 1 && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  console.log(visibleAlbums);

  const navigate = useNavigate();

  const handleStartListening = () => {
    if (selectedAlbum) {
      onPlayAlbum(selectedAlbum); 
      navigate("/home"); 
    }
  };

  return (
    <div className="library-container">
      <img className="library-text" src="/library-text.svg" />

      <div className="master-view">
        <button
          className="nav-arrow left"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          <svg viewBox="0 0 100 100"><polygon points="80,20 20,50 80,80" /></svg>
        </button>

        <div className="album-grid">
          {albums.length === 0 && (
            <p className="empty-msg">Your library is empty. Go to the store!</p>
          )}
          {visibleAlbums.map((album) => (
            <div
              key={album.id}
              className="album-card"
              onClick={() => setSelectedAlbum(album)}
            >
              <div className="album-image">
                <img src="/vinyl.png" className="vinyl-record" alt="vinyl" />
                <img src={album.coverImage} className="album-cover" alt={album.title} />
              </div>
              <div className="album-card-text">
                <h3 >{album.title}</h3>
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

      <Link to="/store" className="button-text get-more-link">
        get more<br />albums!
      </Link>

      {selectedAlbum && (
        <div className="detail-overlay" onClick={() => setSelectedAlbum(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedAlbum(null)}>X</button>

            <div className="detail-content">
              <div className="detail-info">
                <div className="tracklist">
                  <img src="/track-list-text.svg" alt="Track List" />
                  <ul>
                    {selectedAlbum.tracks.map(track => (
                      <li key={track.id}>{track.trackNumber}. {track.title}</li>
                    ))}
                  </ul>
                </div>
                <div className="start-listening">
                  <button className="button-text start-listening" onClick={handleStartListening}>
                    start<br />listening
                  </button>
                  <img src="/headphones.png" alt="Headphones" />
                </div>
                <button
                  className="remove-button"
                  onClick={() => handleRemoveClick(selectedAlbum.id)}
                >
                  Remove from library
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}