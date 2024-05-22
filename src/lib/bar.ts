import { ArtistType, SongType } from "./song";

export type BarType = {
    name: string;
    type: string;
    distance?: string;
    image_url?: string;
    id: number;
    description: string;
    active: boolean
    topArtists?: ArtistType[]
    topSongs?: SongType[]
  }