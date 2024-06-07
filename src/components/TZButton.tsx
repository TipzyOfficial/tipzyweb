import { useState } from 'react';
import { Colors, padding, radius } from '../lib/Constants';
import { Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle as faSuccess } from '@fortawesome/free-solid-svg-icons';

function TZButton(props: { onClick?: () => void; title?: string, backgroundColor?: string, width?: number, disabled?: boolean, fontSize?: number, loading?: boolean, completed?: boolean }) {
    const [opacity, setOpacity] = useState(1);

    return (
        <button
            disabled={props.disabled || props.loading || props.completed}
            onClick={() => { if (!props.disabled && props.onClick) props.onClick() }}
            onPointerDown={() => {
                setOpacity(0.5);
            }}
            onPointerUp={() => {
                setOpacity(1);
            }}
            style={{
                padding: padding,
                backgroundColor: props.backgroundColor ?? Colors.secondaryDark,
                display: 'flex',
                justifyContent: 'center', alignItems: 'center',
                borderRadius: radius,
                width: props.width ?? "100%",
                boxSizing: "border-box",
                WebkitBoxSizing: "border-box",
                MozBoxSizing: "border-box",
                opacity: props.disabled ? 0.5 : opacity,
                border: 'none'
            }}>
            {props.completed ?
                <FontAwesomeIcon icon={faSuccess} fontSize={props.fontSize} color="white"></FontAwesomeIcon>
                :
                <>
                    <span className="App-tertiarytitle" style={{ color: "white", fontWeight: "bold", fontSize: props.fontSize }}>{props.title ?? ""}</span>
                    {props.loading ? <div style={{ paddingLeft: 5 }}><Spinner style={{ color: "white", paddingTop: 3 }} size='sm'></Spinner></div> : <></>}
                </>
            }

        </button>
    )
}

export default TZButton;