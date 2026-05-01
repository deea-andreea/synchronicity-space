const TRACKS = [
{ id: "2NGUHMpXX5dewkZiDZvtJc", albumId: "1ATL5uqDgopeOnvYm2o0Q3", title: "Track 1", trackNumber: 1 },
  { id: "4jK6bBO2JbkvvgT7FPj8c5", albumId: "1ATL5uqDgopeOnvYm2o0Q3", title: "Track 2", trackNumber: 2 },
  { id: "1-3", albumId: "1ATL5uqDgopeOnvYm2o0Q3", title: "Track 3", trackNumber: 3 },
  { id: "2-1", albumId: "2", title: "Track 1", trackNumber: 1 },
  { id: "2-2", albumId: "2", title: "Track 2", trackNumber: 2 },
  { id: "2-3", albumId: "2", title: "Track 3", trackNumber: 3 },
  { id: "3-1", albumId: "3", title: "Oras", trackNumber: 1 },
  { id: "3-2", albumId: "3", title: "Luni de Fiere", trackNumber: 2 },
  { id: "3-3", albumId: "3", title: "Asfalt", trackNumber: 3 },
  { id: "4-1", albumId: "4", title: "Track 1", trackNumber: 1 },
  { id: "4-2", albumId: "4", title: "Track 2", trackNumber: 2 },
  { id: "4-3", albumId: "4", title: "Track 3", trackNumber: 3 },
  { id: "5-1", albumId: "5", title: "Track 1", trackNumber: 1 },
  { id: "5-2", albumId: "5", title: "Track 2", trackNumber: 2 },
  { id: "5-3", albumId: "5", title: "Track 3", trackNumber: 3 },
  { id: "6-1", albumId: "6", title: "Track 1", trackNumber: 1 },
  { id: "6-2", albumId: "6", title: "Track 2", trackNumber: 2 },
  { id: "6-3", albumId: "6", title: "Track 3", trackNumber: 3 },
  { id: "7-1", albumId: "7", title: "Track 1", trackNumber: 1 },
  { id: "7-2", albumId: "7", title: "Track 2", trackNumber: 2 },
  { id: "7-3", albumId: "7", title: "Track 3", trackNumber: 3 },
  { id: "8-1", albumId: "8", title: "Track 1", trackNumber: 1 },
  { id: "8-2", albumId: "8", title: "Track 2", trackNumber: 2 },
  { id: "8-3", albumId: "8", title: "Track 3", trackNumber: 3 },
  { id: "9-1", albumId: "9", title: "Track 1", trackNumber: 1 },
  { id: "9-2", albumId: "9", title: "Track 2", trackNumber: 2 },
  { id: "9-3", albumId: "9", title: "Track 3", trackNumber: 3 },
];

export function getAllTracks() { return tracks; }
export function getTrackById(id) { return tracks.find(t => t.id === id) ?? null; }
export function getTracksByAlbumId(albumId) { return tracks.filter(t => t.albumId === albumId); }

