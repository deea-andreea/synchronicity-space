const ALBUMS = [
    {
        id: "1ATL5uqDgopeOnvYm2o0Q3",
        title: "Montage of Heck: The Home Recordings (Deluxe Soundtrack)",
        artist: "Kurt Cobain",
        genre: "Rock",
        year: 1977,
        coverImage: "/covers/asfalt.png",
        description: "A classic album with rich harmonies and emotional songwriting.",
        tracks: [
            "2NGUHMpXX5dewkZiDZvtJc",
            "4jK6bBO2JbkvvgT7FPj8c5",
            "1-3"
        ]
    },
    {
        id: "2",
        title: "Album 2",
        artist: "Artist 2",
        genre: "Pop",
        year: 1977,
        coverImage: "/covers/asfalt.png",
        description: "A classic album with rich harmonies and emotional songwriting.",
        tracks: [
            "2-1",
            "2-2",
            "2-3"
        ]
    },
    {
        id: "3",
        title: "Asfalt",
        artist: "Luna Amara",
        genre: "Grunge",
        year: 2015,
        coverImage: "/covers/asfalt.png",
        description: "...",
        tracks: [
            "3-1",
            "3-2",
            "3-3"
        ]
    },
    {
        id: "4",
        title: "Album 3",
        artist: "Artist 3",
        genre: "Blues",
        year: 1977,
        coverImage: "/covers/asfalt.png",
        description: "A classic album with rich harmonies and emotional songwriting.",
        tracks: [
            "4-1",
            "4-2",
            "4-3"
        ]
    },
    {
        id: "5",
        title: "Album 4",
        artist: "Artist 4",
        genre: "Rock",
        year: 1977,
        coverImage: "/covers/asfalt.png",
        description: "A classic album with rich harmonies and emotional songwriting.",
        tracks: [
            "5-1",
            "5-2",
            "5-3"
        ]
    },
    {
        id: "6",
        title: "Album 5",
        artist: "Artist 5",
        genre: "Rock",
        year: 1977,
        coverImage: "/covers/asfalt.png",
        description: "A classic album with rich harmonies and emotional songwriting.",
        tracks: [
            "6-1",
            "6-2",
            "6-3"
        ]
    },
    {
        id: "7",
        title: "Album 6",
        artist: "Artist 6",
        genre: "Rock",
        year: 1977,
        coverImage: "/covers/asfalt.png",
        description: "A classic album with rich harmonies and emotional songwriting.",
        tracks: [
            "7-1",
            "7-2",
            "7-3"
        ]
    },
    {
        id: "8",
        title: "Album 7",
        artist: "Artist 7",
        genre: "Rock",
        year: 1977,
        coverImage: "/covers/asfalt.png",
        description: "A classic album with rich harmonies and emotional songwriting.",
        tracks: [
            "8-1",
            "8-2",
            "8-3"
        ]
    }
]

let albums = ALBUMS.map((n) => ({ ...n }));

export function getAllAlbums() {
    return albums;
}

export function getAlbumById(id) {
    return albums.find((n) => n.id === id) ?? null;
}

export function getTracksByAlbumId(albumId) { return tracks.filter(t => t.albumId === albumId); }
