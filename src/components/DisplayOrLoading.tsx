import Spinner from 'react-bootstrap/Spinner';

import '../App.css'
import { Colors } from '../lib/Constants';
import { useEffect } from 'react';

export function DisplayOrLoading(props: {content: JSX.Element, condition: boolean, loadingScreen?: JSX.Element}) {
    const color = "#888"
    const LoadingScreen = () => {

        // useEffect(() => {
        //     const handleBeforeUnload = (event: Event) => {
        //       event.preventDefault();
        //       // Custom logic to handle the refresh
        //       // Display a confirmation message or perform necessary actions
        //     };
        //     window.addEventListener('beforeunload', handleBeforeUnload);
        //     return () => {
        //       window.removeEventListener('beforeunload', handleBeforeUnload);
        //     };
        //   }, []);
        
        return(
        props.loadingScreen ?? 
        <div className="App-header">
        <Spinner animation="grow" style={{color: Colors.primaryRegular, width: 75, height: 75}}/>
        <br></br>
        <span>Getting user session...please don't reload!</span>
        </div>);
    }

    return( props.condition ?
        props.content
        : <LoadingScreen/>
    )
}