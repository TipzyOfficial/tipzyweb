import { useContext } from "react";
import { padding } from "../../lib/Constants";
import { UserSessionContext } from "../../lib/UserSessionContext";
import TZButton from "../../components/TZButton";
import { Logout } from "../..";
import { getCookies } from "../../App";
import TZHeader from "../../components/TZHeader";

function ProfileItem(props: {title: string, value: string, onClick?: () => void}) {
    return(
        <div style={{padding: padding, width: "100%", backgroundColor: 'red'}}>
            <span>
                {props.title}:
            </span>
            <span>
                {props.value}
            </span>
        </div>
    );
}

export default function Profile() {
    const usc = useContext(UserSessionContext)
    const cookies = getCookies();

    return(
        <div className={"App-body-top"}>
            <TZHeader title="Your Profile"/>
            <div style={{paddingRight: padding, paddingLeft: padding, width: "100%"}}>
                <ProfileItem title="Name" value={usc.user.name}></ProfileItem>
                <TZButton title={"logout"} onClick={() => Logout(cookies)}></TZButton>
            </div>
        </div>
    )
}