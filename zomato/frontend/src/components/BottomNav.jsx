import { NavLink, useNavigate } from 'react-router-dom'
import api from '../api'
import { BookmarkIcon, HomeIcon, LogoutIcon, PlusIcon, StoreIcon } from './Icons'
import './BottomNav.css'

// role="user": Home / Saved / Logout      role="partner": Upload / My store / Logout
const BottomNav = ({ role = 'user', partnerId }) => {
    const navigate = useNavigate()

    const logout = async () => {
        try {
            await api.get(role === 'partner' ? '/api/auth/foodpartner/logout' : '/api/auth/user/logout')
        } finally {
            navigate(role === 'partner' ? '/food-partner/login' : '/user/login', { replace: true })
        }
    }

    const cls = ({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`

    return (
        <nav className="bottom-nav" aria-label="Main">
            {role === 'user' ? (
                <>
                    <NavLink to="/" end className={cls}><HomeIcon /><span>Home</span></NavLink>
                    <NavLink to="/saved" className={cls}><BookmarkIcon /><span>Saved</span></NavLink>
                </>
            ) : (
                <>
                    <NavLink to="/create-food" className={cls}><PlusIcon /><span>Upload</span></NavLink>
                    {partnerId && <NavLink to={`/food-partner/${partnerId}`} className={cls}><StoreIcon /><span>My store</span></NavLink>}
                </>
            )}
            <button type="button" className="nav-item" onClick={logout}><LogoutIcon /><span>Logout</span></button>
        </nav>
    )
}

export default BottomNav
