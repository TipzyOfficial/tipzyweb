import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, useFdim } from "../lib/Constants";
import { SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import { artistsStringListToString } from "./Song";
import PaymentSetup from "./PaymentSetup";
import { useContext, useState } from "react";
import TZButton from "./TZButton";
import { fetchWithToken } from "..";
import { UserSessionContext } from "../lib/UserSessionContext";

export default function RequestSongModal(props: {song: SongType | undefined, show: boolean, handleClose: () => void}) {
    const dims = useFdim()/2;
    const song: SongType = props.song ?? {id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false}
    const [paymentScreenVisible, setPaymentScreenVisible] = useState(false);
    const userContext = useContext(UserSessionContext);

    const sendRequest = async (): Promise<number> => {     
        if(!userContext.barState.bar) return 0;

        return await fetchWithToken(userContext.user, `tipper/request/?business_id=${userContext.barState.bar.id}`, "POST", JSON.stringify({
            track_id: song?.id ?? "",
            track_name: song?.title ?? "No title",
            artist: song ? artistsStringListToString(song.artists) : "No artist",
            image_url: song?.albumart ?? "",
            token_count: 0, //TODO: THIS NEEDS TO BE CHANGED
        })).then(response => {
            if(response === null) throw new Error("null response");
            if(!response.ok) throw new Error("Bad response " + response.status);    
            return 1;        
        }).catch((e: Error) => {
            return 0;
        });
        // }
    }

    const sendRequestClose = async () => {
        await sendRequest().then(r => {
            if(r === 0) alert("Failed to send your request. You won't been charged.");
            else alert("Your request was sent! Thank you for using Tipzy :)")
        });
        props.handleClose();
    }

    function PaymentScreen() {

        return (
            <>
                <Modal.Header closeButton>
                    <Modal.Title style={{color: 'white'}}>Set up payment</Modal.Title>
                </Modal.Header>
                <Modal.Body data-bs-theme="light">
                    <Container fluid>
                        <Row className="justify-content-md-center">
                            <Col>
                                <Modal.Body style={{textAlign: "center", padding: 0, color: 'white'}}>Please set up your payment info–we'll keep it on file for later.</Modal.Body>
                                <PaymentSetup handleSubmit={() => sendRequestClose()}/>
                            </Col>
                        </Row>
                    </Container>                
                </Modal.Body>
            </>
        )
    }

    function RequestScreen() {
        const [disabled, setDisabled] = useState(false);

        const checkStripe = async (): Promise<boolean> => {
            return fetchWithToken(userContext.user, `get_saved_payment3`,'GET')
            .then(r => r.json())
            .then(json => {
                console.log("json gsp", json)
                if(!json.has_method ) throw new Error("malformed json: no has_method.")
                return (json.has_method === "True")
            }).catch(e => {console.log(e); return false});
        }

        async function onRequestClick() {
            setDisabled(true);
            const hasStripe = await checkStripe();

            if(!hasStripe) setPaymentScreenVisible(true);
            else {
                sendRequestClose();
            }
            // fetch(`https://de07-201-235-133-111.ngrok-free.app/get_saved_payment3/`, {
            //     method: 'GET',
            //     headers: {
            //         // Authorization: `Bearer ${myAccessToken}`,
            //         'Content-Type': 'application/json'
            //     },
            // }).then(r => console.log(r.status)).catch((e) => console.log(e));

            // sendRequest().then(r => {
            //     if(r === 0) alert("Failed to send your request. You won't been charged.");
            //     else alert("Your request was sent! Thank you for using Tipzy :)")
            // });
        }

        return(<>
                <Modal.Header closeButton>
                    <Modal.Title style={{color: 'white'}}>Request a song</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid>
                        <Row className="justify-content-md-center">
                            <Col style={{display: 'flex', justifyContent: 'center'}}>
                            <img src={song.albumartbig ?? song.albumart} width={dims} height={dims} alt={song.title}/>
                            </Col>
                        </Row>
                        <Row className="justify-content-md-center">
                            <Col>
                                <Modal.Title style={{textAlign: "center", paddingTop: padding, color: 'white'}}>{song.title}</Modal.Title>
                                <Modal.Body style={{textAlign: "center", padding: 0, color: 'white'}}>{artistsStringListToString(song.artists)}</Modal.Body>
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Container fluid>
                        <Row className="justify-content-md-center">
                            <Col style={{display: 'flex', justifyContent: 'center'}}>
                                <div>
                                    <TZButton 
                                        fontSize={Math.min(30, dims/7)}
                                        disabled={disabled}
                                        title={"$2.00"}
                                        onClick={() => onRequestClick()}/>
                                </div>
                            </Col>
                        </Row>
                        <Row className="justify-content-md-center">
                            <Modal.Body style={{textAlign: "center", paddingTop: padding, color: 'white'}}>You'll only be charged for requests that a DJ accepts.</Modal.Body>
                        </Row>
                    </Container>
                </Modal.Footer>
            </>
        );
    }



    return(
        <Modal show={props.show} onShow={() => setPaymentScreenVisible(false)} onHide={props.handleClose} centered data-bs-theme={"dark"}>
            {paymentScreenVisible ? <PaymentScreen/> : <RequestScreen/>}
        </Modal>
    );
}