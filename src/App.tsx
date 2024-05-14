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
import Cookies from 'universal-cookie';
import { UserSessionContext, UserSessionContextProvider } from './lib/UserSessionContext';


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
