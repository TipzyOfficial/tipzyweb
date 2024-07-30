import { createContext, useEffect, useRef, useState } from 'react';
import { Consumer, Users } from './user'
import { SongRequestType, SongType } from './song';
import { Logout, checkIfAccountExists, consumerFromJSON, fetchWithToken, rootGetRefreshToken, storeTokens } from '../index'
import { BarType, LiveArtistType } from './bar';
import { DisplayOrLoading } from '../components/DisplayOrLoading';
import Cookies from 'universal-cookie';
import { useLocation } from 'react-router-dom';
import { getCookies, getStored } from './utils';
import { fetchBarInfo } from '../pages/bar/Bar';
import { fetchArtistInfo } from '../pages/artist/Artist';

export const defaultConsumer: () => Consumer = () => {
    const cookies = getCookies();
    return new Consumer(getStored("access_token") ?? "", parseInt(getStored("expires_at") ?? "0") ?? 0, "", -1)
}

export type ArtistStateType = {
    artist?: LiveArtistType,
    setArtist: (artist: LiveArtistType | undefined) => void
}

export type BarStateType = {
    bar?: BarType,
    setBar: (bar: BarType | undefined) => void
}

export type UserSessionContextType = {
    user: Consumer,
    setUser: (user: Consumer) => void; //do we even need this? or can i just load for asyncstorage
    barState: BarStateType;
    artistState: ArtistStateType;
    abortController?: AbortController;
}

const initBar = async (id?: number) => {
    return id ? fetchBarInfo(DefaultUserSessionContext, id, true) : undefined;
}

const initArtist = async (id?: number): Promise<LiveArtistType | undefined> => {
    return id ? { id: id, name: "", allowingRequests: false, minPrice: -1 } : undefined
    // fetchArtistInfo(DefaultUserSessionContext, id, true) : undefined;
}

export const DefaultUserSessionContext: UserSessionContextType = {
    user: new Consumer("", 0, "", -1),
    setUser: () => { },
    barState: {
        bar: undefined, setBar: () => { }
    },
    artistState: {
        artist: undefined, setArtist: () => { }
    },
}

// export const getStartingUser = async (): Promise<Consumer> => {
//     const cookies = getCookies();
//     const rt = cookies.get("refresh_token");
//     const dc = defaultConsumer();
//     // const ea = cookies.get("expires_at");
//     if(rt === null) return dc;
//     return checkIfAccountExists(dc).then(r => {
//         if(r.result){
//             return consumerFromJSON(undefined, r.data);
//         }
//         cookies.remove("refresh_token"); //bad refresh
//         cookies.remove("access_token"); //bad refresh
//         return dc;
//     })
// }


export const UserSessionContext = createContext<UserSessionContextType>(DefaultUserSessionContext);

export const getPending = async (usc: UserSessionContextType, ignoreReqs?: boolean): Promise<[SongRequestType[], number]> => {
    const p: SongRequestType[] = [];
    let ptc: number = 0;
    await fetchWithToken(usc, `tipper/requests/pending/`, 'GET').then(r => {
        return r.json();
    })
        .then(json => {
            const reqs = json.data;
            reqs.forEach((e: any) => {
                const sj = e.song_json;
                const bi = e.business_info;
                const s: SongType = { id: sj.id, title: sj.name, artists: [sj.artist], albumart: sj.image_url, explicit: false };
                const b: BarType = { id: bi.id, name: bi.business_name, type: bi.business_type, image_url: bi.image_url, description: bi.description, active: bi.active, allowingRequests: bi.allowing_requests }
                ptc += e.token_count ?? 0;
                p.push({ id: e.id, song: s, status: e.status, bar: b, date: new Date(e.request_time) })
            })
        })
        .catch((e: Error) => { console.log("problem getting pending: ", e) });

    return [p, ptc];
}

// const fetchTokenPendingData = async (user: Consumer) : Promise<[SongRequestType[], number, number]> => {
//     let pr: SongRequestType[] = [];
//     let tokens = 0;
//     let ptokens = 0;

//     await fetchWithToken(user, `get_tipper_account_tokens/`, 'GET').then((r: Response) => r.json()).then(json => {
//       tokens += json.token_amount;
//     }).catch((e: Error) => {console.log("problem getting tipzy tokens.", e);});

//     // console.log("fetch acc tokens");

//     //get the pending tokens
//     await getPending(user).then(r => {
//         ptokens = r[1];
//         pr = r[0];
//     })
//     .catch((e: Error) => console.log("problem getting pending tokens.", e));

