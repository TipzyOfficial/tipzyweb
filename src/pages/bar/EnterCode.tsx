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

function BarRenderItem(props: { bar: BarType }) {
    const bar = props.bar;
    return (
        <div style={{ cursor: 'pointer' }} onClick={() => {
            router.navigate(`/bar?id=${bar.id}`)
        }}>
            <div style={{ width: "100%", padding: padding, backgroundColor: "#8883", borderRadius: radius, display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '100%' }}>

                    {bar.image_url ?
                        <img src={bar.image_url} alt={bar.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 50 }} />
                        : <div style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 50, backgroundColor: "#888" }} />
                    }
                </div>
                <div style={{ width: "100%", paddingLeft: padding, borderRadius: radius, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span className="text">
                        {bar.name}
                    </span>
                    <span className="App-tertiarytitle" style={{ color: Colors.tertiaryLight }}>
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
        const json = await fetchWithToken(userContext, `tipper/businesses`, 'GET').then((r) => r.json());
        const o: BarType[] = []
        json.forEach((e: any) => {
            if (e.active)
                o.push({
                    id: e.id,
                    name: e.business_name,
                    type: e.business_type,
                    description: e.description,
                    image_url: e.image_url,
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

    // console.log(userContext)
    return (
        <div className="App-body" >
            <div style={{ maxWidth: 350 }}>
                <div style={{ paddingTop: '5dvh', paddingBottom: padding }}>
                    <Container data-bs-theme="dark" >
                        <Card>
                            <Card.Header style={{ textAlign: 'center' }}>
                                <span>Scan a Tipzy QR code at your bar!</span>
                                <br></br>
                                <span>You can also ask a bartender for the bar's code and enter it here:</span>
                            </Card.Header>
                            <Card.Body>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8} style={{ width: "100%", fontSize: 25, textAlign: 'center', padding: 5 }}
                                    value={barID}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, '');
                                        setBarID(v);
                                    }}
                                ></input>
                                <div style={{ paddingTop: padding }}>
                                    <TZButton title="Continue" onClick={onClick} />
                                </div>
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
            </div>
        </div>
    )
}

export default EnterCode;