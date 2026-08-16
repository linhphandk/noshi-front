import { Routes, Route } from "react-router"

import SignupPage from "@/pages/auth/SignupPage"
import LoginPage from "@/pages/auth/LoginPage"
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"
import OnboardingPage from "@/pages/OnboardingPage"

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
    </Routes>
  )
}

export default App
