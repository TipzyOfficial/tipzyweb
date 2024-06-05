import { useContext, useState, memo, useEffect } from "react";
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
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { Spinner } from "react-bootstrap";

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

type CardDetailsType = {
    brand: string,
    last4: string,
    expMonth: number,
    expYear: number,
}

export default function Account() {
    const usc = useContext(UserSessionContext)
    const user = usc.user;
    const cookies = getCookies();
    

    // const loc = useLocation();

    function CardDetails(){
        const [details, setDetails] = useState<CardDetailsType | undefined>();
        const [ready, setReady] = useState(false);

        async function getCardDetails() {
            const deets = await fetchWithToken(usc, `get_saved_card_details/`, 'GET').then((r) => r.json()).then((json) => {
                const d = json.card_details;
                return {brand: d.brand, last4: d.last4, expMonth: d.exp_month, expYear: d.exp_year}
            }).catch(() => {console.log("can't find payment details"); return undefined})

            setDetails(deets);
            setReady(true);
        }
        
        useEffect(() => {
            getCardDetails();
        }, [])

        return(
            <>
            <div style={{width: "100%", padding: padding, borderColor: "#8888", borderStyle: 'solid', borderWidth: 1, borderRadius: radius}}>
                <div style={{paddingBottom: padding/2}}>
                <span>Your card details:</span>
                </div>
                <DisplayOrLoading condition={ready} loadingScreen={<div style={{display: "flex", justifyContent: 'center', alignContent: 'center', padding: padding}}><Spinner></Spinner></div>}>
                    <div style={{width: "100%", padding: padding, backgroundColor: "#8883"}}>
                        {details ?
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span style={{fontFamily: 'monospace'}}>{details.brand.toUpperCase()} ****{details.last4}</span>
                                <span style={{fontFamily: 'monospace'}}>Expiration: {details.expMonth}/{details.expYear}</span>
                            </div>
                        :   <span>No card details saved–please update your payment information.</span>
                        }
                    </div>
                </DisplayOrLoading>
            </div>
            <div style={{paddingBottom: padding}}></div>
            </>
        )
    }

    function DeleteAccount(){
        const mr = Math.random()*1000000;
        const letters = ["L", "E", "S", "G", "T", "P", "Z", "Y", "B", "A"]
        const r = letters[(Math.floor(mr) % 10)] + letters[(Math.floor(mr/10) % 10)] + (mr).toString().substring(0,5);
        const s = prompt(
            `WARNINGL: You're about to permanently delete your account and all your data. This action is NOT REVERSIBLE and your transactions WILL NOT be refunded. ${"\n\n"} If you still want to continue, enter "${r}" below.`,
        )
        if(s === r) {
            fetchWithToken(usc, `tipper/`, 'DELETE').then(r => {
                Logout(usc, cookies);
            }).catch((e) => {alert(`Error: Problem deleting account: ${e}. Please try again later.`)})
        } else {
            alert("Account not deleted. You didn't enter in the right code.")
        }
    }

    const handleBackClick = () => {
        router.navigate(-1);
    };

    const handlePaymentDetails = () => {
        router.navigate("/payments");
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
                    <CardDetails/>
                    <TZProfileComponent text="Update Card Details" onClick={handlePaymentDetails}></TZProfileComponent>
                    <TZProfileComponent text="View Your Invoices" onClick={handleInvoices}></TZProfileComponent>
                </div>
                <div style={{position: "absolute", bottom: padding, width: Math.min(600-padding*2, useWindowDimensions().width - padding*2)}}>
                    <TZButton title={"Log out"} onClick={() => Logout(usc, cookies)}></TZButton>
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