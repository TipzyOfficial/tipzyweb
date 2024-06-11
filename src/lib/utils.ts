import { useEffect, useRef, useState } from "react";
import Cookies from "universal-cookie";

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

export const getStored = (key: string): string | null => {
    return localStorage.getItem(key);
}

export const setStored = (key: string, value: string): void => {
    return localStorage.setItem(key, value);
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
