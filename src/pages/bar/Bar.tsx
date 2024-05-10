import { Card, Container, Spinner } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { Colors, padding } from "../../lib/Constants";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import { useContext, useEffect, useState } from "react";
import { BarType } from "../../lib/bar";
import { fetchWithToken } from "../..";
import { UserSessionContext } from "../../lib/UserSessionContext";
import '../../App.css'

const LoadingScreen = () => 
    <div className="App-header">
        <Spinner style={{color: Colors.primaryRegular, width: 75, height: 75}}/>
        <br></br>
        <span>Loading bar information...</span>
    </div>;

export default function Bar(){
    const [searchParams, setSearchParams] = useSearchParams();
    const userContext = useContext(UserSessionContext);
    const [ready, setReady] = useState(false);
    const [bar, setBar] = useState<BarType | undefined>(undefined);
    const id = searchParams.get("id");

    useEffect(() => {
        fetchWithToken(userContext.user, `tipper/business/${id}`, 'GET').then(r => r.json())
        .then(json => {
            const bar: BarType = {
                id: json.id,
                name: json.business_name,
                type: json.business_type,
                image_url: json.image_url,
                description: json.description,
                active: json.active,
            }
            setBar(bar);
        })
        .catch(e => console.log(e));
    }, [])

    if(bar === undefined)
        return <LoadingScreen></LoadingScreen>

    return(
        <div  style={{height: "100vh", width: '100%'}}>
            <div style={{width: '100%', height: "30%", objectFit: 'cover', backgroundImage: `url(${bar.image_url})`, 
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                padding: padding,
                display: "flex",
                alignItems: 'flex-end',
                backgroundColor:"#000",
                boxShadow: 'inset 0px -30vh 30vh rgba(23, 23, 30, 0.8)'
            }}
            >
                <span className='App-title'>{bar.name}</span>
            </div>
            <Container fluid>
                
            </Container>
        </div>
    );
}

const styles = {
    title: {
        fontSize: 25,
        fontWeight: 'bold',
    },
}