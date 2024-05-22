import { padding } from "../lib/Constants";
import { SongType } from "../lib/song";
import './Song.css'

function artistsStringListToString(artists: string[]){
    let out = "";
    artists.forEach(a => {
        out += ", " + a
    })
    return out.substring(2);
}

export default function Song(props: {song: SongType, big?: boolean, dims?: number}){
    const big = props.big ?? false;

    const bigDims = 128;
    const dims = props.dims ?? 50;

    return (
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
            <img src={props.song.albumart} alt={props.song.title} style={{height: dims, width: dims}}/>
            <div style={{paddingLeft: dims/10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                <span className="text"  style={{fontSize: dims/3, color: "white"}}>
                    {props.song.title}
                </span>
                <span className="text" style={{fontSize: dims/4, color: "#888"}}>
                    {props.song.explicit ?"🅴": ""} {artistsStringListToString(props.song.artists)}
                </span>
            </div>
        </div>
    )
}