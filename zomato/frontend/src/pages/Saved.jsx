import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import ReelFeed from '../components/ReelFeed'
import BottomNav from '../components/BottomNav'

const Saved = () => {
    const [items, setItems] = useState([])
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/api/food/save')
            .then((res) => { setItems(res.data.foodItems); setStatus('ready') })
            .catch((err) => {
                if (err.response?.status === 401) return navigate('/user/login', { replace: true })
                setError(errorMessage(err)); setStatus('error')
            })
    }, [navigate])

    return (
        <div className="reels-page">
            {status === 'loading' && <div className="page-loading" role="status">Loading saved…</div>}
            {status === 'error' && <div className="page-loading" role="alert">{error}</div>}
            {status === 'ready' && (
                <ReelFeed items={items} setItems={setItems} emptyTitle="Nothing saved yet" emptyText="Tap the bookmark on any reel to keep it here." />
            )}
            <BottomNav role="user" />
        </div>
    )
}

export default Saved
