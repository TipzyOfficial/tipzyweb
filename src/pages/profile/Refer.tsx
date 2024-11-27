import { useContext, useState, memo, useEffect } from "react";
import { padding, radius } from "../../lib/Constants";
import { router } from "../../App";
import TZHeader from "../../components/TZHeader";
import "../../App.css"
import BackButton from "../../components/BackButton";
import QRCode from "react-qr-code";
import TZButton from "../../components/TZButton";
import { UserSessionContext, UserSessionContextType } from "../../lib/UserSessionContext";
import { fetchWithToken } from "../..";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { Spinner } from "react-bootstrap";

// 607 227 7092    520 esty st. $243
// $550

async function getReferralCode(usc: UserSessionContextType): Promise<string> {
    const json = await fetchWithToken(usc, `tipper/refer/`, 'GET').then((r) => r.json());
    if (json.status !== 200) throw new Error("Bad response" + json.status);
    return json.code;
    // return 
}

function QR(props: { url: string | undefined }) {

    const url = props.url

    return (
        <DisplayOrLoading loadingScreen={<div style={{ width: "100%", padding: padding }}><Spinner /></div>} condition={props.url !== undefined}>
            <div style={{ background: 'white', padding: padding, maxWidth: "50%", borderRadius: radius }}>
                <QRCode
                    style={{ height: "auto", width: "100%" }}
                    value={url ?? ""} />
            </div>
        </DisplayOrLoading>
    )
}

export default function Refer() {
    // const loc = useLocation();

    const [url, setUrl] = useState<string | undefined>(undefined);
    const origin = "https://app.tipzy.app";//window.location.origin
    const usc = useContext(UserSessionContext);

    const generateQRCode = async () => {
        const code = await getReferralCode(usc);
        setUrl(`${origin}/login?referral=${code}`);
    }
    useEffect(() => {
        generateQRCode();
    }, []);


    return (
        <div className={"App-body-top"}>
            <TZHeader title="Refer a Friend" leftComponent={
                <BackButton></BackButton>
            } />
            <div style={styles}>
                <span style={{ paddingBottom: padding }} className="App-normaltext">Referring a friend grants you both a free request!</span>
                <span style={{ paddingBottom: padding }} className="App-normaltext">Just scan the following QR code and create an account:</span>
                <QR url={url} />
            </div>
        </div>
    )
};

const styles: React.CSSProperties = {
    paddingRight: padding,
    paddingLeft: padding,
    height: "100%",
    width: "100%",
    maxWidth: "600px",
    margin: '0 auto',
    display: "flex",
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
};