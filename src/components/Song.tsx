import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, useFdim } from "../lib/Constants";
import { SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import FlatList from "flatlist-react/lib";
import { useEffect, useState } from "react";
import RequestSongModal from "./RequestSongModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faMusic } from "@fortawesome/free-solid-svg-icons";

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


export function SongRenderItem(props: { song: SongType, dims: number, onClick?: () => void, noImage?: boolean, number?: number }) {
    const item = props.song;
    const songDims = props.dims;
    const onClick = props.onClick;
    return (
        <button style={{
            display: 'flex', width: '100%',
            paddingRight: 0,
            paddingLeft: 0,
            paddingTop: 0,
            paddingBottom: padding * 1.2,
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
            <div style={{ paddingLeft: 2 }}>
                {/* <div style={{display: 'flex', padding: 10, 
                                    border: 'solid #8888', borderWidth: 0.5, borderRadius: 5,
                                    backgroundColor: '#8881',
                                    justifyContent: 'center', alignItems: 'center', fontSize: songDims/3, color: 'white'}}>
                            $1.50
                        </div> */}
                <FontAwesomeIcon icon={faCirclePlus} color={'#fff8'} fontSize={songDims / 3}></FontAwesomeIcon>
            </div>
        </button>
    )
}

export function SongList(props: { songs: SongType[], dims: number, noImage?: boolean, numbered?: boolean, logoutData?: any }) {

    const songDims = props.dims;

    try {
        const ret = localStorage.getItem("ret");
        // console.log("ret", ret);
        const parsed = ret ? JSON.parse(atob(ret)) : undefined;
        // console.log("parsed", parsed);
        const initRQS = parsed ? parsed.data?.selectedSong : undefined;
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
                    <SongRenderItem song={item} dims={songDims} number={props.numbered ? parseInt(index) : undefined} key={item.id + "_index" + index} noImage={props.noImage} onClick={() => {
                        setRequestedSong(item);
                        setRequestVisible(true);
                    }} />
                }
            />
            {/* <div style={{position: "fixed", top: 0}}> */}
            <RequestSongModal song={requestedSong} show={requestVisible} handleClose={() => setRequestVisible(false)} data={props.logoutData}></RequestSongModal>
            {/* </div> */}
        </>
    )
}