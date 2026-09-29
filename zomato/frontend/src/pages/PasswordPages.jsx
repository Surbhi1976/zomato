import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api, { errorMessage } from '../api'
import Logo from '../components/Logo'
import { BRAND } from '../brand'
import '../components/AuthPage.css'
import './PasswordPages.css'

const loginPath = (role) => (role === 'partner' ? '/food-partner/login' : '/user/login')
const forgotPath = (role) => (role === 'partner' ? '/food-partner/forgot-password' : '/user/forgot-password')

// Same look as the sign-in page, without the extra navigation.
const Shell = ({ role, eyebrow, title, description, children }) => (
    <main className="auth-page">
        <header className="auth-header">
            <Logo to={loginPath(role)} />
        </header>
        <section className="auth-content" aria-labelledby="pw-title">
            <div className="auth-intro">
                <p className="eyebrow">{eyebrow}</p>
                <h1 id="pw-title">{title}</h1>
                {description && <p className="auth-description">{description}</p>}
            </div>
            {children}
        </section>
        <footer className="auth-footer">© 2026 {BRAND.NAME} · {role === 'partner' ? 'Partner account' : 'Customer account'}</footer>
    </main>
)

// ---------------------------------------------------------------- forgot password
export const ForgotPassword = ({ role = 'user' }) => {
    const [email, setEmail] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [sentTo, setSentTo] = useState('')

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        try {
            await api.post('/api/auth/forgot-password', { email: email.trim(), role })
            setSentTo(email.trim())
        } catch (err) {
            setError(errorMessage(err))
        } finally {
            setBusy(false)
        }
    }

    if (sentTo) {
        return (
            <Shell role={role} eyebrow="Check your inbox" title="Reset link on its way">
                <div className="pw-card" role="status">
                    <p>
                        If an account exists for <strong>{sentTo}</strong>, we have sent a link to reset your password.
                        It is valid for 30 minutes.
                    </p>
                    <p className="pw-hint">Nothing there? Check your spam folder, or make sure you typed the email you signed up with.</p>
                    <button type="button" className="submit-button pw-secondary" onClick={() => { setSentTo(''); setEmail('') }}>
                        Use a different email
                    </button>
                    <p className="switch-prompt"><Link to={loginPath(role)}>Back to sign in</Link></p>
                </div>
            </Shell>
        )
    }

    return (
        <Shell
            role={role}
            eyebrow="Account recovery"
            title="Forgot your password?"
            description="Enter the email you signed up with and we will send you a link to choose a new password."
        >
            <form className="auth-form" onSubmit={submit}>
                <label className="form-field">
                    <span>Email address</span>
                    <input
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button className="submit-button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
                <p className="switch-prompt"><Link to={loginPath(role)}>Back to sign in</Link></p>
            </form>
        </Shell>
    )
}

// ---------------------------------------------------------------- reset password
export const ResetPassword = () => {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const role = params.get('role') === 'partner' ? 'partner' : 'user'
    const token = params.get('token') || ''
    const linkLooksValid = /^[a-f0-9]{64}$/.test(token)

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [show, setShow] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [expired, setExpired] = useState(false)

    if (!linkLooksValid) {
        return (
            <Shell role={role} eyebrow="Account recovery" title="This link is not valid">
                <div className="pw-card">
                    <p>The reset link is incomplete. Please open the link from your email again, or request a new one.</p>
                    <Link className="submit-button pw-link-button" to={forgotPath(role)}>Request a new link</Link>
                </div>
            </Shell>
        )
    }

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        if (password.length < 8) return setError('Password must be at least 8 characters.')
        if (password !== confirm) return setError('The two passwords do not match.')
        setBusy(true)
        try {
            await api.post('/api/auth/reset-password', { token, role, password })
            navigate(loginPath(role), { replace: true, state: { notice: 'Password updated. Sign in with your new password.' } })
        } catch (err) {
            setError(errorMessage(err))
            if (err.response?.status === 400 && /invalid or has expired/i.test(err.response?.data?.message || '')) setExpired(true)
            setBusy(false)
        }
    }

    return (
        <Shell role={role} eyebrow="Account recovery" title="Choose a new password" description="Pick something at least 8 characters long that you have not used elsewhere.">
            <form className="auth-form" onSubmit={submit}>
                <label className="form-field">
                    <span>New password</span>
                    <input
                        name="password"
                        type={show ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        minLength="8"
                        maxLength="72"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                <label className="form-field">
                    <span>Confirm new password</span>
                    <input
                        name="confirm"
                        type={show ? 'text' : 'password'}
                        placeholder="Type it again"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </label>
                <label className="remember-option">
                    <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
                    <span>Show passwords</span>
                </label>
                {error && <p className="auth-error" role="alert">{error}</p>}
                {expired
                    ? <Link className="submit-button pw-link-button" to={forgotPath(role)}>Request a new link</Link>
                    : <button className="submit-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>}
                <p className="switch-prompt"><Link to={loginPath(role)}>Back to sign in</Link></p>
            </form>
        </Shell>
    )
}
