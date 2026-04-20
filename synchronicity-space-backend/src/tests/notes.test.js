import request from "supertest";
import app from "../app.js";
import { resetStore } from "../store/noteStore.js";

// Reset to seed state before every single test so they never affect each other
beforeEach(() => resetStore());

const VALID_NOTE = {
  userId: "1",
  trackId: "track-abc",
  albumId: "album-xyz",
  text: "Great track, very soothing.",
};

// Helper — creates a note and returns the response body
async function createNote(overrides = {}) {
  const res = await request(app)
    .post("/notes")
    .send({ ...VALID_NOTE, ...overrides });
  expect(res.status).toBe(201);
  return res.body;
}

// Helper — clears all notes including seed data
async function clearAllNotes() {
  const res = await request(app).get("/notes");
  for (const note of res.body.items) {
    await request(app)
      .delete(`/notes/${note.id}`)
      .query({ requesting_user_id: note.userId });
  }
}

// ===========================================================================
// Health check
// ===========================================================================

describe("GET /", () => {
  test("returns 200 and status ok", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ===========================================================================
// CREATE — POST /notes
// ===========================================================================

describe("POST /notes", () => {
  test("creates a note and returns 201", async () => {
    const res = await request(app).post("/notes").send(VALID_NOTE);
    expect(res.status).toBe(201);
  });

  test("response contains all expected fields", async () => {
    const note = await createNote();
    expect(note).toHaveProperty("id");
    expect(note).toHaveProperty("createdAt");
    expect(note.userId).toBe("1");
    expect(note.trackId).toBe("track-abc");
    expect(note.albumId).toBe("album-xyz");
    expect(note.text).toBe("Great track, very soothing.");
  });

  test("each note gets a unique id", async () => {
    const a = await createNote();
    const b = await createNote();
    expect(a.id).not.toBe(b.id);
  });

  test("trims whitespace from text", async () => {
    const note = await createNote({ text: "  Chilling vibes  " });
    expect(note.text).toBe("Chilling vibes");
  });

  test("rejects text shorter than 5 characters → 422", async () => {
    const res = await request(app).post("/notes").send({ ...VALID_NOTE, text: "Hi" });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  test("rejects text longer than 300 characters → 422", async () => {
    const res = await request(app).post("/notes").send({ ...VALID_NOTE, text: "x".repeat(301) });
    expect(res.status).toBe(422);
  });

  test("rejects blank/whitespace-only text → 422", async () => {
    const res = await request(app).post("/notes").send({ ...VALID_NOTE, text: "     " });
    expect(res.status).toBe(422);
  });

  test("rejects missing userId → 422", async () => {
    const { userId, ...payload } = VALID_NOTE;
    const res = await request(app).post("/notes").send(payload);
    expect(res.status).toBe(422);
  });

  test("rejects missing trackId → 422", async () => {
    const { trackId, ...payload } = VALID_NOTE;
    const res = await request(app).post("/notes").send(payload);
    expect(res.status).toBe(422);
  });

  test("rejects missing albumId → 422", async () => {
    const { albumId, ...payload } = VALID_NOTE;
    const res = await request(app).post("/notes").send(payload);
    expect(res.status).toBe(422);
  });

  test("rejects empty userId → 422", async () => {
    const res = await request(app).post("/notes").send({ ...VALID_NOTE, userId: "" });
    expect(res.status).toBe(422);
  });
});

// ===========================================================================
// READ — GET /notes and GET /notes/:id
// ===========================================================================

describe("GET /notes", () => {
  test("returns 200 and paginated shape", async () => {
    const res = await request(app).get("/notes");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("page");
    expect(res.body).toHaveProperty("pageSize");
    expect(res.body).toHaveProperty("totalPages");
  });

  test("seed notes are present on startup", async () => {
    const res = await request(app).get("/notes");
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  test("respects pageSize parameter", async () => {
    for (let i = 0; i < 5; i++) await createNote();
    const res = await request(app).get("/notes?pageSize=3");
    expect(res.body.items.length).toBe(3);
    expect(res.body.pageSize).toBe(3);
  });

  test("page 2 contains different notes than page 1", async () => {
    for (let i = 0; i < 5; i++) await createNote();
    const p1 = await request(app).get("/notes?page=1&pageSize=3");
    const p2 = await request(app).get("/notes?page=2&pageSize=3");
    const ids1 = p1.body.items.map((n) => n.id);
    const ids2 = p2.body.items.map((n) => n.id);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap).toHaveLength(0);
  });

  test("page beyond last returns empty items array", async () => {
    const res = await request(app).get("/notes?page=999&pageSize=10");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  test("page=0 is rejected → 422", async () => {
    const res = await request(app).get("/notes?page=0");
    expect(res.status).toBe(422);
  });

  test("pageSize=0 is rejected → 422", async () => {
    const res = await request(app).get("/notes?pageSize=0");
    expect(res.status).toBe(422);
  });

  test("filters by trackId", async () => {
    await createNote({ trackId: "track-AAA" });
    await createNote({ trackId: "track-BBB" });
    const res = await request(app).get("/notes?trackId=track-AAA");
    expect(res.body.items.every((n) => n.trackId === "track-AAA")).toBe(true);
  });

  test("filters by albumId", async () => {
    await createNote({ albumId: "album-111" });
    const res = await request(app).get("/notes?albumId=album-111");
    expect(res.body.items.every((n) => n.albumId === "album-111")).toBe(true);
  });

  test("filters by userId", async () => {
    await createNote({ userId: "user-77" });
    const res = await request(app).get("/notes?userId=user-77");
    expect(res.body.items.every((n) => n.userId === "user-77")).toBe(true);
  });
});

describe("GET /notes/:id", () => {
  test("returns the correct note by id", async () => {
    const created = await createNote();
    const res = await request(app).get(`/notes/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
    expect(res.body.text).toBe(created.text);
  });

  test("returns 404 for a non-existent id", async () => {
    const res = await request(app).get("/notes/does-not-exist");
    expect(res.status).toBe(404);
  });

  test("404 response contains an error message", async () => {
    const res = await request(app).get("/notes/does-not-exist");
    expect(res.body.error).toMatch(/not found/i);
  });
});

// ===========================================================================
// UPDATE — PUT /notes/:id
// ===========================================================================

describe("PUT /notes/:id", () => {
  test("updates text and returns the updated note", async () => {
    const note = await createNote();
    const res = await request(app)
      .put(`/notes/${note.id}`)
      .query({ requesting_user_id: "1" })
      .send({ text: "Updated thoughts on this track." });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe("Updated thoughts on this track.");
  });

  test("immutable fields are unchanged after update", async () => {
    const note = await createNote();
    const res = await request(app)
      .put(`/notes/${note.id}`)
      .query({ requesting_user_id: "1" })
      .send({ text: "Updated thoughts on this track." });
    expect(res.body.userId).toBe(note.userId);
    expect(res.body.trackId).toBe(note.trackId);
    expect(res.body.albumId).toBe(note.albumId);
    expect(res.body.createdAt).toBe(note.createdAt);
  });

  test("returns 404 for non-existent note", async () => {
    const res = await request(app)
      .put("/notes/does-not-exist")
      .query({ requesting_user_id: "1" })
      .send({ text: "Something valid here." });
    expect(res.status).toBe(404);
  });

  test("returns 403 when a different user tries to edit", async () => {
    const note = await createNote(); // created by userId "1"
    const res = await request(app)
      .put(`/notes/${note.id}`)
      .query({ requesting_user_id: "99" }) // different user
      .send({ text: "Trying to steal this note." });
    expect(res.status).toBe(403);
  });

  test("returns 422 when requesting_user_id is missing", async () => {
    const note = await createNote();
    const res = await request(app)
      .put(`/notes/${note.id}`)
      .send({ text: "Something valid here." });
    expect(res.status).toBe(422);
  });

  test("rejects text shorter than 5 characters → 422", async () => {
    const note = await createNote();
    const res = await request(app)
      .put(`/notes/${note.id}`)
      .query({ requesting_user_id: "1" })
      .send({ text: "Hi" });
    expect(res.status).toBe(422);
  });

  test("rejects blank text → 422", async () => {
    const note = await createNote();
    const res = await request(app)
      .put(`/notes/${note.id}`)
      .query({ requesting_user_id: "1" })
      .send({ text: "   " });
    expect(res.status).toBe(422);
  });

  test("rejects text over 300 characters → 422", async () => {
    const note = await createNote();
    const res = await request(app)
      .put(`/notes/${note.id}`)
      .query({ requesting_user_id: "1" })
      .send({ text: "x".repeat(301) });
    expect(res.status).toBe(422);
  });
});

// ===========================================================================
// DELETE — DELETE /notes/:id
// ===========================================================================

describe("DELETE /notes/:id", () => {
  test("deletes a note and returns 204", async () => {
    const note = await createNote();
    const res = await request(app)
      .delete(`/notes/${note.id}`)
      .query({ requesting_user_id: "1" });
    expect(res.status).toBe(204);
  });

  test("note no longer exists after deletion", async () => {
    const note = await createNote();
    await request(app).delete(`/notes/${note.id}`).query({ requesting_user_id: "1" });
    const res = await request(app).get(`/notes/${note.id}`);
    expect(res.status).toBe(404);
  });

  test("returns 404 for non-existent note", async () => {
    const res = await request(app)
      .delete("/notes/does-not-exist")
      .query({ requesting_user_id: "1" });
    expect(res.status).toBe(404);
  });

  test("returns 403 when a different user tries to delete", async () => {
    const note = await createNote(); // created by userId "1"
    const res = await request(app)
      .delete(`/notes/${note.id}`)
      .query({ requesting_user_id: "99" });
    expect(res.status).toBe(403);
  });

  test("returns 422 when requesting_user_id is missing", async () => {
    const note = await createNote();
    const res = await request(app).delete(`/notes/${note.id}`);
    expect(res.status).toBe(422);
  });

  test("deleting the same note twice returns 404 on the second attempt", async () => {
    const note = await createNote();
    await request(app).delete(`/notes/${note.id}`).query({ requesting_user_id: "1" });
    const res = await request(app)
      .delete(`/notes/${note.id}`)
      .query({ requesting_user_id: "1" });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// STATISTICS — GET /notes/stats
// ===========================================================================

describe("GET /notes/stats", () => {
  test("returns 200", async () => {
    const res = await request(app).get("/notes/stats");
    expect(res.status).toBe(200);
  });

  test("counts total notes correctly", async () => {
    await clearAllNotes();
    await createNote();
    await createNote();
    const res = await request(app).get("/notes/stats");
    expect(res.body.totalNotes).toBe(2);
  });

  test("groups notes per track correctly", async () => {
    await clearAllNotes();
    await createNote({ trackId: "t1" });
    await createNote({ trackId: "t1" });
    await createNote({ trackId: "t2" });
    const res = await request(app).get("/notes/stats");
    expect(res.body.notesPerTrack["t1"]).toBe(2);
    expect(res.body.notesPerTrack["t2"]).toBe(1);
  });

  test("identifies the most active track", async () => {
    await clearAllNotes();
    await createNote({ trackId: "hot-track" });
    await createNote({ trackId: "hot-track" });
    await createNote({ trackId: "hot-track" });
    await createNote({ trackId: "cold-track" });
    const res = await request(app).get("/notes/stats");
    expect(res.body.mostActiveTrack).toBe("hot-track");
  });

  test("calculates average note length correctly", async () => {
    await clearAllNotes();
    await createNote({ text: "Short note." });       // 11 chars
    await createNote({ text: "A longer note text." }); // 19 chars
    const res = await request(app).get("/notes/stats");
    expect(res.body.avgNoteLength).toBe(15);
  });

  test("handles empty store gracefully", async () => {
    await clearAllNotes();
    const res = await request(app).get("/notes/stats");
    expect(res.body.totalNotes).toBe(0);
    expect(res.body.mostActiveTrack).toBeNull();
    expect(res.body.mostActiveAlbum).toBeNull();
    expect(res.body.avgNoteLength).toBe(0);
  });
});