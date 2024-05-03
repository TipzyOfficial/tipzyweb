import React, { useState } from 'react';
import './Login.css';
import BigLogo from '../components/BigLogo';
import TZButton from '../components/TZButton';
import { CredentialResponse, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import GoogleButton from 'react-google-button';
import { expiresInToAt, getUser, loginWithGoogleAccessToken, loginWithUsernamePassword } from '../lib/serverinfo';
import { Consumer } from '../lib/user';
import { checkIfAccountExists, storeAll } from '../index';
import { router } from '../App';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => console.log(tokenResponse),
    });

    const onLogin = () => {
        loginWithUsernamePassword(username, password)
        .then(json => {
            console.log(json);
            loginWithTipzyToken(json.access_token, json.refresh_token, expiresInToAt(json.expires_in));
        }).catch(e => console.log(e)
        )
    }

    function loginWithTipzyToken(accessToken: string | null, refreshToken: string | null, expiresAt: number) {
        if (accessToken == null || refreshToken == null) {
            alert("Null token when logging into Tipzy. Contact an admin for more information.");
            return;
        }
        const name =  "Guest";
        const email = undefined;
        const img = undefined;
        const expires_at = expiresAt;
        const user = new Consumer(accessToken, expires_at, name ?? "", img ?? undefined);

        console.log(user.name);

        checkIfAccountExists(user, refreshToken).then((result) => {
            console.log("account exists", result.result)

            if(result.result){
                storeAll(user, refreshToken).then((user) => {
                    
                    router.navigate("/code")
                    // props.navigation.replace('Tabs', {
                    //     user: result.data
                    // });
                });
                
            } else {
                // props.navigation.replace('CreateAccount', {
                //     refreshToken: refreshToken,
                //     user: user
                // });
            }
        }).catch((e: Error) => {alert(`Can't check if account exists: ${e.message}`)})
    }

    return(
        <div className='Login-container'>
            <div style={styles.jumbo}>
                <div style={styles.header}>
                    <BigLogo></BigLogo>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' placeholder='Username' autoCorrect='off' autoCapitalize='off' value={username} onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <TZButton onClick={onLogin} title="Sign in"></TZButton>
                <div style={{padding:10}}>
                    or
                </div>
                <div style={{justifyContent: 'center', alignItems: 'center'}}>
                    <GoogleButton 
                    style={{width: '100%'}}
                    onClick={() => googleLogin()}/>                        
                </div>
                <div style={{paddingTop:10}}>
                    Don't have an account? <a href={"./register"}>Sign Up</a>
                </div>
            </div>
        </div>
    )
}

export const styles = {
    header: {
        paddingBottom: 20
    },
    loginField: {
        paddingBottom: 10
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
    },
    jumbo: {
        backgroundColor: "#0000",
        width: "80%",
        minWidth: 200,
        maxWidth: 300,
        padding: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        color: "white",
        backgroundColor: "#1e1e1e",
        fontSize: 20,
        borderRadius: 10,
        padding: 10,
        borderStyle: "solid",
        display: 'block',
        width: '100%',
    }
  }

export default Login;