//     // console.log("fetch pending tokens");

//     return [pr, tokens, ptokens];
// }

// export const setTokenPendingData = async (context: UserSessionContextType) => {
//     //get the real tokens

//     console.log("fetching data...");

//     const r = await fetchTokenPendingData(context.user);

//     const user = context.user;
//     // setPendingRequests(context, d[0]);

//     if(user.token_count !== r[1] || user.pending_tokens !== r[2] || user.pending_requests.length !== r[0].length 
//         || (JSON.stringify(user.pending_requests) !== JSON.stringify(r[0]))) {
//         console.log("tc diff:", user.token_count, r[1], "ptc diff: ", user.pending_tokens, r[2], "prl diff: ", user.pending_requests.length, r[0].length,)
//         context.setUser(new Consumer(
//             user.access_token,
//             user.expires_at,
//             user.name,
//             user.image,
//             user.email,
//             r[1],
//             r[0],
//             r[2],
//         ));
//     }
//   }


export function UserSessionContextProvider(props: { children: JSX.Element }) {
    const cookies = getCookies();
    const dc = defaultConsumer();
    const [user, setUser] = useState<Consumer>(dc);
    const [bar, setBar] = useState<BarType | undefined>();
    const [artist, setArtist] = useState<LiveArtistType | undefined>();
    const [ready, setReady] = useState(false);
    const abortController = new AbortController();
    // const signal = abortController.signal;

    const editUser = (user: Consumer) => {
        // console.log("usc edit to", user);
        // storeTokens(user.access_token, cookies.get("refresh_token"), user.expires_at);
        setUser(user);
    }

    const editBar = (bar: BarType | undefined) => {
        if (bar) cookies.set("bar_session", bar.id);
        setBar(bar);
    }

    const editArtist = (artist: LiveArtistType | undefined) => {
        if (artist) cookies.set("artist_session", artist.id);
        setArtist(artist);
    }

    //10s refresh token data
    // const refreshRate = 10000;

    const refreshUserData = (user: Consumer) => {
        const c = new Consumer(
            user.access_token,
            user.expires_at,
            user.name,
            user.id,
            user.image,
            user.email,
        );

        editUser(c);
    }

    const usc: UserSessionContextType = { user: user, setUser: editUser, barState: { bar: bar, setBar: editBar }, artistState: { artist: artist, setArtist: editArtist }, abortController: abortController };

    const setup = async () => {
        const queryParameters = new URLSearchParams(window.location.search);

        const pathname = window.location.pathname;

        let barid = cookies.get("bar_session") ?? undefined;
        let artistid = cookies.get("artist_session") ?? undefined;

        if (pathname === "/bar") {
            barid = queryParameters.get("id") ?? barid;
            if (barid) cookies.set("bar_session", barid);
        } else if (pathname === "/artist") {
            artistid = queryParameters.get("id") ?? artist;
            if (artistid) cookies.set("artist_session", artistid);
        }

        if (barid) {
            const bar = await initBar(barid);
            if (bar) setBar(bar);
        }
        if (artistid) {
            const artist = await initArtist(artistid);
            if (artist) setArtist(artist);
        }

        if (!getStored("refresh_token") || !getStored("access_token")) {
            if (usc.user.access_token) {
                checkIfAccountExists(usc).then((r) => {
                    console.log("rdata", r.data)
                    refreshUserData(r.data)
                    setReady(true);
                })
                    .catch((e) => {
                        console.log("no session detected." + e)
                        setReady(true)
                    });
            } else {
                setReady(true)
            }
        } else {
            refreshUserData(user);
            checkIfAccountExists(usc).then((r) => {
                if (!r.result) {
                    console.log("account doesn't exist, logging out.")
                    Logout(usc);
                    setReady(true);
                    return;
                }
                refreshUserData(r.data)
                setReady(true);
            })
                .catch((e) => {
                    console.log("problem init user." + e)
                    setReady(true)
                });
        }

    }

    useEffect(() => {
        setup();
        // if(location.pathname === "/login" || location.pathname === "/register") return;
    }, []);

    // useInterval(() => setTokenPendingData({user, setUser, barState}), refreshRate);

    return (
        <UserSessionContext.Provider value={usc}>
            <DisplayOrLoading condition={ready}>
                {props.children}
            </DisplayOrLoading>
        </UserSessionContext.Provider>
    )
}