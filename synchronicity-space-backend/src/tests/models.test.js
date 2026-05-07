import { jest } from '@jest/globals';

jest.unstable_mockModule('../database.js', async () => {
  const { Sequelize } = await import('sequelize');

  class NoopConnectionManager {
    initPools() {}
    close() {}
    connect() { return Promise.resolve({}); }
    disconnect() { return Promise.resolve(); }
    validate() { return true; }
    getConnection() { return Promise.resolve({}); }
    releaseConnection() {}
  }

  const seq = new Sequelize('db', 'user', 'pass', {
    dialect: 'mysql',
    logging: false,
  });

  seq.connectionManager = new NoopConnectionManager();

  if (seq.dialect && seq.dialect.connectionManager) {
    seq.dialect.connectionManager = new NoopConnectionManager();
  }

  return { sequelize: seq };
});

import { Note }   from '../models/note.js';
import { User }   from '../models/User.js';
import { Album }  from '../models/Album.js';
import { Track }  from '../models/Track.js';
import { Listen } from '../models/Listen.js';

// ─── Note ────────────────────────────────────────────────────────────────────
describe('Note model definition', () => {
  it('has all required attributes', () => {
    const attrs = Note.rawAttributes;
    ['id','userId','trackId','albumId','text'].forEach(k => expect(attrs).toHaveProperty(k));
  });
  it('marks id as primary key', () => { expect(Note.rawAttributes.id.primaryKey).toBe(true); });
  it('sets text max length to 100', () => {
    const t = Note.rawAttributes.text.type;
    expect(t._length ?? t.options?.length).toBe(100);
  });
  it('enables timestamps', () => { expect(Note.options.timestamps).toBe(true); });
  it('uses table name "Notes"', () => { expect(Note.getTableName()).toBe('Notes'); });
});

// ─── User ────────────────────────────────────────────────────────────────────
describe('User model definition', () => {
  it('has id, username and password', () => {
    ['id','username','password'].forEach(k => expect(User.rawAttributes).toHaveProperty(k));
  });
  it('marks id as primary key', () => { expect(User.rawAttributes.id.primaryKey).toBe(true); });
  it('username max length is 20', () => {
    const t = User.rawAttributes.username.type;
    expect(t._length ?? t.options?.length).toBe(20);
  });
  it('disables timestamps', () => { expect(User.options.timestamps).toBe(false); });
});

// ─── Album ───────────────────────────────────────────────────────────────────
describe('Album model definition', () => {
  it('has id, title, artist, genre, coverURL', () => {
    ['id','title','artist','genre','coverURL'].forEach(k => expect(Album.rawAttributes).toHaveProperty(k));
  });
  it('marks id as primary key', () => { expect(Album.rawAttributes.id.primaryKey).toBe(true); });
  it('disables timestamps', () => { expect(Album.options.timestamps).toBe(false); });
  it('uses table name "Albums"', () => { expect(Album.getTableName()).toBe('Albums'); });
});

// ─── Track ───────────────────────────────────────────────────────────────────
describe('Track model definition', () => {
  it('has id, albumId, title', () => {
    ['id','albumId','title'].forEach(k => expect(Track.rawAttributes).toHaveProperty(k));
  });
  it('marks id as primary key', () => { expect(Track.rawAttributes.id.primaryKey).toBe(true); });
  it('disables timestamps', () => { expect(Track.options.timestamps).toBe(false); });
});

// ─── Listen ──────────────────────────────────────────────────────────────────
describe('Listen model definition', () => {
  it('has userId, albumId, genre, listenDate', () => {
    ['userId','albumId','genre','listenDate'].forEach(k => expect(Listen.rawAttributes).toHaveProperty(k));
  });
  it('listenDate has a default value', () => {
    expect(Listen.rawAttributes.listenDate.defaultValue).toBeDefined();
  });
  it('disables timestamps', () => { expect(Listen.options.timestamps).toBe(false); });
  it('uses table name "Listens"', () => { expect(Listen.getTableName()).toBe('Listens'); });
});