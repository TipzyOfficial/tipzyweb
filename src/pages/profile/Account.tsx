import { useContext, useState, memo } from "react";
import { padding, radius } from "../../lib/Constants";
import { UserSessionContext } from "../../lib/UserSessionContext";
import TZButton from "../../components/TZButton";
import { Logout, fetchWithToken } from "../..";
import { getCookies, router } from "../../App";
import TZHeader from "../../components/TZHeader";
import "../../App.css"
import { Cookie } from "universal-cookie";
import useWindowDimensions from "../../lib/useWindowDimensions";
import BackButton from "../../components/BackButton";
import TZProfileComponent from "../../components/TZProfileComponent";

function AccountComponent(props: { title: string, text: string }) {
    const profileButton: React.CSSProperties = {
        width: '100%',
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderColor: "#8888",
        borderWidth: 1,
        borderStyle: "solid",
        padding: padding,
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, color 0.3s ease'
    };
    return (
        <>
        <div style={profileButton}>
            <span className="App-tertiarytitle" style={{fontWeight: 'normal', color: "#aaa"}}>{props.title}:</span>
            <span className="App-tertiarytitle" style={{paddingLeft: 5, fontWeight: 'normal'}}>{props.text}</span>
        </div>
        <div style={{paddingBottom: padding}}></div>
        </>
    );
}


export default function Account() {
    const usc = useContext(UserSessionContext)
    const user = usc.user;
    const cookies = getCookies();

    // const loc = useLocation();

    function DeleteAccount(){
        const mr = Math.random()*1000000;
        const letters = ["L", "E", "S", "G", "T", "P", "Z", "Y", "B", "A"]
        const r = letters[(Math.floor(mr) % 10)] + letters[(Math.floor(mr/10) % 10)] + (mr).toString().substring(0,5);
        const s = prompt(
            `WARNINGL: You're about to permanently delete your account and all your data. This action is NOT REVERSIBLE and your transactions WILL NOT be refunded. ${"\n\n"} If you still want to continue, enter "${r}" below.`,
        )
        if(s === r) {
            fetchWithToken(user, `tipper/`, 'DELETE').then(r => {
                Logout(cookies);
            }).catch((e) => {alert(`Error: Problem deleting account: ${e}. Please try again later.`)})
        } else {
            alert("Account not deleted. You didn't enter in the right code.")
        }
    }

    const handleBackClick = () => {
        router.navigate(-1);
    };

    const handlePaymentDetails = () => {
        router.navigate("/paymentsetup");
    };

    const handleInvoices = () => {
        router.navigate("/invoices");
    };

    return (
        <div className={"App-body-top"}>
            <TZHeader title="Your Account" leftComponent={
                <BackButton onClick={handleBackClick}></BackButton>
            }/>
            <div style={styles}>
                <div>
                    <div style={{paddingBottom: padding/2}}>
                        <span className="App-tertiarytitle">Your Information</span>
                    </div>
                    <AccountComponent title="Name" text={user.name}></AccountComponent>
                    <AccountComponent title="Email" text={user.email}></AccountComponent>
                    <div style={{paddingBottom: padding/2}}>
                        <span className="App-tertiarytitle">Payments</span>
                    </div>
                    <TZProfileComponent text="Update Payment Details" onClick={handlePaymentDetails}></TZProfileComponent>
                    <TZProfileComponent text="View Your Invoices" onClick={handleInvoices}></TZProfileComponent>
                </div>
                <div style={{position: "absolute", bottom: padding, width: Math.min(600-padding*2, useWindowDimensions().width - padding*2)}}>
                    <TZButton title={"Log out"} onClick={() => Logout(cookies)}></TZButton>
                    <div style={{paddingBottom: padding}}></div>
                    <TZButton title={"Delete account"} backgroundColor="#800" onClick={DeleteAccount}></TZButton>
                </div>
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
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: "100%",
    maxWidth: "600px",
    margin: '0 auto'
};