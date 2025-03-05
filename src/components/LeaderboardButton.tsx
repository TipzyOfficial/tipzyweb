import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Colors, useFdim } from "../lib/Constants"
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Col, Container, Modal, Row } from "react-bootstrap";

export default function LeaderboardButton(props: {}) {
    const [leaderboardShow, setLeaderboardShow] = useState(false);
    const fdim = useFdim();
    const dim = Math.min(fdim / 8, 60);

    const onClick = () => {
        setLeaderboardShow(!leaderboardShow);
    }

    return (
        <div
            onClick={onClick}
            style={{
                width: dim, height: dim, backgroundColor: Colors.primaryDark, borderRadius: dim,
                boxShadow: '0px 5px 5px rgba(23, 23, 30, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer'
            }}>
            <FontAwesomeIcon icon={faTrophy} fontSize={dim / 2} color={"white"} />
            <LeaderboardModal show={leaderboardShow} handleClose={() => setLeaderboardShow(false)} />
        </div>
    )
}

export const LeaderboardModal = (props: { show: boolean, handleClose: () => any }) => {
    return (
        <Modal
            dialogClassName="App-modal"
            show={props.show} onHide={props.handleClose} centered data-bs-theme={"dark"}>
            <Modal.Header closeButton>
                <Modal.Title style={{ color: 'white' }}><FontAwesomeIcon icon={faTrophy} /> Leaderboard</Modal.Title>
            </Modal.Header>
            <Modal.Body data-bs-theme="light">
                <Container fluid>
                    <Row className="justify-content-md-center">
                        <Col>
                            <Modal.Body style={{ textAlign: "center", padding: 0, color: 'white' }}>
                                Leaderboard!
                            </Modal.Body>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
        </Modal>
    )
}
