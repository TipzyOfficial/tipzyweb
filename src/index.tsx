import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import App, { goToLogin } from './App';
import { clearData, getCookies, getStored, setStored } from './lib/utils';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';
import { TokenReturnType, getUser } from './lib/serverinfo';
import { Consumer, Users } from './lib/user';
import Cookies from 'universal-cookie';
import { fetchWithToken as sharedFetchWithToken } from './lib/serverinfo';
import { useCookies } from 'react-cookie';
import { UserSessionContextType, defaultConsumer } from './lib/UserSessionContext';

const cookies = getCookies();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

console.log(!process.env.REACT_APP_GAUTH_CLIENT_ID ? "No Gauth client id detected." : "Gauth client id detected.")

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GAUTH_CLIENT_ID ?? ""}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

export function Logout(usc: UserSessionContextType, cookies: Cookies) {
  // console.log("abortcontroller", usc.abortController)
  usc.abortController?.abort();
  usc.setUser(new Consumer("", 0, ""));
  usc.barState.setBar(undefined);

  clearData().then(() => {
    googleLogout();
    goToLogin();
  });
}

export function rootGetRefreshToken(cookies: Cookies): string | null {
  const rt = getStored("refresh_token");
  return rt;
}


/**
 * updates the tokens in local storage
 * @param user the user session
 * @param tokens the new tokens
 * @param cookies the cookies that are storing the token data
 * @param setUser (optional) update the user if using useState()
 */
async function resetTokenValues(usc: UserSessionContextType, tokens: TokenReturnType) {
  // console.log("resetting tokens to!", tokens)
  const access = getStored("access_token");
  const refresh = getStored("refresh_token");
  const expa = getStored("expires_at");
  if (!refresh || !access || !expa) return;

  await storeTokens(tokens.access_token, tokens.refresh_token, tokens.expires_at)

  // await cookies.set("expires_at", tokens.refresh_token, { path: '/' });
  const newUser = structuredClone(usc.user);
  newUser.access_token = tokens.access_token;
  newUser.expires_at = tokens.expires_at

  usc.setUser(newUser);
}

export async function getTipper(usc: UserSessionContextType, cookies: Cookies) {
  return getUser("tipper", usc.user.access_token, usc.user.expires_at, () => rootGetRefreshToken(cookies), () => Logout(usc, cookies), (tokens: TokenReturnType) => resetTokenValues(usc, tokens, cookies));
}

export const consumerFromJSON = (user: Consumer | undefined, d: any) => {
  const c = new Consumer(user ? user.access_token : d.access_token, user ? user.expires_at : d.expires_at, `${d.user_info.first_name} ${d.user_info.last_name}`, user ? user.image : undefined, d.user_info.email, user ? user.requests : undefined)
  c.setBirthday(d.birthday);
  return (c);
}

export async function checkIfAccountExists(usc: UserSessionContextType): Promise<{ result: boolean, data: Consumer }> {
  return getTipper(usc, cookies).then(json => {
    const d = json.data;
    return {
      result: json.status === 200,
      data: json.status !== 200 ? usc.user : consumerFromJSON(usc.user, d)
    }
  })
    .catch(e => { throw e })
}

async function handleResponse(response: Response | null) {
  if (response === null) throw new Error("Null response.");
  if (!response.ok) {
    const t = await response.text()
    throw new Error(`Bad response. Code: ${response.status}. ${t}`);
  }
  return response;
}

export async function fetchWithToken(usc: UserSessionContextType, urlEnding: string, fetchMethod: string, body?: string) {
  const response = await sharedFetchWithToken(usc.user.access_token, urlEnding, usc.user.expires_at, () => rootGetRefreshToken(cookies), () => Logout(usc, cookies), (tokens: TokenReturnType) => resetTokenValues(usc, tokens, cookies), fetchMethod, body, usc.abortController?.signal).then(response => {
    return handleResponse(response);
  }).catch((e: Error) => {
    if (e.name === "AbortError") {
      console.log("fetch aborted" + e);
    }
    throw new Error(e.message);
  });
  return response;
}

export async function storeTokens(accessToken: string, refreshToken: string, expiresAt: number) {
  console.log("storing tokens");

  // cookies.set("access_token", accessToken, { expires: new Date(expiresAt), secure: true });
  // cookies.set("refresh_token", refreshToken, { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), secure: true });
  // cookies.set("expires_at", expiresAt, { expires: new Date(expiresAt), secure: true });
  setStored("access_token", accessToken);
  setStored("refresh_token", refreshToken);
  setStored("expiresAt", expiresAt.toString());
}

export async function storeAll(usc: UserSessionContextType, refreshToken: string) {
  await storeTokens(usc.user.access_token, refreshToken, usc.user.expires_at);
  const json = await getTipper(usc, cookies);

  return consumerFromJSON(usc.user, json.data);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
