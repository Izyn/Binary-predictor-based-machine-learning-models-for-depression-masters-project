import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Layout from "../components/Layout";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        new URLSearchParams({ username, password }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      localStorage.setItem("token", res.data.access_token);
      navigate("/predict");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/google`,
        { id_token: credential }
      );
      localStorage.setItem("token", data.access_token);
      navigate("/predict");
    } catch (err) {
      setError(err.response?.data?.detail || "Google login failed");
    }
  };

  return (
    <Layout title="Login">
      <div className="grid place-items-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-8 shadow-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="text-slate-400 mt-1 mb-6">Sign in to continue</p>

          {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

          {/* Password form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <label className="block text-sm">
              <span className="text-slate-300">Username</span>
              <input
                className="mt-1 w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 outline-none focus:ring-4 focus:ring-blue-500/30"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. izinnoushad"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 outline-none focus:ring-4 focus:ring-blue-500/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 font-semibold"
            >
              Login
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Google button (NO useOneTap) */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed")}
              theme="filled_blue"
              size="large"
              text="continue_with"
              shape="pill"
            />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Don’t have an account?{" "}
            <Link className="underline" to="/register">Register</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
