import { Colors, padding } from "../lib/Constants";


export default function TZHeader(props: {title: string, leftComponent?: JSX.Element, rightComponent?: JSX.Element, }){
    return(
        <div className="App-headertop"
            style={{position: 'sticky', 
            top: 0,
            padding: padding,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'space-between',
            flexDirection: 'row',
            width: '100%', 
            backgroundColor: Colors.background
            }}>
            {props.leftComponent ?? <div></div>}
            <span className="App-headertitle">{props.title}</span>
            {props.rightComponent ?? <div></div>}
        </div>
    );
}