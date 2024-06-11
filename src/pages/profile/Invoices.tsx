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

type InvoicesType = {
    date: Date,
    invoices: InvoiceType[],
    total_amount: number,
}

type InvoiceType = {
    id: string,
    description: string,
    amount: number,
    currency: string,
    paid: boolean,
    bar: string,
    date: Date
}

function parseInvoiceJSON(e: any, desc?: string): InvoiceType {
    return { id: e.id, description: desc ?? e.metadata.song_info, amount: e.amount, currency: e.currency, paid: e.paid, bar: e.metadata.bar_name, date: new Date(parseInt(e.metadata.date)) };
}

export default function Invoices() {
    const [pendingVisible, setPendingVisible] = useState(true);
    const [completedVisible, setCompletedVisible] = useState(true);
    const [pending, setPending] = useState<InvoicesType | undefined>();
    const [completed, setCompleted] = useState<InvoicesType[]>([]);
    const [ready, setReady] = useState(false);
    const usc = useContext(UserSessionContext);
    const headerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | undefined>();

    const getInvoices = async () => {
        const json = await fetchWithToken(usc, `get_customer_invoice_items/`, 'GET').then(r => r.json());
        const pending = json["Pending items"];
        const completed = json["Invoices"];

        console.log(json);

        const p: InvoiceType[] = [];
        const c: InvoicesType[] = [];

        let pamnt = 0;

        pending.forEach((e: any) => {
            p.push(parseInvoiceJSON(e));
            pamnt += e.amount;
        })
        if (pamnt !== 0)
            setPending({ invoices: p, date: new Date(json.Next_charge_date * 1000), total_amount: pamnt / 100 });


        completed.forEach((e: any) => {
            let camnt = 0;
            const ci: InvoiceType[] = []
            e.invoice_items.forEach((ei: any) => {
                camnt += ei.amount;
                ci.push(parseInvoiceJSON(ei));
            })

            if (camnt !== 0)
                c.push({ invoices: ci, date: new Date(Date.parse(e.paid_date)), total_amount: camnt })
            // ci.push(parseInvoiceJSON(e));
        })


        setCompleted(c);

        setReady(true);
    }

    useLayoutEffect(() => {

    })

    useEffect(() => {
        getInvoices();
    }, []);

    const RenderSongItem = (props: { item: InvoiceType }) => {
        const item = props.item;
        return (
            <div style={{ width: "100%", paddingTop: padding / 2 }}>
                <div style={{ width: "100%", overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', flexDirection: 'column' }}>
                    <span className="App-smalltext" style={{ fontStyle: 'oblique', color: "#888", paddingLeft: 2 }}>
                        ID: {item.id}
                    </span>
                    <span className="App-smalltext">
                        {item.description}, amount: {item.currency === "usd" ? "$" : ""}{(item.amount / 100).toFixed(2)}
                    </span>
                </div>
            </div>
        )
    }

    const RenderInvoiceItem = (props: { item?: InvoicesType, pending?: boolean }) => {
        const item = props.item;

        if (!item) return (
            <div style={{ height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888' }}>No pending invoice. Go request something!</div>
        )

        return (
            <div style={{ width: "100%", paddingTop: padding }}>
                <div style={{ width: "100%", padding: padding, backgroundColor: "#8883", borderRadius: radius, display: 'flex', flexDirection: 'column' }}>
                    <span className="App-tertiarytitle">
                        ${item.total_amount.toFixed(2)}
                    </span>
                    <span className="App-smalltext">
                        {props.pending ? "Will process on:" : "Date processed:"} {`${item.date.toLocaleDateString()} at ${item.date.toLocaleTimeString()}`}
                    </span>
                    <FlatList
                        list={item.invoices}
                        renderItem={(item, key) => <RenderSongItem item={item} key={key} />}
                    >
                    </FlatList>
                </div>
            </div>
        )
    }

    return (
        <div className="App-body-top">
            <div ref={headerRef}
                style={{
                    position: 'sticky',
                    top: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: 'row',
                    width: '100%',
                }}
            >
                <TZHeader title={"Invoices"}
                    leftComponent={<BackButton onClick={() => router.navigate(-1)} />}
                    rightComponent={<HelpButton
                        text="Once your requested song gets accepted, you won't get charged immediately. Instead, we batch all payments you've made recently into a single invoice that gets charged to you every week. You can view your pending and past invoices here, as well as their processing date."></HelpButton>}
                />
            </div>
            <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: padding, paddingRight: padding, width: "100%" }}
            >
                <ExpandHeader zI={4} height={headerRef.current ? headerRef.current.clientHeight : 0} loading={!ready} text="Pending" onClick={() => setPendingVisible(!pendingVisible)} expanded={pendingVisible}>
                    <>
                        <RenderInvoiceItem item={pending} pending></RenderInvoiceItem>
                        <div style={{ padding: padding / 2 }}></div>
                    </>
                </ExpandHeader>
                <div style={{ padding: padding / 2 }}></div>
                <ExpandHeader zI={4} height={headerRef.current ? headerRef.current.clientHeight : 0} loading={!ready} text="Completed" onClick={() => setCompletedVisible(!completedVisible)} expanded={completedVisible}>
                    <FlatList
                        list={completed}
                        renderWhenEmpty={() => <div style={{ height: 50, justifyContent: 'center', alignItems: 'center', display: 'flex', color: '#888' }}>No completed invoices–yet!</div>}
                        renderItem={(item, key) => <RenderInvoiceItem item={item} key={key}></RenderInvoiceItem>}
                    >
                    </FlatList>
                </ExpandHeader>
            </div>
        </div>
    )
}