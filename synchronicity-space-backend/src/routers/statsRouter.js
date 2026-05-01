import { Router } from "express";
import { getAlbumById } from "../store/albumStore.js";
import { getListeningHistory, getNoteHistory, recordListenEvent, recordNoteEvent } from "../store/statsStore.js";

export const statsRouter = Router();

statsRouter.post("/listen", (req, res) => {
    const { userId, albumId } = req.body;
    if (!userId || !albumId) {
        return res.status(422).json({ errors: ["userId and albumId are required"] });
    }

    const album = getAlbumById(albumId);
    if (!album) return res.status(404).json({ error: "Album not found" });

    recordListenEvent(userId, albumId, album.genre);
    res.status(201).json({ message: "Listen event recorded" });
});

statsRouter.post("/note", (req, res) => {
    console.log("posted note")
    const { userId } = req.body;
    if (!userId) return res.status(422).json({ errors: ["userId is required"] });
    // recordNoteEvent(userId);
    res.status(201).json({ message: "Note event recorded" });
});

statsRouter.get("/summary", (req, res) => {
    const { userId } = req.query;
    const listeningHistory = getListeningHistory();
    const noteHistory = getNoteHistory();
    // console.log(noteHistory);

    const userListens = userId
        ? listeningHistory.filter(e => e.userId === userId)
        : listeningHistory;
    const userNotes = userId
        ? noteHistory.filter(e => e.userId === userId)
        : noteHistory;

    const genreCounts = {};
    const seenAlbums = new Set();
    for (const entry of userListens) {
        if (!seenAlbums.has(entry.albumId)) {
            genreCounts[entry.genre] = (genreCounts[entry.genre] ?? 0) + 1;
            seenAlbums.add(entry.albumId);
        }
    }

    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre, count]) => ({ genre, count }));

    const now = new Date();
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const weekStats = days.map(day => ({ weekday: day, albums: 0, hours: 0, notes: 0 }));

    const seenAlbums1 = new Set();
    for (const entry of userListens) {
        if (!seenAlbums1.has(entry.albumId)) {
        const diffDays = (now - new Date(entry.date)) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
            const dayIndex = new Date(entry.date).getDay();
            weekStats[dayIndex].albums += 1;
            weekStats[dayIndex].hours += 0.75;
        }
        seenAlbums1.add(entry.albumId);
    }
    }
    for (const entry of userNotes) {
        const diffDays = (now - new Date(entry.date)) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
            const dayIndex = new Date(entry.date).getDay();
            weekStats[dayIndex].notes += 1;
        }
    }
    res.json({
        totalListens: userListens.length,
        totalNotes: userNotes.length,
        topGenres,
        weekStats,
    });


})

