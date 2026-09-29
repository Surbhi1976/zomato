import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { BookmarkIcon, CommentIcon, HeartIcon, PlayIcon, StoreIcon, VolumeIcon } from './Icons'
import CommentsSheet from './CommentsSheet'
import './ReelFeed.css'

const compact = (n = 0) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n))

const Reel = ({ item, active, muted, onToggleMute, onLike, onSave, onComment }) => {
    const videoRef = useRef(null)
    const [paused, setPaused] = useState(false)
    const [expanded, setExpanded] = useState(false)

    // play only the reel that is on screen
    useEffect(() => {
        const video = videoRef.current
        if (!video) return
        if (active) {
            video.play().catch(() => {})
        } else {
            video.pause()
            video.currentTime = 0
        }
    }, [active])

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return
        if (video.paused) {
            video.play().catch(() => {})
            setPaused(false)
        } else {
            video.pause()
            setPaused(true)
        }
    }

    const partner = item.foodPartner

    return (
        <section className="reel" data-id={item._id} aria-label={item.name}>
            <video
                ref={videoRef}
                className="reel-video"
                src={item.video}
                loop
                muted={muted}
                playsInline
                preload="metadata"
                onClick={togglePlay}
            />
            {paused && active && <div className="reel-paused" aria-hidden="true"><PlayIcon width={56} height={56} /></div>}

            <button type="button" className="reel-mute" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
                <VolumeIcon muted={muted} width={22} height={22} />
            </button>

            <div className="reel-actions">
                <button type="button" className={`reel-action ${item.isLiked ? 'is-on is-liked' : ''}`} onClick={() => onLike(item)} aria-pressed={!!item.isLiked} aria-label="Like">
                    <HeartIcon filled={item.isLiked} />
                    <span>{compact(item.likeCount)}</span>
                </button>
                <button type="button" className="reel-action" onClick={() => onComment(item)} aria-label="Comments">
                    <CommentIcon />
                    <span>{compact(item.commentCount)}</span>
                </button>
                <button type="button" className={`reel-action ${item.isSaved ? 'is-on' : ''}`} onClick={() => onSave(item)} aria-pressed={!!item.isSaved} aria-label="Save">
                    <BookmarkIcon filled={item.isSaved} />
                    <span>{compact(item.saveCount)}</span>
                </button>
            </div>

            <div className="reel-info">
                {partner?.name && <p className="reel-partner">{partner.name}</p>}
                <h2 className="reel-title">{item.name}</h2>
                <p className={`reel-desc ${expanded ? 'is-expanded' : ''}`} onClick={() => setExpanded((v) => !v)}>{item.description}</p>
                {partner?._id && (
                    <Link className="reel-visit" to={`/food-partner/${partner._id}`}>
                        <StoreIcon width={18} height={18} /> Visit store
                    </Link>
                )}
            </div>
        </section>
    )
}

// items: array of food docs (with isLiked / isSaved), setItems: state setter from the parent page
const ReelFeed = ({ items, setItems, emptyTitle = 'No videos yet', emptyText = 'Check back soon for delicious reels.' }) => {
    const [activeId, setActiveId] = useState(null)
    const [muted, setMuted] = useState(true) // browsers only allow autoplay when muted
    const [error, setError] = useState('')
    const [commentId, setCommentId] = useState(null)
    const containerRef = useRef(null)

    // track which reel is mostly visible
    useEffect(() => {
        const root = containerRef.current
        if (!root || items.length === 0) return
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting && e.intersectionRatio >= 0.65) setActiveId(e.target.dataset.id)
                })
            },
            { root, threshold: [0.65] }
        )
        root.querySelectorAll('.reel').forEach((el) => observer.observe(el))
        return () => observer.disconnect()
    }, [items.length])

    const patch = useCallback((id, changes) => {
        setItems((prev) => prev.map((f) => (f._id === id ? { ...f, ...changes } : f)))
    }, [setItems])

    const like = async (item) => {
        try {
            const { data } = await api.post('/api/food/like', { foodId: item._id })
            patch(item._id, { isLiked: data.like, likeCount: data.likeCount })
        } catch {
            setError('Could not update like. Please try again.')
            setTimeout(() => setError(''), 2500)
        }
    }

    const save = async (item) => {
        try {
            const { data } = await api.post('/api/food/save', { foodId: item._id })
            patch(item._id, { isSaved: data.save, saveCount: data.saveCount })
        } catch {
            setError('Could not update save. Please try again.')
            setTimeout(() => setError(''), 2500)
        }
    }

    const commentItem = items.find((f) => f._id === commentId)
    const closeComments = () => setCommentId(null)

    if (items.length === 0) {
        return (
            <div className="reel-empty">
                <h2>{emptyTitle}</h2>
                <p>{emptyText}</p>
            </div>
        )
    }

    return (
        <div className="reel-container" ref={containerRef}>
            {error && <div className="reel-toast" role="alert">{error}</div>}
            {items.map((item) => (
                <Reel
                    key={item._id}
                    item={item}
                    active={(activeId ?? items[0]._id) === item._id}
                    muted={muted}
                    onToggleMute={() => setMuted((m) => !m)}
                    onLike={like}
                    onSave={save}
                    onComment={(f) => setCommentId(f._id)}
                />
            ))}
            {commentItem && (
                <CommentsSheet
                    food={commentItem}
                    onClose={closeComments}
                    onCount={(commentCount) => patch(commentItem._id, { commentCount })}
                />
            )}
        </div>
    )
}

export default ReelFeed
