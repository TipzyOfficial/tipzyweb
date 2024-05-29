import { useContext, useState } from "react";
import { padding, radius } from "../../lib/Constants";
import { UserSessionContext } from "../../lib/UserSessionContext";
import TZButton from "../../components/TZButton";
import { Logout } from "../..";
import { getCookies } from "../../App";
import TZHeader from "../../components/TZHeader";

/**
 * user: appreview, pw: appreview
 * 
 * Name,
 * Email,
 * Profile Picture,
 * Look at the requests you've sent/been accepted
 * Transaction History
 * Setup payment stuff
 * Logout
 * A back button
 * 
 */


function ProfileLanding(props: {}) {
    const [isHovered1, setIsHovered1] = useState(false);
    const [isHovered2, setIsHovered2] = useState(false);
    const [isHovered3, setIsHovered3] = useState(false);
    const [isHovered4, setIsHovered4] = useState(false);

    const profileButton: React.CSSProperties = {
        fontSize: "30px",
        fontWeight: 'bold',
        margin: '10px',
        width: '100%',
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'grey',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, color 0.3s ease'
    };

    const hoveredButton: React.CSSProperties = {
        ...profileButton,
        color: '#1B242E',
        backgroundColor: '#EDA13E', // Change background color on hover
    };

    return (
        <div style={{
            // backgroundColor: "red",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginBottom: "10px"
        }
        }>
            <div style={isHovered1 ? hoveredButton : profileButton}
                onMouseEnter={() => setIsHovered1(true)}
                onMouseLeave={() => setIsHovered1(false)}>
                Your Account
            </div>
            <div style={isHovered2 ? hoveredButton : profileButton}
                onMouseEnter={() => setIsHovered2(true)}
                onMouseLeave={() => setIsHovered2(false)}>
                Your Requests
            </div>
            <div style={isHovered3 ? hoveredButton : profileButton}
                onMouseEnter={() => setIsHovered3(true)}
                onMouseLeave={() => setIsHovered3(false)}>
                Transaction History
            </div>
            <div style={isHovered4 ? hoveredButton : profileButton}
                onMouseEnter={() => setIsHovered4(true)}
                onMouseLeave={() => setIsHovered4(false)}>
                About
            </div>
        </div>

    );
}
function ProfileItem(props: { title: string, value: string, profilePic?: string, onClick?: () => void }) {
    console.log("Profile Name is: " + props.value);
    //overriding default CSS properties by initializing within the function
    const defaultProfile: React.CSSProperties = {
        width: "100px",
        height: "100px",
        background: 'linear-gradient(0deg, #c76b89, #d38932)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: "30px",
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    };
    return (
        <div style={{ padding: padding, width: "100%", display: "flex", }}>
            <span style={{ padding: padding }}>
                <div style={{ borderRadius: "50%" }}>
                    {props.profilePic ? (
                        <img src={props.profilePic} alt="Profile" style={{ borderRadius: "50%" }} ></img>)
                        :
                        (<div style={defaultProfile}>{getInitials(props.value)}</div>)
                    }

                </div>
            </span >
            <span style={{ padding: padding, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: "36px", fontWeight: "bold" }}>
                {props.value}
            </span>
        </div >
    );
}

export default function Profile() {
    const usc = useContext(UserSessionContext)
    const user = usc.user;
    const cookies = getCookies();
    // user.name
    // user.email

    return (
        <div className={"App-body-top"}>
            <TZHeader title="Your Profile" />
            <div style={styles}>
                <ProfileItem title="Name" value={usc.user.name} profilePic={user.image}></ProfileItem>
                <ProfileLanding></ProfileLanding>
                <TZButton title={"Logout"} onClick={() => Logout(cookies)}></TZButton>
            </div>
        </div>
    )
}

// Function to extract initials from a name
const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(name => name.charAt(0).toUpperCase()).join('');
    return initials.substring(0, 2);
};

const styles: React.CSSProperties = {
    paddingRight: padding,
    paddingLeft: padding,
    width: "100%"
}

// const defaultProfile: React.CSSProperties = {
//     width: "50px",
//     height: "50px",
//     background: 'linear-gradient(0deg, #c76b89, #d38932)',
//     borderRadius: '50%',
//     display: 'flex',
//     fontSize: "30px",
//     alignItems: 'center',
//     alignContent: 'center',
//     color: 'white',
//     fontWeight: 'bold',
//     textAlign: 'center',
// }