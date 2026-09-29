const base = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const HeartIcon = ({ filled, ...p }) => (
    <svg {...base} {...p} fill={filled ? 'currentColor' : 'none'}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
)
export const BookmarkIcon = ({ filled, ...p }) => (
    <svg {...base} {...p} fill={filled ? 'currentColor' : 'none'}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
)
export const HomeIcon = (p) => (
    <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
)
export const PlusIcon = (p) => (
    <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)
export const StoreIcon = (p) => (
    <svg {...base} {...p}><path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6" /></svg>
)
export const UserIcon = (p) => (
    <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
)
export const LogoutIcon = (p) => (
    <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
)
export const VolumeIcon = ({ muted, ...p }) => (
    <svg {...base} {...p}>
        <path d="M11 5 6 9H2v6h4l5 4z" />
        {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
    </svg>
)
export const PlayIcon = (p) => (
    <svg {...base} {...p} fill="currentColor"><path d="M7 4v16l13-8z" /></svg>
)
export const CommentIcon = (p) => (
    <svg {...base} {...p}><path d="M21 12a8 8 0 0 1-11.7 7.1L3 21l1.9-5.8A8 8 0 1 1 21 12z" /></svg>
)
export const SearchIcon = (p) => (
    <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
)
export const TrashIcon = (p) => (
    <svg {...base} {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
)
export const CloseIcon = (p) => (
    <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
