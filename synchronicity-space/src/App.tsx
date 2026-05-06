import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LibraryPage from "./pages/LibraryPage";
import StorePage from "./pages/StorePage";
import PresentationPage from "./pages/PresentationPage";
import { mockAlbums } from "./data/mockAlbums"; // Import only once here!
import type { Album } from "./models/Album";
import type { Track } from "./models/Track";
import HomePage from "./pages/HomePage";
import { SpotifyProvider } from "./pages/Spotify";
import StatsPage from "./pages/StatsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ListeningSpacePage from "./pages/ListeningSpacePage";
export const API_BASE_URL = `http://${window.location.hostname}:3000`;
import { getCookie } from "./utils/cookies";



export const playSpotifyAlbum = async (token: string, deviceId: string, albumUri: string) => {
  console.log("Using Token:", token);
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ context_uri: albumUri }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
};

export default function App() {

 const [libraryAlbums, setLibraryAlbums] = useState<Album[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const albRes = await fetch(`${API_BASE_URL}/albums`);
        const albumsFromDb = await albRes.json();
        setLibraryAlbums(albumsFromDb);

        const userRes = await fetch(`${API_BASE_URL}/users`);
        const usersFromDb = await userRes.json();
        
        const activeUser = usersFromDb.find((u: any) => u.id === getCookie("active_user_id")) || usersFromDb[0];
        setCurrentUser(activeUser);
      } catch (err) {
        console.error("Database connection failed:", err);
      }
    };

    loadData();
  }, []);

  const handlePlayAlbum = (album: Album) => {
    setActiveAlbum(album);
  };

  const handleRemove = (id: string) => {
    setLibraryAlbums(prev => prev.filter(a => a.id !== id));
  };



  return (
    // <SpotifyProvider token="BQCh0fSs1LhN4Sy70tJ573EstDSYtCZJAm8Cf8SVO_kbbVWAtwK9w5iWM40HUYFcw-MdBFKQy1St6U5JS6jT8j-4K64wTopP6uC6azIabzCPGN_X8YuodTKBysjF9pblGu2-lelZAyltzqdhkCNhZ1F3GqCKYBozg0qtUNSCE24uKXXwOyhq4sUbWBn7V5VkIL_mAqUnnFwYYTpZauXLngeWOx_QJf5uwLXy8KdM11tRT7CEN64l0M6yzd6-GwtEed_uDvdkcg">
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PresentationPage />} />\
          <Route
            path="library"
            index element={<LibraryPage albums={libraryAlbums} onRemove={handleRemove} onPlayAlbum={handlePlayAlbum} />} />
          {/* <Route
            path="store"
            element={
              <StorePage
                albums={storeAlbums}
                onOrder={handleOrder}
                onUpdateTracks={handleUpdateTracks}
              />
            }
          /> */}
          <Route
            path="home"
            element={
              <HomePage
                albums={libraryAlbums}
                activeAlbum={activeAlbum}
                onPlayAlbum={handlePlayAlbum}
                currentUser={currentUser} />
            } />
          <Route
            path="stats"
            element={
              <StatsPage
              currentUser={currentUser} />
            } />
          <Route
            path="login"
            element={
              <LoginPage />
            }
          />
          <Route
            path="register"
            element={
              <RegisterPage />
            }
          />
          <Route
            path="listening-space"
            element={
              <ListeningSpacePage />
            }
          />

        </Route>
      </Routes>
    </Router>
    // </SpotifyProvider>
  );
}