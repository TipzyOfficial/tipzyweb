import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass as faSearch } from '@fortawesome/free-solid-svg-icons'
import { padding, radius } from '../lib/Constants';

export default function TZSearchButton(props: {onClick: () => void, dims?: number}){
    const [opacity, setOpacity] = React.useState(1);
    const dims = props.dims ?? 20;
    const fontSize = Math.max(Math.min(dims, 30), 15);
    return(
        <button style={{
            padding: padding, width: '100%', opacity: opacity,
            borderRadius: radius, borderWidth: 1, borderColor: "#888", backgroundColor: 'white',
            }} onPointerDown={() => {
                setOpacity(0.7);
                props.onClick();
            }}
            onPointerUp={() => {
                setOpacity(1);
            }}
        >
            <div style={{width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}>
                <FontAwesomeIcon fontSize={fontSize*0.8} icon={faSearch} color={"black"}/>                        
                <span style={{color: 'black', paddingLeft: padding, fontSize: fontSize}}>Request a song!</span>
            </div>
        </button>
    )
}

