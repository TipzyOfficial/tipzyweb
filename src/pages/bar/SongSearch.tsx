/**
 * I've included some constants and functions that I think will help you out below
 * and explanations for what they do. You obviously don't need to use all of them
 * if you don't need to but you will need to use some of them.
 * 
 * As always, if you have any questions message me. Good luck!
 */

import { memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import { UserSessionContext } from "../../lib/UserSessionContext";
import useWindowDimensions from "../../lib/useWindowDimensions";
import { router } from "../../App";
import { SongType } from "../../lib/song";
import { fetchWithToken } from "../..";
import { isAndroid } from 'react-device-detect';


/**
 * Custom button I made. Good for if you want a quick button without worrying about
 * formatting. Here's an example implementation:
 * <TZButton title={"TITLE_STRING"} onClick={SOME_FUNCTION}/>
 * there are other optional parameters you can check out in components/TZButton.tsx
 */
import TZButton from "../../components/TZButton";

/**
 * This is the library I use to display lists. You don't have to use this if you
 * don't want to; I use it because it mimics React Native's FlatList component.
 * I would highly reccomend using it as opposed to manually appending items
 * since it only renders items that are visible on the screen, saving time. There
 * are other libraries out there that also do this though. I have an
 * implementation of this specifically with Songs in pages/bar/bar.tsx if you 
 * want an example. Here's the docs: https://github.com/beforesemicolon/flatlist-react
 */
import FlatList from "flatlist-react/lib";

/**
 * The Song component displays a SongType object. Here's how it's implemented:
 * <Song song={SONG_VARIABLE_HERE} dims={DIMENSIONS}/>
 * dims is completely optional, it will default to a certain size if you don't
 * put anything. you can check out the code in components/Song.tsx
 */
import Song, { SongList, SongRenderItem } from "../../components/Song";
import { Colors, padding } from "../../lib/Constants";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SongType[]>(userContext.barState.bar ? userContext.barState.bar.topSongs ?? [] : []);
    const window = useWindowDimensions();
    const fdim = window.height && window.width ? Math.min(window.height*0.9, window.width) : 1000;
    const songDims = fdim ? Math.max(Math.min(fdim/10, 75), 50) : 50;
    const limit = 50;
    const timeoutInterval = 100;
    const androidTimeout = 100;
    const [androidStupid, setAndroidStupid] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    const defaultResults = () => {
        if(!userContext.barState.bar) {
            router.navigate("/code");
            throw new Error("no bar")
        }
        console.log("ts", userContext.barState.bar.topSongs);
        return(userContext.barState.bar.topSongs ?? []);
    }

    /**
     * searches for songs related to a certain query.
     * @param query the query of a search. could be anything
     * @param limit the max amount of results to return
     * @returns the array of songs matching the query. since it's an async function, it returns a promise.
     */
    async function searchForSongs(query: string, limit: number): Promise<SongType[]>{
        //this function calls the backend to get the search results for a query.        

        console.log("query", query);

        if(query.length === 0) {
            return defaultResults();
        }
        const json = await fetchWithToken(user, `tipper/spotify/search/?limit=${limit}&string=${query}&business_id=${bar?.id}`, 'GET').then(r => r.json());
        const songs: SongType[] = [];
        json.data.forEach((item: any) => {
            songs.push({title: item.name ?? "Default", artists: item.artist ?? ["Default"], albumart: item.images[2].url ?? "", albumartbig: item.images[0].url, id: item.id ?? -1, explicit: item.explicit});
        });
        return songs;
    }

    async function getSearchResults(query: string, limit: number){
        const response = await searchForSongs(query, limit).catch((e) => {
            if(e.message === "no bar") return [];
            console.log("can't get response,", e);
            return [];
        });
        setSearchResults(response);
    }

    const SongResultListMemo = memo(SongList);

    useEffect(() => {
        // if(searchQuery === "") setSearchResults(defaultResults());
        // setSearchResults(defaultResults());

        const androidIsDumb = setTimeout(() => {
            console.log("hate android");
            setAndroidStupid(false);
            inputRef.current?.focus();
        }, androidTimeout)

        const delayDebounceFn = setTimeout(() => {
            getSearchResults(searchQuery, limit);
        }, timeoutInterval)

        return () => {
            clearTimeout(delayDebounceFn);
            clearTimeout(androidIsDumb)
        }
    }, [searchQuery])

    return(
        <div className="App-body-top">
            {isAndroid ? (!androidStupid ? <div></div> : <div style={{width: "100%", height: "100%", position: 'fixed', top: 0, display: "flex"}}></div>) : <></>}
            <div style={{padding: padding, width: '100%', flexDirection: 'row', display: 'flex', position: 'sticky', top:0, backgroundColor: Colors.background}}>
                <input 
                    ref={inputRef}
                    className='input' 
                    placeholder="Request a song!" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    onSubmit={() => searchForSongs(searchQuery, limit)}
                    />
                <div style={{display: 'flex', paddingLeft: padding, alignItems:'center', cursor: 'pointer'}} onClick={() => {if(!isAndroid || (isAndroid && !androidStupid)) router.navigate(-1);}}>
                    <span className="text">Cancel</span>
                </div>
            </div>
            <div style={{display: 'flex', flex: 1, flexDirection: 'column', paddingRight: padding, paddingLeft: padding, width: '100%'}}>
                <SongResultListMemo songs={searchResults} dims={songDims}></SongResultListMemo>
            </div>
        </div>
    )
}