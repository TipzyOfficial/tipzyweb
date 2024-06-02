import './index.css';
// import './App.css'
import Login from './pages/Login';
import Register from './pages/Register'
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import Bar from './pages/bar/Bar';
import EnterCode from './pages/bar/EnterCode';
import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router'
// import { Cookies, useCookies } from 'react-cookie';
import Cookies from 'universal-cookie';
import { UserSessionContext, UserSessionContextProvider } from './lib/UserSessionContext';
import SongSearch from './pages/bar/SongSearch';
import { Elements, PaymentElement, } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentSetup from './pages/profile/PaymentSetup';
import { fetchWithToken, Logout } from '.';
import { fetchPaymentSheetParams } from './lib/stripe';
import { DisplayOrLoading } from './components/DisplayOrLoading';
import Profile from './pages/profile/Profile';
import ArtistInfo from './pages/bar/artist/ArtistInfo';
import Account from './pages/profile/Account';
import About from './pages/profile/About';
import AlbumPage from './pages/bar/artist/AlbumPage';
import Albums from './pages/bar/artist/Albums';
import PaymentSetupScreen from './pages/profile/PaymentSetupScreen';
import { NotFoundPage } from './pages/bar/NotFoundPage';
import Invoices from './pages/profile/Invoices';

export const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY ?? "");

export const getCookies = () => {
  return new Cookies(null, { path: '/', sameSite: "strict" })
}

function Redirect() {
  const userContext = useContext(UserSessionContext)
  const cookies = getCookies();
  const session = cookies.get("bar_session");
  let loggedin = cookies.get("refresh_token") && cookies.get("expires_at") && userContext.user.access_token;

  return(
    loggedin ? (session ? <Navigate to={`/bar?id=${session}`}></Navigate> : <Navigate to='/code'></Navigate>) : <Login></Login>
  )
}

const Layout = () => {
  const [clientSecret, setClientSecret] = useState<string | undefined | null>(undefined);
  const usc = useContext(UserSessionContext);

  useEffect(() => {
    // Create SetupIntent as soon as the page loads
    
    fetchPaymentSheetParams(usc.user).then(
      (r) => {
        setClientSecret(r);
      }
    )
  }, []);


  if(clientSecret === null) {
    Logout(getCookies());
    return (<Outlet></Outlet>)
  }

  return (
    clientSecret ?
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: clientSecret,
          appearance: { theme: "night" }
        }}
      >
        <Outlet />
      </Elements> :
      <DisplayOrLoading condition={false}></DisplayOrLoading>
  );
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
    Component: Bar
  },
  {
    path: "/bar/search",
    Component: SongSearch
  },
  {
    path: "/profile",
    Component: Profile
  },
  {
    path: "/account",
    Component: Account
  },
  {
    path: "/about",
    Component: About
  },
  {
    path: "/paymentsetup",
    Component: PaymentSetupScreen
  },
  {
    path: "/invoices",
    Component: Invoices
  },
  {
    path: "/artist",
    Component: ArtistInfo
  },
  {
    path: "/album",
    Component: AlbumPage
  },
  {
    path: "/albums",
    Component: Albums
  }
  ], errorElement: <NotFoundPage title="404" body={"We can't seem to find that page. Are you sure you entered everything correctly?"} backPath={-1}/>}
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
    </div>
  )
}

export function goToLogin() {
  router.navigate('/')
}

export default App;
