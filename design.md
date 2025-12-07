# stay-true

## overview
Single interactive page containing all the songs mentioned in Stay True by Hua Hsu. Songs are plotted on a timeline of the book and associated with specific characters.

Users can:
- scrub through the timeline
- play songs
- see associated characters


## tech stack
- React 18+ with Vite
- TypeScript
- HTML5 `<audio>` element
- iTunes Search API for 30-second previews
- storage in static JSON file in `/src/data/songs.json`


## song object schema
```json
{
  "id": "unique-song-id",
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "year": 2025,
  "page": 42,
  "characters": ["Character A", "Character B"],
  "itunesTrackId": "123456789",
  "previewUrl": "https://audio-ssl.itunes.apple.com/...",
  "albumArt": "https://is1-ssl.mzstatic.com/...",
  "spotifyUrl": "https://open.spotify.com/track/..." // optional fallback link
}
```

## notes
- Store both `itunesTrackId` and `previewUrl` for redundancy
- If `previewUrl` breaks, you can regenerate it via iTunes Lookup API using the `trackId`
- Album art should be at least 300x300px for quality display