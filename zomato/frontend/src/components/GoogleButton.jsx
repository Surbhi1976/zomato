import { useEffect, useRef, useState } from 'react'
import './GoogleButton.css'

const SRC = 'https://accounts.google.com/gsi/client'
let scriptPromise

// Loads Google's sign-in script once for the whole app.
const loadGoogleScript = () => {
    if (window.google?.accounts?.id) return Promise.resolve()
    scriptPromise ??= new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = SRC
        s.async = true
        s.onload = resolve
        s.onerror = () => { scriptPromise = null; reject(new Error('Google script failed to load')) }
        document.head.appendChild(s)
    })
    return scriptPromise
}

// Google's official "Sign in with Google" button. `onCredential(idToken)` runs after the person picks an account;
// the token must be verified by the backend (never trust it in the browser).
const GoogleButton = ({ onCredential, text = 'continue_with' }) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const holder = useRef(null)
    const callback = useRef(onCredential)
    const [failed, setFailed] = useState(false)

    useEffect(() => { callback.current = onCredential })

    useEffect(() => {
        if (!clientId) return
        let cancelled = false
        loadGoogleScript()
            .then(() => {
                if (cancelled || !holder.current) return
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (res) => callback.current?.(res.credential),
                    ux_mode: 'popup',
                })
                const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
                window.google.accounts.id.renderButton(holder.current, {
                    type: 'standard',
                    theme: dark ? 'filled_black' : 'outline',
                    size: 'large',
                    text,
                    shape: 'rectangular',
                    width: Math.min(400, holder.current.offsetWidth || 320),
                })
            })
            .catch(() => !cancelled && setFailed(true))
        return () => { cancelled = true }
    }, [clientId, text])

    if (!clientId) return null // feature is simply hidden until a Client ID is configured

    return (
        <div className="google-block">
            <div className="or-divider"><span>or</span></div>
            <div ref={holder} className="google-holder" />
            {failed && (
                <p className="google-fail" role="status">
                    Google sign-in could not load. Check your connection or ad-blocker, or use your email instead.
                </p>
            )}
        </div>
    )
}

export default GoogleButton
