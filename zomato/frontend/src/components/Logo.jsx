import { Link } from 'react-router-dom'
import { BRAND } from '../brand'

// Orange rounded square with a play triangle: "food + reels".
export const LogoMark = ({ size = 30 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="9" fill="#ff6a2b" />
        <path d="M12.5 9.5v13l11-6.5z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
)

// name is split so the last 4 letters get the accent colour: "bite" + "reel"
const Logo = ({ to = '/user/login', size = 30 }) => {
    const name = BRAND.NAME.toLowerCase()
    const cut = name.length - 4
    return (
        <Link className="wordmark" to={to} aria-label={`${BRAND.NAME} home`}>
            <LogoMark size={size} />
            <span className="wordmark-text">
                {name.slice(0, cut)}<span className="wordmark-accent">{name.slice(cut)}</span>
            </span>
        </Link>
    )
}

export default Logo
