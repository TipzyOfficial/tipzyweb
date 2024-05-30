import { useContext, useState, memo } from "react";
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
function ProfileButton(props: { text: string, onClick: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const profileButton: React.CSSProperties = {
        fontSize: "30px",
        fontWeight: 'bold',
        margin: '5px',
        width: '100%',
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isHovered ? '#EDA13E' : 'transparent',
        color: isHovered ? '#1B242E' : 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, color 0.3s ease'
    };
    return (
        <div style={profileButton}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={props.onClick}>
            {props.text}
        </div>
    );
}

function ProfileLanding(props: {}) {
    //handling clicks
    const handleAccountClick = () => {
        console.log("Your Account clicked");
    };

    const handleRequestsClick = () => {
        console.log("Your Requests clicked");
    };

    const handleHistoryClick = () => {
        console.log("Transaction History clicked");
    };

    const handleAboutClick = () => {
        console.log("About clicked");
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
        }}>
            <ProfileButton text="Your Account" onClick={handleAccountClick}></ProfileButton>
            <ProfileButton text="Your Requests" onClick={handleRequestsClick}></ProfileButton>
            <ProfileButton text="Transaction History" onClick={handleHistoryClick}></ProfileButton>
            <ProfileButton text="About" onClick={handleAboutClick}></ProfileButton>
        </div>

    );
}

//react was re-rendering profileItem every hover state for the back button, so we memoize it.
const ProfileItem = memo(function ProfileItem(props: { title: string, value: string, profilePic?: string, email: string, onClick?: () => void }) {
    console.log("User is: " + props.value);
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
        <div style={{ padding: padding, width: "100%", display: "flex", alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: padding, width: '100%', display: "flex", justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ padding: padding }}>
                    <div style={{ borderRadius: "50%" }}>
                        {props.profilePic ? (
                            <img src={props.profilePic} alt="Profile" style={{ borderRadius: "50%" }} ></img>)
                            :
                            (<div style={defaultProfile}>{getInitials(props.value)}</div>)
                        }

                    </div>
                </span >
                <div style={{ padding: padding, display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', }}>
                    <span style={{ padding: padding, paddingBottom: '0', display: 'flex', fontSize: "36px", fontWeight: "bold" }}>
                        {props.value}
                    </span>
                    <span style={{ padding: padding, paddingTop: '0' }}>{ //starting all emails with upper case
                        props.email.substring(0, 1).toUpperCase() + props.email.substring(1)}</span>
                </div>

            </div>

        </div >
    );
}
);

export default function Profile() {
    const usc = useContext(UserSessionContext)
    const user = usc.user;
    const cookies = getCookies();
    const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
    // user.name
    // user.email
    const backButtonStyle: React.CSSProperties = {
        position: 'absolute',
        left: '15px',
        border: 'none',
        backgroundColor: 'transparent',
        color: isBackButtonHovered ? '#EDA13E' : 'white',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'color 0.3s ease',
    };

    const handleBackClick = () => {
        console.log("Back button clicked");
        // Add your navigation logic here
    };
    return (
        <div className={"App-body-top"}>
            <div style={headerStyle}>
                <div style={headerTitleStyle}>
                    <TZHeader title="Your Profile" />
                </div>
                <button style={backButtonStyle}
                    onMouseEnter={() => setIsBackButtonHovered(true)}
                    onMouseLeave={() => setIsBackButtonHovered(false)}
                    onClick={handleBackClick}>
                    Back
                </button>
            </div>

            <div style={styles}>
                <ProfileItem title="Name" value={usc.user.name} profilePic={user.image} email={user.email}></ProfileItem>
                <ProfileLanding></ProfileLanding>
                <TZButton title={"Logout"} onClick={() => Logout(cookies)}></TZButton>
            </div>
        </div>
    )
};

// Function to extract initials from a name
const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(name => name.charAt(0).toUpperCase()).join('');
    return initials.substring(0, 2);
};

const styles: React.CSSProperties = {
    paddingRight: padding,
    paddingLeft: padding,
    width: "100%",
    maxWidth: "600px",
    margin: '0 auto'
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
};

const headerTitleStyle: React.CSSProperties = {
    flexGrow: 1,
    textAlign: 'center',
    fontSize: '24px',
    color: 'white',
    fontWeight: 'bold',
};