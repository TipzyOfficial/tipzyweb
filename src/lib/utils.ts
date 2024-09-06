import { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "universal-cookie";
import { Consumer } from "./user";
import { UserSessionContextType } from "./UserSessionContext";

function isMobile() {
    const o = typeof window.screen.orientation !== 'undefined';
    return o;
}

//checks if a user is logged out
export function noAccessToken(usc: UserSessionContextType): boolean {
    return !usc.user.access_token || usc.user.access_token.length === 0;
}

export function numberToPrice(n: number): string {
    return `${(n / 100).toFixed(2)}`;
}

export function shuffleArrayMutate(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function shuffleWithUserID(array: any[], user: Consumer) {
    let seed = 0;
    const userid = (user.name.toString() ?? "" + user.email.toString() ?? "" + user.birthday ?? "")

    for (let i = 0; i < userid.length; i++) {
        seed += userid.charCodeAt(i);
    }

    return shuffle(array, seed);
}

//shuffles an array according to a seed
export function shuffle(array: any[], seed: number) {                // <-- ADDED ARGUMENT
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(random(seed) * m--);        // <-- MODIFIED LINE

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
        ++seed                                     // <-- ADDED LINE
    }

    return array;
}

function random(seed: number) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

export const getCookies = () => {
    return new Cookies(null, { path: '/', sameSite: "strict" })
}

const cookies = getCookies();

export const clearData = () => {
    cookies.remove("access_token");
    cookies.remove("refresh_token");
    cookies.remove("expires_at");
    cookies.remove("name");
    cookies.remove("notifs");
    cookies.remove("notis");
    cookies.remove("email");
    localStorage.clear();
}

export const onlyAlphanumeric = (str: string): string => {
    return str.replace(/[^0-9A-Z]+/gi, "");
}

export const onlyAlphanumericSpaces = (str: string): string => {
    return str.replace(/[^0-9A-Z ]+/gi, "");
}

export const getStored = (key: string): string | null => {
    return localStorage.getItem(key);
}

export const setStored = (key: string, value: string): void => {
    return localStorage.setItem(key, value);
}

export const trackUser = (usc: UserSessionContextType): string => {
    if (noAccessToken(usc)) return "[GUEST USER]"
    return `${usc.user.name}, id: ${usc.user.id}`;
}

export function useInterval(callback: () => any, delay: number, firstDelay?: number): void {

    const [enabled, setEnabled] = useState(true);
    const [d, setdi] = useState(firstDelay ?? delay);
    const setd = (n: number) => {
        if (n !== d) setdi(n);
    }
    // let enabled = true;
    // const setEnabled = (e: boolean) => {enabled = e;}

    const savedCallback = useRef<typeof callback>();

    const onVisChange = () => {
        if (document.hidden) {
            if (enabled) {
                setEnabled(false);
                console.log("Tab is now hidden. Disabling useInterval");
            }
        }
        else {
            if (!enabled) {
                setd(firstDelay ?? delay);
                setEnabled(true);
                console.log("Tab is now in focus. Enabling useInterval");
            }
        }
    };

    // Remember the latest callback.
    useEffect(() => {
        document.addEventListener("visibilitychange", onVisChange);

        savedCallback.current = callback;

        onVisChange();

        // Specify how to clean up after this effect:
        return () => {
            document.removeEventListener("visibilitychange", onVisChange);
        };

    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            if (delay !== null) setd(delay);
            // console.log("tick ended. enabled",enabled);
            if (enabled) savedCallback.current ? savedCallback.current() : (() => { })()
        }
        if (delay !== null) {
            // console.log(d);
            let id = setInterval(tick, d);
            return () => { clearInterval(id); }
        }
    }, [d, enabled]);
}

export function useCallbackRef<T>(): [T | null, (node: T | null) => void] {
    const [o, so] = useState<T | null>(null);
    const ref = useCallback((node: T | null) => {
        if (node !== null) {
            so(node);
        }
    }, []);
    return [o, ref];
}