import { useContext, useState, memo } from "react";
import { padding, radius } from "../../lib/Constants";
import { UserSessionContext } from "../../lib/UserSessionContext";
import TZButton from "../../components/TZButton";
import { Logout } from "../..";
import { getCookies, router } from "../../App";
import TZHeader from "../../components/TZHeader";
import "../../App.css"

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
        fontWeight: 'bold',
        margin: '5px',
        width: '100%',
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isHovered ? '#EDA13E' : 'transparent',
        borderColor: isHovered ? "#8880" : "#8888",
        borderWidth: 1,
        borderStyle: "solid",
        padding: padding,
        color: isHovered ? '#1B242E' : 'white',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, color 0.3s ease'
    };
    return (
        <div style={profileButton}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={props.onClick}>
            <span className="App-tertiarytitle">{props.text}</span>
        </div>
    );
}

function ProfileLanding() {
    //handling clicks
    const handleAccountClick = () => {
        router.navigate("/account");
    };

    const handleHistoryClick = () => {
        console.log("Transaction History clicked");
    };

    const handleAboutClick = () => {
        router.navigate("/about");
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
            {/* <ProfileButton text="Your Requests" onClick={handleRequestsClick}></ProfileButton> */}
            {/* <ProfileButton text="Transaction History" onClick={handleHistoryClick}></ProfileButton> */}
            <ProfileButton text="Help & Privacy" onClick={handleAboutClick}></ProfileButton>
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
            <div style={{ width: '100%', display: "flex", justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <div style={{ borderRadius: "50%" }}>
                        {props.profilePic ? (
                            <img src={props.profilePic} alt="Profile" style={{ borderRadius: "50%" }} ></img>)
                            :
                            (<div style={defaultProfile}>{getInitials(props.value)}</div>)
                        }
                    </div>
                <div style={{ padding: padding, display: 'flex', flexDirection: 'column', alignItems: 'start', justifyContent: 'center', }}>
                    <span className="App-subtitle" style={{ padding: padding, paddingBottom: '0', display: 'flex' }}>
                        {props.value}
                    </span>
                    <span style={{ padding: padding, paddingTop: 0, color: "#888" }}>{props.email}</span>
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
        // position: 'absolute',
        // left: padding,
        paddingLeft: padding,
        border: 'none',
        backgroundColor: 'transparent',
        color: isBackButtonHovered ? '#EDA13E' : 'white',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'color 0.3s ease',
    };

    // const loc = useLocation();

    const handleBackClick = () => {
        router.navigate(-1);
    };

    console.log(user.email)

    return (
        <div className={"App-body-top"}>
            <TZHeader title="Your Profile" leftComponent={
                <div style={backButtonStyle}
                    onMouseEnter={() => setIsBackButtonHovered(true)}
                    onMouseLeave={() => setIsBackButtonHovered(false)}
                    onClick={handleBackClick}>
                    Back
                </div>
            }/>

            <div style={styles}>
                <ProfileItem title="Name" value={usc.user.name} profilePic={user.image} email={user.email}></ProfileItem>
                <ProfileLanding></ProfileLanding>
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