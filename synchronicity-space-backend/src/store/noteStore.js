const SEED_NOTES = [
  {
    id: "seed-1",
    userId: "2",
    albumId: "1ATL5uqDgopeOnvYm2o0Q3",
    trackId: "1-1",
    text: "Note 1",
    createdAt: "2025-01-01T10:00:00.000Z",
  },
  {
    id: "seed-2",
    userId: "3",
    albumId: "1ATL5uqDgopeOnvYm2o0Q3",
    trackId: "1-1",
    text: "Note 2",
    createdAt: "2025-01-02T14:30:00.000Z",
  },
];

let notes = SEED_NOTES.map((n) => ({ ...n }));

export function getAllNotes() {
    return notes;
}

export function getNoteById(id) {
    return notes.find((n) => n.id === id) ?? null;
}

export function addNote(note) {
    notes.push(note);
    return note;
}

export function updateNote(id, changes) {
    const index = notes.findIndex((n) => n.id === id);
    if (index == -1) return null;
    notes[index] = {...notes[index], ...changes};
    return notes[index];
}

export function deleteNote(id) {
    notes = notes.filter((n) => n.id !== id);
    return true;
}

export function resetStore() {
  notes = SEED_NOTES.map((n) => ({ ...n }));
}