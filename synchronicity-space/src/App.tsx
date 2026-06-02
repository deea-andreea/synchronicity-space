import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LibraryPage from "./pages/LibraryPage";
import StorePage from "./pages/StorePage";
import PresentationPage from "./pages/PresentationPage";
import { mockAlbums } from "./data/mockAlbums"; 
import type { Album } from "./models/Album";
import type { Track } from "./models/Track";
import HomePage from "./pages/HomePage";
import { SpotifyProvider } from "./pages/Spotify";
import StatsPage from "./pages/StatsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ListeningSpacePage from "./pages/ListeningSpacePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage"; 
import ResetPasswordPage from "./pages/ResetPasswordPage"; 
import { jwtDecode } from "jwt-decode";
import { getCookie } from "./utils/cookies";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { API_BASE_URL } from "./config";

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const albRes = await fetch(`${API_BASE_URL}/albums`);
        const albumsFromDb = await albRes.json();
        setLibraryAlbums(albumsFromDb);

        const savedToken = localStorage.getItem("authToken");

        if (savedToken) {
          try {
            const decodedUser: any = jwtDecode(savedToken);
            if (decodedUser.exp * 1000 > Date.now()) {
              setCurrentUser({
                id: decodedUser.id,
                username: decodedUser.username,
                role: decodedUser.roleName,
                permissions: decodedUser.permissions
              });
              setIsLoading(false);
              return;
            }
          } catch (tokenErr) {
            console.error("Corrupted session token found:", tokenErr);
            localStorage.removeItem("authToken");
          }
        }

        setCurrentUser(null);
      } catch (err) {
        console.error("Database connection failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isLoading || !currentUser) return;

    let inactivityTimer: NodeJS.Timeout;

    const logoutUserDueToInactivity = () => {
      console.log("Session expired due to inactivity.");
      setCurrentUser(null);
      localStorage.removeItem("authToken");
      document.cookie = "active_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      alert("You have been logged out due to inactivity.");
      window.location.href = "/login";
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logoutUserDueToInactivity();
      }, 1 * 60 * 1000);
    };

    window.addEventListener("load", resetInactivityTimer);
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("mousedown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("load", resetInactivityTimer);
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("mousedown", resetInactivityTimer);
      window.removeEventListener("click", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("scroll", resetInactivityTimer);
    };
  }, [currentUser, isLoading]);

  const handlePlayAlbum = (album: Album) => {
    setActiveAlbum(album);
  };

  const handleRemove = (id: string) => {
    setLibraryAlbums(prev => prev.filter(a => a.id !== id));
  };

  const hasFrontendPermission = (permissionName: string) => {
    return currentUser?.permissions?.includes(permissionName);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#121212", color: "#fff" }}>
        <h3>Loading Synchronicity Session...</h3>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<PresentationPage />} />
          
          <Route
            path="library"
            element={
              hasFrontendPermission("view_library") ? (
                <LibraryPage albums={libraryAlbums} onRemove={handleRemove} onPlayAlbum={handlePlayAlbum} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route
            path="home"
            element={
              hasFrontendPermission("play_music") ? (
                <HomePage
                  albums={libraryAlbums}
                  activeAlbum={activeAlbum}
                  onPlayAlbum={handlePlayAlbum}
                  currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route
            path="stats"
            element={
              hasFrontendPermission("view_stats") ? (
                <StatsPage currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          <Route path="login" element={<LoginPage setCurrentUser={setCurrentUser}/>} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />

          <Route
            path="listening-space"
            element={
              hasFrontendPermission("navigate_listening_space") ? (
                <ListeningSpacePage currentUser={currentUser}/>
              ) : (
                <Navigate to="/home" replace /> 
              )
            }
          />

        </Route>
      </Routes>
    </Router>
  );
}