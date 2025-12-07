export interface Song {
    id: string;
    title: string;
    artist: string;
    album: string;
    year: number;
    page: number;
    characters: string[];
    itunesTrackId: string;
    previewUrl: string;
    albumArt: string;
    spotifyUrl?: string;
}