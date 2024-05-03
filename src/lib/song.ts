import { BarType } from "./bar";

export type SongType = {
    title: string,
    artists: string[],
    albumart: string,
    albumartbig?: string,
    id: string;
    duration?: number;
    explicit: boolean;
}

export type AlbumType = {
    title: string,
    artists: string[],
    albumart: string,
    id: string,
    year: string,
}

export type ArtistType = {
    name: string,
    image: string,
    id: string,
}

export function songIsEqual(s1: SongType, s2: SongType): boolean {
    return s1.id === s2.id;
}

export function songListIsEqual(s1: SongType[], s2: SongType[]): boolean { 
    if(s1.length !== s2.length) return false;
    for(let i = 0; i < s1.length; i++) {
        if(!songIsEqual(s1[i], s2[i])){
            return false;
        }
    }
    return true;
}

export type SongRequestType = {
    id: number,
    song: SongType,
    bar: BarType,
    tokenCount: number,
    date: Date,
    status: "ACCEPTED" | "REJECTED" | "PENDING" | "CANCELED"
}