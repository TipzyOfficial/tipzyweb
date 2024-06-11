import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { FormEvent, useContext, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import TZButton from "./TZButton";
import { Colors, padding } from "../lib/Constants";
import { UserSessionContext } from "../lib/UserSessionContext";
import { fetchPaymentSheetParams } from "../lib/stripe";
import { Logout } from "..";
import { stripePromise } from "../App";
import { getCookies } from "../lib/utils";

export default function PaymentSetup(props: { handleSubmit?: () => void, update?: boolean }) {
    const [clientSecret, setClientSecret] = useState<string | undefined | null>(undefined);
    const usc = useContext(UserSessionContext);

    useEffect(() => {
        // Create SetupIntent as soon as the page loads
        fetchPaymentSheetParams(usc, props.update).then(
            (r) => {
                setClientSecret(r);
            }
        )
    }, []);

    if (clientSecret === null) {
        //Logout(usc, getCookies());
        return (<></>)
    }

    return (
        clientSecret ?
            <Elements
                stripe={stripePromise}
                options={{
                    clientSecret: clientSecret,
                    appearance: { theme: "night" }
                }}
            >
                <PaymentSetupInner handleSubmit={props.handleSubmit} />
            </Elements>
            :
            <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
                <Spinner style={{ color: Colors.primaryRegular, width: 75, height: 75 }}></Spinner>
            </div>
    )
}

function PaymentSetupInner(props: { handleSubmit?: () => void }) {
    const [disabled, setDisabled] = useState(false);

    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event: FormEvent) => {
        setDisabled(true);
        // We don't want to let default form submission happen here,
        // which would refresh the page.
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            // Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        const result = await stripe.confirmSetup({
            //`Elements` instance that was used to create the Payment Element
            elements,
            redirect: 'if_required'
        });

        if (result.error) {
            // Show error to your customer (for example, payment details incomplete)
            setDisabled(false);
            //console.log(result.error.message);
            alert(result.error.message);
        } else {
            // Your customer will be redirected to your `return_url`. For some payment
            // methods like iDEAL, your customer will be redirected to an intermediate
            // site first to authorize the payment, then redirected to the `return_url`.
            if (props.handleSubmit) props.handleSubmit();
        }
    };

    // return(
    //     clientSecret ? 
    //     <Elements 
    //     stripe={stripePromise} 
    //     options={{
    //         clientSecret: clientSecret,
    //         appearance: {theme: "night"}
    //     }}
    //     >
    //         <Outlet/>
    //     </Elements> : 
    //     <DisplayOrLoading condition={false}></DisplayOrLoading>
    // );

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <div style={{ paddingTop: padding }}>
                <TZButton title={"Submit"} loading={disabled} />
            </div>
        </form>
    );
}