/**
 * I've included some constants and functions that I think will help you out below
 * and explanations for what they do. You obviously don't need to use all of them
 * if you don't need to but you will need to use some of them.
 * 
 * As always, if you have any questions message me. Good luck!
 */

import { memo, useContext, useEffect, useRef, useState } from "react";
import { UserSessionContext } from "../../lib/UserSessionContext";
import useWindowDimensions from "../../lib/useWindowDimensions";
import { router } from "../../App";
import { ArtistType, SongType } from "../../lib/song";
import { isAndroid } from 'react-device-detect';
import { useLocation } from "react-router-dom";

/**
 * The Song component displays a SongType object. Here's how it's implemented:
 * <Song song={SONG_VARIABLE_HERE} dims={DIMENSIONS}/>
 * dims is completely optional, it will default to a certain size if you don't
 * put anything. you can check out the code in components/Song.tsx
 */
import Song, { SongList, SongRenderItem } from "../../components/Song";
import { Colors, padding, radius } from "../../lib/Constants";
import { fetchNoToken } from "../../lib/serverinfo";
import { getCookies, onlyAlphanumeric, onlyAlphanumericSpaces } from "../../lib/utils";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { Spinner } from "react-bootstrap";
import _, { result } from "lodash"
import { deepEqual } from "assert";

type QueryResultType = {
    recognizability: number,
    song: SongType
}

type QueryResultScoreType = {
    recognizability: number,
    song: SongType,
    score: number,
}

const SongResultListMemo = memo(SongList, (a, b) => JSON.stringify(a.songs) === JSON.stringify(b.songs));

const badWords = new Set([
    "(live",
    "(live)",
    "instrumental",
    "(instrumental",
    "(instrumental)",
    "instrumental)",
    "(cover",
    "(cover)",
    "cover)",
    "(lofi",
    "(lofi)",
    "lofi)",
    "parody",
    "(parody",
    "(parody)",
    "parody)",
    "(by",
    "(acoustic",
    "(acoustic)",
    "(originally"
])

const badArtists = new Set([
    "party song instrumentals",
    "kidz bop kids",
    "kids bop",
    "mini pop kids",
    "rockabye baby!",
    "lofi fruits music",
])

const compareWords = (a: string, b: string) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return onlyAlphanumeric(a) === onlyAlphanumeric(b);
}

const resultScore = (r: QueryResultType, q: string, topArtists: Set<string>) => {
    const artistFactor = 10;
    const titleFactor = 12;
    const topArtistFactor = 10;

    let score = r.recognizability / 20;

    const title = r.song.title.toLowerCase();
    const titleWords = title.split(" ").filter(v => v.length > 0 || v === "-");;

    const query = q.toLowerCase();
    const queryWords = query.split(" ").filter(v => v.length > 0 || v === "-");;

    const artists = new Set(r.song.artists.map(v => v.toLowerCase()));

    for (const artist of artists) {
        if (badArtists.has(artist)) return 0;
        if (topArtists.has(artist)) score += topArtistFactor;
        const artistWords = artist.trim().split(" ").filter(v =>
            v.length > 0
        );
        // console.log(artistWords);

        if (!artistWords[0]) break; //no artist (for some reason?)

        const artistPos = queryWords.indexOf(artistWords[0]); //search query string for that specific artist
        if (artistPos !== -1) {
            let count = 0;
            for (let i = artistPos; i < queryWords.length; i++) { //traverse string to find rest of artist name 
                if (compareWords(artistWords[count], queryWords[i])) {
                    const increase = artistFactor / ((count) * 4 + 1);
                    score += increase;
                    console.log("found", artistWords[count], increase, queryWords);
                    count++;
                } else {
                    break;
                }
            }
            queryWords.splice(artistPos, count);
            console.log("qw", queryWords, count)
        }
    }

    console.log(queryWords);

    let beginningIndex = -1;

    for (let i = 0; i < titleWords.length; i++) {
        //second part gives exceptions to if the bad keyword is EXPLICITLY in the string
        console.log("badword?", titleWords[i], badWords.has(titleWords[i]));

        if (badWords.has(titleWords[i]) && !query.includes(titleWords[i])) return 0;

        if (beginningIndex === -1) {
            if (compareWords(titleWords[0], queryWords[i])) {
                beginningIndex = i;
                score += titleFactor;
            }
        } else {
            if (compareWords(titleWords[i - beginningIndex], queryWords[i])) {
                score += titleFactor + (i - beginningIndex);

                // console.log("word: ", titleWords[i - beginningIndex], i - beginningIndex, titleWords)
            }
        }
    }

    return score;
}

