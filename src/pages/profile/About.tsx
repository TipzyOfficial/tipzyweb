import { useContext, useState, memo } from "react";
import { padding, radius } from "../../lib/Constants";
import { UserSessionContext } from "../../lib/UserSessionContext";
import TZButton from "../../components/TZButton";
import { Logout } from "../..";
import { router } from "../../App";
import TZHeader from "../../components/TZHeader";
import "../../App.css"
import BackButton from "../../components/BackButton";

export default function About() {
    // const loc = useLocation();

    const handleBackClick = () => {
        router.navigate(-1);
    };

    return (
        <div className={"App-body-top"}>
            <TZHeader title="Help & Privacy" leftComponent={
                <BackButton onClick={handleBackClick}></BackButton>
            } />
            <div style={styles}>
                <span>To learn more about how we gather and use your data, please check out our <a href={"https://www.tipzy.app/privacy"} target="_blank" rel="noreferrer">privacy policy.</a></span>
                <div style={{ padding: padding }}></div>
                <span>{"\n"}Have a question, need to dispute a transaction or report a concern? Email us at <a href={"mailto:help@tipzy.app"}>help@tipzy.app</a>!</span>
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
    margin: '0 auto',
    display: "flex",
    flexDirection: 'column'
};