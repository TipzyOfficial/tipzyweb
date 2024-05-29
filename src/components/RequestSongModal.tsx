import { Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, useFdim } from "../lib/Constants";
import { SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import { artistsStringListToString } from "./Song";
import PaymentSetup from "../pages/profile/PaymentSetup";
import { useState } from "react";
import TZButton from "./TZButton";

export default function RequestSongModal(props: {song: SongType | undefined, show: boolean, handleClose: () => void}) {
    const dims = useFdim()/2;
    const song: SongType = props.song ?? {id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false}
    const [paymentScreenVisible, setPaymentScreenVisible] = useState(false);

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
                                        onClick={() => {
                                        setPaymentScreenVisible(true)
                                        }}/>
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