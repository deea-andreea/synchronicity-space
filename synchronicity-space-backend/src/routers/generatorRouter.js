import { Router } from "express";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { addNote } from "../store/noteStore.js";
import { recordListenEvent, recordNoteEvent } from "../store/statsStore.js";

export const generatorRouter = Router();

let broadcast = null;
export function setBroadcast(fct) { broadcast = fct; }

let intervalId = null;

const ALBUMS = [
    {
        albumId: "1ATL5uqDgopeOnvYm2o0Q3",
        genre: "Rock",
        trackIds: ["1-1", "1-2", "1-3"]
    },
    {
        albumId: "2",
        genre: "Jazz",
        trackIds: ["2-1", "2-2", "2-3"]
    },
    {
        albumId: "3",
        genre: "Hip-Hop",
        trackIds: ["3-1", "3-2", "3-3"]
    },
    {
        albumId: "4",
        genre: "Electronic",
        trackIds: ["4-1", "4-2", "4-3"]
    }
];

const USER_IDS = ["1"];

generatorRouter.post("/start", (req, res) => {
    if (intervalId) return res.status(409).json({ message: "Already running" });

    intervalId = setInterval(() => {
        const batch = Array.from({ length: 2 }, () => {
            const album = faker.helpers.arrayElement(ALBUMS);
            const trackId = faker.helpers.arrayElement(album.trackIds);

            recordListenEvent(
                faker.helpers.arrayElement(USER_IDS),
                album.albumId,
                album.genre,
                faker.date.recent({ days: 7 }).toISOString()
            );

            return {
                id: randomUUID(),
                userId: "1",
                trackId,
                albumId: album.albumId,
                text: faker.lorem.sentence().substring(0, 100),
                createdAt: faker.date.recent({ days: 7 }).toISOString()
            };
        })
        batch.forEach(note => {
    addNote(note, note.createdAt);
    // recordNoteEvent(note.userId, note.createdAt);
});
        if (broadcast) broadcast({type: "MOCK_NOTES", notes: batch});
    }, 1000);
    res.json({message: "Generator started"});
});

generatorRouter.post("/stop", (req, res) => {
    clearInterval(intervalId);
    intervalId = null;
    res.json({message: "Generator stopped"});
})