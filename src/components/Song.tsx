import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, radius, useFdim } from "../lib/Constants";
import { PlayableType, SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import FlatList from "flatlist-react/lib";
import { useEffect, useState } from "react";
import RequestSongModal, { RequestPlayableModal } from "./RequestSongModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faMusic } from "@fortawesome/free-solid-svg-icons";
import { numberToPrice } from "../lib/utils";

export function artistsStringListToString(artists: string[]) {
    let out = "";
    artists.forEach(a => {
        out += ", " + a
    })
    return out.substring(2);
}

export default function Song(props: { song: SongType, dims?: number, noImage?: boolean, number?: number }) {
    // const big = props.big ?? false;

    const bigDims = 128;
    const dims = props.dims ?? 50;

    const Img = () => props.song.albumart === "" || !props.song.albumart ? <div style={{ height: dims, width: dims, backgroundColor: "#888", display: 'flex', justifyContent: 'center', alignItems: 'center' }}><FontAwesomeIcon color={"#fff8"} fontSize={dims / 3} icon={faMusic}></FontAwesomeIcon></div>
        : <img src={props.song.albumart} alt={props.song.title} style={{ height: dims, width: dims }} />

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

    const [requestedSong, setRequestedSong] = useState<SongType | undefined>(initRQS);
    const [requestVisible, setRequestVisible] = useState(initRQS !== undefined);

    return (
        <>
            <FlatList
                list={props.songs}
                renderWhenEmpty={() => <div style={{ height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888' }}>No songs.</div>}
                renderItem={(item, index) =>
                    <>
                        <SongRenderItem song={item} dims={songDims} number={props.numbered ? parseInt(index) : undefined} key={item.id + "_index" + index} noImage={props.noImage} onClick={() => {
                            setRequestedSong(item);
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

export function PlayableList(props: { playables: PlayableType[], dims: number, noImage?: boolean, logoutData?: any }) {
    const songDims = props.dims;
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

    const RenderItem = (props: { item: PlayableType, index: string }) => {
        const item = props.item;
        const index = props.index;
        const ratio = item.amountBid / item.minPrice;
        const complete = ratio >= 1

        return (
            <>
                <div style={{ paddingBottom: padding / 4 }}></div>
                <div style={{
                    width: "100%", position: "relative", cursor: "pointer", borderRadius: 5, overflow: 'hidden',
                    // boxShadow: complete ? `0px 0px 5px ${Colors.secondaryDark}` : undefined

                }} onClick={() => {
                    setRequestedPlayable(item);
                    setRequestVisible(true);
                }}>
                    {complete ?
                        <div className="App-animated-gradient" style={{
                            position: "absolute", left: 0, height: "100%", width: `100%`, backgroundColor: Colors.secondaryDark, zIndex: 0
                        }} />
                        : <div className="App-animated-gradient" style={{
                            position: "absolute", left: 0, height: "100%", width: `${ratio * 100}%`, backgroundColor: Colors.secondaryDark, zIndex: 0
                        }} />}
                    <div style={{ height: "100%", width: "100%", display: 'flex', zIndex: 2, padding: padding / 2, backgroundColor: "#fff1" }}>
                        <div style={{ position: 'relative', flex: 2.5 }}>
                            <Song song={item.song} dims={songDims} key={item.id + "_index" + index} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1, minWidth: 50, paddingLeft: 5 }}>
                            <span className="App-montserrat-normaltext" style={{ position: "relative", right: 0, fontWeight: 'bold' }}>{numberToPrice(item.amountBid)}/{numberToPrice(item.minPrice)}</span>
                        </div>
                    </div>
                    {/* <div style={{ position: "absolute", left: 0, height: "100%", width: `${Math.random() * 100}%`, backgroundColor: "red" }} /> */}
                </div>
                <div style={{ paddingBottom: padding / 4 }}></div>
            </>
        )
    }

    return (
        <>
            <FlatList
                list={props.playables}
                renderWhenEmpty={() => <div style={{ height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888' }}>No songs.</div>}
                renderItem={(item, index) => <RenderItem key={item.id + "_index" + index} item={item} index={index} />}
            />
            {/* <div style={{position: "fixed", top: 0}}> */}
            <RequestPlayableModal playable={requestedPlayable} show={requestVisible} handleClose={() => setRequestVisible(false)} data={props.logoutData} />
            {/* </div> */}
        </>
    )
}