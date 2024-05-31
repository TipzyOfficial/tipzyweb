import FlatList from "flatlist-react/lib";
import Song from "../../components/Song";
import { Colors, radius } from "../../lib/Constants";
import { dateTimeParser, dateTimeParserString } from "../../lib/datetime";
import { SongRequestType } from "../../lib/song";
import { useContext, useEffect, useState } from "react";
import { fetchWithToken } from "../..";
import { UserSessionContext } from "../../lib/UserSessionContext";
import { parseRequest, parseRequests } from "./Bar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown as faDown, faChevronUp as faUp,  } from "@fortawesome/free-solid-svg-icons";

const RequestsContent = (props: {pending: SongRequestType[], padding: number}) => {
    const usc = useContext(UserSessionContext);
    const padding = props.padding
    const rqp = 8;
    const [allReqs, setAllReqs] = useState<SongRequestType[]>([])
    const [pendingVisible, setPendingVisible] = useState(true);
    const [completedVisible, setCompletedVisible] = useState(false);

    useEffect(() => {
        getCompleted();
    }, [])

    const getCompleted = async () => {
        console.log("getting complted")
        
        const reqs = await fetchWithToken(usc.user, `tipper/requests/all/`, 'GET').then(r => r.json()).then(json => {
            const reqs = new Array<SongRequestType>();
            console.log("got completed")

            json.data.forEach((r: any) => {
                const req = parseRequest(r);
                if(req.status !== "PENDING") reqs.push(req);
            })
            return reqs;
        });
        

        setAllReqs(reqs);
    }

    const setCompleted = async (v: boolean) => {
        if(!v) {
            setCompletedVisible(false);
            return;
        }

        // await getCompleted();

        setCompletedVisible(true);
    }

    const RenderItem = (props: {request: SongRequestType}) => {
        const dt = dateTimeParser(props.request.date.toISOString());
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
            <div style={{paddingTop: padding, width: '100%'}}>
                <div style={{paddingBottom: rqp-3, paddingLeft: rqp, paddingRight: rqp, paddingTop: rqp-3,
                     backgroundColor: "#8883", width: '100%', borderRadius: radius}}>
                    <span style={{paddingBottom: rqp-3, display: 'block'}}>{props.request.bar.name}</span>
                    <Song song={props.request.song}></Song>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                        <span className="App-tinytext" style={{display: 'block', color: '#888'}}>{dateTimeParserString(dt)}</span>
                        <span style={{color: statusColor}}>{props.request.status}</span>
                    </div>
                </div>
            </div>
        )
    }

    return(
    <div style={{justifyContent: 'flex-start', alignItems: 'flex-start', flex: 1, display: 'flex', flexDirection: 'column'}}>
        <div style={{paddingLeft: padding, paddingRight: padding, width: '100%', display: 'flex', flexDirection: 'column'}}>
            <ExpandHeader text="Pending" onClick={() => setPendingVisible(!pendingVisible)} expanded={pendingVisible}></ExpandHeader>
            {pendingVisible ? <FlatList
                list={props.pending}
                renderWhenEmpty={() => <></>}
                renderItem={(item) => <RenderItem request={item} key={item.id}/>}
            /> : <></>}
            <ExpandHeader text="Completed" onClick={() => setCompleted(!completedVisible)} expanded={completedVisible}></ExpandHeader>
            {completedVisible ? <FlatList
                list={allReqs}
                renderWhenEmpty={() => <></>}
                renderItem={(item) => <RenderItem request={item} key={item.id}/>}
            /> : <></>}
        </div>
    </div>);
}

const ExpandHeader = (props: {onClick: () => void, expanded: boolean, text: string}) => {
 return(
    <div onClick={props.onClick} style={{alignItems: 'center', position: "sticky", top: 50}}>
        <span className="App-tertiarytitle">{props.text} </span>
        {props.expanded ? 
            <FontAwesomeIcon className="App-tertiarytoggle" icon={faUp}></FontAwesomeIcon>
        : 
            <FontAwesomeIcon className="App-tertiarytoggle" icon={faDown}></FontAwesomeIcon>
        }
    </div>
 )
}

export default RequestsContent;