
import { useState } from "react";
import "./Auth.css";

function Register({ goToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setMessage(
        data.message ||
          "Registration submitted. Check your email for verification."
      );
      setPassword("");
    } catch (error) {
      setMessage(error.message || "Unable to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1100&q=85"
          alt="Delicious pizza fresh from the oven"
        />
        <div className="auth-visual-overlay">
          <span className="auth-eyebrow">JOIN THE PIZZA CLUB</span>
          <h2>Good food. Great moments.</h2>
          <p>Create an account and make every pizza your own.</p>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-content">
          <span className="auth-logo">Pizza<span>Craft.</span></span>

          <p className="auth-kicker">LET'S GET STARTED</p>
          <h1>Create your account</h1>
          <p className="auth-description">
            Sign up to discover your next favorite pizza.
          </p>

          {message && (
            <div
              className={`auth-message ${
                /success|check your email|verification|registered/i.test(message)
                  ? "success"
                  : "error"
              }`}
              role="status"
            >
              {message}
            </div>
          )}

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                placeholder="Create a password (at least 6 characters)"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
              <span className="auth-field-hint">
                Use at least 6 characters.
              </span>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create my account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={goToLogin}>
              Log in
            </button>
          </p>

          <p className="auth-footer-note">
            Your next pizza adventure starts here.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;
