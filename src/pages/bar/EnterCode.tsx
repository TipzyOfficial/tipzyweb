import React, { useContext, useEffect, useState } from "react";
import { UserSessionContext } from "../../lib/UserSessionContext";
import '../../App.css'
import { Button, Card, Container } from "react-bootstrap";
import { Colors, padding, radius } from "../../lib/Constants";
import TZButton from "../../components/TZButton";
import { router } from "../../App";
import ProfileButton from "../../components/ProfileButton";
import { BarType } from "../../lib/bar";
import FlatList from "flatlist-react/lib";
import { fetchWithToken } from "../..";
import { fetchNoToken } from "../../lib/serverinfo";
import useWindowDimensions from "../../lib/useWindowDimensions";
import defaultBackground from "../../assets/entercode_background.png"
import defaultBarBackground from "../../assets/default_background.png"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
// import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";


function BarRenderItem(props: { bar: BarType }) {
    const bar = props.bar;
    return (
        <div style={{ cursor: 'pointer' }} onClick={() => {
            router.navigate(`/bar?id=${bar.id}`)
        }}>
            <div style={{ width: "100%", padding: padding, backgroundColor: "#8883", borderRadius: radius, display: 'flex', alignItems: 'center' }}>
                <div style={{
                    height: '100%', borderRadius: "100%", overflow: 'hidden',
                }}>

                    {bar.image_url && bar.image_url.length > 0 ?
                        <img src={bar.image_url} alt={bar.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 50, }} />
                        : <img src={defaultBarBackground} alt={bar.name} style={{
                            width: 50, height: 50, objectFit: "fill",
                            transform: `translateX(${Math.random() * 50}%) translateY(${Math.random() * 50}%) scale(${Math.random() + 2}) rotate(${Math.floor(Math.random() * 2) * 180}deg)`,//translate(${Math.floor(Math.random() * 50)}px,${Math.floor(Math.random() * 50)})px`, ${Math.floor(Math.random() * 100)}
                        }} />
                    }
                </div>
                <div style={{ width: "100%", paddingLeft: padding, borderRadius: radius, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span className="App-normaltext" style={{ fontWeight: 'bold' }}>
                        {bar.name}
                    </span>
                    <span className="App-smalltext" style={{ fontWeight: 500, color: Colors.tertiaryLight }}>
                        {bar.type}
                    </span>
                </div>
            </div>
            <div style={{ height: padding }}></div>
        </div>
    )
}

function EnterCode() {
    const userContext = useContext(UserSessionContext)
    const [barID, setBarID] = useState("");
    const [bars, setBarsIn] = useState<BarType[] | undefined>();
    const setBars = (b: BarType[]) => {
        if (JSON.stringify(b) !== JSON.stringify(bars)) setBarsIn(b);
    }

    const getBars = async () => {
        const json = await fetchNoToken(`tipper/businesses/`, 'GET').then((r) => r.json());
        const o: BarType[] = []
        json.forEach((e: any) => {
            if (e.active)
                o.push({
                    id: e.id,
                    name: e.business_name,
                    type: e.business_type,
                    description: e.description,
                    image_url: e.image_url,
                    allowingRequests: e.allowing_requests,
                    vibe: e.vibe,
                    active: e.active,
                })
        })

        setBars(o);
    }


    const onClick = () => {
        console.log("barid", barID)
        router.navigate(`/bar?id=${barID}`)
    }

    useEffect(() => {
        getBars();
    }, [])

    const mW = 600;

    // console.log(userContext)
    return (
        <div className="App-body-top" style={{
            backgroundImage: `url(${defaultBackground})`, backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundAttachment: "fixed",

        }}>
            <div className="App-body-top" style={{ maxWidth: mW, backgroundColor: "#0000" }}>
                <ProfileButton style={{
                    top: padding,
                    right: Math.max((useWindowDimensions().width - mW + padding) / 2, padding),
                    backgroundColor: "#0003",
                    WebkitBackdropFilter: 'blur(5px)',
                    backdropFilter: 'blur(5px)',
                    borderRadius: "100%"
                }} />
                <div style={{ paddingBottom: padding }} />
                <span className="App-subtitle" style={{ fontWeight: 500, padding: padding, width: "100%", }}>Welcome!</span>
                <div style={{ paddingBottom: padding }} />
                <div style={{ paddingLeft: padding, paddingRight: padding, width: "100%" }}>
                    <div style={{ padding: padding * 2, borderRadius: radius, borderStyle: 'solid', borderColor: 'white', borderWidth: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', width: "100%" }}>
                        <span className="App-tertiarytitle" style={{ fontWeight: 500, width: "100%", textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ paddingRight: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FontAwesomeIcon fontSize={"calc(8px + 1vmin)"} icon={faQuestionCircle}></FontAwesomeIcon></div>Don't see your bar on this page?
                        </span>
                        <span className="App-normaltext" style={{ width: "100%", textAlign: 'center', paddingBottom: padding }}>Ask a bartender for its unique code!</span>
                        <input
                            className="App-tertiarytitle"
                            type="text"
                            inputMode="numeric"
                            maxLength={8} style={{
                                width: "100%", maxWidth: 300, fontSize: "calc(20px + 1vmin)", textAlign: 'center', padding: 5,
                            }}
                            value={barID}
                            onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '');
                                setBarID(v);
                            }}
                        ></input>
                        <div style={{ paddingTop: padding, width: "100%", maxWidth: 300 }}>
                            <TZButton title="Continue" onClick={onClick} />
                        </div>
                    </div>
                    <div style={{ paddingTop: padding * 2 }}>
                        <span className="App-subtitle" style={{ fontSize: "calc(20px + 1vmin)", fontWeight: 'bold' }}>Bars near you</span>
                        <div style={{ padding: padding / 2 }}></div>
                        {bars ?
                            <FlatList
                                list={bars}
                                renderItem={(item, key) =>
                                    <div key={item.id + "k_" + key}>
                                        <BarRenderItem bar={item} />
                                    </div>
                                }
                            /> : <></>
                        }
                    </div>
                </div>
                {/* <div style={{ maxWidth: 350 }}>
                <div style={{ paddingTop: '5dvh', paddingBottom: padding }}>
                    <Container data-bs-theme="dark" >
                        <Card>
                            <Card.Header style={{ textAlign: 'center' }}>
                                <span>Scan a Tipzy QR code at your bar!</span>
                                <br></br>
                                <span>You can also ask a bartender for the bar's code and enter it here:</span>
                            </Card.Header>
                            <Card.Body>

                            </Card.Body>
                        </Card>
                    </Container>
                    <ProfileButton />
                </div>
                <div style={{ padding: padding / 2 }}>
                    <span className="App-tertiarytitle">Other bars near you:</span>
                    <div style={{ padding: padding / 2 }}></div>
                    {bars ?
                        <FlatList
                            list={bars}
                            renderItem={(item, key) =>
                                <div key={item.id + "k_" + key}>
                                    <BarRenderItem bar={item} />
                                </div>
                            }
                        /> : <></>
                    }
                </div>
            </div> */}
            </div>
        </div>
    )
}

export default EnterCode;