import './index.css';
// import './App.css'
import Login from './pages/Login';
import Register from './pages/Register'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import Bar from './pages/bar/Bar';
import EnterCode from './pages/bar/EnterCode';
import { useContext } from 'react';
import { Navigate } from 'react-router'
// import { Cookies, useCookies } from 'react-cookie';
import { UserSessionContext, UserSessionContextProvider } from './lib/UserSessionContext';
import SongSearch from './pages/bar/SongSearch';
import { loadStripe } from '@stripe/stripe-js';
import ArtistInfo from './pages/bar/artist/ArtistInfo';
import Account from './pages/profile/Account';
import About from './pages/profile/About';
import AlbumPage from './pages/bar/artist/AlbumPage';
import Albums from './pages/bar/artist/Albums';
import PaymentSetupScreen from './pages/profile/PaymentSetupScreen';
import { NotFoundPage } from './pages/bar/NotFoundPage';
import Invoices from './pages/profile/Invoices';
import { getCookies, getStored } from './lib/utils';
import Artist from './pages/artist/Artist';
import { Analytics } from "@vercel/analytics/react"

export const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY ?? "");

function Redirect() {
  const userContext = useContext(UserSessionContext)
  const cookies = getCookies();
  const session = cookies.get("bar_session");
  let loggedin = getStored("refresh_token") && getStored("expires_at") && userContext.user.access_token;

  //reset refresh expiry time
  // if (loggedin) cookies.set("refresh_token", cookies.get("refresh_token"), { expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });

  //if (window.location.pathname) //bar?id=66
  return (
    (session ? <Navigate to={`/bar?id=${session}`}></Navigate> : <Navigate to='/code'></Navigate>)
  )
}

function RerouteForTJs() {
  if (window.location.search === "?id=66") return <Navigate to={`/artist?id=2`}></Navigate>
  return (<Bar />)
}


export const router = createBrowserRouter([{
  // element: <Layout/>,
  children:
    [{
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
      Component: RerouteForTJs
    },
    {
      path: "/search",
      Component: SongSearch
    },
    {
      path: "/account",
      Component: Account
    },
    {
      path: "/contact-us",
      Component: About
    },
    {
      path: "/payments",
      Component: PaymentSetupScreen
    },
    {
      path: "/invoices",
      Component: Invoices
    },
    {
      path: "/search/artist",
      Component: ArtistInfo
    },
    {
      path: "/search/album",
      Component: AlbumPage
    },
    {
      path: "/search/albums",
      Component: Albums
    },
    {
      path: "/artist",
      Component: Artist
    }
    ], errorElement: <NotFoundPage title="Oops!" body={"We can't seem to find that page. Are you sure you entered everything correctly?"} backPath={-1} />
}
], {});

function App() {
  return (
    <div className="App-body">
      <UserSessionContextProvider>
        <div className="App-body" style={{ width: '100%' }}>
          <RouterProvider
            router={router} />
        </div>
      </UserSessionContextProvider>
      <Analytics />
    </div>
  )
}

export function goToBar(id?: number) {
  router.navigate(`/bar${id ? `?id=${id}` : ""}`).then(() => {
    // window.location.replace("/");
  });
}

export function goToArtist(id?: number) {
  router.navigate(`/artist${id ? `?id=${id}` : ""}`).then(() => {
    // window.location.replace("/");
  });
}


export type ReturnLinkType = {
  url: string,
  data: any
}

export function goToLogin(data?: any, defaultToBar?: boolean) {

  if (defaultToBar) {
    localStorage.removeItem("ret")
  }

  else {
    const url = window.location.pathname;
    const returnLink: ReturnLinkType = {
      url: url,
      data: data,
    }

    localStorage.setItem("ret", btoa(JSON.stringify(returnLink)))
  }

  // window.location.replace(
  //   `${window.location.origin}/login?prev=${urlbtoa}`
  // )

  window.location.replace(
    `${window.location.origin}/login`//?prev=true`
  )

  // router.navigate(`/login?prev=${urlbtoa}`).then(() => {
  //   window.location.reload
  // });
}

export default App;
