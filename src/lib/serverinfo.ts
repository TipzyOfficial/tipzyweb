export const ServerInfo = {
    baseurl: "https://www.tipzyapi.com/",
    login: "login",
    importPlaylists: "import_playlists",
    selectPlaylist: "select_playlist_by_id",
    requestSong: "request_song",
    getRequests: "get_pending_requests",
    getBar: "bar",
    acceptRequest: "accept_request",
    rejectRequest: "reject_request",
    registerTipper: "create_tipper",
    registerBar: "create_bar",
};

// export const serverURL = (s: string): string => {
//     return (`${ServerInfo.baseurl}/${ServerInfo[s]}/`)
// }

export type TokenReturnType = {
    access_token: string;
    refresh_token: string;
    expires_at: number;
}

export const expiresInToAt = (expires_in: number) : number => {
    return Date.now() + expires_in*1000;
}  

const convertToTokenReturnType = (at: string, rt: string, expires_in: number): TokenReturnType => {
    console.log('EIN', expires_in);
    console.log('EAT', expiresInToAt(expires_in));
    console.log('NOW', Date.now())

    return {access_token: at, refresh_token: rt, expires_at: expiresInToAt(expires_in)}
}


/**
 * runs a fetch request with a certain access token. if the access token is expired, it will run reloadToken.
 * @param accessToken the current access token
 * @param urlEnding the ending of the url. so the total url will be baseUrl + urlEnding. No forward slash included -- add yourself if needed!
 * @param getRefreshToken the function to get your refresh token, the token itself isn't a parameter because pulling it from storage for each call is hugely unnecessary.
 * @param logout if there is no refresh token, this method logs the user out.
 * @param resetTokenValues reset access, refresh, and expiresAt values.
 * @param fetchMethod the method field in fetch. by default it is POST, but usually they will be GET, POST, PATCH, or DELETE
 * @returns returns whatever the response is.
 */
