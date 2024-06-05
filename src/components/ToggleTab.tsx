import { Colors, padding, radius } from "../lib/Constants";
import '../App.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle as faNoti } from "@fortawesome/free-solid-svg-icons";


const ToggleTab = (props: {
    labels: Array<string> | Array<{label: string, noti: boolean}>,
    value: number, setValue: (value: number) => void
}) => {

    const v = props.value;
    const sv = props.setValue;
    const backgroundColor = "#8883";
    const activeColor = Colors.secondaryDark;

    const ToggleComponent = (props: {label: string, value: number, noti?: boolean}) => {
        return(
            <div style={{
                boxShadow: props.value === v ? '0px 0px 10px rgba(23, 23, 30, 0.9)' : 'none',
                flex: 1,
                display: "flex",
                justifyContent: 'center',
                borderRadius: radius,
            }}>
                <button style={{
                    flex: 1,
                    padding: 8, 
                    backgroundColor: props.value === v ? activeColor : "#0000", 
                    zIndex: props.value === v ? 1 : 0,
                    borderRadius: radius,
                    color: 'white',
                    borderWidth: 0,
                    transition: 'background-color ease 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={() => sv(props.value)}
                >
                    <span className="App-toggletitle">{props.label}</span>
                    <div style={{paddingLeft: padding/2}}></div>
                    {props.noti ? <FontAwesomeIcon icon={faNoti} color={Colors.secondaryRegular}></FontAwesomeIcon> : <></>}
                </button>
            </div>

        );
    }

    return(
        <div style={{width: '100%'}}>
            <div style={{width: '100%', 
                backgroundColor: backgroundColor,
                borderRadius: radius, 
                display: "flex",
                overflow: 'hidden'
                }}>
                {props.labels.map((e, i) => {
                    if(typeof e === 'string') return <ToggleComponent label={e} value={i} key={e+"i"+i}/>
                    return <ToggleComponent label={e.label} noti={e.noti} value={i} key={e.label+"i"+i}/>
                })}
            </div>
        </div>
    )
}

export default ToggleTab;