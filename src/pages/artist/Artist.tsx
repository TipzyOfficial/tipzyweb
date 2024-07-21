import { memo, useContext, useEffect, useState } from "react";
import { LiveArtistType } from "../../lib/bar";
import { fetchNoToken } from "../../lib/serverinfo";
import { UserSessionContext, UserSessionContextType } from "../../lib/UserSessionContext";
import { router } from "../../App";
import { useSearchParams } from "react-router-dom";
import { getCookies, useCallbackRef, useInterval } from "../../lib/utils";
import { Spinner } from "react-bootstrap";
import { Colors, padding, radius, useFdim } from "../../lib/Constants";
import { NotFoundPage } from "../bar/NotFoundPage";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { PlayableType, SongType } from "../../lib/song";
import FlatList from "flatlist-react/lib";
import { PlayableList } from "../../components/Song";
import ToggleTab from "../../components/ToggleTab";
import ExpandHeader from "../../components/ExpandHeader";
import _ from "lodash"
import useWindowDimensions from "../../lib/useWindowDimensions";
import defaultBackground from "../../assets/default_background.png"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ProfileButton from "../../components/ProfileButton";
import TopBar from "../../components/TopBar";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { RequestPlayableModal } from "../../components/RequestSongModal";

export default function Artist() {
    const [searchParams] = useSearchParams();
    const [ready, setReady] = useState(false);
    const usc = useContext(UserSessionContext);
    const artist = usc.artistState.artist;
    const cookies = getCookies();
    const id = searchParams.get("id") ?? (usc.artistState.artist ? usc.artistState.artist.id : cookies.get("artist_session"));
    const [playables, setPlayables] = useState<PlayableType[]>([]);

    const wdim = useWindowDimensions();
    const topBarColor = Colors.background + "bc";

    const minHeaderHeight = wdim.height && wdim.width ? Math.max(wdim.height / 4, 250) : 250;

    const refreshRate = 5000;

    const fdim = useFdim();
    const songDims = fdim ? Math.max(Math.min(fdim / 10, 75), 50) : 50;

    const [topBar, topBarRef] = useCallbackRef<HTMLDivElement>();
    const [topExpand, topExpandRef] = useCallbackRef<HTMLDivElement>();
    const [topContent, topContentRef] = useCallbackRef<HTMLDivElement>();

    const [expand, setExpand] = useState(true);
    let initRQS = undefined;
    try {
        const ret = localStorage.getItem("ret");
        // console.log("ret", ret);
        const parsed = ret ? JSON.parse(atob(ret)) : undefined;
        // console.log("parsed", parsed);
        initRQS = parsed ? parsed.data?.selectedSong : undefined;
        // console.log("initRQS", initRQS);
        if (ret) {
            localStorage.removeItem("ret");
        }
    } catch (e) {
        console.log("Problem loading previous state:", e)
        localStorage.removeItem("ret");
    }

    const [requestedPlayable, setRequestedPlayable] = useState<PlayableType | undefined>(initRQS);
    const [requestVisible, setRequestVisible] = useState(initRQS !== undefined);

    const refreshModified = async () => {
        console.log("refreshing modified")
        await fetchNoToken(`liveartist/set/modified?live_artist_id=${id}`, 'GET').then(r => r.json()).then(json => {
            // console.log(json.d);
            const pdata = json.data;

            if (!artist) return;

            const pl: Map<number, PlayableType> = new Map();
            const pending: number[] = [];

            playables.forEach(e => {
                pl.set(e.id, e);
                if (e.status === "PENDING") pending.push(e.id);
            })

            console.log("Pending before", pending)

            let mods = 0; // # of modifications done

            pdata.forEach((s: any) => {
                const id = s.id;
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
                    id: id,
                    position: s.position,
                    song: song,
                    amountBid: s.total_contributed,
                    minPrice: s.min_price,
                    status: s.status,
                }

                if (pending.includes(p.id)) {
                    console.log("includes pending:", p.status);
                    pending.splice(pending.indexOf(p.id), 1);
                }

                if (JSON.stringify(pl.get(id)) !== JSON.stringify(p)) {
                    mods++;
                    pl.set(id, p);
                }
            });

            console.log("Pending now", pending)

            pending.forEach((e) => {
                const oldP = pl.get(e);
                if (!oldP) return;
                const newP: PlayableType = { ...oldP, status: "ACCEPTED" };
                mods++;
                pl.set(e, newP);
            })

            const playablesArray = new Array<PlayableType>();

            pl.forEach((e) => {
                playablesArray.push(e)
            });

            if (mods !== 0) {
                // console.log("setplayables mods", mods)
                setPlayables(playablesArray);
            }
        });
    }

    useInterval(refreshModified, refreshRate)

    useEffect(() => {
        getCookies().remove("bar_session");

        if (!id) {
            router.navigate("/code");
            return;
        }
        if (usc.artistState.artist && id === usc.artistState.artist.id.toString() && usc.artistState.artist.allowingRequests) {
            fetchArtistInfo(usc, id, false, setPlayables).then(() => {
                setReady(true);
            });
            return;
        }
        fetchArtistInfo(usc, id, false, setPlayables).then(() => setReady(true))
            .catch(e => {
                console.log("error", e)
                usc.artistState.setArtist(undefined)
                setReady(true);
            });
        // allRefresh(true);
    }, []);

    if (ready === false)
        return <LoadingScreen />
    else if (artist === undefined)
        return <NotFoundPage body="We can't find that artist...are you sure you got the right ID?" backPath="/code" />

    const sortByPrice = (a: PlayableType, b: PlayableType) => b.amountBid - a.amountBid
    const listed = playables.filter((e) => (e.status === "LISTED_ALTERED" || e.status === "LISTED")).sort(sortByPrice);
    const pending = playables.filter((e) => e.status === "PENDING").sort(sortByPrice);

    const listedAndPending = pending.concat(listed);

    const accepted = playables.filter((e) => e.status === "ACCEPTED").sort(sortByPrice);
    const rejected = playables.filter((e) => e.status === "REJECTED" || e.status === "REFUNDED").sort(sortByPrice);


    // const heightOffset = (header?.clientHeight ?? 0) + (topBar?.clientHeight ?? 0);

    return (
        <DisplayOrLoading condition={ready} loadingScreen={<LoadingScreen />}>
            <>
                <div className="App-body-top" style={artist.allowingRequests ? undefined : { overflow: 'hidden', height: "100%", position: 'fixed' }}>
                    <DisableRequests show={!artist.allowingRequests} artist={artist} />

                    <div ref={topBarRef}
                        style={{
                            flex: 1, alignSelf: "stretch", display: "flex", alignItems: 'center', backgroundColor: topBarColor, position: 'fixed', top: 0, zIndex: 20, width: "100%",
                            WebkitBackdropFilter: 'blur(5px)',
                            backdropFilter: 'blur(5px)',
                        }}>
                        <TopBar />
                    </div>
                    <div
                        style={{
                            width: '100%', minHeight: minHeaderHeight,
                            objectFit: 'cover', backgroundImage: (artist.image_url && artist.image_url.length > 0) ? `url(${artist.image_url})` : `url(${defaultBackground})`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "cover",
                            display: "flex",
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            backgroundColor: "#000",
                            boxShadow: 'inset 0px -30vh 30vh rgba(23, 23, 30, 0.7)',
                        }}

                    >
                        <div style={{ height: topBar?.clientHeight ? topBar.clientHeight : 0 }}></div>
                        <div style={{ paddingBottom: padding / 2, paddingTop: padding * 2, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <span className='App-title' style={{ flex: 7, width: '100%', textAlign: 'center' }}>{artist.name}</span>
                        </div>
                    </div>
                    <div style={{ width: "100%", paddingLeft: padding, paddingRight: padding }}>
                        <span className="App-tertiarytoggle">Next up:</span>
                    </div>
                    <div style={{ width: "100%", position: "sticky", top: topBar?.clientHeight, zIndex: 4 }} ref={topExpandRef}>
                        <ExpandHeader zI={4} height={(topBar?.clientHeight ?? 0)} text={`Sent to ${artist.name}`} onClick={() => {
                            // topExpand?.scrollIntoView(true)
                            setExpand(!expand);
                            if (expand)
                                window.scrollTo({ top: (topContent?.offsetTop ?? 0) - (topBar?.clientHeight ?? 0) - (topExpand?.clientHeight ?? 0) })
                            console.log(topContent?.offsetTop);
                        }} expanded={expand} />
                    </div>
                    <div ref={topContentRef} style={{ width: '100%' }}>
                        <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                            {expand ?
                                <PlayableListMemo playables={pending} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />
                                : <></>}
                        </div>
                    </div>
                    <ExpandHeader zI={4} height={(topExpand?.clientHeight ?? 0) + (topBar?.clientHeight ?? 0)} text="Hot Right Now" initialValue={true} scrollToPosition>
                        <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                            <PlayableListMemo playables={listed} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />
                        </div>
                    </ExpandHeader>
                    <ExpandHeader zI={4} height={(topExpand?.clientHeight ?? 0) * 2 + (topBar?.clientHeight ?? 0)} text="Already Played" scrollToPosition>
                        <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                            <PlayableListMemo playables={accepted} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />
                        </div>
                    </ExpandHeader>
                    <ExpandHeader zI={4} height={(topExpand?.clientHeight ?? 0) * 3 + (topBar?.clientHeight ?? 0)} text="Refunded Songs" scrollToPosition>
                        <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                            <PlayableListMemo playables={rejected} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />
                        </div>
                    </ExpandHeader>
                </div>
                <RQPMmemo playable={requestedPlayable} show={requestVisible} handleClose={() => setRequestVisible(false)} data={undefined} refreshRequests={refreshModified} />
            </>
        </DisplayOrLoading>

    );
}

const PlayableListMemo = memo(PlayableList)
const RQPMmemo = memo(RequestPlayableModal, (o, n) => (o.show === n.show))


const LoadingScreen = () =>
    <div className="App-header">
        <Spinner style={{ color: Colors.primaryRegular, width: 75, height: 75 }} />
        <br></br>
        <span>Loading artist information...</span>
    </div>;

export const fetchArtistInfo = async (userContext: UserSessionContextType, id: number, noSetArtist: boolean, setPlayables?: (p: PlayableType[]) => void) => {
    const artist: LiveArtistType | undefined = await fetchNoToken(`tipper/liveartist/${id}`, 'GET').then(r => r.json())
        .then(json => {
            const pdata = json.playables;

            const playables: PlayableType[] = []

            if (setPlayables)
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
                allowingRequests: json.allowing_requests,
                instagramUrl: json.artist_instagram_url,
                spotifyUrl: json.artist_spotify_url,
                description: json.description,
                image_url: json.image_url,
                minPrice: json.min_price,
                // playables: playables,
            }
            if (!noSetArtist)
                userContext.artistState.setArtist(a);
            if (setPlayables) setPlayables(playables);

            return a;
        }).catch((e: Error) => {
            console.log("Error loading your artist: " + e.message);
            return undefined;
        })

    if (!artist) {
        if (!noSetArtist)
            userContext.artistState.setArtist(artist)
        return undefined;
    }
    return artist;
}


const DisableRequests = (props: { show: boolean, artist: LiveArtistType }) => {
    return (
        props.show ?
            <div className="App-bluroverlay">
                <span className="App-subtitle" style={{ color: Colors.primaryRegular, }}>{"Sorry!"}</span>
                <span className="App-normaltext" style={{ textAlign: 'center', padding: padding }}>{props.artist.name} isn't live at the moment.</span>
                <div style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: padding, borderRadius: radius, borderWidth: 1, borderColor: Colors.primaryRegular, borderStyle: "solid", }} onClick={() => {
                    router.navigate("/code");
                }}>
                    <FontAwesomeIcon color={Colors.primaryRegular} icon={faArrowLeft}></FontAwesomeIcon>
                    <span className="App-normaltext" style={{ color: Colors.primaryRegular, fontWeight: 'bold', paddingLeft: 5 }}>Back to search</span>
                </div>
            </div> : <></>
    )
}