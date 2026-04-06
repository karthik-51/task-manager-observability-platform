import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

const schema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const passwordRules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "Number (0–9)", test: (p) => /[0-9]/.test(p) },
  { label: "Special character (!@#$%…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Register() {
  const { register: registerUser } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const password = watch("password", "");

  const onSubmit = async (data) => {
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password });
      toast.success("Account created successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-xl rounded-2xl p-8 w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          Create Account
        </h2>

        {/* Name */}
        <div className="mb-4">
          <input
            {...register("name")}
            placeholder="Full Name"
            className="border p-2 w-full rounded focus:ring-2 focus:ring-green-500"
          />
          <p className="text-red-500 text-sm">{errors.name?.message}</p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            {...register("email")}
            placeholder="Email"
            className="border p-2 w-full rounded focus:ring-2 focus:ring-green-500"
          />
          <p className="text-red-500 text-sm">{errors.email?.message}</p>
        </div>

        {/* Password */}
        <div className="mb-4 relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Password"
            className="border p-2 w-full rounded focus:ring-2 focus:ring-green-500"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 cursor-pointer text-gray-500 text-sm"
          >
            {showPassword ? "Hide" : "Show"}
          </span>
          <p className="text-red-500 text-sm">{errors.password?.message}</p>

          {/* Live per-rule checklist */}
          {password && (
            <ul className="mt-2 space-y-1">
              {passwordRules.map((rule) => {
                const met = rule.test(password);
                return (
                  <li
                    key={rule.label}
                    className={`text-sm flex items-center gap-1 ${
                      met ? "text-green-500" : "text-red-400"
                    }`}
                  >
                    <span className="font-bold">{met ? "✓" : "✗"}</span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <input
            type="password"
            {...register("confirmPassword")}
            placeholder="Confirm Password"
            className="border p-2 w-full rounded focus:ring-2 focus:ring-green-500"
          />
          <p className="text-red-500 text-sm">{errors.confirmPassword?.message}</p>
        </div>

        {/* Submit */}
        <button
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded font-semibold transition disabled:opacity-60"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 hover:underline font-medium">
            Login
          </Link>
        </p>

        <p className="text-center text-sm text-gray-400 mt-2">
          <Link to="/" className="hover:underline">← Back to Home</Link>
        </p>
      </form>
    </div>
  );
}
