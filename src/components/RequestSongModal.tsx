import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, useFdim } from "../lib/Constants";
import { SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import { artistsStringListToString } from "./Song";
import PaymentSetup from "../pages/profile/PaymentSetup";
import { useContext, useState } from "react";
import TZButton from "./TZButton";
import { fetchWithToken } from "..";
import { UserSessionContext } from "../lib/UserSessionContext";

export default function RequestSongModal(props: {song: SongType | undefined, show: boolean, handleClose: () => void}) {
    const dims = useFdim()/2;
    const song: SongType = props.song ?? {id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false}
    const [paymentScreenVisible, setPaymentScreenVisible] = useState(false);
    const userContext = useContext(UserSessionContext);

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
                                <PaymentSetup/>
                            </Col>
                        </Row>
                    </Container>                
                </Modal.Body>
            </>
        )
    }

    function RequestScreen() {

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

        function onRequestClick(): void {
            // setPaymentScreenVisible(true);
            // fetch(`https://de07-201-235-133-111.ngrok-free.app/get_saved_payment3/`, {
            //     method: 'GET',
            //     headers: {
            //         // Authorization: `Bearer ${myAccessToken}`,
            //         'Content-Type': 'application/json'
            //     },
            // }).then(r => console.log(r.status)).catch((e) => console.log(e));

            sendRequest().then(r => {
                if(r === 0) alert("Your request failed for some reason. You have not been charged.");
                else alert("Your request was made! Hopefully it gets accepted :)")
            });

            props.handleClose()
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
                                        title={"$1.50"}
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