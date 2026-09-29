import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import AuthPage from '../components/AuthPage'
import RequireAuth from '../components/RequireAuth'
import Home from '../pages/Home'
import Saved from '../pages/Saved'
import CreateFood from '../pages/CreateFood'
import FoodPartnerProfile from '../pages/FoodPartnerProfile'
import { ForgotPassword, ResetPassword } from '../pages/PasswordPages'

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* public: auth */}
                <Route path="/user/register" element={<AuthPage audience="user" mode="register" />} />
                <Route path="/user/login" element={<AuthPage audience="user" mode="login" />} />
                <Route path="/food-partner/register" element={<AuthPage audience="partner" mode="register" />} />
                <Route path="/food-partner/login" element={<AuthPage audience="partner" mode="login" />} />

                {/* password recovery (public) */}
                <Route path="/user/forgot-password" element={<ForgotPassword role="user" />} />
                <Route path="/food-partner/forgot-password" element={<ForgotPassword role="partner" />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* customers */}
                <Route element={<RequireAuth role="user" />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/saved" element={<Saved />} />
                </Route>

                {/* food partners */}
                <Route element={<RequireAuth role="partner" />}>
                    <Route path="/create-food" element={<CreateFood />} />
                </Route>

                {/* store profile: visible to both (the API accepts either login) */}
                <Route path="/food-partner/:id" element={<FoodPartnerProfile />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    )
}

export default AppRoutes
