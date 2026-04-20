import { getCookie, setCookie } from "./cookies";
import type { Album } from "../models/Album";

export const trackListening = (album: Album) => {
  const now = new Date();

  const data = getCookie("listening_history");
  let history = data ? JSON.parse(data) : [];
  const isAlreadyTracked = history.some((entry: any) => entry.id === album.id);

  if (!isAlreadyTracked) {
    history.push({
      id: album.id,
      date: now.toISOString(),
      genre: album.genre,
    });
    history = history.slice(-100);

    setCookie("listening_history", JSON.stringify(history));
  }
};

export const updateNoteCount = (adjustment: number) => {
  const currentTotal = getCookie("notes_count");
  let total = currentTotal ? parseInt(currentTotal) : 0;
  const newTotal = Math.max(0, total + adjustment);
  setCookie("notes_count", newTotal.toString());

  const data = getCookie("notes_history");
  let history = [];
  try {
    const parsed = data ? JSON.parse(data) : [];
    history = Array.isArray(parsed) ? parsed : [];
  } catch {
    history = [];
  }

  if (adjustment > 0) {
    history.push({ date: new Date().toISOString() });
  } else if (adjustment < 0 && history.length > 0) {
    history.pop();
  }

  setCookie("notes_history", JSON.stringify(history.slice(-100)));
};