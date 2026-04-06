import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./auth/ProtectedRoute";
import GuestRoute from "./auth/GuestRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { Toaster } from "react-hot-toast";

function App() {
return (
<> <Toaster position="top-right" />


  <Routes>

    {/* Landing Page */}
    <Route path="/" element={<Home />} />

    {/* Auth Pages — redirect to dashboard if already logged in */}
    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
    <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
    <Route path="/reset-password/:token" element={<ResetPassword />} />

    {/* Protected Pages */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics"
      element={
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      }
    />

  </Routes>
</>

);
}

export default App;
