import { Spinner, ToggleButton } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { Colors, padding as basePadding, padding, radius, useFdim } from "../../lib/Constants";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BarType } from "../../lib/bar";
import { fetchWithToken } from "../..";
import { UserSessionContext, UserSessionContextType } from "../../lib/UserSessionContext";
import TZSearchButton from "../../components/TZSearchButton";
import '../../App.css'
import { ArtistType, SongRequestType, SongType, songRequestCompare } from "../../lib/song";
import { SongList } from "../../components/Song";
import Artist from "../../components/Artist";
import { ScrollMenu, } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';
import useWindowDimensions from "../../lib/useWindowDimensions";
import { getCookies, router } from "../../App";
import ProfileButton from "../../components/ProfileButton";
import ToggleTab from "../../components/ToggleTab";
import RequestsContent from "./Requests";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

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
    newUser.requests = await fetchWithToken(userContext.user, `tipper/requests/pending/`, 'GET').then(r => r.json())
    .then(json => { 
        // console.log('got pending')
        return parseRequests(json);
    }).catch((e) => {console.log("error: ",e); return []})

    return newUser;
}

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
    const artistDims = fdim ?  Math.max(Math.min(fdim/4.8, 200), 50) : 120;
    const searchDims = fdim ?  Math.max(Math.min(fdim/20, 30), 15) : 15;
    const minHeaderHeight = window.height && window.width ? Math.min(window.width/5, window.height/4): 200;
    const toggleRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>();
  
    // useEffect(() => {
    //     console.log("tref", toggleRef)
    // }, [toggleRef]);
    // useEffect(() => {
    //     // setHeight(ref.current.offsetHeight);
    //     console.log(ref.current)
    // }, [setHeight])
    
    const setView = (v: number) => {
        // alert("height set");
        setHeight(toggleRef.current?.offsetHeight ?? 0 + padding);
        setViewInner(v);
    }

    const fetchBarInfo = async () => {
        const bar: BarType | undefined = await fetchWithToken(userContext.user, `tipper/business/${id}`, 'GET').then(r => r.json())
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

        bar.topSongs = await fetchWithToken(userContext.user, `tipper/business/spotify/songs/?business_id=${id}`, 'GET').then(r => r.json())
        .then(json => {
            const songs = new Array<SongType>();
            json.data.forEach((s: any) => {
                const song: SongType = parseSong(s);
                songs.push(song);
            })
            //setTopSongs(songs)
            return songs;
        }).catch(() => undefined)

        bar.topArtists = await fetchWithToken(userContext.user, `tipper/business/spotify/artists/?business_id=${id}`, 'GET').then(r => r.json())
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
        // if() {
        //     router.navigate("code")
        // }
        //if id is the same as bar or if new id hasn't been set yet
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
        // fetchPendingRequests(userContext).then(u => userContext.setUser(u));
    }, [])

    if(ready === false)
        return <LoadingScreen/>
    else if(bar === undefined)
        return <div className="App-body" style={{display: 'flex', flexDirection: 'column', textAlign: 'center', padding: padding}}>
                    <span className="App-title" style={{color: Colors.primaryRegular,paddingBottom: padding}}>Oops!</span>
                    <span>That bar doesn't seem to exist...are you sure you got the right bar ID?</span>
                    <span style={{color: Colors.primaryRegular, fontWeight: 'bold', cursor: 'pointer'}} onClick={() => router.navigate("/code")}>Go back</span>
                </div>

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
                        <div style={{opacity:1, paddingLeft: padding}}><Artist artist={e} key={"index"+index+"e"+e.id} itemId={"index"+index} dims={artistDims}></Artist></div>
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

    const RequestsContentMemo = memo(RequestsContent);

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
                        flex: 1, alignSelf: "stretch", display: "flex", alignItems: 'center', backgroundColor: "#0005", position: 'sticky', top: 0}}>
                        <div style={{
                            flex: 1, 
                            display: 'flex', alignItems: 'center',
                            padding: padding/2,
                            cursor: 'pointer', 
                            opacity: 0.8,
                            }} onClick={() => router.navigate('/code')}>
                                <FontAwesomeIcon className="App-tertiarytitle" icon={faChevronLeft} ></FontAwesomeIcon>
                                <span className="App-tertiarytitle" style={{paddingLeft: 5}}>Exit</span>
                        </div>
                        <div style={{flex: 2}}></div>
                    </div>
                    <div style={{paddingBottom: padding, paddingTop: padding/2, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>
                        <span className='App-title' style={{flex: 7, width: '100%', textAlign: 'center'}}>{bar.name}</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                        <span className='App-typetitle' style={{
                            flex: 1,
                            color: Colors.tertiaryLight,
                            paddingLeft: padding,
                        }}>{bar.type ?? "Bar"}</span>
                    </div>
                    <span className='App-typetitle' style={{paddingLeft: padding, textAlign: 'right', flex: 1, color: Colors.primaryRegular}}>Songs are $1.50</span>
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
                    backgroundColor: Colors.background}}>
                    <ToggleTab labels={["Songs", "Requests"]} value={view} setValue={setView}></ToggleTab>
                </div>
                <div>
                    {view === 0 ? <SongContent/> : <RequestsContentMemo height={height} padding={padding}/>} 
                </div>
                <div style={{height: padding*4}}></div>
                <ProfileButton/>
            </div> 
        </div>
    </DisplayOrLoading>

    );
}


const styles = {
    title: {
        fontSize: 25,
        fontWeight: 'bold',
    },
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