//https://en.wikipedia.org/wiki/List_of_most-streamed_artists_on_Spotify
const WHITELISTED_ARTISTS = new Set([
    "billie eilish",
    "the weeknd",
    "bruno mars",
    "taylor swift",
    "coldplay",
    "rihanna",
    "post malone",
    "lady gaga",
    "sabrina carpenter",
    "david guetta",
    "ariana grande",
    "drake",
    "eminem",
    "justin bieber",
    "calvin harris",
    "dua lipa",
    "kendrick lamar",
    "travis scott",
    "kanye west",
    "ed sheeran",
    "sza",
    "bad bunny",
    "shakira",
    "maroon 5",
    "karol g",
    "lana del rey",
    "marshmello",
    "adele",
    "imagine dragons",
    "katy perry",
    "onerepublic",
    "j balvin",
    "future",
    "beyoncé",
    "miley cyrus",
    "sia",
    "khalid",
    "metro boomin",
    "daddy yankee",
    "hozier",
    "benson boone",
    "sam smith",
    "21 savage",
    "queen",
    "arctic monkeys",
    "doja cat",
    "harry styles",
    "elton john",
    "peso pluma",
    "rauw alejandro",
    "bts",
    "xxxtentacion",
    "olivia rodrigo",
    "nicki minaj",
    "harry styles",
    "cardi b",
])

