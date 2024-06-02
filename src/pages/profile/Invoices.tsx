import { router } from "../../App";
import BackButton from "../../components/BackButton";
import TZHeader from "../../components/TZHeader";
import { padding } from "../../lib/Constants";
import PaymentSetup from "./PaymentSetup";
import "../../App.css";

export default function Invoices(){
    return(
        <div className="App-body-top">
                <TZHeader title={"Payment details"} 
                leftComponent={<BackButton onClick={() => router.navigate(-1)}/>
                }/>
                <div style={{maxWidth: 550, padding: padding, textAlign: 'center', display: 'flex', flexDirection: 'column'}}>
                    <span className="App-smalltext" style={{paddingBottom: 5, color: '#fffa'}}>
                        Once your requested song gets accepted, you don't be charged automatically.
                        Instead, we batch all payments you've made recently into a single invoice that gets charged
                        to you every week.
                    </span>
                    <span className="App-smalltext" style={{paddingBottom: 5, color: '#fffa'}}>
                        You can view your pending and past invoices here.
                    </span>
                    <span className="App-smalltext" style={{paddingBottom: 5, color: '#fffa'}}>
                        (this page is under construction right now--sorry!)
                    </span>
                </div>

                <div style={{padding: padding}}></div>
        </div>
    )
}