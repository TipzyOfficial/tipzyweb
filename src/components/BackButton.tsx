import { useState } from "react";
import { Colors, padding } from "../lib/Constants";
import { useLocation } from "react-router-dom";
import { router } from "../App";

//onClick?: () => void

export default function BackButton(props: { defaultDestination?: string }) {
    const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);

    const backButtonStyle: React.CSSProperties = {
        // position: 'absolute',
        // left: padding,
        paddingLeft: padding,
        border: 'none',
        backgroundColor: 'transparent',
        color: isBackButtonHovered ? Colors.primaryRegular : 'white',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'color 0.3s ease',
    };

    const loc = useLocation();


    return (
        <div style={backButtonStyle}
            onMouseEnter={() => setIsBackButtonHovered(true)}
            onMouseLeave={() => setIsBackButtonHovered(false)}
            onClick={() => {
                if (loc.state && loc.state.fromLogin) {
                    router.navigate(props.defaultDestination ?? "/bar");
                }
                else router.navigate(-1);
            }}>
            Back
        </div>
    );
}