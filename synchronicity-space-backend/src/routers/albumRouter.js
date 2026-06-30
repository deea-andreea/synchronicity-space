import {Router} from "express";
import { getAllAlbums, getAlbumById } from "../store/albumStore.js";
import { Album } from '../models/Album.js';
import { Track } from '../models/Track.js';
import { User } from '../models/User.js';
import { UserAlbum } from '../models/UserAlbum.js';
import { Op } from 'sequelize';
import { isAuthenticated } from '../middleware/authMiddleware.js';

export const albumRouter = Router();

// 1. GET /albums/library (secure) - Get user's library albums
albumRouter.get("/library", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Album,
        include: [{ model: Track, as: 'Tracks' }]
      }]
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.Albums || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching user library" });
  }
});

// 2. POST /albums/library (secure) - Add album to user's library
albumRouter.post("/library", isAuthenticated, async (req, res) => {
  try {
    const { albumId } = req.body;
    if (!albumId) {
      return res.status(400).json({ error: 'albumId is required' });
    }

    const [userAlbum, created] = await UserAlbum.findOrCreate({
      where: { userId: req.user.id, albumId }
    });

    // Fetch the album details to return
    const album = await Album.findByPk(albumId, {
      include: [{ model: Track, as: 'Tracks' }]
    });

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.status(201).json(album);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error adding album to library" });
  }
});

// 3. DELETE /albums/library/:albumId (secure) - Remove album from user's library
albumRouter.delete("/library/:albumId", isAuthenticated, async (req, res) => {
  try {
    const { albumId } = req.params;
    const deleted = await UserAlbum.destroy({
      where: { userId: req.user.id, albumId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Album not found in user library' });
    }

    res.json({ message: 'Album successfully removed from library' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error removing album from library" });
  }
});

// 4. GET /albums - Get all catalog albums (supports pagination & search)
albumRouter.get("/", async (req, res) => {
  try {
    const { limit, offset, search } = req.query;
    const queryOptions = {
      include: [{ model: Track, as: 'Tracks' }],
      order: [['title', 'ASC']]
    };

    if (limit) queryOptions.limit = parseInt(limit, 10);
    if (offset) queryOptions.offset = parseInt(offset, 10);

    if (search) {
      queryOptions.where = {
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { artist: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const albums = await Album.findAll(queryOptions);
    res.json(albums);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error fetching albums" });
  }
});

// 5. GET /albums/:id - Legacy/Single fetch
albumRouter.get("/:id", (req, res) => {
    const album = getAlbumById(req.params.id);
    if (!album) return res.status(404).json({ error: `Album '${req.params.id}' not found` });
    res.json(album);
});