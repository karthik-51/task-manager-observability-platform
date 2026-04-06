import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/auth/forgot-password", { email });
      navigate(`/reset-password/${res.data.token}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Forgot Password?</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your registered email and we'll verify your account.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
            <span>✗</span> {error}
          </div>
        )}

        <form onSubmit={submit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition mb-5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
