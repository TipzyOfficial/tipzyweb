import { CSSProperties, useContext, useEffect, useState } from 'react';
import './Login.css';
import BigLogo from '../components/BigLogo';
import TZButton from '../components/TZButton';
import { CredentialResponse, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import GoogleButton from 'react-google-button';
import { ServerInfo, expiresInToAt, getUser, loginWithGoogleAccessToken, loginWithUsernamePassword, registerUsernamePassword } from '../lib/serverinfo';
import { Consumer } from '../lib/user';
import { checkIfAccountExists, consumerFromJSON, getTipper, storeAll } from '../index';
import { getCookies, router } from '../App';
import { UserSessionContext } from '../lib/UserSessionContext';
import Register from './Register';
import { Colors, padding } from '../lib/Constants';

const formatBirthday = (birthday: Date) => {
    return `${birthday.getFullYear()}-${birthday.getMonth()+1 >= 10 ? (birthday.getMonth()+1) : "0" + (birthday.getMonth()+1)}-${birthday.getDate() >= 10 ? birthday.getDate() : "0" + birthday.getDate()}`
}

function Login() {
    const [loginPage, setLoginPage] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginPrompt, setLoginPrompt] = useState(false);
    const [loginPressed, setLoginPressed] = useState(false);
    const userContext = useContext(UserSessionContext);
    const cookies = getCookies();
    const barID = cookies.get("bar_session");

    useEffect(() => {
        if(barID) setLoginPrompt(true);
    })

    const login = (at: string, rt: string, ea: number) => {
        loginWithTipzyToken(at, rt, ea);
    }

    function loginWithGoogleToken(token: string | null){
        if (token == null) {
            alert("Null token when logging into Google. Contact an admin for more information.")
            return;
        }

        loginWithGoogleAccessToken(token).then((value) => login(value.access_token, value.refresh_token, value.expires_at)).catch(
            (e: Error) => {
                console.log(`Error logging into Tipzy servers via Google:`, `${e}`);
            })
    }

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => loginWithGoogleToken(tokenResponse.access_token),
    });

    const onLogin = () => {
        if(!loginPressed) {
            setLoginPressed(true);
            loginWithUsernamePassword(username, password)
            .then(json => {
                setLoginPressed(false);
                login(json.access_token, json.refresh_token, expiresInToAt(json.expires_in));
            }).catch(e => {
                setLoginPressed(false);
                console.log(e);
            })
        }
    }

    const createAccount = async (user: Consumer) => {
        const response = await fetch(`${ServerInfo.baseurl}tipper/`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                birthday: formatBirthday(new Date()),
            })
        }).catch((e: Error) => {
            alert(`Error creating new account. Please try again later: ${e.message}`);
            return null;
        })

        return response;
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

        const nextPage = () => {
            if(barID) router.navigate(`/bar?id=${barID}`);
            else router.navigate("/code")
        }

        // console.log(user.name);
        checkIfAccountExists(user).then((result) => {
            if(result.result){
                storeAll(user, refreshToken).then((user) => {
                    userContext.setUser(user);
                    nextPage();
                    // console.log(user)
                    // props.navigation.replace('Tabs', {
                    //     user: result.data
                    // });
                });
                
            } else {
                createAccount(user).then((r) => {
                    checkIfAccountExists(user).then(r => {
                        if(!r.result) return undefined
                        return r.data;
                    }).then(newUser => {
                        if(!newUser) {
                            alert("Problem verifying account exists. Try again later.")
                            return;
                        }
                        userContext.setUser(newUser);
                        // console.log(newUser);
                        storeAll(newUser, refreshToken).then((u) => {
                            nextPage();
                        });
                    })
                }).catch(e => console.log(e));;
                // props.navigation.replace('CreateAccount', {
                //     refreshToken: refreshToken,
                //     user: user
                // });
            }
        }).catch((e: Error) => {alert(`Can't check if account exists: ${e.message}`)})
    }

    function Register() {
        const [firstName, setFirstName] = useState("");
        const [lastName, setLastName] = useState("");
        const [username, setUsername] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [confirmPassword, setConfirmPassword] = useState("");
        const [pm, setPm] = useState(true);
        const [disabled, setDisabled] = useState(true);
        const [registerPressed, setRegisterPressed] = useState(false);
    
        const emailRegex = new RegExp(".@.*\..");
    
    
        const checkShouldDisable = () => {
            if(password.length < 8) return true;
            return Math.min(firstName.length, lastName.length, username.length, email.length, password.length) === 0;
        }
    
        const PasswordRule = () => password.length < 8 ?
        <div style={regstyles.rule}>
            <span style={{paddingTop: 2, fontSize: 12, color: Colors.secondaryLight, lineHeight: 1, display: 'block'}}>Password must have a minimum of 8 characters.</span>
        </div> : <></>
    
        const ConfirmPasswordRule = () => !pm ?
        <div style={regstyles.rule}>
            <span style={{paddingTop: 2, fontSize: 12, color: Colors.secondaryLight, lineHeight: 1, display: 'block'}}>Passwords don't match.</span>
        </div> : <></>
    
        if(disabled !== checkShouldDisable()) setDisabled(checkShouldDisable());
    
        const onRegister = () => {
            if(!registerPressed) {
                setRegisterPressed(true);
                if (!emailRegex.test(email)){
                    alert("Invalid email. Please enter in a valid email.");
                    setRegisterPressed(false)
                    return;
                }
                if(confirmPassword !== password) {
                    setRegisterPressed(false)
                    setPm(false); return;
                }
                setPm(true);
        
                registerUsernamePassword(firstName, lastName, email, username, password).then((response) => response.json()).then(json => 
                    {
                    setRegisterPressed(false)
                    if (json.status === 201) {
                        alert("Woohoo! Account successfully created! Please log in.");
                        setLoginPage(true);
                    }
                    else if (json.status === 406) {
                        alert(`Register failed: ${json.detail}`);
                    }
                    else {
                        alert(`Register failed: Bad response, status: ${json.status}. Contact help@tipzy.com for assistance.`);
                    }
                }).catch(() => setRegisterPressed(false))
            }
        }
    
        return(
            <div style={{flex: 1, width: '100%', justifyContent: 'center', display: "flex"}}>
            <div style={styles.jumbo}>
                <div style={styles.header}>
                    <div style={{width: "100%", justifyContent: 'center', display: 'flex'}}>
                        <span className='App-title' style={{textAlign: 'center'}}>Sign Up</span>
                    </div>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)}/>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' type='' placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)}/>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' placeholder='Username' value={username} autoCorrect='off' autoCapitalize='off' onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' type='email' placeholder='email@address.com' value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div style={{paddingBottom: 10, justifyContent: 'flex-start'}}>
                    <input className='input' type='Password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                    <PasswordRule/>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' type='Password' placeholder='Confirm Password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                    <ConfirmPasswordRule/>
                </div>
                <TZButton onClick={onRegister} disabled={false} title="Sign up"></TZButton>
                <div style={{paddingTop:10, width: "100%", textAlign: 'center'}}>
                    Have an account? <a href={"#"} onClick={() => {if(!registerPressed) setLoginPage(true)}}>Sign In</a>
                </div>
                <div style={{fontSize: 12, paddingTop: padding, textAlign: 'center'}}>
                    By logging in or creating an account you agree to our <a href="https://www.tipzy.app/privacy" target='_blank' rel="noreferrer">privacy policy.</a>
                </div>
            </div>
            </div>
        )
    }

    return(
            loginPage ?
            <div style={styles.jumbo}>  
                {loginPrompt ? <div style={{position: 'fixed', top:0, left: 0, textAlign: 'center', width: '100%', backgroundColor: '#8883'}}>
                    <div style={{padding: padding/2}}>
                        Please sign in to continue.
                    </div>
                </div> : <></>}          
                <div style={styles.header}>
                    <BigLogo></BigLogo>
                </div>
                <div style={{justifyContent: 'center', alignItems: 'center'}}>
                    <GoogleButton 
                    style={{width: '100%'}}
                    onClick={() => googleLogin()}/>                        
                </div>
                <div style={{padding:10, textAlign: 'center'}}>
                    or
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' placeholder='Username' autoCorrect='off' autoCapitalize='off' value={username} onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div style={{paddingBottom: 10}}>
                    <input className='input' type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <TZButton onClick={onLogin} title={"Sign in"} disabled={loginPressed}></TZButton>
                <div style={{paddingTop:10, textAlign: 'center'}}>
                    Don't have an account? <a href={"#"} onClick={() => {if(!loginPressed) setLoginPage(false)}}>Sign Up</a>
                </div>
                <div style={{fontSize: 12, paddingTop: padding, textAlign: 'center'}}>
                    By logging in or creating an account you agree to our <a href="https://www.tipzy.app/privacy" target='_blank' rel="noreferrer">privacy policy.</a>
                </div>
            </div>
            : <Register/>
    )
}

const jumbo: CSSProperties = { 
    backgroundColor: "#0000",
    width: "80%",
    minWidth: 200,
    maxWidth: 300,
    padding: 20,
    borderRadius: 10,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
}

export const styles = {
    header: {
        paddingBottom: 20,
        width: "100%"
    },
    loginField: {
        paddingBottom: 10
    },
    jumbo: jumbo,
    title: {
        fontSize: 25,
        fontWeight: 'bold',
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

const rule: CSSProperties = {
    textAlign: 'left',
}

const regstyles = {
    rule: rule
  }


export default Login;