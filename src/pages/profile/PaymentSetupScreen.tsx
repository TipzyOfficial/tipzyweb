import { router } from "../../App";
import BackButton from "../../components/BackButton";
import TZHeader from "../../components/TZHeader";
import { padding } from "../../lib/Constants";
import PaymentSetup from "../../components/PaymentSetup";

export default function PaymentSetupScreen(){
    return(
        <div className="App-body-top">
                <TZHeader title={"Card details"} 
                leftComponent={<BackButton onClick={() => router.navigate(-1)}/>
                }/>
                <div style={{maxWidth: 400, padding: padding, textAlign: 'center'}}>
                    <span className="App-smalltext" style={{color: '#fffa'}}>
                        If you've already set up your card details with us, you don't have fill anything
                        out here unless you need to update your information. 
                    </span>
                </div>
                <PaymentSetup handleSubmit={() => {
                    alert("Successfully updated card details!");
                    router.navigate(-1);
                }}/>
                <div style={{padding: padding}}></div>
        </div>
    )
}