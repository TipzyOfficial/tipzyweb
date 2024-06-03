import { Spinner, ToggleButton } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { Colors, padding as basePadding, padding, radius, useFdim } from "../../lib/Constants";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BarType } from "../../lib/bar";
import { fetchWithToken } from "../..";
import { UserSessionContext, UserSessionContextType, useInterval } from "../../lib/UserSessionContext";
import TZSearchButton from "../../components/TZSearchButton";
import '../../App.css'
import { ArtistType, SongRequestType, SongType, songRequestCompare } from "../../lib/song";
import Song, { SongList } from "../../components/Song";
import Artist from "../../components/Artist";
import { ScrollMenu } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';
import useWindowDimensions from "../../lib/useWindowDimensions";
import { getCookies, router } from "../../App";
import ProfileButton from "../../components/ProfileButton";
import ToggleTab from "../../components/ToggleTab";
import RequestsContent from "./Requests";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { NotFoundPage } from "./NotFoundPage";
import Lottie from 'react-lottie';
import speakerAnimation from '../../assets/Speakers.json'; 

function parseSongIHateMeku(s: any): SongType{
    return {id: s.id, title: s.name, artists: [s.artist], albumart: s.image_url, explicit: false}
}

function parseSong(s: any): SongType{
    return {id: s.id, title: s.name, artists: s.artists, albumart: s.images[2].url, albumartbig: s.images[0].url, explicit: s.explicit}
}

function parseBusiness(b: any): BarType {
    return {
        id: b.id,
        name: b.business_name,
        type: b.business_type,
        description: b.description,
        active: b.active,
        image_url: b.image_url
    }
}

const LoadingScreen = () => 
    <div className="App-header">
        <Spinner style={{color: Colors.primaryRegular, width: 75, height: 75}}/>
        <br></br>
        <span>Loading bar information...</span>
    </div>;

export const fetchPendingRequests = async (userContext: UserSessionContextType) => {
    const newUser = structuredClone(userContext.user);
    // console.log('getting pending')
    newUser.requests = await fetchWithToken(userContext, `tipper/requests/pending/`, 'GET').then(r => r.json())
    .then(json => { 
        // console.log('got pending')
        return parseRequests(json);
    }).catch((e) => {console.log("error: ",e); return []})

    return newUser;
}

let currentPCache: SongType | undefined = undefined;
let pendingReqsCache: SongRequestType[] = [];
let allReqsCache: SongRequestType[] = [];

