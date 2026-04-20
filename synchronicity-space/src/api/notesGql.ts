import type { Note } from "../models/Note";
import { isOnline, enqueue, getQueue, clearQueue } from "./offlineQueue";

const GQL_URL = "http://localhost:3000/graphql";

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  
  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data;
}

export interface PaginatedNotes {
  items: Note[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const fetchNotes = async (params: {
  trackId?: string;
  albumId?: string;
  page?: number;
  pageSize?: number;
}) => {
  const data = await gql<{ notes: Note[] }>(`
    query GetNotes($trackId: String, $albumId: String) {
      notes(trackId: $trackId, albumId: $albumId) {
        id userId albumId trackId text createdAt
      }
    }
  `, params);

  return {
    items: data.notes,
    total: data.notes.length,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    totalPages: 1
  };
};

export const createNote = async (data: {
  userId: string;
  trackId: string;
  albumId: string;
  text: string;
}): Promise<Note> => {
  if (!isOnline()) {
    const tempId = "fake-" + Date.now();
    enqueue({ type: "CREATE", tempId, data });
    return { id: tempId, ...data, createdAt: new Date().toISOString() };
  }

  const result = await gql<{ createNote: Note }>(`
    mutation CreateNote($userId: String!, $albumId: String!, $trackId: String!, $text: String!) {
      createNote(userId: $userId, albumId: $albumId, trackId: $trackId, text: $text) {
        id userId text createdAt
      }
    }
  `, data);
  return result.createNote;
};

export const updateNote = async (noteId: string, text: string, requestingUserId: string): Promise<Note> => {
  if (!isOnline()) {
    enqueue({ type: "UPDATE", noteId, text, requestingUserId });
    throw new Error("offline");
  }

  const result = await gql<{ updateNote: Note }>(`
    mutation UpdateNote($id: ID!, $requesting_user_id: String!, $text: String!) {
      updateNote(id: $id, requesting_user_id: $requesting_user_id, text: $text) {
        id text userId
      }
    }
  `, { id: noteId, requesting_user_id: requestingUserId, text });
  return result.updateNote;
};

export const deleteNote = async (noteId: string, requestingUserId: string): Promise<void> => {
  await gql(`
    mutation DeleteNote($id: ID!, $requesting_user_id: String!) {
      deleteNote(id: $id, requesting_user_id: $requesting_user_id)
    }
  `, { id: noteId, requesting_user_id: requestingUserId });
};

export const isServerReachable = async () => {
  try {
    const res = await fetch("http://localhost:3000/", { method: "HEAD" });
    return res.ok;
  } catch { return false; }
};

export async function syncOfflineQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  console.log(`🔄 Syncing ${queue.length} operations...`);

  for (const op of queue) {
    try {
      if (op.type === "CREATE") {
        // Calls the GraphQL createNote which sends the mutation
        await createNote(op.data);
        console.log("✅ Sync: Note created");
      } 
      else if (op.type === "UPDATE") {
        // Calls the GraphQL updateNote
        await updateNote(op.noteId, op.text, op.requestingUserId);
        console.log("✅ Sync: Note updated");
      } 
      else if (op.type === "DELETE") {
        // Calls the GraphQL deleteNote
        await deleteNote(op.noteId, op.requestingUserId);
        console.log("✅ Sync: Note deleted");
      }
    } catch (error) {
      // If a specific operation fails (e.g., validation error), 
      // we log it but continue with the rest of the queue
      console.error("❌ Sync: Operation failed", op, error);
    }
  }

  clearQueue();
  console.log("🏁 Sync complete. Queue cleared.");
}