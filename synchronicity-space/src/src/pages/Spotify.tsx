import React, { createContext, useContext, useEffect, useState } from 'react';

const SpotifyContext = createContext<any>(null);

export const SpotifyProvider = ({ children, token }: { children: React.ReactNode, token: string }) => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // 1. GUARD: If the player exists or script is already loading, STOP.
    if (player || document.getElementById("spotify-sdk")) return;

    const script = document.createElement("script");
    script.id = "spotify-sdk"; // Mark it so we know it's there
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new (window as any).Spotify.Player({
        name: 'Synchronicity Vinyl Player',
        getOAuthToken: (cb: any) => { cb(token); },
        volume: 0.5
      });

      newPlayer.addListener('ready', ({ device_id }: any) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsActive(true);
      });

      newPlayer.addListener('initialization_error', ({ message }: any) => console.error(message));
      newPlayer.addListener('authentication_error', ({ message }: any) => console.error(message));

      newPlayer.connect().then((success: boolean) => {
        if (success) {
          setPlayer(newPlayer);
        }
      });
    };

    // 2. CLEANUP: If the component unmounts, disconnect the player
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []); // 3. EMPTY ARRAY: Run this exactly ONCE on mount.

  return (
    // Added 'token' to the provider so HomePage can access it easily!
    <SpotifyContext.Provider value={{ player, deviceId, isActive, token }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => useContext(SpotifyContext);