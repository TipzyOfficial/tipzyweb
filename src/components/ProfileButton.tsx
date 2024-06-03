import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Colors, padding, radius, useFdim } from "../lib/Constants";
import { faUser as faProfile } from "@fortawesome/free-solid-svg-icons";
import { router } from "../App";
import { useLocation } from "react-router-dom";
import useWindowDimensions from "../lib/useWindowDimensions";

export default function ProfileButton(props: {position?: "fixed" | "relative", disabled?: boolean}){
    const dims = Math.min(90, useWindowDimensions().width/6);
    const position = props.position ?? "fixed";
    // console.log(location.pathname)

    return(
        <div style={{
            position: position,
            bottom: position === "fixed" ? padding : undefined,
            right: position === "fixed" ? padding : undefined,
            zIndex: 20,
            opacity: 0.85,
        }}>
            <button 
            onClick={() => {if(!props.disabled) router.navigate("/profile")}}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                maxWidth: dims,
                maxHeight: dims,
                width: dims,
                height: dims,
                borderRadius: dims,
                padding: padding,
                borderWidth: 0,
                backgroundColor: Colors.primaryRegular,
                boxShadow: '0px 10px 10px rgba(0, 0, 0, 0.5)'
            }}>        
                <FontAwesomeIcon icon={faProfile} color={'white'} fontSize={dims/2}></FontAwesomeIcon>
            </button>
        </div>
    );
}