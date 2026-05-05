import { API_BASE_URL } from "../App";

export async function recordListen(userId: string, albumId: string, genre: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/stats/listen`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ 
      userId: String(userId), 
      albumId: String(albumId), 
      genre: String(genre) 
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error("Server Error:", errorBody);
  }
}

export async function recordNote(userId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/stats/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).catch(() => {});
}

export async function fetchStatsSummary(userId: string) {
  const res = await fetch(`${API_BASE_URL}/stats/summary?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}