import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import BottomNav from '../components/BottomNav'
import './Pages.css'

const MAX_MB = 100

const CreateFood = () => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [partnerId, setPartnerId] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/api/auth/me').then((r) => setPartnerId(r.data.foodPartner?._id || '')).catch(() => {})
    }, [])

    const onFile = (e) => {
        const f = e.target.files?.[0]
        setError('')
        if (!f) return
        if (!f.type.startsWith('video/')) return setError('Please choose a video file.')
        if (f.size > MAX_MB * 1024 * 1024) return setError(`Video must be under ${MAX_MB} MB.`)
        if (preview) URL.revokeObjectURL(preview)
        setPreview(URL.createObjectURL(f))
        setFile(f)
    }

    const submit = async (e) => {
        e.preventDefault()
        if (!file) return setError('Please choose a video.')
        const body = new FormData()
        body.append('name', name.trim())
        body.append('description', description.trim())
        body.append('video', file)
        setBusy(true); setError('')
        try {
            await api.post('/api/food', body)
            navigate(`/food-partner/${partnerId}`)
        } catch (err) {
            setError(errorMessage(err))
            setBusy(false)
        }
    }

    return (
        <main className="page">
            <div className="page-card">
                <p className="eyebrow-red">Food partner</p>
                <h1>Post a new dish</h1>
                <p className="muted">Upload a short video of your dish. It will show up in customers' reels feed.</p>

                <form className="page-form" onSubmit={submit}>
                    <label className="page-field">
                        <span>Dish name</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Paneer butter masala" required />
                    </label>
                    <label className="page-field">
                        <span>Description</span>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="What makes it special?" required />
                    </label>
                    <label className="page-field">
                        <span>Video</span>
                        <input type="file" accept="video/*" onChange={onFile} required={!file} />
                    </label>
                    {preview && <video className="upload-preview" src={preview} controls muted playsInline />}
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button className="page-button" type="submit" disabled={busy}>{busy ? 'Uploading… this can take a moment' : 'Publish'}</button>
                </form>
            </div>
            <BottomNav role="partner" partnerId={partnerId} />
        </main>
    )
}

export default CreateFood
