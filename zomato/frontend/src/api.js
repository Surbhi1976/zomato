import axios from 'axios'

// Cookies (JWT) are httpOnly, so requests must be sent with credentials.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true,
})

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
    err?.response?.data?.message || (err?.request ? 'Cannot reach the server. Is the backend running?' : fallback)

export default api
