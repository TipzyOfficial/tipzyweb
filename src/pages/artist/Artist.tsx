import { memo, useContext, useEffect, useState } from "react";
import { LiveArtistType } from "../../lib/bar";
import { fetchNoToken } from "../../lib/serverinfo";
import { UserSessionContext, UserSessionContextType } from "../../lib/UserSessionContext";
import { router } from "../../App";
import { useSearchParams } from "react-router-dom";
import { getCookies, shuffleArrayMutate, useCallbackRef, useInterval } from "../../lib/utils";
import { Col, Container, Modal, Row, Spinner } from "react-bootstrap";
import { Colors, padding, radius, useFdim } from "../../lib/Constants";
import { NotFoundPage } from "../bar/NotFoundPage";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { ArtistType, PlayableType, SongRequestType, SongType } from "../../lib/song";
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
import { TZArtistSearchButton } from "../../components/TZSearchButton";
import { fetchWithToken } from "../..";

type SearchModalProps = {
    searchVisible: boolean,
    setSearchVisible: (b: boolean) => void,
    allArtists: string[],
    songDims: number,
    allPending: PlayableType[],
    setRequestedPlayable: (p: PlayableType) => void,
    setRequestVisible: (b: boolean) => void,
}

const SearchModal = (props: SearchModalProps) => {
    const [query, setQuery] = useState("");
    const [input, inputRef] = useCallbackRef<HTMLInputElement>();
    const [disabled, setDisabled] = useState(true);

    return (
        <Modal className="App-modal" show={props.searchVisible} onEntered={() => {
            if (input) input.focus();
            setDisabled(false);
        }} onHide={() => { props.setSearchVisible(false); setDisabled(true); }} data-bs-theme={"dark"} centered>
            <div style={{ paddingBottom: padding }}>
                <div style={{
                    maxHeight: 500, height: "60%", color: "white", paddingLeft: padding, paddingRight: padding, paddingBottom: padding, overflow: 'scroll',
                }} data-bs-theme={"light"}>
                    <div style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: Colors.background, paddingTop: padding, paddingBottom: padding }}>
                        <input placeholder="Search set list..." ref={inputRef} className='input' value={query} onChange={(e) => setQuery(e.target.value)}></input>
                    </div>
                    <div style={{ paddingBottom: padding / 2, cursor: "pointer", display: 'inline-block', width: "100%" }}>
                        {props.allArtists.slice(0, 6).map((data) => {
                            return (
                                <div style={{ display: 'inline-flex', width: "auto", paddingBottom: padding / 2 }}>
                                    <span onClick={() => setQuery(data)} style={{ backgroundColor: "#fff", padding: 7, borderRadius: 20, color: "black", fontWeight: 'bold' }}>{data}</span>
                                    <div style={{ width: padding }}></div>
                                </div>
                            );
                        })}
                    </div>
                    <PlayableListMemo disabled={disabled} playables={props.allPending.filter((v) => {
                        const lowercase = query.toLowerCase();

                        if (v.song.title.substring(0, query.length).toLowerCase() === lowercase) return true;

                        for (const a of v.song.artists) {
                            if (a.substring(0, query.length).toLowerCase() === lowercase) return true;
                        }

                        return false;
                    })} dims={props.songDims} setRequestVisible={props.setRequestVisible} setRequestedPlayable={props.setRequestedPlayable} />
                </div>
            </div>

        </Modal>
    )
}