export default function Bar(){
    const [searchParams] = useSearchParams();
    const userContext = useContext(UserSessionContext);
    const [ready, setReady] = useState(false);
    const [view, setViewInner] = useState(0);
    // const [requests, setRequests] = useState<SongRequestType[]>([]);
    const cookies = getCookies();
    const bar = userContext.barState.bar;
    const topSongs = bar?.topSongs ?? [];
    const topArtists = bar?.topArtists ?? [];
    const id = searchParams.get("id") ?? (userContext.barState.bar ? null : cookies.get("bar_session"));
    const window = useWindowDimensions();
    const fdim = useFdim();
    const padding = fdim ? Math.max(Math.min(fdim/50, 30), basePadding) : basePadding;
    const songDims = fdim ? Math.max(Math.min(fdim/10, 75), 50) : 50;
    const artistDims = fdim ?  Math.max(Math.min(fdim/4.3, 200), 50) : 120;
    const searchDims = fdim ?  Math.max(Math.min(fdim/20, 30), 15) : 15;
    const minHeaderHeight = window.height && window.width ? Math.min(window.width/5, window.height/4): 200;
    const toggleRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>();

    const RequestsContentMemo = memo(RequestsContent);
    const [pendingReqs, setPendingReqs] = useState<SongRequestType[]>(pendingReqsCache);
    const [allReqs, setAllReqs] = useState<SongRequestType[]>(allReqsCache);
    const [cload, setCload] = useState(false);
    const timeout = 4000;
    const usc = useContext(UserSessionContext);
    const [current, setCurrent] = useState<SongType | undefined>(currentPCache);
  
    // useEffect(() => {
    //     console.log("tref", toggleRef)
    // }, [toggleRef]);
    // useEffect(() => {
    //     // setHeight(ref.current.offsetHeight);
    //     console.log(ref.current)
    // }, [setHeight])
    
    const setView = (v: number) => {
        if(v !== view) {
            // userContext.abortController?.abort("switching pages");
            // alert("height set");
            setHeight(toggleRef.current?.offsetHeight ?? 0 + padding);
            setViewInner(v);
        }
    }

    const getCurrentQueue = async () : Promise<[SongType | undefined, SongType[]] | undefined | null> => {
        return fetchWithToken(usc, `tipper/business/queue/?business_id=${id}`, "GET").then(response => { 
            if(response === null) throw new Error("null response");
            if(!response.ok) throw new Error("Bad response:" + response.status);
            return response.json();
        }).then(json => {
            if(json.data === undefined) return undefined;
            const np = json.data.now_playing;
            const nowplaying = np ? {title: np.track_name, artists: np.artists, albumart: np.image_url[2].url, albumartbig: np.image_url[0].url, id: np.track_id, duration: np.duration_ms, explicit: np.explicit} : undefined;
            const q: SongType[] = [];
            json.data.queue.forEach((e: any) => {
                const song: SongType = {title: e.name, artists: e.artist, albumart: e.images[2].url, albumartbig: e.images[0].url, id: e.id, duration: e.duration_ms, explicit: e.explicit};
                q.push(song);
            });
            return [nowplaying, q];
        });
    }

    const refreshCurrent = () => {
        getCurrentQueue().then((r) => {
            if(!r) return;
            const [c, q] = r;
            setCurrent(c);
            currentPCache = c;
        })
    }

    const refreshAllReqs = async (indicator: boolean) => {
        if(indicator) setCload(true);
        const allr = await fetchWithToken(userContext, `tipper/requests/all/`, 'GET').then(r => r.json()).then(json => {
            // console.log("got back this: ", json)
            const reqs = new Array<SongRequestType>();
            const preqs = new Array<SongRequestType>();
            json.data.forEach((r: any) => {
                const req = parseRequest(r);
                if(req.status === "PENDING") preqs.push(req);
                else reqs.push(req);
            })
            return [preqs, reqs];
        }).catch(() => {setCload(false); return [new Array<SongRequestType>(), new Array<SongRequestType>()]});

        const [p, r] = allr;

        const psort = p.sort(songRequestCompare);
        const asort = r.sort(songRequestCompare);

        setPendingReqs(psort);
        pendingReqsCache = psort;
        setAllReqs(asort);
        allReqsCache = asort;

        setCload(false);
    }

    const allRefresh = (indicator: boolean) => {
        console.log("refreshing data...")
        refreshCurrent();
        refreshAllReqs(indicator);
    }

    // useEffect(() => console.log("rerendered everything"), [])
    useInterval(() => allRefresh(false), timeout);


    const fetchBarInfo = async () => {
        const bar: BarType | undefined = await fetchWithToken(userContext, `tipper/business/${id}`, 'GET').then(r => r.json())
        .then(json => {
            return {
                id: json.id,
                name: json.business_name,
                type: json.business_type,
                image_url: json.image_url,
                description: json.description,
                active: json.active,
            }
            // setBar(bar);
        }).catch((e: Error) => {
            // alert("Error loading your bar: " + e.message);
            return undefined;
        })

        if(!bar) {
            userContext.barState.setBar(bar)
            return undefined;
        }

        bar.topSongs = await fetchWithToken(userContext, `tipper/business/spotify/songs/?business_id=${id}`, 'GET').then(r => r.json())
        .then(json => {
            const songs = new Array<SongType>();
            json.data.forEach((s: any) => {
                const song: SongType = parseSong(s);
                songs.push(song);
            })
            //setTopSongs(songs)
            return songs;
        }).catch(() => undefined)

        bar.topArtists = await fetchWithToken(userContext, `tipper/business/spotify/artists/?business_id=${id}`, 'GET').then(r => r.json())
        .then(json => {
            const artists = new Array<ArtistType>();
            json.data.forEach((s: any) => {
                const artist: ArtistType = {id: s.id, name: s.name, image: s.images[0] ? s.images[0].url : ""}
                artists.push(artist);
            })
            //setTopArtists(artists)
            return artists;
        }).catch((e) => {
            return undefined;
        })

        userContext.barState.setBar(bar)

        return bar;
    }
    
    useEffect(() => {
        if(!id) {
            router.navigate("/code");
            return;
        }
        if(userContext.barState.bar && id === userContext.barState.bar.id.toString()) {
            setReady(true);
            return;
        }
        fetchBarInfo().then(() => setReady(true))
        .catch(e => {
            userContext.barState.setBar(undefined)
            setReady(true);
        });
        allRefresh(true);
        // fetchPendingRequests(userContext).then(u => userContext.setUser(u));
    }, [])

    if(ready === false)
        return <LoadingScreen/>
    else if(bar === undefined)
        return <NotFoundPage body="That bar doesn't seem to exist...are you sure you got the right bar ID?" backPath="./code"/>

    const SongContent = () => {
        return(
        <div style={{justifyContent: 'flex-start', alignItems: 'flex-start', flex: 1, display: 'flex', flexDirection: 'column'}}>
            <div style={{paddingTop: padding}}>
                <div style={{paddingLeft: padding, paddingBottom: padding}}>
                    <span className='App-subtitle'>Top Artists</span>
                </div>
                <div style={{paddingBottom: padding/3}}></div>
                <div style={{overflow: 'hidden', width: window.width ?? 200}}>
                    <ScrollMenu
                    >
                    {topArtists.map((e, index) => (
                        <div style={{opacity:1, paddingLeft: padding}}><Artist artist={e} key={"index"+index+"e"+e.id} dims={artistDims} onClick={() => router.navigate(`/artist/`, {state:{artist: e}})}></Artist></div>
                    ))}
                    </ScrollMenu>
                </div>
            </div>
            <div style={{padding: padding, width: '100%'}}>
                <div style={{paddingBottom: padding, paddingTop: padding}}>
                    <span className='App-subtitle'>Top Songs</span>
                </div>
                <SongList songs={topSongs} dims={songDims}/>
            </div>
        </div>
        )
    }

    return(
        <DisplayOrLoading condition={ready} loadingScreen={<LoadingScreen/>}>
        <div className="App-body-top">
            <div style={{width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
                <div style={{width: '100%', minHeight: minHeaderHeight,
                    objectFit: 'cover', backgroundImage: `url(${bar.image_url})`, 
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    display: "flex",
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    backgroundColor:"#000",
                    boxShadow: 'inset 0px -30vh 30vh rgba(23, 23, 30, 0.9)'
                }}
                >
                    <div style={{
                        flex: 1, alignSelf: "stretch", display: "flex", alignItems: 'center', backgroundColor: "#0003", position: 'sticky', top: 0}}>
                        <div style={{
                            flex: 1, 
                            display: 'flex', alignItems: 'center',
                            padding: padding/2,
                            cursor: 'pointer', 
                            opacity: 0.8,
                            }} onClick={() => router.navigate('/code')}>
                                <FontAwesomeIcon className="App-tertiarytitle" icon={faArrowLeft} ></FontAwesomeIcon>
                                {/* <span className="App-tertiarytitle" style={{paddingLeft: 5}}>Exit</span> */}
                        </div>
                        <div style={{flex: 2}}></div>
                    </div>
                    <div style={{paddingBottom: padding/2, paddingTop: padding*2, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>
                        <span className='App-title' style={{flex: 7, width: '100%', textAlign: 'center'}}>{bar.name}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                        <span className='App-typetitle' style={{
                            flex: 1,
                            color: Colors.tertiaryLight,
                            paddingLeft: padding,
                        }}>{bar.type ?? "Bar"}</span>
                        <span className='App-typetitle' style={{paddingRight: padding, textAlign: 'right', flex: 1, color: Colors.primaryRegular}}>$2.00/song</span>
                    </div>
                    <div style={{paddingTop: padding, width: '100%', padding: padding,}}>
                        <TZSearchButton dims={searchDims} onClick={() => {router.navigate(`/bar/search`)}}/>
                    </div>
                </div>
                {/* <div style={{paddingBottom: padding/2}}></div> */}
                <div ref={toggleRef} style={{position: 'sticky', top: 0, zIndex: 2, 
                    paddingRight: padding,
                    paddingLeft: padding,
                    paddingTop: padding/2,
                    paddingBottom: padding/2,
                    backgroundColor: Colors.background,
                    display: 'flex',
                    justifyContent: 'center',
                }}
                    >
                        <div style={{flex: 1}}>
                            <ToggleTab labels={["Songs", "Requests"]} value={view} setValue={setView}></ToggleTab>
                        </div>
                </div>


                <>
                    {
                    view === 0 ? 
                    <SongContent/> 
                    : 
                    <RequestsContentMemo height={height} padding={padding} pr={pendingReqs} cr={allReqs} cload={cload}/> 
                    }
                    <div style={{
                            position: "fixed",
                            bottom: 0,
                            width: window.width,
                            display: 'flex',
                            // flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <div style={{flex: 1, paddingBottom: padding, paddingLeft: padding, paddingRight: padding, paddingTop: padding, maxWidth: 800,
                            }}>
                                <CurrentlyPlaying current={current} songDims={songDims}/>
                            </div>
                            <div style={{flexShrink: 1, justifyContent: 'flex-end', display: 'flex', paddingRight: padding}}>
                                <ProfileButton position="relative"/>
                            </div>
                    </div>
                </>


                <div>
                    <div style={{padding: padding, opacity: 0}}>
                        <div style={{flexShrink: 1, justifyContent: 'flex-end', display: 'flex', paddingRight: padding}}>
                            <div style={{width: "100%",
                                padding: padding,
                                display: 'flex',
                                alignItems: 'center',
                            }}>
                                <div style={{flexGrow: 1}}>
                                    <Song song={{title: "No song playing", artists: ["No artist"], explicit: false, id:"-1", albumart: ""}} dims={songDims ? songDims * 0.9 : undefined}></Song> 
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> 
        </div>
    </DisplayOrLoading>

    );
}

export function parseRequests(json: any): SongRequestType[] {
    const reqs = new Array<SongRequestType>();
    json.data.forEach((r: any) => {
        const req: SongRequestType = {
            id: r.id, song: parseSongIHateMeku(r.song_json), bar: parseBusiness(r.business_info), date: new Date(r.request_time), status: r.status }
            reqs.push(req);
    })
    return reqs.sort(songRequestCompare);
}


export function parseRequest(r: any): SongRequestType {
    const req: SongRequestType = {id: r.id, song: parseSongIHateMeku(r.song_json), bar: parseBusiness(r.business_info), date: new Date(r.request_time), status: r.status }
    return req;
}

function CurrentlyPlaying(props: {current?: SongType, songDims?: number}) : JSX.Element {
    const current = props.current;

    const speakerAnimationOptions = {
        loop: true,
        autoplay: true,
        animationData: speakerAnimation,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice"
        }
      };


    return(
        <>
            <div style={{width: "100%", backgroundColor: Colors.secondaryRegular, borderRadius: radius,
                padding: padding,
                boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
            }}>
                <div style={{flexGrow: 1}}>
                    <Song song={current ?? {title: "No song playing", artists: ["No artist"], explicit: false, id:"-1", albumart: ""}} dims={props.songDims ? props.songDims * 0.9 : undefined}></Song> 
                </div>
                <div style={{width: (props.songDims ?? 40) * 0.7}}>
                    <Lottie 
                        options={speakerAnimationOptions}
                        height={(props.songDims ?? 40) * 0.7}
                        width={(props.songDims ?? 40) * 0.7}
                    />
                </div>
            </div>
            <div style={{paddingLeft: radius, paddingRight: radius, width: "100%",
                
            }}>
                <div style={{
                    width: "100%", height: padding/2, backgroundColor: Colors.secondaryDark, 
                    borderBottomLeftRadius: radius,
                    borderBottomRightRadius: radius,
                    boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.5)'
                }}></div>
            </div>

        </>
    )
}



const RefreshableContent = (props: {view: number}) => {
    // const RequestsContentMemo = memo(RequestsContent);
    // const [pendingReqs, setPendingReqs] = useState<SongRequestType[]>([]);
    // const [allReqs, setAllReqs] = useState<SongRequestType[]>([]);
    // const [cload, setCload] = useState(false);
    // const timeout = 4000;
    // const usc = useContext(UserSessionContext);
    // const [current, setCurrent] = useState<SongType | undefined>(undefined);

    // const getCurrentQueue = async () : Promise<[SongType | undefined, SongType[]] | undefined | null> => {
    //     if(!bar) return;
    //     return fetchWithToken(usc, `tipper/business/queue/?business_id=${bar.id}`, "GET").then(response => { 
    //         if(response === null) throw new Error("null response");
    //         if(!response.ok) throw new Error("Bad response:" + response.status);
    //         return response.json();
    //     }).then(json => {
    //         if(json.data === undefined) return undefined;
    //         const np = json.data.now_playing;
    //         const nowplaying = np ? {title: np.track_name, artists: np.artists, albumart: np.image_url[2].url, albumartbig: np.image_url[0].url, id: np.track_id, duration: np.duration_ms, explicit: np.explicit} : undefined;
    //         const q: SongType[] = [];
    //         json.data.queue.forEach((e: any) => {
    //             const song: SongType = {title: e.name, artists: e.artist, albumart: e.images[2].url, albumartbig: e.images[0].url, id: e.id, duration: e.duration_ms, explicit: e.explicit};
    //             q.push(song);
    //         });
    //         return [nowplaying, q];
    //     });
    // }

    // const refreshCurrent = () => {
    //     getCurrentQueue().then((r) => {
    //         if(!r) return;
    //         const [c, q] = r;
    //         setCurrent(c);
    //     })
    // }

    // const refreshAllReqs = async (indicator: boolean) => {
    //     if(indicator) setCload(true);
    //     console.log("about to send!")
    //     const allr = await fetchWithToken(userContext, `tipper/requests/all/`, 'GET').then(r => r.json()).then(json => {
    //         // console.log("got back this: ", json)
    //         const reqs = new Array<SongRequestType>();
    //         const preqs = new Array<SongRequestType>();
    //         json.data.forEach((r: any) => {
    //             const req = parseRequest(r);
    //             if(req.status === "PENDING") preqs.push(req);
    //             else reqs.push(req);
    //         })
    //         return [preqs, reqs];
    //     }).catch(() => {setCload(false); return [new Array<SongRequestType>(), new Array<SongRequestType>()]});

    //     const [p, r] = allr;

    //     setPendingReqs(p.sort(songRequestCompare));
    //     setAllReqs(r.sort(songRequestCompare));

    //     setCload(false);
    // }

    // const allRefresh = () => {
    //     console.log("timed func running");
    //     refreshCurrent();
    //     refreshAllReqs(true);
    // }

    // useInterval(allRefresh, timeout);

    // useEffect(() => console.log("rerendered everything"), [])

    // useEffect(() => {
    //     console.log(tick);

    //     if(tick === 0){
    //         setTick(2)
    //         refreshCurrent();
    //         getCompleted(true);
    //     }
    //     const timer = setTimeout(() => {
    //         console.log("timer function running")
    //         if(tick === 0) setTick(2)
    //         else setTick(tick === 2 ? 3 : 2);
    //         refreshCurrent();
    //         getCompleted(false);
    //         return () => clearTimeout(timer);
    //     }, timeout);
        
    // }, [tick]);

    // return(
       
    // );
};