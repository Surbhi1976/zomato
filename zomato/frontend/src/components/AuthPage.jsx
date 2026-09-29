import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import Logo, { LogoMark } from './Logo'
import GoogleButton from './GoogleButton'
import { BRAND } from '../brand'
import './AuthPage.css'

const AuthPage = ({ audience, mode }) => {
    const isPartner = audience === 'partner'
    const isRegister = mode === 'register'
    const audienceLabel = isPartner ? 'food partner' : 'customer'
    const title = isRegister ? 'Create your account' : 'Welcome back'
    const navigate = useNavigate()
    const notice = useLocation().state?.notice // e.g. "Password updated" after a reset
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        const v = (k) => String(form.get(k) || '').trim()
        const base = isPartner ? '/api/auth/foodpartner' : '/api/auth/user'

        let payload
        if (isPartner) {
            payload = isRegister
                ? { name: v('restaurantName'), email: v('email'), password: form.get('password'), contactname: v('contactName'), phone: v('phone'), address: v('address') }
                : { email: v('email'), password: form.get('password') }
        } else {
            payload = isRegister
                ? { fullName: v('name'), email: v('email'), password: form.get('password') }
                : { email: v('email'), password: form.get('password') }
        }

        setBusy(true)
        setError('')
        try {
            await api.post(`${base}/${isRegister ? 'register' : 'login'}`, payload)
            navigate(isPartner ? '/create-food' : '/', { replace: true })
        } catch (err) {
            setError(errorMessage(err))
        } finally {
            setBusy(false)
        }
    }

    // Google gives the browser a signed ID token; the server verifies it and starts the session
    const handleGoogle = async (credential) => {
        setError('')
        try {
            await api.post('/api/auth/user/google', { credential })
            navigate('/', { replace: true })
        } catch (err) {
            setError(errorMessage(err))
        }
    }

    return (
        <main className={`auth-page ${isPartner && isRegister ? 'partner-register-page' : ''}`}>
            <header className="auth-header">
                <Logo />
                <nav className="audience-switch" aria-label="Choose account type">
                    <Link className={!isPartner ? 'is-active' : ''} to={isRegister ? '/user/register' : '/user/login'}>
                        Customer
                    </Link>
                    <Link className={isPartner ? 'is-active' : ''} to={isRegister ? '/food-partner/register' : '/food-partner/login'}>
                        Food partner
                    </Link>
                </nav>
            </header>

            <section className="auth-content" aria-labelledby="auth-title">
                {isPartner && isRegister && (
                    <aside className="partner-panel" aria-label="Food partner registration benefits">
                        <span className="partner-mark"><LogoMark size={44} /></span>
                        <p className="partner-panel-label">Partner with {BRAND.NAME}</p>
                        <h2>Turn your kitchen into a destination.</h2>
                        <p>Reach hungry customers, grow your orders, and manage your restaurant in one place.</p>
                        <div className="partner-panel-note">
                            <span className="partner-panel-dot" />
                            <span>Set up your partner profile in minutes</span>
                        </div>
                    </aside>
                )}
                <div className="auth-intro">
                    <p className="eyebrow">{isPartner ? 'For restaurants' : BRAND.TAGLINE}</p>
                    <h1 id="auth-title">{title}</h1>
                    <p className="auth-description">
                        {isRegister
                            ? `Join ${BRAND.NAME} as a ${audienceLabel} and make every meal count.`
                            : `Sign in to continue as a ${audienceLabel}.`}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {notice && <p className="auth-notice" role="status">{notice}</p>}
                    {isRegister && (
                        <>
                            {isPartner ? (
                                <label className="form-field">
                                    <span>Restaurant name</span>
                                    <input name="restaurantName" type="text" placeholder="Your restaurant" autoComplete="organization" required />
                                </label>
                            ) : (
                                <label className="form-field">
                                    <span>Full name</span>
                                    <input name="name" type="text" placeholder="Your name" autoComplete="name" required />
                                </label>
                            )}
                        </>
                    )}
                    <label className="form-field">
                        <span>Email address</span>
                        <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
                    </label>
                    {isRegister && isPartner && (
                        <div className="partner-field-grid">
                            <label className="form-field">
                                <span>Contact person</span>
                                <input name="contactName" type="text" placeholder="Your full name" autoComplete="name" required />
                            </label>
                            <label className="form-field">
                                <span>Phone number</span>
                                <input name="phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel" required />
                            </label>
                        </div>
                    )}
                    {isRegister && isPartner && (
                        <label className="form-field">
                            <span>Restaurant address</span>
                            <textarea name="address" placeholder="Building, street, city" autoComplete="street-address" rows="3" required />
                        </label>
                    )}
                    <label className="form-field">
                        <span>Password</span>
                        <input name="password" type="password" placeholder="At least 8 characters" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="8" required />
                    </label>
                    {!isRegister && (
                        <div className="form-meta">
                            <label className="remember-option">
                                <input type="checkbox" name="remember" />
                                <span>Remember me</span>
                            </label>
                            <Link className="text-button" to={`/${isPartner ? 'food-partner' : 'user'}/forgot-password`}>Forgot password?</Link>
                        </div>
                    )}
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="submit-button" type="submit" disabled={busy}>
                        {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
                    </button>
                    {!isPartner && <GoogleButton onCredential={handleGoogle} text={isRegister ? 'signup_with' : 'signin_with'} />}
                    <p className="switch-prompt">
                        {isRegister ? 'Already have an account?' : `New to ${BRAND.NAME}?`}{' '}
                        <Link to={`/${audience === 'partner' ? 'food-partner' : 'user'}/${isRegister ? 'login' : 'register'}`}>
                            {isRegister ? 'Sign in' : 'Create account'}
                        </Link>
                    </p>
                </form>
            </section>

            <footer className="auth-footer">© 2026 {BRAND.NAME} · {isPartner ? 'Partner account' : 'Customer account'}</footer>
        </main>
    )
}

export default AuthPage