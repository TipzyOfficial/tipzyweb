import { padding } from "../lib/Constants";
import { ArtistType } from "../lib/song";
import './Artist.css'

export default function Artist(props: {itemId?: string, artist: ArtistType, dims: number}){
    const dims = props.dims;

    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <img src={props.artist.image} alt={props.artist.name} style={{height: dims, width: dims, borderRadius: dims}}/>
            <span className="text"  style={{fontSize: Math.max(dims/8, 15), color: "white", fontWeight: 'bold', textAlign: 'center'}}>
                {props.artist.name}
            </span>
        </div>
    )
}