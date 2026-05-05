import type { Note } from "../models/Note";
import { isOnline, enqueue, getQueue, type PendingOperation, clearQueue, dequeueFirst } from "./offlineQueue";
// import { randomUUID } from "crypto";
import { API_BASE_URL } from "../App";

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

  const res = await fetch(`${API_BASE_URL}/notes?${query}`);
  console.log(res);

  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}


export async function createNote(data: {
  userId: string;
  trackId: string;
  albumId: string;
  text: string;
}): Promise<Note> {
  if (!isOnline()) {
    console.log("not online");
    const id = generateTempId();
    enqueue({ type: "CREATE", tempId: id, data });
    console.log(getQueue());
    return { id, ...data, createdAt: new Date().toISOString() };
  }
  try {
    console.log(JSON.stringify(data));
    const res = await fetch(`${API_BASE_URL}/notes`, {
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
  } catch (error) {
    if (error instanceof TypeError) {
      const id = generateTempId();
      enqueue({ type: "CREATE", tempId: id, data });
      console.log(getQueue());
      return {
        id: generateTempId(),
        ...data,
        createdAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}


export async function updateNote(
  noteId: string,
  text: string,
  requestingUserId: string
): Promise<Note> {
  if (!isOnline()) {
    enqueue({ type: "UPDATE", noteId, text, requestingUserId });
    throw Object.assign(new Error("offline"), { offline: true });
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/notes/${noteId}?requesting_user_id=${requestingUserId}`,
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
  } catch (error) {
    enqueue({ type: "UPDATE", noteId, text, requestingUserId });
    throw Object.assign(new Error("offline"), { offline: true });
  }
}


export async function deleteNote(
  noteId: string,
  requestingUserId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/notes/${noteId}?requesting_user_id=${requestingUserId}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to delete note");
  }
}

function generateTempId(): string {
  return "fake-" + getQueue().length;
}

export async function syncOfflineQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  for (const op of queue) {
    try {
      if (op.type === "CREATE") {
        await fetch(`${API_BASE_URL}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.data),
        });
      } else if (op.type === "UPDATE") {
        await fetch(`${API_BASE_URL}/notes/${op.noteId}?requesting_user_id=${op.requestingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: op.text }),
        });
      } else if (op.type === "DELETE") {
        await fetch(`${API_BASE_URL}/notes/${op.noteId}?requesting_user_id=${op.requestingUserId}`, {
          method: "DELETE",
        });
      }
      dequeueFirst();
    } catch (e) {
      console.warn("Sync failed for op, will retry next time:", op);
      return;
    }
  }
}

export async function isServerReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}