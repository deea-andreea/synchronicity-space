import { useEffect, useState, useRef } from "react";
import type { Album } from "../models/Album";
import { fetchAlbums } from "../api/albumsApi";
import "./StorePage.css";

interface StoreProps {
  onAddToLibrary: (album: Album) => Promise<void>;
  libraryAlbums: Album[];
}

const LIMIT = 8;

export default function StorePage({ onAddToLibrary, libraryAlbums }: StoreProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Use ref to keep track of current query for debounced search comparison
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBatch = async (currentSearch: string, currentOffset: number, isInitial: boolean) => {
    setLoading(true);
    try {
      const data = await fetchAlbums({
        limit: LIMIT,
        offset: currentOffset,
        search: currentSearch || undefined
      });

      if (isInitial) {
        setAlbums(data);
      } else {
        setAlbums(prev => {
          // Filter out any duplicates
          const ids = new Set(prev.map(a => a.id));
          const uniqueNew = data.filter((a: Album) => !ids.has(a.id));
          return [...prev, ...uniqueNew];
        });
      }

      if (data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error("Failed to load store albums:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial fetch or query change
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setOffset(0);
      setHasMore(true);
      fetchBatch(searchQuery, 0, true);
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Load more function
  const loadMore = () => {
    if (loading || !hasMore) return;
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchBatch(searchQuery, newOffset, false);
  };

  // Scroll listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        loadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, offset, searchQuery]);

  const handleLibraryAdd = async () => {
    if (!selectedAlbum) return;
    setIsAdding(true);
    try {
      await onAddToLibrary(selectedAlbum);
    } catch (err) {
      console.error("Failed to add album to library:", err);
      alert("Failed to add album to your library.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="library-container store-container">
      <div className="title-text">Music Store</div>

      <div className="store-search-container">
        <input
          type="text"
          placeholder="Search by album title or artist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="store-search-input"
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
            X
          </button>
        )}
      </div>

      <div className="master-view">
        <div className="album-grid">
          {albums.map((album) => {
            const isOwned = libraryAlbums.some(la => la.id === album.id);
            return (
              <div
                key={album.id}
                className="album-card"
                onClick={() => setSelectedAlbum(album)}
              >
                <div className="album-image">
                  <img src="/vinyl.png" className="vinyl-record" alt="vinyl" />
                  <img src={album.coverURL} className="album-cover" alt={album.title} />
                </div>
                <div className="album-card-text">
                  <h3>{album.title}</h3>
                  <p>{album.artist}</p>
                  {isOwned && <span className="owned-badge">IN LIBRARY</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="store-loading">
          <div className="spinner"></div>
          <p>loading more albums...</p>
        </div>
      )}
      {!hasMore && albums.length > 0 && (
        <p className="store-end-msg">All albums loaded.</p>
      )}
      {albums.length === 0 && !loading && (
        <p className="empty-msg">No albums found in the store matching "{searchQuery}".</p>
      )}

      {selectedAlbum && (
        <div className="detail-overlay" onClick={() => setSelectedAlbum(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedAlbum(null)}>X</button>

            <div className="detail-content">
              <div className="detail-info">
                <div className="tracklist">
                  <img src="/track-list-text.svg" alt="Track List" />
                  <ul>
                    {selectedAlbum.Tracks && selectedAlbum.Tracks.map((track, i) => (
                      <li key={track.id}>{track.trackNumber || (i + 1)}. {track.title}</li>
                    ))}
                    {(!selectedAlbum.Tracks || selectedAlbum.Tracks.length === 0) && (
                      <li>No tracks listed</li>
                    )}
                  </ul>
                </div>
                
                <div className="start-listening">
                  {libraryAlbums.some(la => la.id === selectedAlbum.id) ? (
                    <button className="button-text added-to-library-btn" disabled>
                      already in<br />library
                    </button>
                  ) : (
                    <button 
                      className="button-text start-listening" 
                      onClick={handleLibraryAdd}
                      disabled={isAdding}
                    >
                      {isAdding ? "adding..." : <>add to<br />library</>}
                    </button>
                  )}
                  <img src="/headphones.png" alt="Headphones" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}