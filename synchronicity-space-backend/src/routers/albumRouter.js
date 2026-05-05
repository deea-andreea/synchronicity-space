import {Router} from "express";
import { getAllAlbums, getAlbumById } from "../store/albumStore.js";
import { Album } from '../models/Album.js'
import { Track } from '../models/Track.js';

export const albumRouter = Router();

albumRouter.get("/", async (req, res) => {
  const albums = await Album.findAll({
    include: [{ model: Track, as: 'Tracks' }] 
  });
  res.json(albums);
});

albumRouter.get("/:id", (req, res) => {
    const album = getAlbumById(req.params.id);
    if (!album) return res.status(404).json({ error: `Album '${req.params.id}' not found` });
    res.json(album);
});