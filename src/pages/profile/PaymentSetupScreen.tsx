import { router } from "../../App";
import BackButton from "../../components/BackButton";
import TZHeader from "../../components/TZHeader";
import { padding } from "../../lib/Constants";
import PaymentSetup from "../../components/PaymentSetup";
import HelpButton from "../../components/HelpButton";

export default function PaymentSetupScreen() {
    return (
        <div className="App-body-top">
            <TZHeader title={"Card details"}
                leftComponent={<BackButton />}
                rightComponent={<HelpButton text="If you've already set up your card details with us, you don't have fill anything out here unless you'd like to update your information."></HelpButton>}
            />
            <PaymentSetup update handleSubmit={() => {
                alert("Successfully updated card details!");
                router.navigate(-1);
            }} />
            <div style={{ padding: padding }}></div>
        </div>
    )
}