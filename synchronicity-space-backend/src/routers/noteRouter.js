import { Router } from "express";
import { NoteCreateSchema, NoteUpdateSchema} from "../models/Note.js";
import {
  getAllNotes, getNoteById, addNote, updateNote, deleteNote
} from "../store/noteStore.js";
import { Note, User } from "../models/index.js";

export const noteRouter = Router();

function formatErrors(error) {
  const issues = error.issues ?? [];
  return issues.map((e) => `${e.path.join(".")}: ${e.message}`);
}

noteRouter.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { trackId, albumId, userId } = req.query;

  const whereClause = {};
  if (trackId) whereClause.trackId = trackId;
  if (albumId) whereClause.albumId = albumId;
  if (userId) whereClause.userId = userId;

  try {
    const { count, rows } = await Note.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['username'] }]
    });

    res.json({
      items: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

noteRouter.post("/", async (req, res) => {
  const result = NoteCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({ errors: formatErrors(result.error) });
  }

  try {
    const note = await Note.create(result.data);
    const fullNote = await Note.findByPk(note.id, {
      include: [{ model: User, attributes: ['username'] }]
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
})

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


noteRouter.get("/:id", async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id); // ✅ Works!
    if (!note) return res.status(404).json({ error: "Not found" });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

noteRouter.put("/:id", async (req, res) => {
  const { requesting_user_id } = req.query;
  const result = NoteUpdateSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(422).json({ errors: formatErrors(result.error) });
  }

  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.userId !== requesting_user_id) return res.status(403).json({ error: "Unauthorized" });

    await note.update({ text: result.data.text });
    res.json(note);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

noteRouter.delete("/:id", async (req, res) => {
  const { requesting_user_id } = req.query;

  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (note.userId !== requesting_user_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await note.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
