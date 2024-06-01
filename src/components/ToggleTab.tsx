import { Colors, padding, radius } from "../lib/Constants";
import '../App.css'


const ToggleTab = (props: {
    labels: Array<string>,
    value: number, setValue: (value: number) => void
}) => {

    const v = props.value;
    const sv = props.setValue;
    const backgroundColor = "#8883";
    const activeColor = Colors.secondaryDark;

    const ToggleComponent = (props: {label: string, value: number}) => {
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
                    backgroundColor: props.value === v ? Colors.secondaryDark : "#0000", 
                    zIndex: props.value === v ? 1 : 0,
                    borderRadius: radius,
                    color: 'white',
                    borderWidth: 0,
                    transition: 'background-color ease 0.3s',
                }}
                onClick={() => sv(props.value)}
                >
                    <span className="App-toggletitle">{props.label}</span>
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
                {props.labels.map((str, i) => <ToggleComponent label={str} value={i} key={str+"i"+i}/>)}
            </div>
        </div>
    )
}

export default ToggleTab;