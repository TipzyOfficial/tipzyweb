import { Alert, Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, useFdim } from "../lib/Constants";
import { PlayableType, SongType } from "../lib/song";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic } from "@fortawesome/free-solid-svg-icons";

export function RequestPlayableModal(props: { playable: PlayableType | undefined, show: boolean, handleClose: () => void, data?: any }) {
    const song: SongType = props.playable?.song ?? { id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false };
    const userContext = useContext(UserSessionContext);

    const [price, setPrice] = useState<number | undefined>(undefined);

    const getPrice = async () => {
        setPrice(props.playable?.minPrice);

        // const response = await fetchNoToken(`calc_dynamic_price/`, 'POST', JSON.stringify({
        //     business_id: userContext.barState.bar?.id
        // })).catch(e => { throw e });

        // const json = await response.json();

        // setPrice(json.Dynamic_price);
    }


    const sendRequest = async (): Promise<number> => {
        if (!props.playable) return 0;

        return await fetchWithToken(userContext, `tipper/liveartist/request/?set_item_id=${props.playable.id}`, "POST", JSON.stringify({
            price: 100
        })).then(response => response.json()).then(json => {
            console.log("json: ", json)
            if (json.status === 200) return 1;
            else if (json.status === 433) return 2;
            else if (json.status === 444) return 3;
            else if (json.status === 469) return 4;
            else throw new Error("Error: ", json)
            // console.log("re", response) 
        }).catch((e: Error) => {
            console.log("error: ", e)
            return 0;
        });
    }

    return <BasicRequestModal song={props.playable?.song} show={props.show} handleClose={props.handleClose} data={props.data} price={price} getPrice={getPrice} sendRequest={sendRequest} />
}

export default function RequestSongModal(props: { song: SongType | undefined, show: boolean, handleClose: () => void, data?: any, refreshRequests?: () => Promise<void> }) {
    const song: SongType = props.song ?? { id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false };
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
        })).then(response => response.json()).then(json => {
            // console.log("json: ", json)
            if (json.status === 200) return 1;
            else if (json.status === 433) return 2;
            else if (json.status === 444) return 3;
            else if (json.status === 469) return 4;
            else throw new Error("Error: " + json.detail)
            // console.log("re", response) 
        }).catch((e: Error) => {
            console.log("error: ", e)
            return 0;
        });
    }
    return <BasicRequestModal song={song} show={props.show} handleClose={props.handleClose} data={props.data} sendRequest={sendRequest} price={price} getPrice={getPrice} refreshRequests={props.refreshRequests} />
}

function BasicRequestModal(props: { song: SongType | undefined, show: boolean, handleClose: () => void, data?: any, sendRequest: () => Promise<number>, price: number | undefined, getPrice: () => Promise<void>, refreshRequests?: () => Promise<void> }) {
    const dims = useFdim() / 2;
    const song: SongType = props.song ?? { id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false }

    const [paymentScreenVisible, setPaymentScreenVisible] = useState(false);
    const [success, setSuccess] = useState<undefined | boolean>(undefined);
    const userContext = useContext(UserSessionContext);

    const data = { selectedSong: song, ...props.data }

    const sendRequestClose = async () => {
        const r = await props.sendRequest();
        if (r === 1) {
            setSuccess(true);
            if (props.refreshRequests)
                await props.refreshRequests();
        }
        else {
            setSuccess(false);
            switch (r) {
                case 2:
                    alert("This establishment isn't taking requests at the moment. Please come back later.");
                    break;
                case 3:
                    alert("This track has been accepted to be played recently. Please select another song or try requesting it later.");
                    break;
                case 4:
                    alert("This establishment doesn't allow explicit songs to be requested at this time.");
                    break;
                default:
                    alert("There was a problem sending that request–you won't be charged.");
                    break;

            }
        }

        // alert("Your request was sent! Thank you for using Tipzy :)");
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
                                {success === true ?
                                    <>
                                        <div style={{ paddingTop: padding }}></div>
                                        <TZButton
                                            fontSize={Math.min(30, dims / 7)}
                                            completed={success}
                                            title={"$2.00"}
                                            backgroundColor={success ? Colors.green : success === false ? Colors.red : undefined}
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
            return fetchWithToken(userContext, `get_saved_payment3`, 'GET', undefined, data)
                .then(r => r.json())
                .then(json => {
                    // console.log("json gsp", json)
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
            <Modal.Header className="m-auto" style={{ width: "100%" }}>
                <Modal.Title style={{ color: 'white', width: "100%", textAlign: 'center' }} className="m-auto">Request a song</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>
                    <Row className="justify-content-md-center">
                        <Col style={{ display: 'flex', justifyContent: 'center' }}>
                            {song.albumart ? <img style={{ objectFit: 'contain' }} src={song.albumartbig ?? song.albumart} width={dims} height={dims} alt={song.title} /> : <div style={{ height: dims, width: dims, backgroundColor: "#888", display: 'flex', justifyContent: 'center', alignItems: 'center' }}><FontAwesomeIcon color={"#fff8"} fontSize={dims / 3} icon={faMusic}></FontAwesomeIcon></div>}
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
                                    loading={disabled || props.price === undefined}
                                    completed={success}
                                    title={props.price ? `$${(props.price / 100).toFixed(2)}` : ""}
                                    backgroundColor={success === true ? Colors.green : success === false ? Colors.red : undefined}
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
        <Modal
            dialogClassName="App-modal"
            show={props.show} onShow={() => {
                props.getPrice();
                console.log(props.song)
                setPaymentScreenVisible(false);
                setSuccess(undefined);
            }} onHide={props.handleClose} centered data-bs-theme={"dark"}>
            {paymentScreenVisible ? <PaymentScreen /> : <RequestScreen />}
        </Modal>
    );
}