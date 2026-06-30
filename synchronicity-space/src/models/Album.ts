import type { Track } from "./Track";

export interface Album {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  coverImage: string;
  coverURL?: string;
  description: string;
  tracks: Track[];
  Tracks?: Track[];
  status?: 'available' | 'delivering' | 'owned';
}