export async function fetchWithToken(accessToken: string, urlEnding: string, expiresAt: number, getRefreshToken: (() => Promise<string | null>), logout: (() => void), resetTokenValues: ((tokens: TokenReturnType) => Promise<void>), fetchMethod?: string, body?: string): Promise<Response | null>{
    let myAccessToken = accessToken;
    
    const newTokens = async () => {
        console.log("generating new tokens!");
        const refreshToken = await getRefreshToken();
        if(refreshToken === null) { console.log("no refresh token stored!"); logout(); return 0; }

        const tokens: TokenReturnType | null = await getAccessToken(refreshToken)
            .then(t => {
                console.log("whats our t", t);

                if(t === null) {
                    alert("You've been signed out. Please sign in again.")
                    logout();
                    return null; 
                }
                return t;
            })
            .catch((e) => {console.log("error access: ", e.message); return null});
        if(tokens === null) {  
            console.log("problem getting access tokens!");
            return 0; 
        }
        resetTokenValues(tokens);
        myAccessToken = tokens.access_token;
        return 1;
    }

    // console.log("ea, dn ", expiresAt, Date.now())
    // console.log("ea < dn", expiresAt <= Date.now());

    if(isNaN(expiresAt) || expiresAt <= Date.now()) {
        const res = await newTokens();
        if(res === 0) return null;
    }
        
    const theFetch = async () => {
        return body ? 
            fetch(`${ServerInfo.baseurl}${urlEnding}`, {
                method: fetchMethod ?? 'POST',
                headers: {
                    Authorization: `Bearer ${myAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: body ?? ""
            })
        :
            fetch(`${ServerInfo.baseurl}${urlEnding}`, {
                method: fetchMethod ?? 'GET',
                headers: {
                    Authorization: `Bearer ${myAccessToken}`,
                    'Content-Type': 'application/json'
                }
            })
    }

    return theFetch().then(response => 
        {
            if(response.status === 401){
                console.log("401 error. old Access token: ", myAccessToken)
                return newTokens().then((res) => {
                    if(res === 0) throw new Error("problem with your refresh token.");
                    console.log("trying again, new AT: ", myAccessToken)
                    return theFetch();
                }).catch((e: Error) => {
                    console.log("couldn't refresh.", e.message);
                    return null;
                });
            }
            return response;
        }
    );
}

/**
 * Gets all data about a tipper or business user.
 * @param userType either a "tipper" or "business"
 * @param access_token the access token
 * @returns the json data of the user
 */
export async function getUser(userType: "tipper" | "business", accessToken: string, expiresAt: number, getRefreshToken: (() => Promise<string | null>), logout: (() => void), resetTokenValues: ((tokens: TokenReturnType) => Promise<void>)): Promise<any>{
    return fetchWithToken(accessToken, userType+"/", expiresAt, getRefreshToken, logout, resetTokenValues, 'GET').then(response => {
        if(response === null || !response.ok){
            throw new Error(`Bad response. Response: ${response ? response.status + ".." : "null response"}`)
        }
        return response.json();
    }).then(json => {
        return json;
    });
}

/**
 * returns a new access token from a given refresh token.
 * @param refresh_token the refresh token
 * @returns access_token, refresh_token, and expires_at.
 */
export async function getAccessToken(refresh_token: string): Promise<TokenReturnType | null> {
    return fetch(`${ServerInfo.baseurl}auth/token`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            client_id: process.env.REACT_APP_CLIENT_ID,
            grant_type: "refresh_token",
            client_secret: process.env.REACT_APP_CLIENT_SECRET,
            refresh_token: refresh_token
        })
    }).then(response => {
        if(response.status === 400 || response.status === 401) {
            console.log("bad respose getting access token.", response.status)
            return null;
        }
        else if(!response.ok){
            throw new Error(`Bad response. Response: ${response.status}`);
        }
        return response.json();
    }).then(json => {
        if(json === null) return null;
        console.log("got a new access token!");
        console.log("json ein", json.expires_in);
        return convertToTokenReturnType(json.access_token, json.refresh_token, json.expires_in);
    }).catch((error: Error) => {throw error})
}

export async function loginWithGoogleAccessToken(access_token: string): Promise<TokenReturnType> {
    return fetch(`${ServerInfo.baseurl}auth/convert-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.REACT_APP_CLIENT_ID,
            grant_type: "convert_token",
            client_secret: process.env.REACT_APP_CLIENT_SECRET,
            backend: "google-oauth2",
            token: access_token
        })
    }).then(response => {
        if(!response.ok){
            throw new Error(`Bad response. Response: ${response.status}`);
        }
        return response.json();
    }).then(json => {
        return convertToTokenReturnType(json.access_token, json.refresh_token, json.expires_in);
    }).catch((error: Error) => {throw error})
}

/**
 * registers a new user into the database
 * @param first user's first name
 * @param last user's last name
 * @param email user's email. assume it's vald
 * @param username user's username. this should be unique
 * @param password user's password. assume its 8 or more chars
 */
export async function registerUsernamePassword(first: string, last: string, email:string, username: string, password: string) : Promise<Response> {
    return fetch(`${ServerInfo.baseurl}auth/register/`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            client_id: process.env.REACT_APP_CLIENT_ID,
            username: username,
            password: password,
            email: email,
            first_name: first,
            last_name: last,
        })
    }).catch((error: Error) => {
        throw error;
    })
}

export async function loginWithUsernamePassword(username: string, password: string) : Promise<any> {
    const encoded = btoa(`${process.env.REACT_APP_CLIENT_ID}:${process.env.REACT_APP_CLIENT_SECRET}`);

    return fetch(`${ServerInfo.baseurl}auth/token`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Authorization: `${encoded}`
        },

        body:`client_id=${process.env.REACT_APP_CLIENT_ID}&client_secret=${process.env.REACT_APP_CLIENT_SECRET}&grant_type=password&username=${username}&password=${password}`

        // body: JSON.stringify({ 
        //     
        //     client_secret: ServerInfo.clientSecret,
        //     grant_type: "password",
        //     username: username,
        //     password: password,
        // })
    })
    .then(r => {
        if(r.ok) return(r.json());
        if(r.status === 400)
            alert("Problem logging in. Invalid credentials.");
        else
            alert(`Problem logging in. Status: ${r.status}`);
        return null;
    })
    .catch((error: Error) => {
        throw error;
    })
}