import { useState } from 'react';
import { Colors, radius } from '../lib/Constants';

function TZButton(props: {onClick?: () => void; title?: string, backgroundColor?: string, width?: number, disabled?: boolean}) {
    const [opacity, setOpacity] = useState(1);

    return(
        <button 
        onClick={props.onClick}
        onPointerDown={() => {
            setOpacity(0.7);
        }}
        onPointerUp={() => {
            setOpacity(1);
        }}
        style={{
            padding: 12,
            backgroundColor: props.disabled ? "#8888": props.backgroundColor ?? Colors.secondaryDark,
            justifyContent: 'center', alignItems: 'center',
            borderRadius: radius,
            width: props.width ?? "100%",
            boxSizing: "border-box",
            WebkitBoxSizing: "border-box",
            MozBoxSizing: "border-box",
            opacity: opacity,
            border: 'none'
        }}>
            <span style={{fontSize: 20, color: props.disabled ? "#888" : "white", fontWeight: "bold"}}>{props.title ?? ""}</span>
        </button>
    )
}

export default TZButton;