import {Router} from "express";
import { getAllAlbums, getAlbumById } from "../store/albumStore.js";

export const albumRouter = Router();

albumRouter.get("/", (req, res) => {
    res.json(getAllAlbums());
});

albumRouter.get("/:id", (req, res) => {
    const album = getAlbumById(req.params.id);
    if (!album) return res.status(404).json({ error: `Album '${req.params.id}' not found` });
    res.json(album);
});