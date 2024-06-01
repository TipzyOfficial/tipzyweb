import FlatList from "flatlist-react/lib";
import Song from "../../components/Song";
import { Colors, padding, radius } from "../../lib/Constants";
import { dateTimeParser, dateTimeParserString } from "../../lib/datetime";
import { SongRequestType, songRequestCompare } from "../../lib/song";
import { RefObject, memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchWithToken } from "../..";
import { UserSessionContext } from "../../lib/UserSessionContext";
import { fetchPendingRequests, parseRequest, parseRequests } from "./Bar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown as faDown, faChevronUp as faUp,  } from "@fortawesome/free-solid-svg-icons";
import { Spinner } from "react-bootstrap";

const RequestsContent = (props: {padding: number, height: number | undefined}) => {
    const usc = useContext(UserSessionContext);
    const padding = props.padding
    const rqp = 8;
    const [pendingReqs, setPendingReqs] = useState<SongRequestType[]>([])
    const [allReqs, setAllReqs] = useState<SongRequestType[]>([])
    const [pendingVisible, setPendingVisible] = useState(true);
    const [completedVisible, setCompletedVisible] = useState(true);
    const [pload, setPload] = useState(false);
    const [cload, setCload] = useState(false);
    const height = props.height ?? 0;
    const getPending = async () => {
        // setPload(true);
        await fetchPendingRequests(usc).then(u => {
            setPendingReqs(u.requests);
            // if(JSON.stringify(u) !== JSON.stringify(usc.user))
            //     usc.setUser(u);
        }).catch(() => 
            {
                setPload(false);
                setPendingReqs([]);
            });

        // setPload(false);
    }

    const getCompleted = async () => {
        // setCload(true);
        
        const reqs = await fetchWithToken(usc.user, `tipper/requests/all/`, 'GET').then(r => r.json()).then(json => {
            const reqs = new Array<SongRequestType>();
            console.log("got completed")

            json.data.forEach((r: any) => {
                const req = parseRequest(r);
                if(req.status !== "PENDING") reqs.push(req);
            })
            return reqs;
        }).catch(() => {setCload(false); return new Array<SongRequestType>()});

        // setCload(false)
        setAllReqs(reqs.sort(songRequestCompare));
    }

    useEffect(() => {
        console.log("ue")
        // alert("sorry");
        getPending();
        getCompleted();
    }, []);

    const RenderItem = memo((props: {request: SongRequestType}) => {
        // const dt = dateTimeParser(props.request.date.toISOString());
        let statusColor = Colors.primaryRegular;
        switch(props.request.status) {
            case "ACCEPTED":
                statusColor = Colors.green;
                break;
            case "PENDING":
                statusColor = Colors.primaryRegular;
                break;
            case "REJECTED":
                statusColor = Colors.secondaryRegular;
        }
        return(
            <div style={{paddingTop: padding, paddingLeft: padding, paddingRight: padding, width: '100%'}}>
                <div style={{paddingBottom: rqp-3, paddingLeft: rqp, paddingRight: rqp, paddingTop: rqp-3,
                     backgroundColor: statusColor+"77", width: '100%', borderRadius: radius}}>
                    <span style={{paddingBottom: rqp-3, display: 'block'}}>{props.request.bar.name}</span>
                    <Song song={props.request.song}></Song>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                        <span className="App-tinytext" style={{display: 'block', color: statusColor}}>{props.request.date.toLocaleString()}</span>
                        <span style={{color: statusColor}}>{props.request.status}</span>
                    </div>
                </div>
            </div>
        )
    })

    return(
    <div style={{justifyContent: 'flex-start', alignItems: 'flex-start', flex: 1, display: 'flex', flexDirection: 'column'}}>
        {/* <div style={{height: 1000, width: 100, backgroundColor: 'red'}}></div> */}
        <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
            <ExpandHeader zI={4} height={height} loading={pload} text="Pending" onClick={() => setPendingVisible(!pendingVisible)} expanded={pendingVisible}></ExpandHeader>
            {pload ? <></> : (pendingVisible ? <>
                <FlatList
                    list={pendingReqs}
                    renderWhenEmpty={() => <div style={{height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888'}}>Looks like you don't have any pending requests.</div>}
                    renderItem={(item) => <RenderItem request={item} key={item.id}/>}
                />                
                <div style={{paddingBottom: padding/2}}></div>
            </> : <></>)}
            <div style={{paddingBottom: padding/2}}></div>
            <ExpandHeader zI={5} height={height} loading={cload} text="Completed" onClick={() => setCompletedVisible(!completedVisible)} expanded={completedVisible}></ExpandHeader>
            {cload ? <></> : (completedVisible ? <>
                <FlatList
                    list={allReqs}
                    renderWhenEmpty={() => <div style={{height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888'}}>Looks like you don't have any completed requests.</div>}
                    renderItem={(item) => <RenderItem request={item} key={item.id}/>}
                />
                <div style={{paddingBottom: padding}}></div>
            </> : <></>)}
        </div>
    </div>);
}

const ExpandHeader = (props: {zI: number, onClick: () => void, expanded: boolean, loading?: boolean, text: string, height: number}) => {
    return(
    <div onClick={props.onClick} 
        style={{
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'space-between',
        cursor: 'pointer',
        backgroundColor: "#292935",
        paddingTop: padding,
        paddingBottom: padding,
        paddingLeft: padding,
        paddingRight: padding,
        position: 'sticky',
        top: props.height-1,
        float:"left",
        zIndex: props.zI,
        }}>
        <span className="App-tertiarytitle">{props.text}</span>
        <div style={{paddingLeft: 5}}>
            {props.loading ? 
                <Spinner size={"sm"}></Spinner>
            :(props.expanded ? 
                <FontAwesomeIcon className="App-tertiarytoggle" icon={faUp}></FontAwesomeIcon>
            : 
                <FontAwesomeIcon className="App-tertiarytoggle" icon={faDown}></FontAwesomeIcon>
            )}
        </div>
    </div>
 )
}

export default RequestsContent;