import { useState } from 'react';
import { Colors, radius } from '../lib/Constants';

function TZButton(props: {onClick?: () => void; title?: string, backgroundColor?: string, width?: number, disabled?: boolean, fontSize?: number}) {
    const [opacity, setOpacity] = useState(1);

    return(
        <button 
        onClick={() =>{if(!props.disabled && props.onClick) props.onClick()}}
        onPointerDown={() => {
            setOpacity(0.7);
        }}
        onPointerUp={() => {
            setOpacity(1);
        }}
        style={{
            padding: 12,
            backgroundColor: props.backgroundColor ?? Colors.secondaryDark,
            justifyContent: 'center', alignItems: 'center',
            borderRadius: radius,
            width: props.width ?? "100%",
            boxSizing: "border-box",
            WebkitBoxSizing: "border-box",
            MozBoxSizing: "border-box",
            opacity: props.disabled ? 0.7 : opacity,
            border: 'none'
        }}>
            <span className="App-tertiarytitle" style={{color: "white", fontWeight: "bold", fontSize: props.fontSize}}>{props.title ?? ""}</span>
        </button>
    )
}

export default TZButton;