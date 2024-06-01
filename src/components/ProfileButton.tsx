import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { padding, radius, useFdim } from "../lib/Constants";
import { faUser as faProfile } from "@fortawesome/free-solid-svg-icons";
import { router } from "../App";
import { useLocation } from "react-router-dom";
import useWindowDimensions from "../lib/useWindowDimensions";

export default function ProfileButton(){
    const dims = Math.min(100, useWindowDimensions().width/7);

    // console.log(location.pathname)

    return(
        <div style={{
            position: "fixed",
            bottom:padding,
            right:padding,
            zIndex: 20,
            opacity: 0.7,
        }}>
            <button 
            onClick={() => router.navigate("/profile")}
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
                borderColor: 'black',
            }}>        
                <FontAwesomeIcon icon={faProfile} color={'black'} fontSize={dims/2}></FontAwesomeIcon>
            </button>
        </div>
    );
}