export default function SongSearch() {
    /**
     * contains all of website's state.
     * this includes user session data, and data about the bar the user is
     * currently in (if applicable)
     */
    const userContext = useContext(UserSessionContext);

    /**
     * the current state of the bar the user is in.
     * bar.id and bar.topSongs may be of use to you.
     * feel free to check out all the other info that BarType has in it under lib/bar.ts
     */
    const bar = userContext.barState.bar;

    /**
     * user session data. when making any calls to the backend you will need to
     * reference this variable (I'll provide an example).
     * feel free to check out all the other info that Consumer has in it under lib/user.ts
     */
    const user = userContext.user;

    /**
     * current dimensions of the window. could be useful for resizing stuff to
     * look nice. totally up to you if you have a better way of doing it--this
     * is just what I found for myself. If you are able to read my spaghetti code
     * in pages/bar/bar.tsx then you can kinda see how I used it.
     * 
     * keep in mind that upon window resize this will rerender your page. so if
     * you aren't using it at all comment it out to reduce potential rerendering
     */
    const windowDims = useWindowDimensions();

    /**
     * searchResults is the current results of your search. initialized to nothing.
     * setSearchResults sets the results of your search and rerenders the page.
     */
    const [searchResults, setSearchResults] = useState<SongType[]>(userContext.barState.bar ? userContext.barState.bar.topSongs ?? [] : []);
    const window = useWindowDimensions();
    const fdim = window.height && window.width ? Math.min(window.height * 0.9, window.width) : 1000;
    const songDims = fdim ? Math.max(Math.min(fdim / 10, 75), 50) : 50;
    const limit = 50;
    const timeoutInterval = 500;
    const androidTimeout = 100;
    const [androidStupid, setAndroidStupid] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const loc = useLocation();
    const [recentQuery, setRecentQuery] = useState(loc.state?.query ?? "");
    const [searchQuery, setSearchQuery] = useState(loc.state?.query ?? "");
    const [searching, setSearching] = useState(false);
    const [suggestion, setSuggestion] = useState<string | undefined>(undefined);
    const [isAiSuggestion, setIsAiSuggestion] = useState(false);

    const barTopArtistSet = new Set((bar?.topArtists?.map(v => v.name) ?? [""]));
    const topArtistSet = new Set([...barTopArtistSet, ...WHITELISTED_ARTISTS])

    // let recentQuery = "";

    const defaultResults = () => {
        if (!userContext.barState.bar) {
            router.navigate("/code");
            throw new Error("no bar")
        }
        return (userContext.barState.bar.topSongs ?? []);
    }

    /**
     * searches for songs related to a certain query.
     * @param query the query of a search. could be anything
     * @param limit the max amount of results to return
     * @returns the array of songs matching the query. since it's an async function, it returns a promise.
     */
    async function searchForSongs(query: string, limit: number, searching?: boolean): Promise<SongType[]> {
        //this function calls the backend to get the search results for a query.   
        if (!bar) return [];

        setSearching(true);

        if (!query || query.trim().length === 0) {
            setSearching(false);
            setRecentQuery(query);
            return defaultResults();
        }

        const b64query = btoa(query);
        console.log("query", b64query)

        const json = await fetchNoToken(`tipper/business/search/?limit=${limit}&string=${b64query}&business_id=${bar.id}`, 'GET').then(r => r.json());

        // console.log(json);

        const results: QueryResultScoreType[] = [];
        //reversing the array since it seems like the explicit songs always appear last in soundtrack?
        const data: any[] = json.data//.reverse();
        const originals: Map<string, number> = new Map();


        for (const item of data) {
            const song =
            {
                title: item.name.trim() ?? "Default",
                artists: item.artist ?? ["Default"],
                albumart: item.images.thumbnail ?? "",
                albumartbig: item.images.teaser,
                id: item.id ?? -1,
                explicit: item.explicit,
                duration: item.duration_ms,
            };

            const songShortened = JSON.stringify({ title: song.title, artists: song.artists, explicit: song.explicit });

            const originalIndex = originals.get(songShortened);

            if (originalIndex === undefined) {
                originals.set(songShortened, results.length);
                console.log(songShortened, originals);

                const score = resultScore({ song: song, recognizability: item.recognizability }, query, topArtistSet)

                // const song2 =
                // {
                //     title: `${item.name} ${score}` ?? "Default",
                //     artists: item.artist ?? ["Default"],
                //     albumart: item.images.thumbnail ?? "",
                //     albumartbig: item.images.teaser,
                //     id: item.id ?? -1,
                //     explicit: item.explicit
                // };

                results.push({ song: song, recognizability: item.recognizability, score: score })

            }
            // else {
            //     // console.log(songShortened, originalIndex, results)
            //     const originalSong = results[originalIndex];
            //     originalSong.song.albumart = item.images.thumbnail ?? "";
            //     originalSong.song.albumartbig = item.images.teaser;
            // }
        }

        results.sort((a, b) => {
            return b.score - a.score;
        });

        // results.filter(a.)

        const songs = results.map(v => v.song);

        setSearching(false);
        setRecentQuery(query);

        return songs;
    }

    async function getSearchResults(query: string, limit: number) {
        const q = query.replace(/["'`]+/gi, "").replace("; ", " ").replace("feat. ", " ")

        //.replace(" - ", "")//.replace(" & ", "");

        const response = await searchForSongs(q, limit).catch((e) => {
            if (e.message === "no bar") return [];
            console.log("can't get response,", e);
            return [];
        });
        setSearchResults(response);
    }

    async function getSuggestion(query: string) {
        if (query.length === 0) { setSuggestion(undefined); return; }
        const b64query = btoa(query);
        const json = await fetchNoToken(`search/autocomplete/?string=${b64query}`).then(r => r.json()).catch((e) => { throw new Error(e) });
        console.log("suggestion json", suggestion)
        if (json.status === 200)
            setSuggestion(json.data);
        else throw new Error("Bad status: ", json);
    }


    useEffect(() => {
        const androidIsDumb = setTimeout(() => {
            setAndroidStupid(false);
            inputRef.current?.focus();
        }, androidTimeout)

        const query = loc.state?.query;

        if (query) {
            getSearchResults(query, limit);
        }

        return () => {
            clearTimeout(androidIsDumb)
        }
    }, []);



    useEffect(() => {
        // if(searchQuery === "") setSearchResults(defaultResults());
        // setSearchResults(defaultResults());

        const delayDebounceFn = setTimeout(() => {
            // if (recentQuery !== searchQuery)
            setSuggestion(undefined);
            getSearchResults(searchQuery, limit);
            if (!isAiSuggestion) {
                getSuggestion(searchQuery);
            } else {
                console.log("setting to false");
                setIsAiSuggestion(false);
            }
        }, timeoutInterval)

        return () => {
            clearTimeout(delayDebounceFn);
        }
    }, [searchQuery])

    return (
        <div className="App-body-top">
            {isAndroid ? (!androidStupid ? <div></div> : <div style={{ width: "100%", height: "100%", position: 'fixed', top: 0, display: "flex" }}></div>) : <></>}
            <div style={{ padding: padding, position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', width: "100%", backgroundColor: Colors.background }}>
                <form style={{ width: '100%', flexDirection: 'row', display: 'flex' }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        getSearchResults(searchQuery, limit);
                    }}
                >
                    <input type="submit"
                        style={{ display: 'none' }}
                    ></input>
                    <input
                        ref={inputRef}
                        className='input'
                        placeholder="Request any song..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); }}
                    // onSubmit={() => searchForSongs(searchQuery, limit)}
                    />
                    <div style={{ display: 'flex', paddingLeft: padding, alignItems: 'center', cursor: 'pointer' }} onClick={() => {
                        if (!isAndroid || (isAndroid && !androidStupid)) router.navigate("/bar");
                    }}>
                        <span className="text">Cancel</span>
                    </div>
                </form>
                {suggestion ?
                    <div style={{ paddingTop: padding }}>
                        <div style={{ padding: padding, borderStyle: 'solid', borderRadius: radius, borderWidth: 1, borderColor: Colors.primaryRegular, cursor: 'pointer', }}
                            onClick={() => { setSearchQuery(suggestion); console.log("setting to true"); setIsAiSuggestion(true) }}>
                            <span>
                                Can't find your result? Try <span style={{ fontWeight: "bold", color: Colors.primaryRegular }}>{suggestion}</span>
                            </span>
                        </div>
                    </div> : <></>
                }
            </div>
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', paddingRight: padding, paddingLeft: padding, width: '100%' }}>
                <DisplayOrLoading condition={!searching} loadingScreen={
                    <div className="App-header">
                        <Spinner style={{ color: Colors.primaryRegular, width: 50, height: 50 }} />
                        <div style={{ padding: padding }} className="App-smalltext">Loading results...</div>
                    </div>
                }>
                    <SongResultListMemo songs={searchResults} dims={songDims} logoutData={{ query: searchQuery }} />
                </DisplayOrLoading>
            </div>
        </div>
    )
}