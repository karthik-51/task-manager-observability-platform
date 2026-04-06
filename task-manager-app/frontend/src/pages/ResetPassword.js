import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "Number (0–9)", test: (p) => /[0-9]/.test(p) },
  { label: "Special character (!@#$%…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const allRulesMet = passwordRules.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allRulesMet) return setError("Password does not meet all requirements.");
    if (!passwordsMatch) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await axios.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Updated!</h2>
          <p className="text-gray-500 text-sm">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Set New Password</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Choose a strong password for your account.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
            <span>✗</span> {error}
          </div>
        )}

        <form onSubmit={submit}>
          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {password && (
              <ul className="mt-2 space-y-1">
                {passwordRules.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li key={rule.label} className={`text-xs flex items-center gap-1.5 ${met ? "text-green-500" : "text-red-400"}`}>
                      <span className="font-bold text-sm">{met ? "✓" : "✗"}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              className={`border p-3 w-full rounded-lg outline-none transition focus:ring-2 ${
                confirmPassword
                  ? passwordsMatch
                    ? "border-green-400 focus:ring-green-400"
                    : "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && (
              <p className={`text-xs mt-1 ${passwordsMatch ? "text-green-500" : "text-red-400"}`}>
                {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
