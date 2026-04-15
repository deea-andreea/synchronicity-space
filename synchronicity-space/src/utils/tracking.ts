import { getCookie, setCookie } from "./cookies";
import type { Album } from "../models/Album";

export const trackListening = (album: Album) => {
  const now = new Date();

  const data = getCookie("listening_history");
  let history = data ? JSON.parse(data) : [];

  history.push({
    id: album.id,
    date: now.toISOString(),
    genre: album.genre,
  });

  history = history.slice(-100);

  setCookie("listening_history", JSON.stringify(history));
};

export const updateNoteCount = (adjustment: number) => {
  const currentTotal = getCookie("notes_count");
  let total = currentTotal ? parseInt(currentTotal) : 0;
  setCookie("notes_count", Math.max(0, total + adjustment).toString());

   if (adjustment > 0) {
    const data = getCookie("notes_history");
    let history = [];
    
    try {
      const parsed = data ? JSON.parse(data) : [];
      history = Array.isArray(parsed) ? parsed : [];
    } catch {
      history = [];
    }

    history.push({
      date: new Date().toISOString(),
    });

    setCookie("notes_history", JSON.stringify(history.slice(-100)));
  }
};