
import { useState } from "react";
import "./Auth.css";

function Login({ onLoginSuccess, goToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!data.token) {
        throw new Error("The server did not return a login token.");
      }

      localStorage.setItem("token", data.token);

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      setMessage("Login successful!");
    } catch (error) {
      setMessage(error.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setResetLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to request a password reset."
        );
      }

      setMessage(
        data.message ||
          "If your account is eligible, check your email for a password-reset link."
      );
    } catch (error) {
      setMessage(error.message || "Unable to request a password reset.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1100&q=85"
          alt="Freshly baked pizza"
        />

        <div className="auth-visual-overlay">
          <span className="auth-eyebrow">WELCOME TO PIZZACRAFT</span>
          <h2>Your next favorite pizza is waiting.</h2>
          <p>Sign in to order, customize, and track your pizza.</p>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-content">
          <span className="auth-logo">
            Pizza<span>Craft.</span>
          </span>

          {showForgotPassword ? (
            <>
              <p className="auth-kicker">ACCOUNT RECOVERY</p>
              <h1>Forgot your password?</h1>
              <p className="auth-description">
                Enter the email address associated with your account.
                We'll request a password-reset link for you.
              </p>

              {message && (
                <div
                  className="auth-message"
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </div>
              )}

              <form
                className="auth-form"
                onSubmit={handleForgotPassword}
              >
                <div className="auth-field">
                  <label htmlFor="customer-email">Email address</label>
                  <input
                    id="customer-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={resetLoading}
                >
                  {resetLoading
                    ? "Sending request..."
                    : "Send reset link"}
                </button>
              </form>

              <p className="auth-switch">
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setMessage("");
                  }}
                >
                  Back to login
                </button>
              </p>
            </>
          ) : (
            <>
              <p className="auth-kicker">YOUR PIZZA JOURNEY</p>
              <h1>Welcome back!</h1>
              <p className="auth-description">
                Enter your details to access your account.
              </p>

              {message && (
                <div
                  className="auth-message"
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </div>
              )}

              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field">
                  <label htmlFor="customer-email">Email address</label>
                  <input
                    id="customer-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="customer-password">Password</label>
                  <input
                    id="customer-password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <button
                    className="auth-forgot-link"
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setMessage("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login to your account"}
                  {!loading && <span aria-hidden="true">→</span>}
                </button>
              </form>

              <p className="auth-switch">
                Don't have an account?{" "}
                <button type="button" onClick={goToRegister}>
                  Create one
                </button>
              </p>
            </>
          )}

          <p className="auth-footer-note">
            Made with love and a little extra cheese.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
