import { jest } from '@jest/globals';
import request  from 'supertest';
import express  from 'express';

jest.unstable_mockModule('../models/Album.js', () => ({
  Album: { findAll: jest.fn() },
}));
jest.unstable_mockModule('../models/Track.js', () => ({
  Track: {},
}));
jest.unstable_mockModule('../store/albumStore.js', () => ({
  getAllAlbums: jest.fn(),
  getAlbumById: jest.fn(),
}));

const { albumRouter } = await import('../routers/albumRouter.js');
const { Album } = await import('../models/Album.js');
const { getAlbumById } = await import('../store/albumStore.js');

const app = express();
app.use(express.json());
app.use('/albums', albumRouter);

const mockAlbum = { id: 'alb-1', title: 'OK Computer', artist: 'Radiohead', genre: 'Rock', Tracks: [] };

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /albums', () => {

  it('returns 200 with all albums', async () => {
    Album.findAll.mockResolvedValue([mockAlbum]);
    const res = await request(app).get('/albums');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('OK Computer');
  });

  it('returns an empty array when no albums exist', async () => {
    Album.findAll.mockResolvedValue([]);
    const res = await request(app).get('/albums');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /albums/:id', () => {

  it('returns 200 with the album when found', async () => {
    getAlbumById.mockReturnValue(mockAlbum);
    const res = await request(app).get('/albums/alb-1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('alb-1');
  });

  it('returns 404 when album does not exist', async () => {
    getAlbumById.mockReturnValue(undefined);
    const res = await request(app).get('/albums/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nonexistent/);
  });
});