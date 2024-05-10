import './index.css';
// import './App.css'
import Login from './pages/Login';
import Register from './pages/Register'
import {
  createBrowserRouter,
  Router,
  RouterProvider,
} from 'react-router-dom';
import Bar from './pages/bar/Bar';
import EnterCode from './pages/bar/EnterCode';
import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router'
// import { Cookies, useCookies } from 'react-cookie';
import Cookies from 'universal-cookie';
import { UserSessionContext, UserSessionContextProvider } from './lib/UserSessionContext';
import { checkIfAccountExists } from './index';
import { Consumer } from './lib/user';


function Redirect() {
  const userContext = useContext(UserSessionContext)
  const cookies = new Cookies(null, { path: '/' });
  let loggedin = cookies.get("refresh_token") && cookies.get("expires_at") && userContext.user.access_token;

  return(
    loggedin ? <Navigate to='/code'></Navigate> : <Login></Login>
  )
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Redirect
  },
  {
    path: "/login",
    Component: Login
  },
  {
    path: "/register",
    Component: Register
  },
  {
    path: "/code",
    Component: EnterCode
  },
  {
    path: "/bar",
    Component: Bar
  },
], {});

function App() {
  const userContext = useContext(UserSessionContext);
  // const [cookies, setCookies, removeCookies] = useCookies(['refresh_token', 'access_token', 'expires_at'])
  const cookies = new Cookies(null, { path: '/' });

  // useEffect(() => {
  //   if(cookies.get("refresh_token")){
  //     checkIfAccountExists(userContext.user, cookies.get("refresh_token")).then((r) => {
  //       userContext.setUser(r.data);
  //     }).catch(() => {
  //       userContext.setUser(new Consumer("", 0, ""));
  //     })
  //   }
  // }, [])

  // checkIfAccountExists(userContext.user, cookies.get("refresh_token") ?? "").then((r) => {
  //   if(JSON.stringify(r.data) !== JSON.stringify(userContext.user)) userContext.setUser(r.data);
  // }).catch((e) => {
  //   console.log("error:", e);
  //   userContext.setUser(new Consumer("", 0, ""));
  // })

  return(
    <div className="App-body">
      <UserSessionContextProvider>
        <RouterProvider router={router}></RouterProvider>
      </UserSessionContextProvider>
    </div>
  )
}

export function goToLogin() {
    router.navigate('/')
}

export default App;
