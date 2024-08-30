import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, radius, useFdim } from "../lib/Constants";
import { PlayableType, SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import FlatList from "flatlist-react/lib";
import { memo, useContext, useEffect, useState } from "react";
import RequestSongModal, { RequestPlayableModal } from "./RequestSongModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faMusic } from "@fortawesome/free-solid-svg-icons";
import { numberToPrice, trackUser } from "../lib/utils";
import { track } from '@vercel/analytics';
import { UserSessionContext } from "../lib/UserSessionContext";


export function artistsStringListToString(artists: string[]) {
    let out = "";
    artists.forEach(a => {
        out += ", " + a
    })
    return out.substring(2);
}

export default function Song(props: { song: SongType, dims?: number, noImage?: boolean, number?: number, roundedEdges?: boolean }) {
    // const big = props.big ?? false;

    const radius = 5;
    const bigDims = 128;
    const dims = props.dims ?? 50;

    const Img = () => props.song.albumart === "" || !props.song.albumart ? <div style={{ borderRadius: props.roundedEdges ? radius : 0, overflow: "hidden", height: dims, width: dims, backgroundColor: "#888", display: 'flex', justifyContent: 'center', alignItems: 'center' }}><FontAwesomeIcon color={"#fff8"} fontSize={dims / 3} icon={faMusic}></FontAwesomeIcon></div>
        : <img src={props.song.albumart} alt={props.song.title} style={{ height: dims, width: dims, borderRadius: props.roundedEdges ? radius : 0, overflow: "hidden", }} />

    return (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {props.number ? <span>{props.number}. </span> : <></>}
            {props.noImage ? <></> : <Img></Img>}
            <div style={{ paddingLeft: props.noImage ? 0 : dims / 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span className="onelinetext" style={{ fontSize: dims / 3, color: "white", width: '100%', fontWeight: '500' }}>
                    {props.song.title}
                </span>
                <span className="onelinetext" style={{ fontSize: dims / 4, color: "#fffa", width: '100%', fontWeight: 'normal' }}>
                    {props.song.explicit ? "🅴" : ""} {artistsStringListToString(props.song.artists)}
                </span>
            </div>
        </div>
    )
}


export function SongRenderItem(props: { song: SongType, dims: number, onClick?: () => void, noImage?: boolean, number?: number, noPlus?: boolean }) {
    const item = props.song;
    const songDims = props.dims;
    const onClick = props.onClick;
    return (
        <button style={{
            display: 'flex', width: '100%',
            paddingRight: 0,
            paddingLeft: 0,
            paddingTop: 0,
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: "border-box",
            WebkitBoxSizing: "border-box",
            MozBoxSizing: "border-box",
            // opacity: opacity,
            border: 'none',
            backgroundColor: '#0000'
        }}
            onClick={onClick}
        >
            <Song key={"id" + item.id}
                noImage={props.noImage}
                number={props.number}
                dims={songDims}
                song={item} />
            {props.noPlus ? <></> : <div style={{ paddingLeft: 2 }}>
                {/* <div style={{display: 'flex', padding: 10, 
                                    border: 'solid #8888', borderWidth: 0.5, borderRadius: 5,
                                    backgroundColor: '#8881',
                                    justifyContent: 'center', alignItems: 'center', fontSize: songDims/3, color: 'white'}}>
                            $1.50
                        </div> */}
                <FontAwesomeIcon icon={faCirclePlus} color={'#fff8'} fontSize={songDims / 3}></FontAwesomeIcon>
            </div>}
        </button>
    )
}

export function SongList(props: { songs: SongType[], dims: number, noImage?: boolean, numbered?: boolean, logoutData?: any, refreshRequests?: () => Promise<void> }) {

    const songDims = props.dims;
    const usc = useContext(UserSessionContext);

    console.log("usc", usc.user)

    useEffect(() => {
        try {
            const ret = localStorage.getItem("ret");

            // console.log("ret", ret);
            const parsed = ret ? JSON.parse(atob(ret)) : undefined;
            // console.log("parsed", parsed);
            const initRQS = parsed ? parsed.data?.selectedSong : undefined;
            // console.log("initRQS", initRQS);

            setRequestedSong(initRQS);
            setRequestVisible(initRQS !== undefined);
        } catch (e) {
            console.log("Problem loading previous state:", e)
            localStorage.removeItem("ret");
        }

    }, []);


    const [requestedSong, setRequestedSong] = useState<SongType | undefined>(undefined);
    const [requestVisible, setRequestVisibleIn] = useState(false);

    const setRequestVisible = (b: boolean) => {
        if (!b) {
            const ret = localStorage.getItem("ret");
            if (ret) {
                localStorage.removeItem("ret");
                console.log("removing ret from song")
            }
        }
        setRequestVisibleIn(b);
    }

    return (
        <>
            <FlatList
                list={props.songs}
                renderWhenEmpty={() => <div style={{ height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888' }}>No songs.</div>}
                renderItem={(item, index) =>
                    <>
                        <SongRenderItem song={item} dims={songDims} number={props.numbered ? parseInt(index) : undefined} key={item.id + "_index" + index} noImage={props.noImage} onClick={() => {
                            setRequestedSong(item);

                            if (usc.user.access_token && usc.user.access_token.length > 0) {
                                track("SongPressed", {
                                    user: trackUser(usc), song: `${item.title} by ${item.artists.toString()}`,
                                    business: usc.barState.bar ? `bar ${usc.barState.bar.id}` : usc.artistState.artist ? `artist ${usc.artistState.artist.id}` : "Unknown business"
                                });
                            } else {
                                track("SongPressed", { user: "[GUEST USER]", song: `${item.title} by ${item.artists.toString()}` })
                            }

                            setRequestVisible(true);
                        }} />
                        <div style={{
                            paddingBottom: padding * 1.2,
                        }}></div>
                    </>
                }
            />
            {/* <div style={{position: "fixed", top: 0}}> */}
            <RequestSongModal song={requestedSong} show={requestVisible} handleClose={() => setRequestVisible(false)} data={props.logoutData} refreshRequests={props.refreshRequests} />
            {/* </div> */}
        </>
    )
}

export function PlayableList(props: { playables: PlayableType[], dims: number, noImage?: boolean, logoutData?: any, setRequestedPlayable: (p: PlayableType) => void, setRequestVisible: (b: boolean) => void, disabled?: boolean }) {
    const songDims = props.dims;
    const setRequestedPlayable = props.setRequestedPlayable;
    const setRequestVisible = props.setRequestVisible;
    const masterDisabled = props.disabled;

    return (
        <>
            <FlatList
                list={props.playables}
                renderWhenEmpty={() => <div style={{ height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888' }}>No songs.</div>}
                renderItem={(item, index) => <Playable key={item.id + "_index" + index} item={item} index={index} dims={songDims} onClick={() => {
                    if (!masterDisabled) {
                        setRequestedPlayable(item);
                        setRequestVisible(true);
                    }
                }
                } />}
            />
            {/* <div style={{position: "fixed", top: 0}}> */}
            {/* </div> */}
        </>

    )
}

export const Playable = (props: { item: PlayableType, index?: string, onClick: () => void, dims: number, currentlyPlaying?: boolean }) => {
    const item = props.item;
    const index = props.index;
    const ratio = item.amountBid / item.minPrice;
    const complete = ratio >= 1
    const status = props.item.status;

    const disabled = status === "ACCEPTED" || status === "REJECTED" || status === "REFUNDED"

    return (
        <>
            <div style={{
                width: "100%", position: "relative", cursor: disabled ? undefined : "pointer", borderRadius: 5, overflow: 'hidden',
                boxShadow: props.currentlyPlaying ? `0px 0px 5px ${"#fff8"}` : undefined,
                opacity: disabled && !props.currentlyPlaying ? 0.5 : 1
            }} onClick={() => { if (!disabled) props.onClick() }}>
                {disabled ?
                    <></>
                    :
                    complete ?
                        <div className="App-animated-gradient" style={{
                            position: "absolute", left: 0, height: "100%", width: `100%`, backgroundColor: Colors.secondaryDark, zIndex: 0
                        }} />
                        : <div className="App-animated-gradient" style={{
                            position: "absolute", left: 0, height: "100%", width: `${ratio * 100}%`, backgroundColor: Colors.secondaryDark, zIndex: 0
                        }} />}
                <div style={{
                    height: "100%", width: "100%", display: 'flex', zIndex: 2, padding: padding / 2, justifyContent: 'space-between',
                    backgroundColor: status === "ACCEPTED" ?
                        props.currentlyPlaying ?
                            Colors.secondaryRegular : Colors.secondaryDark
                        : "#fff1", //flexWrap: 'wrap'
                }}>
                    <div style={{ position: 'relative', flexGrow: 0, flexShrink: 1 }}>
                        <Song song={item.song} dims={props.dims} key={item.id + "_index" + index} roundedEdges />
                    </div>
                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', minWidth: 0, paddingLeft: 5, flexShrink: 0, flexGrow: 1, flexDirection: "column"
                    }}>
                        {/* <span className="App-montserrat-normaltext" style={{ position: "relative", right: 0, fontWeight: 'bold' }}>
                            {disabled || item.minPrice <= item.amountBid ? "" :
                            }
                        </span> */}
                        <span className="App-montserrat-normaltext" style={{ position: "relative", right: 0, fontWeight: 'bold',/* wordBreak: "break-all", overflowWrap: "break-word" */ }}>
                            {disabled ? (props.item.status === "ACCEPTED" ? (props.currentlyPlaying ? "Playing!" : "Played") : "Refunded") :
                                item.minPrice <= item.amountBid ?
                                    <>
                                        {item.status === "LOCKED" ? <></> : <span className="App-smalltext" style={{ lineHeight: 1 }}>Bid: </span>}
                                        ${numberToPrice(item.amountBid)}
                                    </>
                                    :
                                    item.amountBid === 0 ?
                                        <span style={{ lineHeight: 1 }}>${numberToPrice(item.minPrice)}</span>
                                        :
                                        <span className="App-smalltext" style={{ lineHeight: 1, padding: 3, backgroundColor: "white", color: 'black', borderRadius: 5 }}>${numberToPrice(item.minPrice - item.amountBid)} left! 📈</span>
                            }
                        </span>
                    </div>
                </div>
                {/* <div style={{ position: "absolute", left: 0, height: "100%", width: `${Math.random() * 100}%`, backgroundColor: "red" }} /> */}
            </div>
            {/* <div style={{ paddingBottom: padding / 4 }}></div> */}
            <div style={{ paddingBottom: padding / 2 }}></div>
        </>
    )
}
