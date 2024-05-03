import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App, { goToLogin } from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';
import { ServerInfo, TokenReturnType, getUser } from './lib/serverinfo';
import { Consumer, Users } from './lib/user';
import { redirect, useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { fetchWithToken as sharedFetchWithToken } from './lib/serverinfo';
import { UserSessionContextProvider } from './lib/UserSessionContext';

const cookies = new Cookies(null, { path: '/' });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GAUTH_CLIENT_ID ?? ""}>
      <UserSessionContextProvider defaultValue={null}>
        <App />
      </UserSessionContextProvider>
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
  if (typeof rt !== "string") cookies.set("refresh_token", null, { path: '/' })
  return rt;
}

export async function resetTokenValues(user: Users, tokens: TokenReturnType, cookies: Cookies, setUser?: (user: Users) => void) {
  await cookies.set("access_token", tokens.access_token, { path: '/' });
  await cookies.set("refresh_token", tokens.refresh_token, { path: '/' });
  await cookies.set("expires_at", tokens.refresh_token, { path: '/' });
  user.access_token = tokens.access_token;
  user.expires_at = tokens.expires_at;
  if(setUser) setUser(user);
}

export async function getTipper(user: Consumer, cookies: Cookies){
  return getUser("tipper", user.access_token, user.expires_at, () => rootGetRefreshToken(cookies), () => Logout(cookies), (tokens: TokenReturnType) => resetTokenValues(user, tokens, cookies));
}

export const consumerFromJSON = (user: Consumer, d: any) => {
  const c = new Consumer(user.access_token, user.expires_at, `${d.user_info.first_name} ${d.user_info.last_name}`, user.image, d.user_info.email, d.token_count, user.pending_requests, user.pending_tokens)
  c.setBirthday(d.birthday);
  return(c);
}

export async function checkIfAccountExists(user: Consumer, refreshToken: string): Promise<{result: boolean, data: Consumer}>{
  return getTipper(user, cookies).then(json => {
      const d = json.data;
      return {
          result: json.status === 200, 
          data: json.status !== 200 ? user : consumerFromJSON(user, d)
      }
  })
  .catch(e => {throw e})
}

export async function fetchWithToken(user: Consumer, urlEnding: string, fetchMethod: string, body?: string) {
  return sharedFetchWithToken(user.access_token, urlEnding, user.expires_at, () => rootGetRefreshToken(cookies), () => Logout(cookies), (tokens: TokenReturnType) => resetTokenValues(user, tokens, cookies), fetchMethod, body).then(response => {
      if(response === null) throw new Error("Null response.");
      if(!response.ok) throw new Error(`Bad response!! Code: ${response.status}. ${response.body}`);
      return response;
  });
}

async function storeTokens(accessToken: string, refreshToken: string, expiresAt: number){
  cookies.set("access_token", accessToken);
  cookies.set("refresh_token", refreshToken);
  cookies.set("expires_at", expiresAt.toString());
}

export async function storeAll(user: Consumer, refreshToken: string) {
  console.log("ueat", user);

  await storeTokens(user.access_token, refreshToken, user.expires_at);
  // SecureStore.setItemAsync("name", user.name);
  // SecureStore.setItemAsync("email", user.email ?? "");
  const json = await getTipper(user, cookies);

  return consumerFromJSON(user, json.data);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
