import { useState } from "react";
import { Colors, padding, radius } from "../lib/Constants";

export default function TZProfileComponent(props: { text: string, onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const profileButton: React.CSSProperties = {
        fontWeight: 'bold',
        width: '100%',
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isHovered ? Colors.primaryRegular : 'transparent',
        borderColor: isHovered ? "#8880" : "#8888",
        borderWidth: 1,
        borderStyle: "solid",
        padding: padding,
        color: isHovered ? '#1B242E' : 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, color 0.3s ease'
    };
    return (
        <>
            <div style={profileButton}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={props.onClick}>
                <span className="App-tertiarytitle">{props.text}</span>
            </div>
            <div style={{paddingBottom: padding}}/>
        </>
    );
}