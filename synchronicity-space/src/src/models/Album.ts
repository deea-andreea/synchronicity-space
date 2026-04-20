import type { Track } from "./Track";

export interface Album {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  coverImage: string;
  description: string;
  tracks: Track[];
  status?: 'available' | 'delivering' | 'owned';
}