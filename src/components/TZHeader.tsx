import { Colors, padding } from "../lib/Constants";


export default function TZHeader(props: {title: string, leftComponent?: JSX.Element, rightComponent?: JSX.Element, }){
    return(
        <div className="App-headertop"
            style={{position: 'sticky', 
            top: 0,
            paddingTop: padding,
            paddingBottom: padding,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            width: '100%', 
            backgroundColor: Colors.background + "cc"
            }}>
            <div style={{flex: 1}}>
                {props.leftComponent ?? <div></div>}
            </div>
            <span className="App-headertitleoneline" style={{flex: 4, textAlign: "center", paddingLeft: 5, paddingRight: 5, fontSize: props.title.length > 20 ? "calc(10px + 2vmin)" : undefined}}>{props.title}</span>
            <div style={{flex: 1}}>
                {props.rightComponent ?? <div></div>}
            </div>        
        </div>
    );
}