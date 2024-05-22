import { ArtistType, SongType } from "./song";

export type BarType = {
    id: number; //bar's ID number in the database
    name: string; //name of bar
    type: string; //type of bar (dive bar, oyster bar, whatever)
    location?: string; //location of bar. ignore
    image_url?: string; //image background of bar
    description: string; //text description of the bar. format is <TIME>///<DAYS OPEN>///<DESCRIPTION>
    active: boolean; //whether the bar is taking requests right now
    topArtists?: ArtistType[] //bar's top artists. 
    topSongs?: SongType[] //bar's top songs.
  }