const BASE_URL = "http://localhost:3000";

export async function recordListen(userId: string, albumId: string): Promise<void> {
  await fetch(`${BASE_URL}/stats/listen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, albumId }),
  }).catch(() => {}); 
}

export async function recordNote(userId: string): Promise<void> {
  await fetch(`${BASE_URL}/stats/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }).catch(() => {});
}

export async function fetchStatsSummary(userId: string) {
  const res = await fetch(`${BASE_URL}/stats/summary?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}