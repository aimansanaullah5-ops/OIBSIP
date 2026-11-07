
import { useState } from "react";
import "./Auth.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = window.location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

  const handleReset = async (event) => {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!token) {
      setMessage("Reset token is missing from the link.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/reset-password/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not reset password.");
      }

      setSuccess(true);
      setMessage(data.message || "Password reset successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page reset-password-page">
      <section className="auth-form-panel">
        <div className="auth-form-content">
          <span className="auth-logo">
            Pizza<span>Craft.</span>
          </span>

          <p className="auth-kicker">ACCOUNT RECOVERY</p>
          <h1>Create a new password</h1>
          <p className="auth-description">
            Enter your new password below to regain access to your account.
          </p>

          {message && (
            <div
              className={`auth-message ${success ? "success" : "error"}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          )}

          {!success && (
            <form className="auth-form" onSubmit={handleReset}>
              <div className="auth-field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirm-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                />
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Updating password..." : "Update password"}
              </button>
            </form>
          )}

          {success && (
            <button
              className="auth-submit"
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Return to PizzaCraft
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default ResetPassword;
