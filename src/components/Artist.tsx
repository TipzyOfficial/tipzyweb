import { padding } from "../lib/Constants";
import { ArtistType } from "../lib/song";
import './Artist.css'

export default function Artist(props: {artist: ArtistType, dims: number, onClick?: () => void}){
    const dims = props.dims;

    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer'}} onClick={props.onClick}>
            {props.artist.image === "" ? 
            <div style={{height: dims, width: dims, borderRadius: dims, backgroundColor: "#888"}}></div>
            : <img src={props.artist.image} alt={props.artist.name} style={{height: dims, width: dims, borderRadius: dims, objectFit: "cover"}}/>}
            <span className="text"  style={{fontSize: Math.max(dims/8, 15), color: "white", fontWeight: 'bold', textAlign: 'center'}}>
                {props.artist.name}
            </span>
        </div>
    )
}