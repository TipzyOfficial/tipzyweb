import { useContext } from "react";
import { padding } from "../../lib/Constants";
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

const defaultImage = "src/pages/profile/tempProfPic.png";


function ProfileItem(props: { title: string, value: string, profilePic?: string, onClick?: () => void }) {
    console.log("Profile Name is: " + props.value);
    const defaultProfile: React.CSSProperties = {
        width: "100px", // Adjust size as needed
        height: "100px", // Adjust size as needed
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
        <div style={{ padding: padding, width: "100%", backgroundColor: "red", display: "flex", }}>
            <span style={{ backgroundColor: "purple", padding: padding }}>
                <div style={{ backgroundColor: "pink", borderRadius: "50%" }}>
                    {props.profilePic ? (
                        <img src={props.profilePic} alt="Profile" style={{ borderRadius: "50%" }} ></img>)
                        :
                        (<div style={defaultProfile}>{getInitials(props.value)}</div>)
                    }

                </div>
            </span >
            <span style={{ backgroundColor: "blue", padding: padding }}>
                {props.title}:
            </span>
            <span style={{ backgroundColor: "orange", padding: padding }}>
                {props.value}
            </span>
        </div >
    );
}

export default function Profile() {
    const usc = useContext(UserSessionContext)
    const user = usc.user;
    const cookies = getCookies();
    const profilePic = user.image;
    // user.name
    // user.email

    return (
        <div className={"App-body-top"}>
            <TZHeader title="Your Profile" />
            <div style={styles}>
                <ProfileItem title="Name" value={usc.user.name} profilePic={user.image}></ProfileItem>
                <TZButton title={"logout"} onClick={() => Logout(cookies)}></TZButton>
            </div>
        </div>
    )
}

// Function to extract initials from a name
const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(name => name.charAt(0).toUpperCase()).join('');
    return initials;
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