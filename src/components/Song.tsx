import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, useFdim } from "../lib/Constants";
import { SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import FlatList from "flatlist-react/lib";
import { useState } from "react";
import RequestSongModal from "./RequestSongModal";

export function artistsStringListToString(artists: string[]){
    let out = "";
    artists.forEach(a => {
        out += ", " + a
    })
    return out.substring(2);
}

export default function Song(props: {song: SongType, dims?: number}){
    // const big = props.big ?? false;

    const bigDims = 128;
    const dims = props.dims ?? 50;

    return (
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1}}>
            <img src={props.song.albumart} alt={props.song.title} style={{height: dims, width: dims}}/>
            <div style={{paddingLeft: dims/10, flex: 1, display: 'flex', flexDirection: 'column'}}>
                <span className="onelinetext"  style={{fontSize: dims/3, color: "white", width: '100%'}}>
                    {props.song.title}
                </span>
                <span className="onelinetext" style={{fontSize: dims/4, color: "#888", width: '100%'}}>
                    {props.song.explicit ?"🅴": ""} {artistsStringListToString(props.song.artists)}
                </span>
            </div>
        </div>
    )
}


export function SongRenderItem(props: {song: SongType, dims: number, onClick?: () =>  void}) {
    const item = props.song;
    const songDims = props.dims;
    const onClick = props.onClick;
    return(
        <button style={{display: 'flex', width: '100%', 
                            paddingRight: 0,
                            paddingLeft: 0,
                            paddingTop: 0,
                            paddingBottom: padding, 
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
                            dims={songDims}
                            song={item}/>
                    <div style={{display: 'flex', padding: 10, 
                                border: 'solid #8888', borderWidth: 0.5, borderRadius: 5,
                                backgroundColor: '#8881',
                                justifyContent: 'center', alignItems: 'center', fontSize: songDims/3, color: 'white'}}>
                        $1.50
                    </div>
                </button>
    )
}

export function SongList(props: {songs: SongType[], dims: number}) {
    const songDims = props.dims;
    const [requestedSong, setRequestedSong] = useState<SongType | undefined>();
    const [requestVisible, setRequestVisible] = useState(false);
    
    return (
        <>
            <FlatList
                list={props.songs}
                renderWhenEmpty={() => <></>}
                renderItem={(item) => 
                    <SongRenderItem song={item} dims={songDims} onClick={() => {
                        setRequestedSong(item);
                        setRequestVisible(true);
                    }}/>
                }
            />
            {/* <div style={{position: "fixed", top: 0}}> */}
            <RequestSongModal song={requestedSong} show={requestVisible} handleClose={() => setRequestVisible(false)}></RequestSongModal>
            {/* </div> */}
        </>
    )
}