import { Spinner } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { Colors, padding as basePadding, useFdim } from "../../lib/Constants";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { useContext, useEffect, useState } from "react";
import { BarType } from "../../lib/bar";
import { fetchWithToken } from "../..";
import { UserSessionContext } from "../../lib/UserSessionContext";
import TZSearchButton from "../../components/TZSearchButton";
import FlatList from 'flatlist-react';
import '../../App.css'
import { ArtistType, SongType } from "../../lib/song";
import Song, { SongList, SongRenderItem } from "../../components/Song";
import Artist from "../../components/Artist";
import { ScrollMenu, VisibilityContext, publicApiType } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';
import useWindowDimensions from "../../lib/useWindowDimensions";
import { getCookies, router } from "../../App";
import Cookies from "universal-cookie";
import ProfileButton from "../../components/ProfileButton";

const LoadingScreen = () => 
    <div className="App-header">
        <Spinner style={{color: Colors.primaryRegular, width: 75, height: 75}}/>
        <br></br>
        <span>Loading bar information...</span>
    </div>;

export default function Bar(){
    const [searchParams] = useSearchParams();
    const userContext = useContext(UserSessionContext);
    const [ready, setReady] = useState(false);
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
    const minHeaderHeight = window.height && window.width ? Math.min(window.width/5, window.height/4): 200


    const fetchEverything = async () => {
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
            alert("error: " + e.message);
            return undefined;
        })

        if(!bar) {
            return bar;
        }

        bar.topSongs = await fetchWithToken(userContext.user, `tipper/business/spotify/songs/?business_id=${id}`, 'GET').then(r => r.json())
        .then(json => {
            const songs = new Array<SongType>();
            json.data.forEach((s: any) => {
                const song: SongType = {id: s.id, title: s.name, artists: s.artists, albumart: s.images[2].url, albumartbig: s.images[0].url, explicit: s.explicit}
                songs.push(song);
            })
            //setTopSongs(songs)
            return songs;
        }).catch(() => undefined)

        bar.topArtists = await fetchWithToken(userContext.user, `tipper/business/spotify/artists/?business_id=${id}`, 'GET').then(r => r.json())
        .then(json => {
            const artists = new Array<ArtistType>();
            json.data.forEach((s: any) => {
                const artist: ArtistType = {id: s.id, name: s.name, image: s.images[0].url}
                artists.push(artist);
            })
            //setTopArtists(artists)
            return artists;
        }).catch(() => undefined)

        userContext.barState.setBar(bar)

        setReady(true);
    }

    function payment() {

    }
    
    useEffect(() => {
        console.log(userContext.barState.bar)
        // if() {
        //     router.navigate("code")
        // }
        //if id is the same as bar or if new id hasn't been set yet
        if(!id || (userContext.barState.bar && id === userContext.barState.bar.id.toString())) {
            setReady(true);
            return;
        }
        fetchEverything().catch(e => {
            userContext.barState.setBar(undefined)
            console.log(e)
            // setBadLoad(true);
            setReady(true);
        })
    }, [])

    if(bar === undefined && ready === false)
        return <LoadingScreen></LoadingScreen>
    else if(bar === undefined)
        return <div className="App-body" style={{display: 'flex', flexDirection: 'column', textAlign: 'center', padding: padding}}>
                    <span className="App-title" style={{color: Colors.primaryRegular}}>Oops!</span>
                    <span>That bar doesn't seem to exist...are you sure you got the right bar ID?</span>
                </div>

    // const TopArtistsList = (props: {artists: ArtistType[]}) => {
    
    //     return (
    //     );
    // }

    return(
        <DisplayOrLoading condition={ready} loadingScreen={<LoadingScreen></LoadingScreen>}>
            <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
                <div style={{width: '100%', minHeight: minHeaderHeight,
                    objectFit: 'cover', backgroundImage: `url(${bar.image_url})`, 
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    padding: padding,
                    display: "flex",
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    backgroundColor:"#000",
                    boxShadow: 'inset 0px -30vh 30vh rgba(23, 23, 30, 0.9)'
                }}
                >
                    <div style={{paddingTop: padding, paddingBottom: padding, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'}}>
                        <span className='App-title' style={{width: '100%', textAlign: 'center'}}>{bar.name}</span>
                    </div>
                    <span className='App-tertiarytitle' style={styles.subtitle}>Dive Bar</span>
                    <div style={{paddingTop: padding, width: '100%'}}>
                        <TZSearchButton dims={searchDims} onClick={() => {router.navigate(`/bar/search`)}}/>
                    </div>
                </div>
                <div style={{justifyContent: 'flex-start', alignItems: 'flex-start', flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <div style={{paddingTop: padding}}>
                        <div style={{paddingLeft: padding}}>
                            <span className='App-subtitle'>Top Artists</span>
                        </div>
                        <div style={{paddingBottom: padding/3}}></div>
                        <div style={{overflow: 'hidden', width: window.width ?? 200}}>
                            <ScrollMenu
                            >
                            {topArtists.map((e, index) => (
                                <div style={{opacity:1, paddingLeft: padding}}><Artist artist={e} itemId={"index"+index} dims={artistDims}></Artist></div>
                            ))}
                            </ScrollMenu>
                        </div>
                    </div>
                    <div style={{padding: padding, width: '100%'}}>
                        <span className='App-subtitle'>Top Songs</span>
                        <div style={{paddingBottom: padding/3}}></div>
                        <SongList songs={topSongs} dims={songDims}/>
                    </div>
                </div>
                <ProfileButton/>
            </div>
        </DisplayOrLoading>
    );
}

export function LeftArrow() {
    const visibility = useContext<publicApiType>(VisibilityContext);
    const isFirstItemVisible = visibility.useIsVisible("first", true);
    console.log("fiv", visibility.getNextElement())
    console.log("liv", visibility.isLastItemVisible)
  
    return (
      <Arrow
        disabled={isFirstItemVisible}
        onClick={() => visibility.scrollPrev()}
      >
        Left
      </Arrow>
    );
  }
  
  export function RightArrow() {
    const visibility = useContext<publicApiType>(VisibilityContext);
    const isLastItemVisible = visibility.useIsVisible("last", false);
  
    return (
      <Arrow disabled={isLastItemVisible} onClick={() => visibility.scrollNext()}>
        Right
      </Arrow>
    );
  }
  
  function Arrow({
    children,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    disabled: boolean;
    onClick: VoidFunction;
  }) {
    return (
      <button
        disabled={disabled}
        onClick={onClick}
        style={{
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          right: "1%",
          opacity: disabled ? "0" : "1",
          userSelect: "none",
        }}
      >
        {children}
      </button>
    );
  }



const styles = {
    title: {
        fontSize: 25,
        fontWeight: 'bold',
    },
    subtitle: {
        color: Colors.tertiaryLight
    },
}