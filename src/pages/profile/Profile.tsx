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

function ProfileItem(props: { title: string, value: string, onClick?: () => void }) {
    return (
        <div style={{ padding: padding, width: "100%", backgroundColor: "red", display: "flex" }}>
            <span style={{ backgroundColor: "purple", padding: padding }}>
                <div style={{ backgroundColor: "pink", borderRadius: "50%" }}>
                    <img></img>
                </div>
            </span>
            <span style={{ backgroundColor: "blue", padding: padding }}>
                {props.title}:
            </span>
            <span style={{ backgroundColor: "orange", padding: padding }}>
                {props.value}
            </span>
        </div>
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
                <ProfileItem title="Name" value={usc.user.name}></ProfileItem>
                <TZButton title={"logout"} onClick={() => Logout(cookies)}></TZButton>
            </div>
        </div>
    )
}

const styles: React.CSSProperties = {
    paddingRight: padding,
    paddingLeft: padding,
    width: "100%"
}