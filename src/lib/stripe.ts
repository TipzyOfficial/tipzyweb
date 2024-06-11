import { fetchWithToken } from "..";
import { UserSessionContextType } from "./UserSessionContext";
import { Consumer } from "./user";

export async function fetchPaymentSheetParams(usc: UserSessionContextType, update?: boolean) {
    console.log("sending!");

    if (update) {
        const secret = await fetchWithToken(usc, `update_default_payment/`, 'GET').then(r => {
            if (!r.ok) throw new Error("bad response: " + r.status)
            return r.json();
        }).then(json => {
            // console.log("update cls", json);
            return json;
        }).catch(e => { console.log(`bad create setup intent: ${e}`); return undefined });
        if ((secret) && (secret.clientSecret)) return secret.clientSecret;
    }

    const response = await fetchWithToken(usc, `create_setup_intent/`, 'POST').then(r => {
        if (!r.ok) throw new Error("bad response: " + r.status)
        return r.json();
    }).then(json => {
        // console.log(json);
        return json;
    }).catch(e => console.log(`bad create setup intent: ${e}`));

    if (response == null) return null;

    // if(!response.ok) throw new Error("bad response " + response.status + response);

    // const json = await response.json();

    // console.log(json);

    return response.clientSecret;
}
