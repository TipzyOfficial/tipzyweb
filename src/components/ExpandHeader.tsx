import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Spinner } from "react-bootstrap";
import { faChevronDown as faDown, faChevronUp as faUp,  } from "@fortawesome/free-solid-svg-icons";
import { padding } from "../lib/Constants";

const ExpandHeader = (props: {children?: JSX.Element, zI: number, onClick: () => void, expanded: boolean, loading?: boolean, text: string, height: number}) => {
    return(
    <>
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
    {(!props.loading && props.expanded) ? props.children : <></>}
    </>
 )
}

export default ExpandHeader;