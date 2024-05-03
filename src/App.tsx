import './index.css';
import './App.css'
import Login from './pages/Login';
import Register from './pages/Register'
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import EnterCode from './pages/bar/EnterCode';
import React from 'react';
import { Navigate } from 'react-router'
import { useCookies } from 'react-cookie';


function Redirect() {
  const [cookies, setCookies, removeCookies] = useCookies(['refresh_token', 'access_token', 'expires_at'])
  const loggedin = cookies.access_token && cookies.refresh_token && cookies.expires_at;

  return(
    loggedin ? <Navigate to='/code'></Navigate> : <Navigate to='/login'></Navigate>
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
]);

function App() {
  return(
    <div className='App'>
      <RouterProvider router={router}></RouterProvider>
    </div>
  )
}

export function goToLogin() { 
  router.navigate('/login')
}

export default App;
