import { Router } from "express";
import { NoteCreateSchema, NoteUpdateSchema, createNote } from "../models/note.js";
import {
    getAllNotes, getNoteById, addNote, updateNote, deleteNote
} from "../store/noteStore.js";


export const noteRouter = Router();

function formatErrors(error) {
    const issues = error.issues ?? [];
    return issues.map((e) => `${e.path.join(".")}: ${e.message}`);
}

noteRouter.get("/stats", (req, res) => {
    const notes = getAllNotes();
    if (notes.length === 0) {
        return res.json({
            totalNotes: 0,
            notesPerTrack: {},
            notesPerAlbum: {},
            notesPerUser: {},
            avgNoteLength: 0,
            mostActiveTrack: null,
            mostActiveAlbum: null,
        })
    }

    const notesPerTrack = {};
    const notesPerAlbum = {};
    const notesPerUser = {};
    let totalLength = 0;

    for (const note of notes) {
        notesPerTrack[note.trackId] = (notesPerTrack[note.trackId] ?? 0) + 1;
        notesPerAlbum[note.albumId] = (notesPerAlbum[note.albumId] ?? 0) + 1;
        notesPerUser[note.userId] = (notesPerUser[note.userId] ?? 0) + 1;
        totalLength += note.text.length;
    }

    const mostActiveTrack = Object.entries(notesPerTrack).sort((a, b) => b[1] - a[1])[0][0];
    const mostActiveAlbum = Object.entries(notesPerAlbum).sort((a, b) => b[1] - a[1])[0][0];

    res.json({
        totalNotes: notes.length,
        notesPerTrack,
        notesPerAlbum,
        notesPerUser,
        avgNoteLength: parseFloat((totalLength / notes.length).toFixed(2)),
        mostActiveTrack,
        mostActiveAlbum,
    });
});

noteRouter.get("/", (req, res) => {
    const rawPage = req.query.page;
    const rawPageSize = req.query.pageSize;
    const page = rawPage !== undefined ? Number(rawPage) : 1;
    const pageSize = rawPageSize !== undefined ? Number(rawPageSize) : 10;

    if (!Number.isInteger(page) || page < 1) {
        return res.status(422).json({ errors: ["page must be an integer >= 1"] });
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
        return res.status(422).json({ errors: ["pageSize must be an integer between 1 and 100"] });
    }

    const { trackId, albumId, userId } = req.query;

    let notes = getAllNotes();

    if (trackId) notes = notes.filter((n) => n.trackId === trackId);
    if (albumId) notes = notes.filter((n) => n.albumId === albumId);
    if (userId) notes = notes.filter((n) => n.userId === userId);

    const total = notes.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const items = notes.slice(start, start + pageSize);

    res.json({ items, total, page, pageSize, totalPages });
});

noteRouter.get("/:id", (req, res) => {
  const note = getNoteById(req.params.id);
  if (!note) {
    return res.status(404).json({ error: `Note '${req.params.id}' not found` });
  }
  res.json(note);
});

noteRouter.post("/", (req, res) => {
  console.log(req.body);
  const result = NoteCreateSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(422).json({ errors: formatErrors(result.error) });
  }
 
  const note = createNote(result.data);
  addNote(note);
 
  res.status(201).json(note);
});

noteRouter.put("/:id", (req, res) => {
  const { requesting_user_id } = req.query;
 
  if (!requesting_user_id) {
    return res.status(422).json({ errors: ["requesting_user_id query param is required"] });
  }
 
  const existing = getNoteById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: `Note '${req.params.id}' not found` });
  }
 
  if (existing.userId !== requesting_user_id) {
    return res.status(403).json({ error: "You can only edit your own notes" });
  }
 
  const result = NoteUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ errors: formatErrors(result.error) });
  }
 
  const updated = updateNote(req.params.id, { text: result.data.text });
  res.json(updated);
});

noteRouter.delete("/:id", (req, res) => {
  const { requesting_user_id } = req.query;
 
  if (!requesting_user_id) {
    return res.status(422).json({ errors: ["requesting_user_id query param is required"] });
  }
 
  const existing = getNoteById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: `Note '${req.params.id}' not found` });
  }
 
  if (existing.userId !== requesting_user_id) {
    return res.status(403).json({ error: "You can only delete your own notes" });
  }
 
  deleteNote(req.params.id);
  res.status(204).send();
});
