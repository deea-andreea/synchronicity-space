import { getAllNotes, getNoteById, addNote, updateNote, deleteNote } from '../store/noteStore.js';
import { NoteCreateSchema, NoteUpdateSchema, createNote as createNoteModel } from '../models/note.js';

export const rootValue = {
  notes: ({ trackId, albumId, userId }: any) => {
    let notes = getAllNotes();
    if (trackId) notes = notes.filter(n => n.trackId === trackId);
    if (albumId) notes = notes.filter(n => n.albumId === albumId);
    if (userId) notes = notes.filter(n => n.userId === userId);
    return notes;
  },

  note: ({ id }: { id: string }) => getNoteById(id),

  stats: () => {
    const notes = getAllNotes();
    if (notes.length === 0) return { totalNotes: 0, avgNoteLength: 0 };

    let totalLength = 0;
    const notesPerTrack: Record<string, number> = {};
    const notesPerAlbum: Record<string, number> = {};

    for (const note of notes) {
      notesPerTrack[note.trackId] = (notesPerTrack[note.trackId] ?? 0) + 1;
      notesPerAlbum[note.albumId] = (notesPerAlbum[note.albumId] ?? 0) + 1;
      totalLength += note.text.length;
    }

    const mostActiveTrack = Object.entries(notesPerTrack).sort((a, b) => b[1] - a[1])[0][0];
    const mostActiveAlbum = Object.entries(notesPerAlbum).sort((a, b) => b[1] - a[1])[0][0];

    return {
      totalNotes: notes.length,
      avgNoteLength: parseFloat((totalLength / notes.length).toFixed(2)),
      mostActiveTrack,
      mostActiveAlbum
    };
  },

  createNote: ({ userId, albumId, trackId, text }: any) => {
    const result = NoteCreateSchema.safeParse({ userId, albumId, trackId, text });
    if (!result.success) throw new Error("Validation Failed: " + result.error.message);
    
    const note = createNoteModel(result.data);
    return addNote(note);
  },

  updateNote: ({ id, requesting_user_id, text }: any) => {
    const existing = getNoteById(id);
    if (!existing) throw new Error("Note not found");
    if (existing.userId !== requesting_user_id) throw new Error("Forbidden");

    const result = NoteUpdateSchema.safeParse({ text });
    if (!result.success) throw new Error(result.error.message);

    return updateNote(id, { text: result.data.text });
  },

  deleteNote: ({ id, requesting_user_id }: any) => {
    const existing = getNoteById(id);
    if (!existing || existing.userId !== requesting_user_id) throw new Error("Unauthorized");
    return deleteNote(id);
  }
};