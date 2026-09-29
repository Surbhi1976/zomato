import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import ReelFeed from '../components/ReelFeed'
import BottomNav from '../components/BottomNav'
import { SearchIcon } from '../components/Icons'
import './Home.css'

const Home = () => {
    const [items, setItems] = useState([])
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const [input, setInput] = useState('')
    const [query, setQuery] = useState('')
    const navigate = useNavigate()

    // debounce: only search 350ms after the user stops typing
    useEffect(() => {
        const t = setTimeout(() => setQuery(input.trim()), 350)
        return () => clearTimeout(t)
    }, [input])

    useEffect(() => {
        let cancelled = false
        api.get('/api/food', { params: query ? { q: query } : {} })
            .then((res) => {
                if (cancelled) return
                setItems(res.data.foodItems)
                setStatus('ready')
            })
            .catch((err) => {
                if (cancelled) return
                if (err.response?.status === 401) return navigate('/user/login', { replace: true })
                setError(errorMessage(err))
                setStatus('error')
            })
        return () => { cancelled = true }
    }, [query, navigate])

    return (
        <div className="reels-page">
            {status === 'loading' && <div className="page-loading" role="status">Loading reels…</div>}
            {status === 'error' && <div className="page-loading" role="alert">{error}</div>}
            {status === 'ready' && (
                <ReelFeed
                    key={query}
                    items={items}
                    setItems={setItems}
                    emptyTitle={query ? `No results for “${query}”` : 'No food reels yet'}
                    emptyText={query ? 'Try a different dish or restaurant name.' : "Food partners haven't posted anything yet. Check back soon!"}
                />
            )}
            <form className="feed-search" role="search" onSubmit={(e) => e.preventDefault()}>
                <SearchIcon width={18} height={18} />
                <input
                    type="search"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search dishes or restaurants"
                    aria-label="Search dishes or restaurants"
                    maxLength={60}
                />
            </form>
            <BottomNav role="user" />
        </div>
    )
}

export default Home
