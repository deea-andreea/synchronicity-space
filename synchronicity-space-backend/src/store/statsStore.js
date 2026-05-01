let listeningHistory = [];
let noteHistory = [];

export function recordListenEvent(userId, albumId, genre,  date= new Date().toISOString()) {
    listeningHistory.push({
        userId,
        albumId,
        genre,
        date: date
    });
    if (listeningHistory.length > 100) listeningHistory = listeningHistory.slice(-100);
}

export function recordNoteEvent(userId, date = new Date().toISOString()) {
    noteHistory.push({
        userId,
        date: date
    });
    console.log(userId);
    if (noteHistory.length > 100) noteHistory = noteHistory.slice(-100);
}

export function getListeningHistory() { return listeningHistory; }
export function getNoteHistory() { return noteHistory; }

export function resetStatsStore() {
  listeningHistory = [];
  noteHistory = [];
}