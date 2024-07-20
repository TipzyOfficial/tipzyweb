import { Alert, Button, Col, Container, Modal, Row } from "react-bootstrap";
import { Colors, padding, useFdim } from "../lib/Constants";
import { PlayableType, SongType } from "../lib/song";
import './Song.css'
import { router } from "../App";
import { artistsStringListToString } from "./Song";
import PaymentSetup from "./PaymentSetup";
import { useContext, useEffect, useState } from "react";
import TZButton from "./TZButton";
import { fetchWithToken } from "..";
import { UserSessionContext } from "../lib/UserSessionContext";
import { useInterval } from "../lib/utils";
import { fetchNoToken } from "../lib/serverinfo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic } from "@fortawesome/free-solid-svg-icons";
import '../App.css'

export function RequestPlayableModal(props: { playable: PlayableType | undefined, show: boolean, handleClose: () => void, data?: any, refreshRequests?: () => Promise<void> }) {
    const song: SongType = props.playable?.song ?? { id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false };
    const userContext = useContext(UserSessionContext);

    const price = 100;

    // const [price, setPrice] = useState<number>(100);

    const getPrice = async () => {
        // setPrice(props.playable?.minPrice);

        // const response = await fetchNoToken(`calc_dynamic_price/`, 'POST', JSON.stringify({
        //     business_id: userContext.barState.bar?.id
        // })).catch(e => { throw e });

        // const json = await response.json();

        // setPrice(json.Dynamic_price);
    }


    useEffect(() => {
        console.log("everything rerendered")
    })

    const sendRequest = async (price: number): Promise<number> => {
        if (!props.playable) return 0;

        return await fetchWithToken(userContext, `tipper/liveartist/request/?set_item_id=${props.playable.id}`, "POST", JSON.stringify({
            price: price
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

    return <BasicRequestModal song={props.playable?.song} show={props.show} handleClose={props.handleClose} data={props.data} price={price} getPrice={getPrice} sendRequest={sendRequest} refreshRequests={props.refreshRequests} playable />
}

export default function RequestSongModal(props: { song: SongType | undefined, show: boolean, handleClose: () => void, data?: any, refreshRequests?: () => Promise<void> }) {
    const song: SongType = props.song ?? { id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false };
    const userContext = useContext(UserSessionContext);

    // const [price, setPrice] = useState<number | undefined>(undefined);

    // const getPrice = async () => {
    //     setPrice(undefined);

    //     const response = await fetchNoToken(`calc_dynamic_price/`, 'POST', JSON.stringify({
    //         business_id: userContext.barState.bar?.id
    //     })).catch(e => { throw e });

    //     const json = await response.json();

    //     setPrice(json.Dynamic_price);
    // }


    const sendRequest = async (price: number): Promise<number> => {
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
    return <BasicRequestModal song={song} show={props.show} handleClose={props.handleClose} data={props.data} sendRequest={sendRequest} price={undefined} getPrice={async () => { }} refreshRequests={props.refreshRequests} />
}

function BasicRequestModal(props: { song: SongType | undefined, show: boolean, handleClose: () => void, data?: any, sendRequest: (price: number) => Promise<number>, price: number | undefined, getPrice: () => Promise<void>, refreshRequests?: () => Promise<void>, playable?: boolean }) {
    const dims = useFdim() / 2;
    const song: SongType = props.song ?? { id: "-1", title: "No Title", artists: ["No artists"], albumart: "", explicit: false }
    const [paymentScreenVisible, setPaymentScreenVisible] = useState(false);
    const [success, setSuccess] = useState<undefined | boolean>(undefined);
    const userContext = useContext(UserSessionContext);
    const [masterPrice, setMasterPrice] = useState(props.price);

    const data = { selectedSong: song, ...props.data }

    const sendRequestClose = async (price: number | undefined) => {
        if (!price) return;
        const r = await props.sendRequest(price);
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
                                <Modal.Body style={{ textAlign: "center", padding: 0, color: 'white' }}>Please set up your payment info–we'll keep it on file for later. {"\n"}<span style={{ fontWeight: "bold" }}>Your charge: ${masterPrice ? (masterPrice / 100).toFixed(2) : "undefined"}</span></Modal.Body>
                                {success === true ?
                                    <>
                                        <div style={{ paddingTop: padding }}></div>
                                        <TZButton
                                            fontSize={Math.min(30, dims / 7)}
                                            completed={success}
                                            title={masterPrice ? `$${(masterPrice / 100).toFixed(2)}` : ""}
                                            backgroundColor={success ? Colors.green : success === false ? Colors.red : undefined}
                                        />
                                    </>

                                    :
                                    <PaymentSetup handleSubmit={() => sendRequestClose(masterPrice)} />
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
        const [price, setPrice] = useState(masterPrice);

        const checkStripe = async (): Promise<boolean | null> => {
            return fetchWithToken(userContext, `get_saved_payment3`, 'GET', undefined, data)
                .then(r => r.json())
                .then(json => {
                    // console.log("json gsp", json)
                    if (!json.has_method) throw new Error("malformed json: no has_method.")
                    return (json.has_method === "True")
                }).catch((e: Error) => { console.log(e); return null });
        }

        async function onRequestClick(price: number | undefined) {
            setDisabled(true);
            setMasterPrice(price);
            const hasStripe = await checkStripe();
            if (hasStripe === null) {
                console.log("Error getting Stripe. Are you sure you're logged in?")
            }
            else if (!hasStripe) setPaymentScreenVisible(true);
            else {
                sendRequestClose(price);
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
                    {props.playable ?

                        <Row className="justify-content-md-center">
                            <Modal.Body style={{ textAlign: "center", paddingTop: 0, color: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: "column" }}>
                                    <span>Choose how much to pitch in for this song!</span>
                                    <div style={{ width: "80%", maxWidth: 400 }}>
                                        <input type="range" min={100} max={1000} value={price} onChange={(e) => setPrice(parseInt(e.target.value))} step={50} className="slider" />
                                    </div>
                                </div>
                            </Modal.Body>
                        </Row> : <></>
                    }
                    <Row className="justify-content-md-center">
                        <Col style={{ display: 'flex', justifyContent: 'center' }}>
                            {props.playable ?
                                <TZButton
                                    width={"auto"}
                                    fontSize={Math.min(30, dims / 7)}
                                    title={price ? `$${(price / 100).toFixed(2)}` : ""}
                                    loading={disabled || price === undefined}
                                    completed={success}
                                    backgroundColor={success === true ? Colors.green : success === false ? Colors.red : undefined}
                                    onClick={() => onRequestClick(price)} />
                                :
                                <TZButton
                                    width={"auto"}
                                    fontSize={Math.min(30, dims / 7)}
                                    loading={disabled || price === undefined}
                                    completed={success}
                                    title={price ? `$${(price / 100).toFixed(2)}` : ""}
                                    backgroundColor={success === true ? Colors.green : success === false ? Colors.red : undefined}
                                    onClick={() => onRequestClick(price)} />
                            }
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Modal.Body style={{ textAlign: "center", paddingTop: padding, color: 'white' }}>You'll only be charged for requests that are accepted.</Modal.Body>
                    </Row>
                </Container>
            </Modal.Footer>
        </>
        );
    }

    const getPrice = async () => {
        setMasterPrice(undefined);

        const response = await fetchNoToken(`calc_dynamic_price/`, 'POST', JSON.stringify({
            business_id: userContext.barState.bar?.id
        })).catch(e => { throw e });

        const json = await response.json();

        setMasterPrice(json.Dynamic_price);
    }

    return (
        <Modal
            dialogClassName="App-modal"
            show={props.show} onShow={() => {
                if (!props.playable) getPrice()
                console.log(props.song)
                setPaymentScreenVisible(false);
                setSuccess(undefined);
            }} onHide={props.handleClose} centered data-bs-theme={"dark"}>
            {paymentScreenVisible ? <PaymentScreen /> : <RequestScreen />}
        </Modal>
    );
}