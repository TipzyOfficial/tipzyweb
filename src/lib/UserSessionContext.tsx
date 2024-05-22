import { createContext, useEffect, useRef, useState } from 'react';
import { Consumer, Users } from './user'
import { SongRequestType, SongType } from './song';
import { Logout, checkIfAccountExists, consumerFromJSON, fetchWithToken, getTipper, resetTokenValues, rootGetRefreshToken } from '../index'
import { BarType } from './bar';
import { DisplayOrLoading } from '../components/DisplayOrLoading';
import Cookies from 'universal-cookie';
import { TokenReturnType, getUser } from './serverinfo';
import { useLocation } from 'react-router-dom';

export type UserSessionContextType = {
    user: Consumer,
    setUser: (user: Consumer) => void; //do we even need this? or can i just load for asyncstorage
}

export const DefaultUserSessionContext = {
    user: new Consumer("", 0, ""),
    setUser: () => {}
}

function useInterval(callback: () => any, delay: number) {
    const savedCallback = useRef<typeof callback>();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
          savedCallback.current ? savedCallback.current() : (() => {})()
        }
        if (delay !== null) {
          let id = setInterval(tick, delay);
          return () => clearInterval(id);
        }
      }, [delay]);
}

export const getStartingUser = async (): Promise<Consumer> => {
    const cookies = new Cookies(null, {path: '/'});
    const rt = cookies.get("refresh_token");
    // const ea = cookies.get("expires_at");
    if(rt === null) return  new Consumer("", 0, "");
    return checkIfAccountExists(new Consumer("", 0, ""), rt).then(r => {
        if(r.result){
            return consumerFromJSON(undefined, r.data);
        }
        cookies.remove("refresh_token"); //bad refresh
        return new Consumer("", 0, "")
    })

    // getUser("tipper", "", 0, () => rootGetRefreshToken(cookies), () => Logout(cookies), (tokens: TokenReturnType) => resetTokenValues(new Consumer("", 0, ""), tokens, cookies)).then((json) => {
    //     json.data
    // })
}
export const UserSessionContext = createContext<UserSessionContextType>({user: new Consumer("",0,""), setUser: () => {}});

export const getPending = async (user: Consumer, ignoreReqs?: boolean) : Promise<[SongRequestType[], number]> => {
    const p: SongRequestType[] = [];
    let ptc: number = 0;
    await fetchWithToken(user, `tipper/requests/pending/`, 'GET').then(r => {
        return r.json();
    })
    .then(json => {
        const reqs = json.data;
        reqs.forEach((e: any) => {
            const sj = e.song_json;
            const bi = e.business_info;
            const s: SongType = {id: sj.id, title: sj.name, artists: [sj.artist], albumart: sj.image_url, explicit: false};
            const b: BarType = {id: bi.id, name: bi.business_name, type: bi.business_type, image_url: bi.image_url, description: bi.description, active: bi.active}
            ptc += e.token_count ?? 0;
            p.push({id: e.id, song: s, tokenCount: e.token_count, status: e.status, bar: b, date: new Date(e.request_time)})
        })
    })
    .catch((e: Error) => {console.log("problem getting pending: ", e)});

    return [p, ptc];
}

const fetchTokenPendingData = async (user: Consumer) : Promise<[SongRequestType[], number, number]> => {
    let pr: SongRequestType[] = [];
    let tokens = 0;
    let ptokens = 0;
  
    await fetchWithToken(user, `get_tipper_account_tokens/`, 'GET').then((r: Response) => r.json()).then(json => {
      tokens += json.token_amount;
    }).catch((e: Error) => {console.log("problem getting tipzy tokens.", e);});

    // console.log("fetch acc tokens");
  
    //get the pending tokens
    await getPending(user).then(r => {
        ptokens = r[1];
        pr = r[0];
    })
    .catch((e: Error) => console.log("problem getting pending tokens.", e));

    // console.log("fetch pending tokens");

    return [pr, tokens, ptokens];
}

export const setTokenPendingData = async (context: UserSessionContextType) => {
    //get the real tokens

    console.log("fetching data...");
  
    const r = await fetchTokenPendingData(context.user);

    const user = context.user;
  
    // setTokens(context, d[1]);
    // setPendingTokens(context, d[2]);
    // setPendingRequests(context, d[0]);

    if(user.token_count !== r[1] || user.pending_tokens !== r[2] || user.pending_requests.length !== r[0].length 
        || (JSON.stringify(user.pending_requests) !== JSON.stringify(r[0]))) {
        console.log("tc diff:", user.token_count, r[1], "ptc diff: ", user.pending_tokens, r[2], "prl diff: ", user.pending_requests.length, r[0].length,)
        context.setUser(new Consumer(
            user.access_token,
            user.expires_at,
            user.name,
            user.image,
            user.email,
            r[1],
            r[0],
            r[2],
        ));
    }
  }


export function UserSessionContextProvider(props: { children: JSX.Element }) {
    const cookies = new Cookies(null, { path: '/' });
    const [user, setUser] = useState<Consumer>(new Consumer("", 0, ""));
    const [ready, setReady] = useState(false);

    const editUser = (user: Consumer) => {
        setUser(user);
    }

    //10s refresh token data
    const refreshRate = 10000;

    const refreshUserData = (user: Consumer) => {
        return fetchTokenPendingData(user).then(r => {
            const u = new Consumer(
                user.access_token,
                user.expires_at,
                user.name,
                user.image,
                user.email,
                r[1],
                r[0],
                r[2],
            );
            setUser(u);
            console.log("fetched data success", u);
        })
        .then(() => {
            console.log('setready')
            setReady(true);
        })
        .catch((e) => {
            console.log("Error. Couldn't fetch data about your tokens." + e);
            console.log('setconsumer')
            setUser(new Consumer("", 0, ""))
        });
    }
    
    useEffect(() => 
        {
            // if(location.pathname === "/login" || location.pathname === "/register") return;
            console.log("useeffect")
            if(!cookies.get("refresh_token") || JSON.stringify(user) === JSON.stringify(new Consumer("", 0, ""))){
                let newUser = new Consumer("", 0, "");
                checkIfAccountExists(user, cookies.get("refresh_token")).then((r) => {
                    refreshUserData(r.data).then(() => setReady(true));
                })
                .catch((e) => {
                    console.log("no session detected." + e)
                    setReady(true)
                })
            } else {
                refreshUserData(user).then(() => setReady(true));
            }
    }, []);

    useInterval(() => setTokenPendingData({user, setUser}), refreshRate);

    return (
        <UserSessionContext.Provider value={{ user: user, setUser: editUser }}>
            <DisplayOrLoading condition={ready}>
                {props.children}
            </DisplayOrLoading>
        </UserSessionContext.Provider>
    )
}