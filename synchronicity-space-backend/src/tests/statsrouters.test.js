import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

jest.unstable_mockModule('../models/index.js', () => ({
  Note:      { findAll: jest.fn() },
  Listen:    { create: jest.fn(), findAll: jest.fn() },
  sequelize: {
    fn:      jest.fn((name, ...args) => `${name}(${args.join(',')})`),
    literal: jest.fn((s) => s),
    col:     jest.fn((c) => c),
  },
}));

const { Note, Listen } = await import('../models/index.js');
const { statsRouter }  = await import('../routers/statsRouter.js');

const app = express();
app.use(express.json());
app.use('/stats', statsRouter);

const makeDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /stats/listen', () => {

  beforeEach(() => jest.clearAllMocks());

  it('returns 201 when a listen is recorded', async () => {
    Listen.create.mockResolvedValue({});
    const res = await request(app)
      .post('/stats/listen')
      .send({ userId: 'u1', albumId: 'a1', genre: 'Rock' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Listen recorded');
  });

  it('defaults genre to "Unknown" when omitted', async () => {
    Listen.create.mockResolvedValue({});
    await request(app).post('/stats/listen').send({ userId: 'u1', albumId: 'a1' });
    expect(Listen.create).toHaveBeenCalledWith(
      expect.objectContaining({ genre: 'Unknown' })
    );
  });

  it('returns 500 when DB throws', async () => {
    Listen.create.mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/stats/listen').send({ userId: 'u1', albumId: 'a1' });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /stats/summary', () => {

  const mockGenreCounts = [
    { genre: 'Rock',  get: jest.fn(() => '5') },
    { genre: 'Jazz',  get: jest.fn(() => '3') },
  ];

  const mockListens = [
    { listenDate: makeDate(0), albumId: 'a1' },
    { listenDate: makeDate(1), albumId: 'a2' },
  ];

  const mockNotes = [
    { createdAt: makeDate(0) },
    { createdAt: makeDate(2) },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupSuccess = () => {
    Listen.findAll
      .mockResolvedValueOnce(mockGenreCounts)
      .mockResolvedValueOnce(mockListens);
    Note.findAll.mockResolvedValue(mockNotes);
  };

  it('returns 400 when userId is missing', async () => {
    const res = await request(app).get('/stats/summary');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId/i);
  });

  it('returns 200 with topGenres and weekStats', async () => {
    setupSuccess();
    const res = await request(app).get('/stats/summary?userId=u1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('topGenres');
    expect(res.body).toHaveProperty('weekStats');
  });

  it('maps genre counts to integers', async () => {
    setupSuccess();
    const res = await request(app).get('/stats/summary?userId=u1');
    const rock = res.body.topGenres.find(g => g.genre === 'Rock');
    expect(rock.count).toBe(5);
  });

  it('weekStats has an entry for all 7 days', async () => {
    setupSuccess();
    const res = await request(app).get('/stats/summary?userId=u1');
    expect(res.body.weekStats).toHaveLength(7);
    const days = res.body.weekStats.map(s => s.weekday);
    expect(days).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('returns 500 when Listen.findAll rejects on genre query', async () => {
    Listen.findAll.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/stats/summary?userId=u1');
    expect(res.status).toBe(500);
  });
});