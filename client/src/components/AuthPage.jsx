import { useState } from "react";
import { signup, login } from "../utils/api";

export default function AuthPage({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error on input
  };

  const handleToggle = () => {
    setIsSignup((prev) => !prev);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) {
        const res = await signup(form.username, form.email, form.password);
        if (res?.success) {
          setIsSignup(false);
          setForm({ username: "", email: "", password: "" });
        } else {
          setError(res?.message || "Signup failed. Try again.");
        }
      } else {
        const res = await login(form.username, form.password);
        if (res?.success) {
          localStorage.setItem("token", res.token);
          localStorage.setItem("username", res.username);
          onAuth({ username: res.username, token: res.token });
        } else {
          setError(res?.message || "Login failed. Try again.");
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-green-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-green-700">
          {isSignup ? "Sign Up" : "Login"}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            disabled={submitting}
            className="px-4 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {isSignup && (
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={submitting}
              className="px-4 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          )}
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={submitting}
            className="px-4 py-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 text-white font-semibold rounded bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            {submitting ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : null}
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>
        <button
          type="button"
          disabled={submitting}
          className="mt-4 w-full py-2 text-green-700 font-semibold rounded border border-green-600 hover:bg-green-50 transition-colors"
          onClick={handleToggle}
        >
          {isSignup
            ? "Already have an account? Login"
            : "No account? Sign Up"}
        </button>
        {error && (
          <div className="mt-4 text-red-600 text-center font-medium">{error}</div>
        )}
      </div>
    </div>
  );
}