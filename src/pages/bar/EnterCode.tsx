import React, { useContext, useEffect, useState } from "react";
import { UserSessionContext } from "../../lib/UserSessionContext";
import '../../App.css'
import { Button, Card, Container } from "react-bootstrap";
import { padding } from "../../lib/Constants";
import TZButton from "../../components/TZButton";
import { getCookies, router } from "../../App";
import ProfileButton from "../../components/ProfileButton";

function EnterCode() {
    const userContext = useContext(UserSessionContext)
    const [barID, setBarID] = useState("");

    const onClick = () => {
        console.log("barid", barID)
        router.navigate(`/bar?id=${barID}`)
    }

    // console.log(userContext)
    return(
            <div style={{maxWidth: 350}}>
            <Container data-bs-theme="dark" >
                <Card>
                    <Card.Header style={{textAlign: 'center'}}>
                        <span>Scan a Tipzy QR code at your bar!</span>
                        <br></br>
                        <span>You can also ask a bartender for the bar's code and enter it here:</span>
                    </Card.Header>
                    <Card.Body>
                        <input 
                        type="text"
                        inputMode="numeric"
                        maxLength={8} style={{width: "100%", fontSize: 25, textAlign: 'center', padding: 5}}
                        value={barID}
                        onChange={(e) => {
                            const v = e.target.value.replace(/\D/g,'');
                            setBarID(v);
                        }}
                        ></input>
                        <div style={{paddingTop: padding}}>
                            <TZButton title="Continue" onClick={onClick}/>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
            <ProfileButton/>
        </div>
    )
}

export default EnterCode;