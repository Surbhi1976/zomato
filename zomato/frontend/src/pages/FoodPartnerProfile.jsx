import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../api'
import BottomNav from '../components/BottomNav'
import { TrashIcon } from '../components/Icons'
import './Pages.css'

const FoodPartnerProfile = () => {
    const { id } = useParams()
    const [partner, setPartner] = useState(null)
    const [role, setRole] = useState('')
    const [myId, setMyId] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        let cancelled = false
        Promise.all([api.get(`/api/food-partner/${id}`), api.get('/api/auth/me')])
            .then(([p, me]) => {
                if (cancelled) return
                setPartner(p.data.foodPartner)
                setRole(me.data.role)
                setMyId(me.data.foodPartner?._id || '')
            })
            .catch((err) => {
                if (cancelled) return
                if (err.response?.status === 401) return navigate('/user/login', { replace: true })
                setError(errorMessage(err))
            })
        return () => { cancelled = true }
    }, [id, navigate])

    const isOwner = role === 'partner' && myId === id

    const remove = async (food) => {
        if (!window.confirm(`Delete "${food.name}"? This cannot be undone.`)) return
        try {
            await api.delete(`/api/food/${food._id}`)
            setPartner((p) => ({
                ...p,
                foodItems: p.foodItems.filter((f) => f._id !== food._id),
                totalLikes: p.totalLikes - (food.likeCount || 0),
            }))
        } catch (err) {
            window.alert(errorMessage(err))
        }
    }

    if (error) {
        return <main className="page"><div className="page-card"><h1>Oops</h1><p className="form-error">{error}</p><Link to="/">Go home</Link></div></main>
    }
    if (!partner) return <div className="page-loading" role="status">Loading…</div>

    return (
        <main className="page page-wide">
            <header className="profile-head">
                <div className="profile-avatar" aria-hidden="true">{partner.name.charAt(0).toUpperCase()}</div>
                <div>
                    <h1>{partner.name}</h1>
                    <p className="muted">{partner.address}</p>
                    <p className="muted">Contact: {partner.contactname} · {partner.phone}</p>
                </div>
            </header>

            <div className="profile-stats">
                <div><strong>{partner.foodItems.length}</strong><span>Dishes</span></div>
                <div><strong>{partner.totalLikes}</strong><span>Total likes</span></div>
            </div>

            {partner.foodItems.length === 0 ? (
                <p className="muted center">No videos posted yet.</p>
            ) : (
                <div className="video-grid">
                    {partner.foodItems.map((f) => (
                        <figure key={f._id} className="video-tile">
                            <video src={f.video} controls preload="metadata" playsInline muted />
                            <figcaption>
                                <span>{f.name}</span>
                                {isOwner && (
                                    <button type="button" className="tile-delete" onClick={() => remove(f)} aria-label={`Delete ${f.name}`}>
                                        <TrashIcon width={16} height={16} />
                                    </button>
                                )}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            )}

            {role === 'user'
                ? <BottomNav role="user" />
                : <BottomNav role="partner" partnerId={myId} />}
        </main>
    )
}

export default FoodPartnerProfile
