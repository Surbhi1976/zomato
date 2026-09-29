import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import api from '../api'

// Guards a group of routes. `role` is "user" or "partner".
// Asks the backend who is logged in (the JWT lives in an httpOnly cookie).
const RequireAuth = ({ role }) => {
    const [session, setSession] = useState({ status: 'loading' })

    useEffect(() => {
        let cancelled = false
        api.get('/api/auth/me')
            .then((res) => !cancelled && setSession({ status: 'ok', role: res.data.role }))
            .catch(() => !cancelled && setSession({ status: 'none' }))
        return () => { cancelled = true }
    }, [])

    if (session.status === 'loading') {
        return <div className="page-loading" role="status">Loading…</div>
    }
    if (session.status === 'none') {
        return <Navigate to={role === 'partner' ? '/food-partner/login' : '/user/login'} replace />
    }
    if (session.role !== role) {
        // logged in, but as the other account type
        return <Navigate to={session.role === 'partner' ? '/create-food' : '/'} replace />
    }
    return <Outlet />
}

export default RequireAuth
