import { useContext, useState } from "react";
import { AuthContext } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {

  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailValidator = (email) => {
    const regex =
      /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    return regex.test(email);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {

      if (!form.email || !form.password) {
        return setError("All fields are required");
      }

      if (!emailValidator(form.email)) {
        return setError("Invalid email format");
      }

      setLoading(true);

      await login(form.email, form.password);

      toast.success("Login successful 🎉");

    } catch (err) {

      const message =
        err?.response?.data?.message ||
        "Invalid email or password";

      setError(message);
      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">

      <form
        onSubmit={submit}
        className="bg-white shadow-xl rounded-2xl p-8 w-96"
      >

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">
            {error}
          </div>
        )}

        {/* Email */}
        <input
          className="border rounded p-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {/* Password */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 cursor-pointer text-gray-500"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>
        {/* Forgot Password Link */}
        <div className="text-right mb-4">

  <Link
    to="/forgot-password"
    className="text-sm text-blue-600 hover:underline"
  >
    Forgot Password?
  </Link>

</div>

        {/* Login Button */}
        <button
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold transition
          ${
            loading
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Register
          </Link>
        </p>

        <p className="text-center text-sm text-gray-400 mt-2">
          <Link to="/" className="hover:underline">← Back to Home</Link>
        </p>

      </form>
    </div>
  );
}