import { Alert, Button, Col, Container, Modal, Row } from "react-bootstrap";
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
import { useInterval } from "../lib/utils";
import { fetchNoToken } from "../lib/serverinfo";

export default function RequestSongModal(props: { song: SongType | undefined, show: boolean, handleClose: () => void }) {
    const dims = useFdim() / 2;
    const song: SongType = props.song ?? { id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false }
    const [paymentScreenVisible, setPaymentScreenVisible] = useState(false);
    const [success, setSuccess] = useState(false);
    const userContext = useContext(UserSessionContext);
    const [price, setPrice] = useState<number | undefined>(undefined);

    const getPrice = async () => {
        setPrice(undefined);

        const response = await fetchNoToken(`calc_dynamic_price/`, 'POST', JSON.stringify({
            business_id: userContext.barState.bar?.id
        })).catch(e => { throw e });

        const json = await response.json();

        setPrice(json.Dynamic_price);
    }

    const sendRequest = async (): Promise<number> => {
        if (!userContext.barState.bar) return 0;

        return await fetchWithToken(userContext, `tipper/request/?business_id=${userContext.barState.bar.id}`, "POST", JSON.stringify({
            track_id: song?.id ?? "",
            track_name: song?.title ?? "No title",
            artist: song ? artistsStringListToString(song.artists) : "No artist",
            image_url: song?.albumart ?? "",
            price: price,
            token_count: 0,
            explicit: song.explicit,
        })).then(response => {
            if (response === null) throw new Error("null response");
            if (!response.ok) throw new Error("Bad response " + response.status);
            // console.log("re", response) 
            return 1;
        }).catch((e: Error) => {
            console.log("error: ", e)
            return 0;
        });
        // }
    }

    const sendRequestClose = async () => {
        const r = await sendRequest();
        if (r === 0) {
            alert("Failed to send your request. You won't been charged.");
            props.handleClose();
            return;
        }

        // alert("Your request was sent! Thank you for using Tipzy :)");
        setSuccess(true);
        // useInterval(() => props.handleClose(), 500);
        setTimeout(() => props.handleClose(), 500);
    }

    function PaymentScreen() {

        return (
            <>
                <Modal.Header closeButton>
                    <Modal.Title style={{ color: 'white' }}>Set up payment</Modal.Title>
                </Modal.Header>
                <Modal.Body data-bs-theme="light">
                    <Container fluid>
                        <Row className="justify-content-md-center">
                            <Col>
                                <Modal.Body style={{ textAlign: "center", padding: 0, color: 'white' }}>Please set up your payment info–we'll keep it on file for later.</Modal.Body>
                                {success ?
                                    <>
                                        <div style={{ paddingTop: padding }}></div>
                                        <TZButton
                                            fontSize={Math.min(30, dims / 7)}
                                            completed={success}
                                            title={"$2.00"}
                                            backgroundColor={success ? Colors.green : undefined}
                                        />
                                    </>

                                    :
                                    <PaymentSetup handleSubmit={() => sendRequestClose()} />
                                }
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
            </>
        )
    }

    function RequestScreen() {
        const [disabled, setDisabled] = useState(false);

        const checkStripe = async (): Promise<boolean | null> => {
            return fetchWithToken(userContext, `get_saved_payment3`, 'GET')
                .then(r => r.json())
                .then(json => {
                    console.log("json gsp", json)
                    if (!json.has_method) throw new Error("malformed json: no has_method.")
                    return (json.has_method === "True")
                }).catch((e: Error) => { console.log(e); return null });
        }

        async function onRequestClick() {
            setDisabled(true);
            const hasStripe = await checkStripe();

            if (hasStripe === null) {
                console.log("Error getting Stripe. Are you sure you're logged in?")
            }
            else if (!hasStripe) setPaymentScreenVisible(true);
            else {
                sendRequestClose();
            }
        }

        return (<>
            <Modal.Header closeButton>
                <Modal.Title style={{ color: 'white' }}>Request a song</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>
                    <Row className="justify-content-md-center">
                        <Col style={{ display: 'flex', justifyContent: 'center' }}>
                            <img src={song.albumartbig ?? song.albumart} width={dims} height={dims} alt={song.title} />
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Col>
                            <Modal.Title style={{ textAlign: "center", paddingTop: padding, color: 'white' }}>{song.title}</Modal.Title>
                            <Modal.Body style={{ textAlign: "center", padding: 0, color: 'white' }}>{artistsStringListToString(song.artists)}</Modal.Body>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Container fluid>
                    <Row className="justify-content-md-center">
                        <Col style={{ display: 'flex', justifyContent: 'center' }}>
                            <div>
                                <TZButton
                                    fontSize={Math.min(30, dims / 7)}
                                    loading={disabled || price === undefined}
                                    completed={success}
                                    title={price ? `$${(price / 100).toFixed(2)}` : ""}
                                    backgroundColor={success ? Colors.green : undefined}
                                    onClick={() => onRequestClick()} />
                            </div>
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Modal.Body style={{ textAlign: "center", paddingTop: padding, color: 'white' }}>You'll only be charged for requests that a DJ accepts.</Modal.Body>
                    </Row>
                </Container>
            </Modal.Footer>
        </>
        );
    }



    return (
        <Modal show={props.show} onShow={() => {
            getPrice();
            setPaymentScreenVisible(false);
            setSuccess(false);
        }} onHide={props.handleClose} centered data-bs-theme={"dark"}>
            {paymentScreenVisible ? <PaymentScreen /> : <RequestScreen />}
        </Modal>
    );
}