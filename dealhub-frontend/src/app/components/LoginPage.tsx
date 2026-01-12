import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./Button";
import logo from "../../assets/logo.svg";
import bgVideo from "../../assets/login-bg.mp4";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/authApi";

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await login({ email, password });

      // fetch /auth/me via AuthContext
      await refreshUser();

      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3B]/85 via-[#102A52]/70 to-[#1E40AF]/75" />
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <img src={logo} alt="DealHub Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-3xl text-white mb-2">DealHub</h1>
          <p className="text-blue-200">
            Facility Agreement Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl text-[#0B1F3B] mb-2">Welcome back</h2>
          <p className="text-gray-600 mb-6">Sign in to access your dashboard</p>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@dealhub.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
      {/* ✅ Footer */}
      <div className="absolute bottom-4 w-full text-center text-sm text-white/70">
        © {new Date().getFullYear()} Tesselate. All rights reserved.
      </div>
    </div>
  );
}
