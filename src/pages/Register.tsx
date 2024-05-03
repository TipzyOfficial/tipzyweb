import React, { CSSProperties, useEffect, useState } from 'react';
import './Login.css';
import BigLogo from '../components/BigLogo';
import TZButton from '../components/TZButton';
import { CredentialResponse, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import GoogleButton from 'react-google-button';
import { loginWithGoogleAccessToken, registerUsernamePassword } from '../lib/serverinfo';
import { styles } from './Login';
import { Colors } from '../lib/Constants';
import { goToLogin } from '../App';

function Register() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pm, setPm] = useState(true);
    const [disabled, setDisabled] = useState(true);

    const emailRegex = new RegExp(".@.*\..");


    const checkShouldDisable = () => {
        if(password.length < 8) return true;
        return Math.min(firstName.length, lastName.length, username.length, email.length, password.length) === 0;
    }

    const PasswordRule = () => password.length < 8 ?
    <div style={regstyles.rule}>
        <span style={{fontSize: 12, color: Colors.secondaryLight}}>Password must have a minimum of 8 characters.</span>
    </div> : <></>

    const ConfirmPasswordRule = () => !pm ?
    <div style={regstyles.rule}>
        <span style={{fontSize: 12, color: Colors.secondaryLight}}>Passwords don't match.</span>
    </div> : <></>

    if(disabled !== checkShouldDisable()) setDisabled(checkShouldDisable());

    const onRegister = () => {
        if (!emailRegex.test(email)){
            alert("Invalid email. Please enter in a valid email.");
            return;
        }
        if(confirmPassword !== password) {
            setPm(false); return;
        }
        setPm(true);

        registerUsernamePassword(firstName, lastName, email, username, password).then((response) => response.json()).then(json => 
            {
            if (json.status === 201) {
                alert("Woohoo! Account successfully created! Please log in.");
                goToLogin();
            }
            else if (json.status === 406) {
                alert(`Register failed: ${json.detail}`);
            }
            else {
                alert(`Register failed: Bad response, status: ${json.status}. Contact help@tipzy.com for assistance.`);
            }
        })
    }

    return(
        <div className='Login-container'>
            <div style={styles.jumbo}>
                <div style={styles.header}>
                    <span style={styles.title}>Sign Up</span>
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
                <div style={{paddingTop:10}}>
                    Have an account? <a href={"./login"}>Sign In</a>
                </div>
            </div>
        </div>
    )
}

const rule: CSSProperties = {
    textAlign: 'left',
}

const regstyles = {
    rule: rule
  }

export default Register;