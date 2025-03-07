import { CSSProperties, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './Login.css';
import BigLogo from '../components/BigLogo';
import TZButton from '../components/TZButton';
import { CredentialResponse, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import GoogleButton from 'react-google-button';
import { ServerInfo, expiresInToAt, loginWithGoogleAccessToken, loginWithAppleAccessToken, loginWithUsernamePassword, registerUsernamePassword, fetchNoToken } from '../lib/serverinfo';
import { Consumer } from '../lib/user';
import { checkIfAccountExists, consumerFromJSON, fetchWithToken, storeAll } from '../index';
import { ReturnLinkType, router } from '../App';
import { UserSessionContext, UserSessionContextType } from '../lib/UserSessionContext';
import Register from './Register';
import { Colors, padding, radius } from '../lib/Constants';
import { Spinner } from 'react-bootstrap';
import { getCookies } from '../lib/utils';
import AppleLogin from 'react-apple-login'
import { useLocation, useNavigation, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAppleAlt, faArrowLeft, faXmark as faCancel, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faApple } from '@fortawesome/free-brands-svg-icons';
import GoogleLogo from '../assets/google_logo_clear.svg';
// import raveVideo from "../assets/TipzyHomePageVideo.mp4";
import FullLogo from '../assets/Tipzy_Full_Orange.png';
import rave from '../assets/rave.png';
import { isIOS } from 'react-device-detect';
import { track } from '@vercel/analytics';


const t = process.env.REACT_APP_TESTING === "false";

const formatBirthday = (birthday: Date) => {
    return `${birthday.getFullYear()}-${birthday.getMonth() + 1 >= 10 ? (birthday.getMonth() + 1) : "0" + (birthday.getMonth() + 1)}-${birthday.getDate() >= 10 ? birthday.getDate() : "0" + birthday.getDate()}`
}

type AppleReturnType = {
    name: any,
    email: string,
}

function Login(props: { back?: boolean, small?: boolean, nextPage?: (u: Consumer) => void }) {
    const [globalDisable, setGlobalDisable] = useState(false);
    const [loginPage, setLoginPage] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginPressed, setLoginPressed] = useState(false);
    const [loginPrompt, setLoginPrompt] = useState(false);
    const usc = useContext(UserSessionContext);
    const [searchParams] = useSearchParams();
    const referral = searchParams.get("referral");
    const [referrer, setReferrer] = useState<string | null | undefined>(undefined)

    const cookies = getCookies();
    const barID = cookies.get("bar_session");
    const [usernameShowing, setUsernameShowing] = useState(false);
    const small = props.small;

    const redeemReferral = async (u: Consumer) => {
        const json = await fetchWithToken({ ...usc, user: u }, `tipper/referral/redeem/?code=${referral}`, 'POST')
            .then((r) => r.json())
        if (json.status !== 200) {
            throw new Error(`Bad response: ${json.status}`);
        }
    }

    const nextPage = async (u?: Consumer) => {
        if (props.nextPage) {
            props.nextPage(u ?? usc.user);
        } else {
            const ret = localStorage.getItem("ret");

            if (referral && u) {
                if (referrer) {
                    await redeemReferral(u).catch((e) => {
                        console.log(e)
                        alert("Problem redeeming referral. Have you already redeemed a code on this account?");
                        return;
                    });
                } else {
                    alert("There is a problem with your referral. Logging in without referral.");
                    return;
                }
            }

            if (ret) {
                const retDecoded: ReturnLinkType = JSON.parse(atob(ret));
                // console.log("going ret", retDecoded);

                let url = retDecoded.url;
                if (url === "/login") url = "/code";
                router.navigate(url, { state: { fromLogin: true, ...retDecoded.data } });
            } else {
                console.log("going barid");

                router.navigate(barID ? `/bar?id=${barID}` : '/code', { state: { fromLogin: true } });
            }
        }
    }

    // console.log(searchParams.get("prev"));

    const handleAppleLoginSuccess = async (event: any) => {
        setGlobalDisable(true);
        // console.log(event);

        const accessToken = event.detail.authorization.id_token;

        const user = event.detail.user;

        const email = event.detail.email;

        const name: AppleReturnType | undefined = user ? { name: user.name, email: email } : undefined;

        if (name) {
            //store apple name stuff bc we are never getting this again
            localStorage.setItem("firstName", name.name.firstName);
            localStorage.setItem("lastName", name.name.lastName);
            localStorage.setItem("email", name.email);
        }

        if (!accessToken) {
            console.log("Malformed response from Apple login servers.");
            return;
        }

        await loginWithAppleAccessToken(accessToken).then((value) => login(value.access_token, value.refresh_token, value.expires_at, true, name)).catch(
            (e: Error) => {
                console.log(`Error logging into Tipzy servers via Apple:`, `${e}`);
                setGlobalDisable(false);
            })
    }

    const handleAppleLoginFailure = (event: any) => {
        console.log("apple failure...", event)
    }

    const getReferrer = async () => {
        if (!referral) {
            return;
        }

        console.log("getReferrer");
        try {
            const json = await fetchNoToken(`tipper/referral/?code=${referral}`, 'GET').then((r) => r.json())
            console.log(json);

            if (json.status === 200) {
                if (json.expired) {
                    setReferrer(null);
                    alert("Your referral code has expired. Ask your referrer to generate a new code.");
                } else {
                    const ti = json.data.referred_by.tipper_info;
                    setReferrer(`${ti.first_name} ${ti.last_name}`);
                }
            }
            else {
                throw new Error("bad response");
            }
        }
        catch {
            setReferrer(null);
            alert("Problem getting your referral. Ask your referrer to generate a new code.")
        }

    }

    useEffect(() => {
        if (localStorage.getItem("ret")) setLoginPrompt(true);
        getReferrer();
    }, [])

    useLayoutEffect(() => {
        window.document.addEventListener('AppleIDSignInOnSuccess', (event) => handleAppleLoginSuccess(event));
        window.document.addEventListener('AppleIDSignInOnFailure', (event) => handleAppleLoginFailure(event));

        return () => {
            window.document.removeEventListener('AppleIDSignInOnSuccess', (event) => handleAppleLoginSuccess(event));
            window.document.removeEventListener('AppleIDSignInOnFailure', (event) => handleAppleLoginFailure(event));
        }
    }, [])

    const login = async (at: string, rt: string, ea: number, isApple?: boolean, name?: AppleReturnType) => {
        if (referrer === null) {
            alert("Your referral code is invalid. Please ask your referrer to generate a new code.");
            setGlobalDisable(false);
            setLoginPressed(false);
        }
        else {
            const origin = cookies.get("origin");
            const bar = usc.barState.bar?.name ?? (cookies.get("bar_session") ?? "UNKNOWN BAR");
            const time = new Date(Date.now());

            if (origin) {
                try {
                    track(`${bar}: NEW LOGIN`, { origin: origin ?? "No origin", apple_email: name?.email ?? "GUEST", time: time.toLocaleTimeString() })
                }
                catch {
                    console.error("Can't track origin thru login.")
                }
            }

            await loginWithTipzyToken(at, rt, ea, isApple, name)
                .catch(() => {
                    setGlobalDisable(false);
                    setLoginPressed(false);
                });
        }

    }

    function loginWithGoogleToken(token: string | null) {
        if (token == null) {
            alert("Null token when logging into Google. Contact an admin for more information.")
            return;
        }

        setGlobalDisable(true);

        loginWithGoogleAccessToken(token).then((value) => login(value.access_token, value.refresh_token, value.expires_at)).catch(
            (e: Error) => {
                console.log(`Error logging into Tipzy servers via Google:`, `${e}`);
                setGlobalDisable(false);
            })
    }

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => loginWithGoogleToken(tokenResponse.access_token),
    });

    const onLogin = () => {
        if (!loginPressed) {
            setLoginPressed(true);
            loginWithUsernamePassword(username, password)
                .then(json => {
                    // console.log("ei", json.expires_in);
                    login(json.access_token, json.refresh_token, expiresInToAt(json.expires_in));
                }).catch(e => {
                    setLoginPressed(false);
                    console.log(e);
                })
        }
    }

    const createAccount = async (user: Consumer, isApple?: boolean, customName?: AppleReturnType) => {
        console.log(customName);

        if (!isApple)
            fetch(`${ServerInfo.baseurl}tipper/`, {
                method: 'POST',
                headers:
                {
                    Authorization: `Bearer ${user.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    birthday: formatBirthday(new Date()),
                })
            }).then((r) => r.json()).then((json) => console.log("new acc", json))
                .catch((e: Error) => {
                    alert(`Error creating new account. Please try again later: ${e.message}`);
                    return null;
                })
        else
            return customName ?
                fetch(`${ServerInfo.baseurl}tipper/?first_name=${customName.name.firstName}&last_name=${customName.name.lastName}&email=${customName.email}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        birthday: formatBirthday(new Date()),
                    })
                }).catch((e: Error) => {
                    alert(`Error creating new account. Please try again later: ${e.message}`);
                    return null;
                })
                :
                fetch(`${ServerInfo.baseurl}tipper/?first_name=${localStorage.getItem("firstName") ?? "Guest"}&last_name=${localStorage.getItem("lastName") ?? "Guest"}&email=${localStorage.getItem("email") ?? "guest@guest.com"}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        birthday: formatBirthday(new Date()),
                    })
                }).catch((e: Error) => {
                    alert(`Error creating new account. Please try again later: ${e.message}`);
                    return null;
                })

    }


    async function loginWithTipzyToken(accessToken: string | null, refreshToken: string | null, expiresAt: number, isApple?: boolean, customName?: AppleReturnType) {
        if (accessToken == null || refreshToken == null) {
            alert("Null token when logging into Tipzy. Contact an admin for more information.");
            return;
        }
        const name = "Guest";
        const img = undefined;
        const expires_at = expiresAt;

        const user = new Consumer(accessToken, expires_at, name ?? "", -1, img ?? undefined);
        usc.setUser(user);

        // console.log("login", user);
        // console.log(user.name);
        // console.log("usc user", usc.user);
        const result = await checkIfAccountExists({
            user: user,
            setUser: () => { },
            barState: { setBar: () => { } },
            artistState: { setArtist: () => { } }
        }).catch((e: Error) => {
            alert(`Can't check if account exists: ${e.message}`);
            setLoginPressed(false);
            return { result: false, data: undefined };
        })

        if (result.result && result.data) {
            const user = await storeAll({
                user: result.data,
                setUser: usc.setUser,
                barState: usc.barState,
                artistState: usc.artistState
            }, refreshToken)

            console.log("resulting user", user);
            usc.setUser(user);
            if (props.back) router.navigate(-1);
            else nextPage(user);

        } else {
            await createAccount(user, isApple, customName).catch(e => console.log(e));
            const newUser = await checkIfAccountExists({
                user: user,
                setUser: () => { },
                barState: { setBar: () => { } },
                artistState: { setArtist: () => { } }
            }).then(r => {
                if (!r.result) return undefined
                return r.data;
            });

            if (!newUser) {
                throw new Error("Problem verifying account exists. Try again later.")
            }
            usc.setUser(newUser);
            // console.log(newUser);
            await storeAll({
                user: newUser,
                setUser: usc.setUser,
                barState: usc.barState,
                artistState: { setArtist: () => { } }
            }, refreshToken).then((u) => {
                console.log("newuser", newUser, "u", u);
                nextPage(u);
            });
            // props.navigation.replace('CreateAccount', {
            //     refreshToken: refreshToken,
            //     user: user
            // });
        }
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
            if (password.length < 8) return true;
            return Math.min(firstName.length, lastName.length, username.length, email.length, password.length) === 0;
        }

        const PasswordRule = () => password.length < 8 ?
            <div style={regstyles.rule}>
                <span style={{ paddingTop: 2, fontSize: 12, color: Colors.secondaryLight, lineHeight: 1, display: 'block' }}>Password must have a minimum of 8 characters.</span>
            </div> : <></>

        const ConfirmPasswordRule = () => !pm ?
            <div style={regstyles.rule}>
                <span style={{ paddingTop: 2, fontSize: 12, color: Colors.secondaryLight, lineHeight: 1, display: 'block' }}>Passwords don't match.</span>
            </div> : <></>

        if (disabled !== checkShouldDisable()) setDisabled(checkShouldDisable());

        const onRegister = () => {
            if (!registerPressed) {
                setRegisterPressed(true);
                if (!emailRegex.test(email)) {
                    alert("Invalid email. Please enter in a valid email.");
                    setRegisterPressed(false);
                    return;
                }
                if (confirmPassword !== password) {
                    setRegisterPressed(false)
                    setPm(false); return;
                }
                setPm(true);

                registerUsernamePassword(firstName, lastName, email, username, password).then((response) => response.json()).then(json => {
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

        return (
            <div className={small ? "App-body-small" : "App-body"} style={{ width: "100%", justifyContent: 'flex-end' }}>
                <div

                    style={
                        small ? undefined :
                            {
                                zIndex: 1, justifyContent: 'flex-end', alignItems: 'center', display: 'flex', flexDirection: 'column', flex: 0,
                                width: "100%",
                                maxWidth: 500,
                                padding: padding,
                                borderTopLeftRadius: radius, borderTopRightRadius: radius, backgroundColor: Colors.background
                            }
                    }>
                    <div style={styles.header}>
                        {
                            small ?
                                <>
                                    <div style={{ width: "100%", display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: 0 }}>
                                        <div style={{ cursor: 'pointer' }} onClick={() => setLoginPage(true)}><FontAwesomeIcon icon={faArrowLeft}></FontAwesomeIcon></div>
                                    </div>
                                    <div style={{ width: "100%", justifyContent: 'center', display: 'flex' }}>
                                        <span className='App-subtitle' style={{ textAlign: 'center' }}>Sign Up</span>
                                    </div>
                                </>
                                :
                                <>
                                    <div style={{ width: "100%", display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', paddingBottom: 0 }}>
                                        <div style={{ cursor: 'pointer' }} onClick={() => setLoginPage(true)}><FontAwesomeIcon icon={faXmark}></FontAwesomeIcon></div>
                                    </div>
                                    <div style={{ width: "100%", justifyContent: 'center', display: 'flex' }}>
                                        <span className='App-subtitle' style={{ textAlign: 'center' }}>Sign Up</span>
                                    </div>
                                </>
                        }
                    </div>
                    <div style={{ paddingBottom: 10, width: "100%" }}>
                        <input className='input' placeholder='First name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div style={{ paddingBottom: 10, width: "100%" }}>
                        <input className='input' type='' placeholder='Last name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <div style={{ paddingBottom: 10, width: "100%" }}>
                        <input className='input' placeholder='Username' value={username} autoCorrect='off' autoCapitalize='off' onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div style={{ paddingBottom: 10, width: "100%" }}>
                        <input className='input' type='email' placeholder='email@address.com' value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div style={{ paddingBottom: 10, justifyContent: 'flex-start', width: "100%" }}>
                        <input className='input' type='Password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
                        <PasswordRule />
                    </div>
                    <div style={{ paddingBottom: 10, width: "100%" }}>
                        <input className='input' type='Password' placeholder='Confirm Password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <ConfirmPasswordRule />
                    </div>
                    <TZButton onClick={onRegister} disabled={false} title="Sign up"></TZButton>
                    {small ? <></> :
                        <>
                            <div style={{ paddingTop: 10, width: "100%", textAlign: 'center' }}>
                                Have an account? <a href={"#"} onClick={() => { if (!registerPressed) setLoginPage(true) }}>Sign In</a>
                            </div>
                            <div style={{ fontSize: 12, paddingTop: padding, textAlign: 'center' }}>
                                By logging in or creating an account you agree to our <a href="https://www.tipzy.app/privacy" target='_blank' rel="noreferrer">privacy policy.</a>
                            </div>
                        </>
                    }
                </div>
            </div>
        )
    }

    // const LoginPageMobile = () => {
    //     return (

    //     )
    // }

    return (
        <div className={small ? "App-body-small" : "App-body"} style={{ width: "100%" }}>
            {/* <img src={require('../assets/rave.gif')} style={{ objectFit: 'fill' }}></img> */}
            <div

                style={small ? undefined : {
                    zIndex: 0,
                    position: 'fixed',
                    right: 0,
                    top: 0,
                    minWidth: "100%",
                    minHeight: "100%",
                    // backgroundColor: "black",
                    backgroundImage: `url("${rave}")`,
                    backgroundSize: 'cover',
                }}
            >
                {/* <video autoPlay loop muted style={{ objectFit: 'fill', minWidth: "100%", minHeight: "100%", opacity: 0.3 }}>
                    <source src={raveVideo} type='video/mp4' />
                </video> */}
            </div>

            {loginPage ?
                <div style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', flex: 1, width: "100%"
                }}>
                    {loginPrompt ?
                        <div style={{ flex: 0, zIndex: 2, position: 'fixed', top: 0, left: 0, textAlign: 'center', width: '100%', backgroundColor: '#8883', justifyContent: 'space-between', flexDirection: 'row', display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                flex: 1, height: 50
                            }}></div>
                            <div style={{ padding: padding / 2, flex: 5, height: 50, display: "flex", justifyContent: 'center', alignItems: 'center' }}>
                                {"Please sign in to continue."}
                            </div>
                            {
                                <div style={{
                                    flex: 1,
                                    display: 'flex', alignItems: 'center',
                                    paddingRight: padding,
                                    cursor: 'pointer',
                                    opacity: 0.8,
                                    flexDirection: 'row-reverse',
                                }} onClick={() => nextPage()}>
                                    <FontAwesomeIcon className="App-backarrow" icon={faCancel} ></FontAwesomeIcon>
                                    {/* <span className="App-tertiarytitle" style={{paddingLeft: 5}}>Exit</span> */}
                                </div>
                            }
                        </div> : <></>}
                    <div style={{
                        zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: "100%",
                        maxWidth: 500,
                    }}>
                        <div>

                            {
                                small ?
                                    <div style={{ display: "flex", flexDirection: 'column', justifyContent: 'center' }}>
                                        <span className='App-logintitle-small' style={{ whiteSpace: 'pre-line', }}>
                                            YOU'RE SO CLOSE TO
                                            HEARING YOUR FAVORITE SONG!
                                        </span>
                                        <span className='App-tertiarytitle' style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
                                            {"\n"}Please sign in:
                                        </span>
                                    </div>
                                    :
                                    <>
                                        <img src={FullLogo} style={{ width: "30%", minWidth: 100, maxWidth: 180, objectFit: 'contain', paddingBottom: padding }} alt={"tipzy full logo"}></img>
                                        <br></br>
                                        <span className='App-logintitle' style={{ whiteSpace: 'pre-line' }}>
                                            YOUR TUNES,{"\n"}
                                            YOUR CALL,{"\n"}
                                            YOUR VIBE.
                                        </span>
                                    </>
                            }
                            {/* <img src={FullLogo} style={{ minWidth: 100, maxWidth: 200, objectFit: 'contain' }} alt={"tipzy full logo"}></img> */}
                        </div>
                    </div>
                    <div style={{
                        zIndex: 1, justifyContent: 'flex-end', alignItems: 'center', display: 'flex', flexDirection: 'column', flex: 0,
                        width: "100%",
                        maxWidth: 500,
                        padding: padding, borderTopLeftRadius: radius, borderTopRightRadius: radius, backgroundColor: Colors.background
                    }}>
                        {referrer !== undefined ?
                            <div className='App-normaltext' style={{ paddingBottom: padding, fontWeight: 'bold' }}>
                                {referrer === null ? "INVALID REFERRAL CODE" : `Referral from ${referrer}`}
                            </div> : <></>}
                        <AppleLogin
                            clientId="app.tipzy.TipzyAppleSignIn"
                            redirectURI="https://app.tipzy.app/"
                            // redirectURI="https://tipzyapi.com/auth/token"
                            usePopup={true}
                            // responseType="code id_token"
                            responseType="code"
                            callback={() => {
                                console.log("response from apple: ");
                            }} // Catch the response
                            scope="name email"
                            // responseType='id_token'
                            responseMode="query"
                            render={renderProps => (  //Custom Apple Sign in Button
                                <TZButton
                                    animateglow={isIOS}
                                    leftComponent={
                                        <><FontAwesomeIcon fontSize={18} icon={faApple} color={"black"} /> <div style={{ paddingRight: 5 }} /></>
                                    } onClick={renderProps.onClick} backgroundColor="white" fontSize={20} color="black" title="Continue With Apple" />
                            )}
                        />
                        <div style={{ paddingBottom: padding }}></div>
                        <TZButton leftComponent={
                            <><img src={GoogleLogo} width={18} height={18} alt={"google logo"} /> <div style={{ paddingRight: 5 }} /></>
                        } onClick={googleLogin} backgroundColor="white" fontSize={20} color="black" title="Continue With Google" />
                        <div style={{ paddingBottom: padding }}></div>
                        {t ? (
                            usernameShowing ?
                                <div style={{
                                    backgroundColor: "#8885", width: "100%",
                                    paddingTop: padding / 2, paddingBottom: padding, paddingLeft: padding, paddingRight: padding,
                                    borderRadius: radius
                                }}>
                                    <div style={{ width: "100%", display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', paddingBottom: padding / 2 }}>
                                        <div style={{ cursor: 'pointer' }} onClick={() => setUsernameShowing(false)}><FontAwesomeIcon icon={faXmark}></FontAwesomeIcon></div>
                                    </div>
                                    <div style={{ paddingBottom: 10, width: "100%" }}>
                                        <input className='input' placeholder='Username' autoCorrect='off' autoCapitalize='off' value={username} onChange={(e) => setUsername(e.target.value)} />
                                    </div>
                                    <div style={{ paddingBottom: 10, width: "100%" }}>
                                        <input className='input' type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
                                    </div>
                                    <TZButton onClick={onLogin} title={"Sign in"} disabled={loginPressed}></TZButton>
                                </div>
                                :
                                <TZButton onClick={() => setUsernameShowing(true)} backgroundColor="#8885" fontSize={20} color="white" title="Sign in with Username" />
                        ) : <></>}
                        {t ? <div style={{ paddingTop: 10, textAlign: 'center' }}>
                            Don't have an account? <span style={{ color: Colors.primaryRegular, cursor: "pointer" }} onClick={() => { if (!loginPressed) setLoginPage(false) }}>Sign Up</span>
                        </div> : <></>}
                        <div style={{ fontSize: 12, paddingTop: padding, textAlign: 'center', color: "#888" }}>
                            By using this service you agree to our <a style={{ textDecoration: 'underline', color: "#AAA" }} href="https://www.tipzy.app/privacy" target='_blank' rel="noreferrer">privacy policy.</a>
                            <br></br>
                            Questions? <a style={{ textDecoration: 'underline', color: "#AAA" }} href="mailto:help@tipzy.app" target='_blank' rel="noreferrer">Contact us.</a>
                        </div>
                    </div>
                </div >
                : <Register />}
            {(globalDisable || loginPressed) ?
                <div className='App-body' style={{ position: 'fixed', zIndex: 10, top: 0, display: 'flex', flex: 1, width: '100%', backgroundColor: Colors.background + "aa" }}>
                    <Spinner style={{ color: Colors.primaryRegular, width: 75, height: 75 }}></Spinner>
                </div>
                : <></>
            }
        </div>
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