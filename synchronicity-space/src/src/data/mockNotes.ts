import type { Note } from "../models/Note";

export const mockNotes: Note[] = [
  {
    id: "1",
    userId: "2", 
    albumId: "1nG8mArxQsJplIY6w50aQg",
    trackId: "1-1", // Replace with real Spotify track ID if known
    text: "The strings in the intro always give me chills.",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    userId: "3",
    albumId: "1nG8mArxQsJplIY6w50aQg",
    trackId: "1-1",
    text: "Perfect vinyl for a rainy Sunday.",
    createdAt: new Date().toISOString()
  }
];