/**
 * I've included some constants and functions that I think will help you out below
 * and explanations for what they do. You obviously don't need to use all of them
 * if you don't need to but you will need to use some of them.
 * 
 * YOUR ASSIGNMENT: create a page that lets a user search for whatever song they want
 * and displays the top results as a list. If the query is empty, display the
 * bar's top songs (see the bar const description)
 * 
 * As always, if you have any questions message me. Good luck!
 */

import { useContext, useEffect, useState } from "react";
import { UserSessionContext } from "../../lib/UserSessionContext";
import useWindowDimensions from "../../lib/useWindowDimensions";
import { router } from "../../App";
import { SongType } from "../../lib/song";
import { fetchWithToken } from "../..";

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
import Song from "../../components/Song";

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
    const [searchResults, setSearchResults] = useState<SongType[]>([])

    /**
     * searches for songs related to a certain query.
     * @param query the query of a search. could be anything
     * @param limit the max amount of results to return
     * @returns the array of songs matching the query. since it's an async function, it returns a promise.
     */
    async function searchForSongs(query: string, limit: number): Promise<SongType[]>{
        //this function calls the backend to get the search results for a query.
        const json = await fetchWithToken(user, `tipper/spotify/search/?limit=${limit}&string=${query}&business_id=${bar?.id}`, 'GET').then(r => r.json());
        const songs: SongType[] = [];
        json.data.forEach((item: any) => {
            songs.push({title: item.name ?? "Default", artists: item.artist ?? ["Default"], albumart: item.images[2].url ?? "", albumartbig: item.images[0].url, id: item.id ?? -1, explicit: item.explicit});
        });
        return songs;
    }

    async function exampleSearch(){
        //here's one way to use the search function.
        searchForSongs("Radiohead", 10)
        .then((songs) => {
            console.log("Radiohead search results: ", songs);
        })
        .catch(() => []);
    
        //here's another way (it only works when inside an async function, but it's cleaner)
        const songs = await searchForSongs("DJ Khaled", 10).catch(() => []);
        console.log("DJ Khaled search results: ", songs);

        /**
         * note: i add the .catch(() => []) at the end so that instead of giving
         * an error if the search went wrong it just returns an empty result.
         * feel free to put something else in the catch statement.
         */
    }

    /* useEffect calls code every time a component is rerendered. by putting
        the [] as the second argument it only gets called once per page open */
    useEffect(() => {
        exampleSearch();
    }, [])

    return(
        <div className="App-body">
            <TZButton title={"Back to bar page"} onClick={() => router.navigate("/bar")}></TZButton>
        </div>
    )
}