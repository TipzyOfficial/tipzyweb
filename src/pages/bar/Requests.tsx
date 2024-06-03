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

const RequestsContent = (props: {padding: number, height: number | undefined, cload: boolean, 
    pr: SongRequestType[], cr: SongRequestType[]}) => {
    const usc = useContext(UserSessionContext);
    const padding = props.padding
    const rqp = 8;
    // const [pendingReqs, setPendingReqs] = useState<SongRequestType[]>([])
    // const [allReqs, setAllReqs] = useState<SongRequestType[]>([])
    const pendingReqs = props.pr;
    const allReqs = props.cr;
    const [tick, setTick] = useState(0);
    const [pendingVisible, setPendingVisible] = useState(true);
    const [completedVisible, setCompletedVisible] = useState(true);
    // const [cload, setCload] = useState(false);
    const cload = props.cload;
    const height = props.height ?? 0;
    const timeout = 5000;


    // const getCompleted = async (indicator: boolean) => {
        
    //     if(indicator) setCload(true);
        
    //     console.log("about to send!")
    //     const allr = await fetchWithToken(usc, `tipper/requests/all/`, 'GET').then(r => r.json()).then(json => {
    //         console.log("got back this: ", json)
    //         const reqs = new Array<SongRequestType>();
    //         const preqs = new Array<SongRequestType>();
    //         json.data.forEach((r: any) => {
    //             const req = parseRequest(r);
    //             if(req.status === "PENDING") preqs.push(req);
    //             else reqs.push(req);
    //         })
    //         return [preqs, reqs];
    //     }).catch(() => {setCload(false); return [new Array<SongRequestType>(), new Array<SongRequestType>()]});

    //     const [p, r] = allr;

    //     setPendingReqs(p.sort(songRequestCompare));
    //     setAllReqs(r.sort(songRequestCompare));

    //     setCload(false);
    // }
    

    // useEffect(() => {
    //     // alert("sorry");
    //     // getPending();
    //     if(tick === 0) getCompleted(true);
        
    //     console.log("tick", tick)
        
    //     const timer = setTimeout(() => {
    //         getCompleted(false).then(() => {
    //             if(tick === 0) setTick(2);
    //             else setTick(tick%2 === 0 ? tick+1 : tick-1);
    //         });
    //         return () => {
    //             console.log("out");
    //             clearTimeout(timer);
    //         }
    //     }, timeout)
    // }, [tick]);


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
                     backgroundColor: "#8882", width: '100%', borderRadius: radius}}>
                    <span style={{paddingBottom: rqp-3, display: 'block'}}>{props.request.bar.name}</span>
                    <Song song={props.request.song}></Song>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                        <span className="App-tinytext" style={{display: 'block', color: "#777"}}>{props.request.date.toLocaleString()}</span>
                        <span style={{color: statusColor}}>{props.request.status}</span>
                    </div>
                </div>
            </div>
        )
    })

    return(
    <div style={{justifyContent: 'flex-start', alignItems: 'flex-start', flex: 1, display: 'flex', flexDirection: 'column'}}>
        <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
            <ExpandHeader zI={4} height={height} loading={cload} text="Pending" onClick={() => setPendingVisible(!pendingVisible)} expanded={pendingVisible}></ExpandHeader>
            {cload ? <></> : (pendingVisible ? <>
                <FlatList
                    list={pendingReqs}
                    renderWhenEmpty={() => <div style={{height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888'}}>No pending requests.</div>}
                    renderItem={(item) => <RenderItem request={item} key={item.id}/>}
                />                
                <div style={{paddingBottom: padding/2}}></div>
            </> : <></>)}
            <div style={{paddingBottom: padding/2}}></div>
            <ExpandHeader zI={5} height={height} loading={cload} text="Completed" onClick={() => setCompletedVisible(!completedVisible)} expanded={completedVisible}></ExpandHeader>
            {cload ? <></> : (completedVisible ? <>
                <FlatList
                    list={allReqs}
                    renderWhenEmpty={() => <div style={{height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888'}}>No completed requests.</div>}
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
        boxShadow: '0px 5px 5px rgba(23, 23, 30, 0.5)',
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'space-between',
        cursor: 'pointer',
        backgroundColor: "#292935",
        padding: padding,
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