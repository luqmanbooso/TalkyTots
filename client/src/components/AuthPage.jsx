import { useState } from "react";
import { signup, login } from "../utils/api";

// Basic sanitization: strips HTML tags and converts angle brackets to entities
function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  // Remove all HTML tags
  let sanitized = str.replace(/<\/?[^>]+(>|$)/g, "");
  // Replace angle brackets to prevent tag injection
  sanitized = sanitized.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Optionally, trim whitespace
  sanitized = sanitized.trim();
  return sanitized;
}

// Username validation: 3-32 chars, only a-z, A-Z, 0-9, _, ., -
function isValidUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,32}$/.test(username);
}

export default function AuthPage({ onAuth }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    // Sanitize input on each change
    const { name, value } = e.target;
    setForm({ ...form, [name]: sanitizeInput(value) });
    if (error) setError(""); // Clear error on input
    if (info) setInfo("");
  };

  const handleToggle = () => {
    setIsSignup((prev) => !prev);
    setError("");
    setInfo("");
    setForm({ username: "", email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const sanitizedForm = {
        username: sanitizeInput(form.username),
        email: sanitizeInput(form.email),
        password: sanitizeInput(form.password),
      };
      // Validate username before submit
      if (!isValidUsername(sanitizedForm.username)) {
        setError(
          "Username must be 3-32 characters and only contain letters, numbers, ., _, or -"
        );
        setSubmitting(false);
        return;
      }
      if (isSignup) {
        const res = await signup(
          sanitizedForm.username,
          sanitizedForm.email,
          sanitizedForm.password
        );
        if (res?.success) {
          setIsSignup(false);
          setForm({ username: "", email: "", password: "" });
          setInfo("Signup successful! You can now log in.");
        } else {
          setError(res?.message || "Signup failed. Try again.");
        }
      } else {
        const res = await login(sanitizedForm.username, sanitizedForm.password);
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

  // UI: Telegram-inspired with branding and notes
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e3f7ee] via-[#f7fafc] to-[#d2f1fc]">
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white border border-[#e6ecf1] p-0 overflow-hidden">
        {/* Top Branding */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-r from-[#0088cc] to-[#5bc6e5] py-8 px-4">
          <div className="flex items-center mb-2">
            <svg width="44" height="44" viewBox="0 0 240 240" fill="none">
              <circle cx="120" cy="120" r="120" fill="#fff" />
              <path
                d="M62 124.5l48.3 19.8c3.5 1.4 7.4 1.3 10.8-0.2l62.5-28c4.2-1.9 3.7-7.9-0.7-8.9L72.2 99c-4.3-1-8.4 2.7-7.8 7.1l4.1 30.2c0.4 2.8 2.2 5.2 4.7 6.2z"
                fill="#0088cc"
              />
            </svg>
            <span className="ml-3 text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
              Talky Tots 
            </span>
          </div>
          <span className="text-white opacity-90 text-lg font-medium">
            {isSignup ? "Create your account" : "Welcome back"}
          </span>
        </div>
        {/* Form */}
        <form className="flex flex-col gap-5 px-8 py-8" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="text-[#0088cc] font-semibold">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="e.g. johndoe"
              value={form.username}
              onChange={handleChange}
              required
              disabled={submitting}
              className="px-4 py-3 border border-[#b8e4f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5bc6e5] text-lg"
              autoComplete="username"
              maxLength={32}
              pattern="^[a-zA-Z0-9_.-]{3,32}$"
              title="3-32 chars, only letters, numbers, ., _, -"
            />
            <p className="text-xs text-[#6c757d]">
              3-32 characters. Letters, numbers, dot, underscore, or dash.
              <br />
              <b>No spaces or emojis.</b>
            </p>
          </div>
          {isSignup && (
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[#0088cc] font-semibold">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={submitting}
                className="px-4 py-3 border border-[#b8e4f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5bc6e5] text-lg"
                autoComplete="email"
                maxLength={64}
              />
              <p className="text-xs text-[#6c757d]">
                You'll need this to recover your account.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[#0088cc] font-semibold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={isSignup ? "Create a password" : "Your password"}
              value={form.password}
              onChange={handleChange}
              required
              disabled={submitting}
              className="px-4 py-3 border border-[#b8e4f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5bc6e5] text-lg"
              autoComplete={isSignup ? "new-password" : "current-password"}
              maxLength={64}
            />
            {isSignup ? (
              <p className="text-xs text-[#6c757d]">
                At least 6 characters. <b>Keep it safe!</b>
              </p>
            ) : (
              <div className="flex items-center text-xs text-[#6c757d]">
                <span>Forgot password?</span>
                <span className="ml-2 text-[#5bc6e5] cursor-not-allowed opacity-60">
                  (Coming soon)
                </span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 text-white font-bold text-lg rounded-xl bg-gradient-to-r from-[#0088cc] to-[#5bc6e5] hover:from-[#007ab8] hover:to-[#30b2e2] transition-colors flex items-center justify-center shadow"
          >
            {submitting ? (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-30"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : null}
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>
        <div className="px-8 pb-8 flex flex-col gap-2">
          <button
            type="button"
            disabled={submitting}
            className="w-full py-2 text-[#0088cc] font-semibold rounded-xl border border-[#b8e4f0] hover:bg-[#f2fbfe] transition-colors"
            onClick={handleToggle}
          >
            {isSignup
              ? "Already have an account? Log In"
              : "No account? Sign Up"}
          </button>
          {info && (
            <div className="mt-2 text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded text-center font-medium">
              {info}
            </div>
          )}
          {error && (
            <div className="mt-2 text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded text-center font-medium">
              {error}
            </div>
          )}
          <div className="mt-4 text-xs text-[#a6b2c2] text-center">
            By signing up, you agree to our{" "}
            <span className="underline cursor-pointer text-[#5bc6e5]">
              Terms
            </span>{" "}
            &amp;{" "}
            <span className="underline cursor-pointer text-[#5bc6e5]">
              Privacy
            </span>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
