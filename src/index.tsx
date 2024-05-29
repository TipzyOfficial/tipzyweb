import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import App, { getCookies, goToLogin } from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';
import { TokenReturnType, getUser } from './lib/serverinfo';
import { Consumer, Users } from './lib/user';
import Cookies from 'universal-cookie';
import { fetchWithToken as sharedFetchWithToken } from './lib/serverinfo';
import { useCookies } from 'react-cookie';

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

export async function Logout(cookies: Cookies) {
  const clearCookies = async () => {
      await cookies.remove("access_token");
      await cookies.remove("refresh_token");
      await cookies.remove("expires_at");
      await cookies.remove("name");
      await cookies.remove("email");
      goToLogin();
  }
  googleLogout();
  clearCookies();
}

export function rootGetRefreshToken(cookies: Cookies): Promise<string | null>{
  const rt = cookies.get("refresh_token");
  console.log("rgrt refresh token = ", rt);
  if (typeof rt !== "string") cookies.remove("refresh_token")
  return rt;
}


/**
 * updates the tokens in local storage
 * @param user the user session
 * @param tokens the new tokens
 * @param cookies the cookies that are storing the token data
 * @param setUser (optional) update the user if using useState()
 */
export async function resetTokenValues(user: Users, tokens: TokenReturnType, cookies: Cookies, setUser?: (user: Users) => void) {
  console.log("resetting token values");
  console.log("updating rt token = ", tokens.refresh_token);
  cookies.set("refresh_token", tokens.refresh_token, { path: '/' });
  cookies.set("access_token", tokens.access_token, { path: '/' });
  // await cookies.set("expires_at", tokens.refresh_token, { path: '/' });
  user.access_token = tokens.access_token;
  user.expires_at = tokens.expires_at;
  if(setUser) setUser(user);
}

export async function getTipper(user: Consumer, cookies: Cookies){
  return getUser("tipper", user.access_token, user.expires_at, () => rootGetRefreshToken(cookies), () => Logout(cookies), (tokens: TokenReturnType) => resetTokenValues(user, tokens, cookies));
}

export const consumerFromJSON = (user: Consumer | undefined, d: any) => {
  const c = new Consumer(user ? user.access_token : d.access_token, user ? user.expires_at : d.expires_at, `${d.user_info.first_name} ${d.user_info.last_name}`, user ? user.image : undefined, d.user_info.email, d.token_count, user ? user.pending_requests : undefined, user ? user.pending_tokens : undefined)
  c.setBirthday(d.birthday);
  return(c);
}

export async function checkIfAccountExists(user: Consumer): Promise<{result: boolean, data: Consumer}>{
  console.log("ciae")
  return getTipper(user, cookies).then(json => {
      const d = json.data;
      return {
          result: json.status === 200, 
          data: json.status !== 200 ? user : consumerFromJSON(user, d)
      }
  })
  .catch(e => {throw e})
}

async function handleResponse (response: Response | null) {
  if(response === null) throw new Error("Null response.");
  if(!response.ok) {
    const t = await response.text()
    throw new Error(`Bad response. Code: ${response.status}. ${t}`);
  }
  return response;
}

export async function fetchWithToken(user: Consumer, urlEnding: string, fetchMethod: string, body?: string) {  
  const response = await sharedFetchWithToken(user.access_token, urlEnding, user.expires_at, () => rootGetRefreshToken(cookies), () => Logout(cookies), (tokens: TokenReturnType) => resetTokenValues(user, tokens, cookies), fetchMethod, body).then(response => {
    return handleResponse(response);
  }).catch(e => {throw new Error(e);});
  return response;
}

async function storeTokens(accessToken: string, refreshToken: string, expiresAt: number){
  cookies.set("refresh_token", refreshToken);
  cookies.set("access_token", refreshToken);
  cookies.set("expires_at", expiresAt);
}

export async function storeAll(user: Consumer, refreshToken: string) {
  await storeTokens(user.access_token, refreshToken, user.expires_at);
  const json = await getTipper(user, cookies);

  return consumerFromJSON(user, json.data);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
