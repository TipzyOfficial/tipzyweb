import { memo, useContext, useEffect, useState } from "react";
import { LiveArtistType } from "../../lib/bar";
import { fetchNoToken } from "../../lib/serverinfo";
import { UserSessionContext, UserSessionContextType } from "../../lib/UserSessionContext";
import { router } from "../../App";
import { useSearchParams } from "react-router-dom";
import { getCookies, useCallbackRef } from "../../lib/utils";
import { Spinner } from "react-bootstrap";
import { Colors, padding, useFdim } from "../../lib/Constants";
import { NotFoundPage } from "../bar/NotFoundPage";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { PlayableType, SongType } from "../../lib/song";
import FlatList from "flatlist-react/lib";
import { PlayableList } from "../../components/Song";
import ToggleTab from "../../components/ToggleTab";
import ExpandHeader from "../../components/ExpandHeader";

const LoadingScreen = () =>
    <div className="App-header">
        <Spinner style={{ color: Colors.primaryRegular, width: 75, height: 75 }} />
        <br></br>
        <span>Loading artist information...</span>
    </div>;

export const fetchArtistInfo = async (userContext: UserSessionContextType, id: number, noSetBar?: boolean) => {
    const artist: LiveArtistType | undefined = await fetchNoToken(`tipper/liveartist/${id}`, 'GET').then(r => r.json())
        .then(json => {
            const pdata = json.playables;

            // const song: SongType = {
            //     title: e.name,
            //     albumart: e.images?.thumbnail ?? "",
            //     albumartbig: e.images?.teaser ?? "",
            //     id: e.id,
            //     explicit: e.explicit,
            //     artists: e.artists
            // }

            const playables: PlayableType[] = []

            console.log(pdata)

            pdata.forEach((s: any) => {
                const e = s.song_json;
                const song: SongType = {
                    title: e.name,
                    albumart: e.images?.thumbnail ?? "",
                    albumartbig: e.images?.teaser ?? "",
                    id: e.id,
                    explicit: e.explicit,
                    artists: e.artists
                }

                const p: PlayableType = {
                    artistId: s.live_artist,
                    active: s.active,
                    id: s.id,
                    position: s.position,
                    song: song,
                    amountBid: s.total_contributed,
                    minPrice: s.min_price,
                    status: s.status,
                }
                playables.push(p);
            });

            const a: LiveArtistType = {
                id: json.id,
                name: json.title,
                allowingRequests: json.active,
                instagramUrl: json.artist_instagram_url,
                spotifyUrl: json.artist_spotify_url,
                description: json.description,
                image_url: json.image_url,
                minPrice: json.min_price,
                playables: playables,
            }

            userContext.artistState.setArtist(a)
            return a;
        }).catch((e: Error) => {
            console.log("Error loading your artist: " + e.message);
            return undefined;
        })

    if (!artist) {
        userContext.artistState.setArtist(artist)
        return undefined;
    }
    return artist;
}

export default function Artist() {
    const [searchParams] = useSearchParams();
    const [ready, setReady] = useState(false);
    const usc = useContext(UserSessionContext);
    const artist = usc.artistState.artist;
    const cookies = getCookies();
    const id = searchParams.get("id") ?? (usc.artistState.artist ? usc.artistState.artist.id : cookies.get("artist_session"));

    const fdim = useFdim();
    const songDims = fdim ? Math.max(Math.min(fdim / 10, 75), 50) : 50;

    const [topBar, topBarRef] = useCallbackRef<HTMLDivElement>();
    const [expand, setExpand] = useState(true);

    const allRefresh = (indicator: boolean) => {
        // console.log("refreshing data...")
    }

    useEffect(() => {
        if (!id) {
            router.navigate("/code");
            return;
        }
        if (usc.artistState.artist && id === usc.artistState.artist.id.toString() && usc.artistState.artist.allowingRequests) {
            setReady(true);
            fetchArtistInfo(usc, id);
            return;
        }
        fetchArtistInfo(usc, id).then(() => setReady(true))
            .catch(e => {
                console.log("error", e)
                usc.artistState.setArtist(undefined)
                setReady(true);
            });
        allRefresh(true);
    }, [])

    if (ready === false)
        return <LoadingScreen />
    else if (artist === undefined)
        return <NotFoundPage body="We can't find that artist...are you sure you got the right ID?" backPath="./code" />

    const sortByPrice = (a: PlayableType, b: PlayableType) => b.amountBid - a.amountBid
    const listed = artist.playables.filter((e) => (e.status === "LISTED_ALTERED" || e.status === "LISTED")).sort(sortByPrice);
    const pending = artist.playables.filter((e) => e.status === "PENDING").sort(sortByPrice);
    const accepted = artist.playables.filter((e) => e.status === "ACCEPTED").sort(sortByPrice);
    const rejected = artist.playables.filter((e) => e.status === "REJECTED" || e.status === "REFUNDED").sort(sortByPrice);

    return (
        <DisplayOrLoading condition={ready} loadingScreen={<LoadingScreen />}>
            <div className="App-body-top" style={artist.allowingRequests ? undefined : { overflow: 'hidden', height: "100%", position: 'fixed' }}>
                {usc.artistState.artist?.name}
                <div style={{ width: "100%", position: "sticky", top: 0, zIndex: 4 }} ref={topBarRef}>
                    <ExpandHeader zI={4} height={0} text="Hot Right Now" onClick={() => setExpand(!expand)} expanded={expand} />
                </div>
                {expand ?
                    <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                        <PlayableListMemo playables={listed} dims={songDims} />
                    </div> : <></>}
                <ExpandHeader zI={4} height={topBar?.clientHeight ?? 0} text="Sent To Artist">
                    <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                        <PlayableListMemo playables={pending} dims={songDims} />
                    </div>
                </ExpandHeader>
                <ExpandHeader zI={4} height={(topBar?.clientHeight ?? 0) * 2} text="Already Played">
                    <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                        <PlayableListMemo playables={accepted} dims={songDims} />
                    </div>
                </ExpandHeader>
                <ExpandHeader zI={4} height={(topBar?.clientHeight ?? 0) * 3} text="Refunded Songs">
                    <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                        <PlayableListMemo playables={rejected} dims={songDims} />
                    </div>
                </ExpandHeader>
            </div>
        </DisplayOrLoading>

    );
}

const PlayableListMemo = memo(PlayableList)