export default function Artist() {
    const [searchParams] = useSearchParams();
    const [ready, setReady] = useState(false);
    const usc = useContext(UserSessionContext);
    const artist = usc.artistState.artist;
    const cookies = getCookies();
    const id = searchParams.get("id") ?? (usc.artistState.artist ? usc.artistState.artist.id : cookies.get("artist_session"));
    const [playables, setPlayables] = useState<PlayableType[]>([]);
    const [toggle, setToggleIn] = useState(0);
    const wdim = useWindowDimensions();
    const topBarColor = Colors.background + "bc";
    const minHeaderHeight = wdim.height && wdim.width ? Math.max(wdim.height / 4, 250) : 250;
    const refreshRate = 5000;
    const fdim = useFdim();
    const songDims = fdim ? Math.max(Math.min(fdim / 10, 75), 50) : 50;
    const searchDims = fdim ? Math.max(Math.min(fdim / 17, 40), 20) : 20;
    const [topBar, topBarRef] = useCallbackRef<HTMLDivElement>();
    const [searchVisible, setSearchVisible] = useState(false);
    const [allArtists, setAllArtists] = useState<string[]>([]);
    // const [view, setView] = useState(0);
    let initRQS = undefined;

    const setToggle = (n: number) => {
        setToggleIn(n);
    }


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
        console.log("refreshing modified");
        console.log("id", usc.user.id)

        const func = usc.user.access_token ?
            fetchWithToken(usc, `liveartist/set/modified?live_artist_id=${id}`, 'GET') :
            fetchNoToken(`liveartist/set/modified?live_artist_id=${id}`, 'GET');

        const json = await func.then(r => r.json())

        // console.log(json.d);
        console.log("pdata", json);

        const pdata = json.data;

        if (!artist) return;

        const pl: Map<number, PlayableType> = new Map();
        const ids: number[] = [];
        const pendingLocked: number[] = [];

        playables.forEach(e => {
            pl.set(e.id, e);
            ids.push(e.id);
            if (e.status === "PENDING" || e.status === "LOCKED") pendingLocked.push(e.id);
        })

        let mods = 0; // # of modifications done

        for (const s of pdata) {
            if (ids.indexOf(s.id) === -1) {
                setPlayables([]);
                await fetchArtistInfo(usc, id, false, setPlayables, setAllArtists);
                return;
            }
            const e = s.song_json;
            const song: SongType = {
                title: e.name,
                albumart: e.images?.thumbnail ?? "",
                albumartbig: e.images?.teaser ?? "",
                id: e.id,
                explicit: e.explicit,
                artists: e.artists
            }

            // console.log(s);

            const p: PlayableType = {
                artistId: s.live_artist,
                active: s.active,
                id: s.id,
                position: s.position,
                song: song,
                amountBid: s.total_contributed,
                minPrice: s.min_price,
                status: s.status,
                lastModified: new Date(s.last_modified),
                tipperRelevant: s.tipper_relevant,
            }

            if (pendingLocked.includes(p.id)) {
                pendingLocked.splice(pendingLocked.indexOf(p.id), 1);
            }

            if (JSON.stringify(pl.get(s.id)) !== JSON.stringify(p)) {
                mods++;
                pl.set(s.id, p);
            }
        }


        pendingLocked.forEach((e) => {
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

        // if (mods !== 0) {
        // console.log("setplayables mods", mods)
        setPlayables(playablesArray);
        // }
    }

    const setAllArtistArray = () => {
        const artists = new Map<string, number>();
        const aps = playables;

        console.log("aps", aps);

        for (const p of aps) {
            for (const a of p.song.artists) {
                const val = artists.get(a);
                if (val)
                    artists.set(a, val + 1);
                else
                    artists.set(a, 1);
            }
        }

        setAllArtists(Object.entries(artists).sort((a, b) => b[1] - a[1]).map(e => e[0]))
    }

    useInterval(refreshModified, refreshRate)

    useEffect(() => {
        getCookies().remove("bar_session");

        if (!id) {
            router.navigate("/code");
            return;
        }
        if (usc.artistState.artist && id === usc.artistState.artist.id.toString() && usc.artistState.artist.allowingRequests) {
            fetchArtistInfo(usc, id, false, setPlayables, setAllArtists).then(() => {
                setReady(true);
            });
            return;
        }
        fetchArtistInfo(usc, id, false, setPlayables, setAllArtists).then(() => {
            setReady(true);
        })
            .catch(e => {
                console.log("error", e);
                usc.artistState.setArtist(undefined);
                setReady(true);
            });
    }, []);

    if (ready === false)
        return <LoadingScreen />
    else if (artist === undefined)
        return <NotFoundPage body="We can't find that artist...are you sure you got the right ID?" backPath="/code" />

    const sortByPrice = (a: PlayableType, b: PlayableType) => b.amountBid - a.amountBid

    const activePlayables = playables.filter((e) => e.active);
    const lockedin = activePlayables.filter((e) => (e.status === "LOCKED")).sort(sortByPrice);
    const listed = activePlayables.filter((e) => (e.status === "LISTED")).sort(sortByPrice);
    const listedAltered = activePlayables.filter((e) => (e.status === "LISTED_ALTERED")).sort(sortByPrice);
    const tipperRelevant = activePlayables.filter((p) => p.tipperRelevant)

    const allPending = activePlayables.filter((e) => (
        e.status === "LISTED" ||
        e.status === "LISTED_ALTERED" ||
        e.status === "PENDING"
    )).sort(sortByPrice);

    const pending = activePlayables.filter((e) => e.status === "PENDING").sort(sortByPrice);

    const listedAndPending = pending.concat(listedAltered);

    const completed = activePlayables.filter((e) => e.status === "ACCEPTED" || e.status === "REJECTED" || e.status === "REFUNDED").sort(sortByPrice);
    // const rejected = playables.filter((e) => e.status === "REJECTED" || e.status === "REFUNDED").sort(sortByPrice);


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
                    <div style={{ paddingBottom: padding / 2, }}></div>
                    <div style={{
                        position: "sticky", top: topBar?.clientHeight ?? 0,
                        width: "100%", paddingBottom: padding / 2, paddingLeft: padding, paddingRight: padding,
                        backgroundColor: topBarColor,
                        WebkitBackdropFilter: 'blur(5px)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 10,
                    }}>
                        <ToggleTab labels={["Songs", "Requests"]} value={toggle} setValue={setToggle}></ToggleTab>
                        <div style={{ width: "100%", paddingBottom: padding / 2 }} />
                        <TZArtistSearchButton dims={searchDims} onClick={() => { setSearchVisible(true) }} />
                    </div>
                    <div style={{ width: "100%", padding: padding }}>
                        {toggle === 0 ?
                            <>
                                <div style={{ padding: padding / 2, backgroundColor: "#fff2", borderRadius: 5 }}>
                                    <span className="App-montserrat-normaltext" style={{ fontWeight: "bold" }}>Sent to {artist.name}:</span>
                                    <div style={{ paddingBottom: 5 }} />
                                    {lockedin.length > 0 ?
                                        <PlayableListMemo playables={lockedin} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />
                                        :
                                        <div style={{ width: "100%", display: "flex", padding: padding, backgroundColor: "#fff3", borderRadius: radius }}>
                                            <span style={{ textAlign: 'center', width: "100%" }}>No songs yet...be the first to request a song to {artist.name}!</span>
                                        </div>
                                    }
                                </div>
                                <div style={{ paddingTop: padding, paddingBottom: padding / 2 }}>
                                    <span className="App-subtitle">Hot Right Now</span>
                                </div>
                                <PlayableListMemo playables={allPending} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />

                                <div style={{ paddingTop: padding, paddingBottom: padding / 2 }}>
                                    <span className="App-subtitle">Completed Requests</span>
                                </div>
                                <PlayableListMemo playables={completed} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />
                            </>
                            :
                            <>
                                <div style={{ paddingBottom: padding / 2 }}>
                                    <span className="App-subtitle">Your Requests</span>
                                </div>
                                <PlayableListMemo playables={tipperRelevant.sort((a, b) => b.amountBid - a.amountBid)} dims={songDims} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable} />
                            </>
                        }

                    </div>
                </div>
                <SearchModalMemo searchVisible={searchVisible} setSearchVisible={setSearchVisible} setRequestVisible={setRequestVisible} setRequestedPlayable={setRequestedPlayable}
                    allArtists={allArtists} songDims={songDims} allPending={allPending}
                />
                <RQPMmemo playable={requestedPlayable} show={requestVisible} handleClose={() => setRequestVisible(false)} data={undefined} refreshRequests={refreshModified} />
            </>
        </DisplayOrLoading>
    );
}


