

import type { Note } from "../models/Note";

const BASE_URL = "http://localhost:3000";

export interface PaginatedNotes {
  items: Note[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


export async function fetchNotes(params: {
  trackId?: string;
  albumId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedNotes> {
  const query = new URLSearchParams();
  if (params.trackId) query.set("trackId", params.trackId);
  if (params.albumId) query.set("albumId", params.albumId);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));

  const res = await fetch(`${BASE_URL}/notes?${query}`);

  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}


export async function createNote(data: {
  userId: string;
  trackId: string;
  albumId: string;
  text: string;
}): Promise<Note> {
  console.log(JSON.stringify(data));
  const res = await fetch(`${BASE_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });


  if (!res.ok) {
    const err = await res.json();
    console.log(err);
    throw new Error(err.errors?.join(", ") ?? "Failed to create note");
  }

  return res.json();
}


export async function updateNote(
  noteId: string,
  text: string,
  requestingUserId: string
): Promise<Note> {
  const res = await fetch(
    `${BASE_URL}/notes/${noteId}?requesting_user_id=${requestingUserId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.errors?.join(", ") ?? err.error ?? "Failed to update note");
  }

  return res.json();
}


export async function deleteNote(
  noteId: string,
  requestingUserId: string
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/notes/${noteId}?requesting_user_id=${requestingUserId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to delete note");
  }
}