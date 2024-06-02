import { To } from "react-router-dom";
import { router } from "../../App";
import { Colors, padding } from "../../lib/Constants";

export function NotFoundPage(props: {title?: string, body: string, backPath:string|-1}){
    return (
        <div className="App-body" style={{display: 'flex', flexDirection: 'column', textAlign: 'center', padding: padding}}>
            <span className="App-title" style={{color: Colors.primaryRegular,paddingBottom: padding}}>{props.title ?? "Oops!"}</span>
            <span>{props.body}</span>
            <span style={{color: Colors.primaryRegular, fontWeight: 'bold', cursor: 'pointer'}} onClick={() => {
                if(props.backPath === -1) router.navigate(props.backPath);
                else router.navigate(props.backPath);
            }}>Go back</span>
        </div>
    )
}