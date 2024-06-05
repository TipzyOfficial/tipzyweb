import { router } from "../../App";
import BackButton from "../../components/BackButton";
import TZHeader from "../../components/TZHeader";
import { padding, radius } from "../../lib/Constants";
import "../../App.css";
import HelpButton from "../../components/HelpButton";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { fetchWithToken } from "../..";
import { UserSessionContext } from "../../lib/UserSessionContext";
import { DisplayOrLoading } from "../../components/DisplayOrLoading";
import FlatList from "flatlist-react/lib";
import ExpandHeader from "../../components/ExpandHeader";
import '../../App.css';

type InvoiceType = {
    id: string,
    description: string,
    amount: number,
    currency: string,
    paid: boolean,
}

function parseInvoiceJSON (e: any, desc?: string): InvoiceType {
    return {id: e.id, description: desc ?? e.description, amount: e.amount, currency: e.currency, paid: e.paid};
}

export default function Invoices(){
    const [pendingVisible, setPendingVisible] = useState(true);
    const [completedVisible, setCompletedVisible] = useState(true);
    const [pending, setPending] = useState<InvoiceType[]>([]);
    const [completed, setCompleted] = useState<InvoiceType[]>([]);
    const [ready, setReady] = useState(false);
    const usc = useContext(UserSessionContext);
    const headerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>();

    const getInvoices = async () => {
        const json = await fetchWithToken(usc, `get_customer_invoice_items/`, 'GET').then(r => r.json());
        const pending = json["Pending items"];
        const completed = json["Invoices"];

        const p: InvoiceType[] = [];
        const c: InvoiceType[] = [];

        pending.forEach((e: any) => {
            p.push(parseInvoiceJSON(e, "This is the amount of money that is yet to be charged to your account–you only get charged if your requested song gets accepted! Currently, invoices are processed every Monday morning."));
        })

        completed.forEach((e: any) => {
            c.push(parseInvoiceJSON(e, "Payment has ben processed"));
        })

        setPending(p);
        setCompleted(c);

        setReady(true);
    }

    useLayoutEffect(() => {

    })

    useEffect(() => {
        getInvoices();
    }, []);

    const RenderItem = (props: {item: InvoiceType}) => {
        const item = props.item;
        return(
            <div style={{width: "100%", paddingTop: padding}}>
                <div style={{width: "100%", padding: padding, backgroundColor: "#8883", borderRadius: radius, display: 'flex', flexDirection: 'column'}}>
                    <span className="App-tertiarytitle">
                        {item.paid ? "Paid Invoice" : "Pending Invoice"}
                    </span>
                    <span className="App-smalltext">
                        Amount: {item.currency === "usd" ? "$" : ""}{(item.amount/100).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            useGrouping: false
                        })}
                    </span>
                    <span className="App-smalltext">
                        Description: {item.description}
                    </span>
                </div>
            </div>
        )
    }

    return(
        <div className="App-body-top">
            <div ref={headerRef} 
                style={{position: 'sticky', 
                top: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: 'row',
                width: '100%', 
            }}
            >
            <TZHeader title={"Invoices"} 
                leftComponent={<BackButton onClick={() => router.navigate(-1)}/>}
                rightComponent={<HelpButton 
                    text="Once your requested song gets accepted, you don't get charged immediately. Instead, we batch all payments you've made recently into a single invoice that gets charged to you every week. You can view your pending and past invoices here."></HelpButton>}
                />
            </div>
                <div
                    style={{flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: padding, paddingRight: padding, width: "100%"}}
                >
                    <ExpandHeader zI={4} height={headerRef.current ? headerRef.current.clientHeight : 0} loading={!ready} text="Pending" onClick={() => setPendingVisible(!pendingVisible)} expanded={pendingVisible}>
                        <>
                        <FlatList
                            list={pending}
                            renderWhenEmpty={() => <div style={{height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888'}}>No pending invoices. Go request something!</div>}
                            renderItem={(item, key) => <RenderItem item={item} key={item.id + key}></RenderItem>}
                        >
                        </FlatList>
                        <div style={{padding: padding/2}}></div>
                        </>
                    </ExpandHeader>
                    <div style={{padding: padding/2}}></div>
                    <ExpandHeader zI={4} height={headerRef.current ? headerRef.current.clientHeight : 0} loading={!ready} text="Completed" onClick={() => setCompletedVisible(!completedVisible)} expanded={completedVisible}>
                        <FlatList
                            list={completed}
                            renderWhenEmpty={() => <div style={{height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888'}}>No completed invoices–yet!</div>}
                            renderItem={(item, key) => <RenderItem item={item} key={item.id + key}></RenderItem>}
                        >

                        </FlatList>
                    </ExpandHeader>
                </div>
        </div>
    )
}