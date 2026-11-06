
import { useState } from "react";
import "./AdminLogin.css";

function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Admin login failed");
      }

      if (!data.token) {
        throw new Error(
          "The server did not return a login token."
        );
      }

      localStorage.setItem("adminToken", data.token);
      onLoginSuccess();
    } catch (error) {
      console.error("Admin login error:", error);
      setError(error.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-visual">
          <div className="admin-login-logo" aria-hidden="true">
            🍕
          </div>

          <h2>PizzaCraft</h2>

          <p>
            Fresh pizzas, smooth operations, and a better
            experience for every customer.
          </p>

          <div className="admin-login-badge">
            🔒 Secure Admin Access
          </div>
        </div>

        <div className="admin-login-content">
          <p className="admin-login-eyebrow">
            ADMIN PORTAL
          </p>

          <h1>Welcome back!</h1>

          <p className="admin-login-description">
            Sign in to manage your pizza shop inventory and orders.
          </p>

          {error && (
            <p
              className="admin-login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <form
            className="admin-login-form"
            onSubmit={handleLogin}
          >
            <label htmlFor="admin-email">
              Email address
            </label>

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-login-password-wrap">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                className="admin-login-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              className="admin-login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login to Dashboard →"}
            </button>
          </form>

          <p className="admin-login-footer">
            PizzaCraft Admin Portal · Authorized access only
          </p>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