const PlayableListMemo = memo(PlayableList);
const RQPMmemo = memo(RequestPlayableModal, (o, n) => (o.show === n.show));
const SearchModalMemo = memo(SearchModal);

const LoadingScreen = () =>
    <div className="App-header">
        <Spinner style={{ color: Colors.primaryRegular, width: 75, height: 75 }} />
        <br></br>
        <span>Loading artist information...</span>
    </div>;

export const fetchArtistInfo = async (userContext: UserSessionContextType, id: number, noSetArtist: boolean, setPlayables?: (p: PlayableType[]) => void, setAllArtists?: (a: string[]) => void) => {
    const func = userContext.user.access_token ? fetchWithToken(userContext, `tipper/liveartist/${id}`, 'GET') : fetchNoToken(`tipper/liveartist/${id}`, 'GET');

    const artist: LiveArtistType | undefined = await func.then(r => r.json())
        .then(json => {
            const pdata = json.playables;

            console.log("pdata init", pdata)

            const playables: PlayableType[] = []

            if (setPlayables) {
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
                        lastModified: new Date(s.last_modified),
                        tipperRelevant: s.tipper_relevant,
                    }
                    playables.push(p);
                });

                setPlayables(playables);

                if (setAllArtists) {
                    const artists = new Map<string, number>();
                    const aps = playables;//shuffleArrayMutate(playables).slice(0, 50);

                    for (const p of aps) {
                        for (const a of p.song.artists) {
                            const val = artists.get(a);
                            if (val)
                                artists.set(a, val + 1);
                            else
                                artists.set(a, 1);
                        }
                    }


                    const artistsArray = [...artists.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0])
                    // .sort((a, b) => b[1] - a[1]).map(e => e[0])

                    // console.log("artists", artistsArray);

                    setAllArtists(artistsArray)
                }
            }

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