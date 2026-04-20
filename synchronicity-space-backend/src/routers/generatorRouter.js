import { Router } from "express";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { addNote } from "../store/noteStore.js";

export const generatorRouter = Router();

let broadcast = null;
export function setBroadcast(fct) { broadcast = fct; }

let intervalId = null;

const ALBUMS = [
    { albumId: "1ATL5uqDgopeOnvYm2o0Q3", trackIds: ["1-1", "1-2", "1-3"] },
    { albumId: "2", trackIds: ["1-1", "1-2", "1-3"] },
    { albumId: "3", trackIds: ["2-1", "2-2", "2-3"] },
    { albumId: "4", trackIds: ["3-1", "3-2", "3-3"] }
]

const USER_IDS = ["2", "3", "1"];

generatorRouter.post("/start", (req, res) => {
    if (intervalId) return res.status(409).json({ message: "Already running" });

    intervalId = setInterval(() => {
        const batch = Array.from({ length: 3 }, () => {
            const album = faker.helpers.arrayElement(ALBUMS);
            const trackId = faker.helpers.arrayElement(album.trackIds);

            return {
                id: randomUUID(),
                userId: faker.helpers.arrayElement(USER_IDS),
                trackId,
                albumId: album.albumId,
                text: faker.lorem.sentence().substring(0, 100),
                createdAt: new Date().toISOString()
            };
        })
        batch.forEach(addNote);
        if (broadcast) broadcast({type: "MOCK_NOTES", notes: batch});
    }, 1000);
    res.json({message: "Generator started"});
});

generatorRouter.post("/stop", (req, res) => {
    clearInterval(intervalId);
    intervalId = null;
    res.json({message: "Generator stopped"});
})