import { jest } from '@jest/globals';

jest.unstable_mockModule('../database.js', () => ({
  sequelize: { define: jest.fn() }
}));

const { NoteCreateSchema, NoteUpdateSchema }  = await import('../models/note.js');

// ── helpers ──────────────────────────────────────────────────────────────────
const validUUID  = '550e8400-e29b-41d4-a716-446655440000';
const validNote  = { userId: validUUID, trackId: 't1', albumId: 'a1', text: 'A fine note here' };

// ─────────────────────────────────────────────────────────────────────────────
describe('NoteCreateSchema', () => {

  // ── happy-path ──────────────────────────────────────────────────────────────
  describe('valid data', () => {
    it('accepts a fully valid payload', () => {
      const r = NoteCreateSchema.safeParse(validNote);
      expect(r.success).toBe(true);
    });

    it('preserves all fields after parsing', () => {
      const r = NoteCreateSchema.safeParse(validNote);
      expect(r.data).toMatchObject(validNote);
    });

    it('accepts text at minimum length (1 char)', () => {
      const r = NoteCreateSchema.safeParse({ ...validNote, text: 'X' });
      expect(r.success).toBe(true);
    });

    it('accepts text at maximum length (100 chars)', () => {
      const r = NoteCreateSchema.safeParse({ ...validNote, text: 'A'.repeat(100) });
      expect(r.success).toBe(true);
    });
  });

  // ── userId validation ────────────────────────────────────────────────────────
  describe('userId field', () => {
    it('rejects missing userId', () => {
      const { userId, ...rest } = validNote;
      const r = NoteCreateSchema.safeParse(rest);
      expect(r.success).toBe(false);
    });

    it('rejects non-UUID userId', () => {
      const r = NoteCreateSchema.safeParse({ ...validNote, userId: 'not-a-uuid' });
      expect(r.success).toBe(false);
    });

    it('rejects empty userId', () => {
      const r = NoteCreateSchema.safeParse({ ...validNote, userId: '' });
      expect(r.success).toBe(false);
    });
  });

  // ── trackId / albumId ────────────────────────────────────────────────────────
  describe('trackId & albumId fields', () => {
    it('rejects missing trackId', () => {
      const { trackId, ...rest } = validNote;
      expect(NoteCreateSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects missing albumId', () => {
      const { albumId, ...rest } = validNote;
      expect(NoteCreateSchema.safeParse(rest).success).toBe(false);
    });
  });

  // ── text validation ──────────────────────────────────────────────────────────
  describe('text field', () => {
    it('rejects empty text', () => {
      const r = NoteCreateSchema.safeParse({ ...validNote, text: '' });
      expect(r.success).toBe(false);
    });

    it('rejects text longer than 100 characters', () => {
      const r = NoteCreateSchema.safeParse({ ...validNote, text: 'A'.repeat(101) });
      expect(r.success).toBe(false);
    });

    it('rejects missing text', () => {
      const { text, ...rest } = validNote;
      expect(NoteCreateSchema.safeParse(rest).success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('NoteUpdateSchema', () => {

  it('accepts a valid text update', () => {
    const r = NoteUpdateSchema.safeParse({ text: 'Updated note content' });
    expect(r.success).toBe(true);
  });

  it('preserves text value after parsing', () => {
    const r = NoteUpdateSchema.safeParse({ text: 'Hello world' });
    expect(r.data.text).toBe('Hello world');
  });

  it('rejects empty text', () => {
    expect(NoteUpdateSchema.safeParse({ text: '' }).success).toBe(false);
  });

  it('rejects text > 100 characters', () => {
    expect(NoteUpdateSchema.safeParse({ text: 'B'.repeat(101) }).success).toBe(false);
  });

  it('rejects missing text field', () => {
    expect(NoteUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('ignores extra fields (only text matters)', () => {
    const r = NoteUpdateSchema.safeParse({ text: 'Valid text', userId: 'extra' });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('userId');
  });
});