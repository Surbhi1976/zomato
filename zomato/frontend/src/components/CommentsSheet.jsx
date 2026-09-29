import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api, { errorMessage } from '../api'
import { CloseIcon, TrashIcon } from './Icons'
import './CommentsSheet.css'

const timeAgo = (iso) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return 'just now'
    const units = [['d', 86400], ['h', 3600], ['m', 60]]
    for (const [label, size] of units) if (s >= size) return `${Math.floor(s / size)}${label} ago`
    return 'just now'
}

// Bottom sheet with the comments of one food item.
// onCount(newCount) lets the parent keep the reel's comment counter in sync.
const CommentsSheet = ({ food, onClose, onCount }) => {
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [text, setText] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        api.get(`/api/food/${food._id}/comments`)
            .then((res) => !cancelled && setComments(res.data.comments))
            .catch((err) => !cancelled && setError(errorMessage(err)))
            .finally(() => !cancelled && setLoading(false))
        return () => { cancelled = true }
    }, [food._id])

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose()
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const submit = async (e) => {
        e.preventDefault()
        const value = text.trim()
        if (!value || busy) return
        setBusy(true); setError('')
        try {
            const { data } = await api.post(`/api/food/${food._id}/comments`, { text: value })
            setComments((prev) => [data.comment, ...prev])
            onCount(data.commentCount)
            setText('')
        } catch (err) {
            setError(errorMessage(err))
        } finally {
            setBusy(false)
        }
    }

    const remove = async (id) => {
        try {
            const { data } = await api.delete(`/api/food/comments/${id}`)
            setComments((prev) => prev.filter((c) => c._id !== id))
            onCount(data.commentCount)
        } catch (err) {
            setError(errorMessage(err))
        }
    }

    // portal: the feed container is position:fixed (its own stacking context), which would otherwise
    // let the bottom nav paint over the sheet
    return createPortal(
        <div className="sheet-backdrop" onClick={onClose}>
            <section className="sheet" role="dialog" aria-modal="true" aria-label="Comments" onClick={(e) => e.stopPropagation()}>
                <header className="sheet-head">
                    <h2>Comments</h2>
                    <button type="button" className="sheet-close" onClick={onClose} aria-label="Close comments"><CloseIcon width={22} height={22} /></button>
                </header>

                <ul className="sheet-list">
                    {loading && <li className="sheet-note">Loading…</li>}
                    {!loading && comments.length === 0 && <li className="sheet-note">No comments yet. Be the first!</li>}
                    {comments.map((c) => (
                        <li key={c._id} className="comment">
                            <div className="comment-avatar" aria-hidden="true">{c.user.fullName.charAt(0).toUpperCase()}</div>
                            <div className="comment-body">
                                <p className="comment-meta"><strong>{c.user.fullName}</strong> · {timeAgo(c.createdAt)}</p>
                                <p className="comment-text">{c.text}</p>
                            </div>
                            {c.isMine && (
                                <button type="button" className="comment-delete" onClick={() => remove(c._id)} aria-label="Delete comment">
                                    <TrashIcon width={18} height={18} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>

                {error && <p className="sheet-error" role="alert">{error}</p>}
                <form className="sheet-form" onSubmit={submit}>
                    <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Add a comment…" aria-label="Add a comment" />
                    <button type="submit" disabled={busy || !text.trim()}>Post</button>
                </form>
            </section>
        </div>,
        document.body
    )
}

export default CommentsSheet
