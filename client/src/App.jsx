
import { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import PizzaBuilder from "./pages/PizzaBuilder";
import Cart from "./pages/Cart";
import AdminInventory from "./pages/AdminInventory";
import AdminLogin from "./pages/AdminLogin";
import AdminOrders from "./pages/AdminOrders";
import AdminPizzas from "./pages/AdminPizzas";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrderHistory from "./pages/OrderHistory";
import ResetPassword from "./pages/ResetPassword";

import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;

    if (path === "/admin" || path === "/admin/") {
      return localStorage.getItem("adminToken")
        ? "inventory"
        : "adminLogin";
    }

    if (path.startsWith("/payment-return/")) return "orders";
    if (path.startsWith("/payment-cancelled/")) return "cart";

    return "dashboard";
  });

  const [cartItems, setCartItems] = useState([]);
  const [selectedPizza, setSelectedPizza] = useState(null);

  const [isAdmin, setIsAdmin] = useState(
    Boolean(localStorage.getItem("adminToken"))
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const isCustomerLoggedIn = Boolean(localStorage.getItem("token"));

  // Handle customer returning from Safepay.
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    const isPaymentReturn = path.startsWith("/payment-return/");
    const isPaymentCancelled = path.startsWith("/payment-cancelled/");

    if (!isPaymentReturn && !isPaymentCancelled) return;

    const orderId = path.split("/").filter(Boolean)[1];
    const tracker = (params.get("tracker") || "").split("?")[0];

    console.log("Safepay return URL:", window.location.href);
    console.log("Order ID:", orderId);
    console.log("Tracker:", tracker);

    if (!orderId) {
      setPaymentMessage("Order details are missing. Please check My Orders.");
      setCurrentPage("orders");
      window.history.replaceState({}, "", "/");
      return;
    }

    if (isPaymentCancelled) {
      setPaymentMessage(
        "Payment was not completed. Your cart is still available."
      );
      setCurrentPage("cart");
      window.history.replaceState({}, "", "/");
      return;
    }

    const verifyPayment = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setPaymentMessage("Please log in to verify your payment.");
        setCurrentPage("login");
        return;
      }

      setPaymentLoading(true);

      try {
        const trackerQuery = tracker
          ? `?tracker=${encodeURIComponent(tracker)}`
          : "";

        const response = await fetch(
          `http://localhost:5000/api/orders/verify-payment/${encodeURIComponent(orderId)}${trackerQuery}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok && response.status !== 202) {
          throw new Error(
            data.message || "Payment verification failed."
          );
        }

        if (data.order?.paymentStatus === "paid") {
          setCartItems([]);
          setPaymentMessage(
            "Payment successful! Your pizza order has been confirmed."
          );
        } else {
          setPaymentMessage(
            data.message ||
              "Payment is still being checked. Please check My Orders."
          );
        }

        setCurrentPage("orders");
      } catch (error) {
        setPaymentMessage(
          error.message || "Unable to verify payment."
        );
        setCurrentPage("orders");
      } finally {
        setPaymentLoading(false);
        window.history.replaceState({}, "", "/");
      }
    };

    verifyPayment();
  }, []);

  const navigate = (page) => {
    setCurrentPage(page);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToDashboard = () => navigate("dashboard");

  const goToBuilder = (pizza = null) => {
  // Ignore the click event from buttons without a selected pizza.
  if (pizza && typeof pizza.preventDefault === "function") {
    pizza = null;
  }

  setSelectedPizza(pizza);
  navigate("builder");
};

  const goToCart = () => navigate("cart");
  const goToLogin = () => navigate("login");
  const goToRegister = () => navigate("register");
  const goToOrders = () => navigate("orders");
  const goToAdminLogin = () => navigate("adminLogin");

  const goToAdminOrders = () => {
    navigate(isAdmin ? "adminOrders" : "adminLogin");
  };

  const openInventory = () => {
    navigate(isAdmin ? "inventory" : "adminLogin");
  };

  const openAdminPizzas = () => {
    navigate(isAdmin ? "adminPizzas" : "adminLogin");
  };

  const handleCustomerLoginSuccess = () => {
    navigate("dashboard");
  };

  const handleCustomerLogout = () => {
    localStorage.removeItem("token");
    navigate("dashboard");
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    navigate("inventory");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
    navigate("dashboard");
  };

  // Keep reset-password links working.
  if (window.location.pathname.startsWith("/reset-password/")) {
    return <ResetPassword />;
  }

  // Show payment verification status while checking.
  if (paymentLoading) {
    return (
      <div className="app-shell">
        <main className="main-content">
          <p>Verifying your Safepay payment. Please wait...</p>
        </main>
      </div>
    );
  }

  // Show admin login separately when an admin is not authenticated.
  if (currentPage === "adminLogin" && !isAdmin) {
    return (
      <div className="app-shell">
        <main className="main-content">
          <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
        </main>
      </div>
    );
  }

  // Protect admin pages.
  const adminPages = ["inventory", "adminOrders", "adminPizzas"];

  if (adminPages.includes(currentPage) && !isAdmin) {
    return (
      <div className="app-shell">
        <main className="main-content">
          <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
        </main>
      </div>
    );
  }

  const showAdminNavigation = isAdmin;

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="navbar">
          <button
            type="button"
            className="brand"
            onClick={goToDashboard}
            aria-label="Go to homepage"
          >
            <span className="brand-icon">🍕</span>
            <span>
              <span className="brand-name">PizzaCraft</span>
              <span className="brand-tagline">
                Freshly made, just for you
              </span>
            </span>
          </button>

          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
            {showAdminNavigation ? (
              <>
                <button
                  type="button"
                  className={
                    currentPage === "inventory"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={openInventory}
                >
                  Inventory
                </button>

                <button
                  type="button"
                  className={
                    currentPage === "adminOrders"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={goToAdminOrders}
                >
                  Admin Orders
                </button>

                <button
                  type="button"
                  className={
                    currentPage === "adminPizzas"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={openAdminPizzas}
                >
                  Manage Pizzas
                </button>

                <button
                  type="button"
                  className="nav-button nav-button-outline"
                  onClick={handleAdminLogout}
                >
                  Admin Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={
                    currentPage === "dashboard"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={goToDashboard}
                >
                  Home
                </button>

                <button
                  type="button"
                  className={
                    currentPage === "builder"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={goToBuilder}
                >
                  Customize
                </button>

                <button
                  type="button"
                  className={
                    currentPage === "cart"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={goToCart}
                >
                  Cart <span className="cart-count">{cartItems.length}</span>
                </button>

                <button
                  type="button"
                  className={
                    currentPage === "orders"
                      ? "nav-link active"
                      : "nav-link"
                  }
                  onClick={goToOrders}
                >
                  My Orders
                </button>

                {isCustomerLoggedIn ? (
                  <button
                    type="button"
                    className="nav-button nav-button-outline"
                    onClick={handleCustomerLogout}
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={
                        currentPage === "login"
                          ? "nav-link active"
                          : "nav-link"
                      }
                      onClick={goToLogin}
                    >
                      Login
                    </button>

                    <button
                      type="button"
                      className="nav-button"
                      onClick={goToRegister}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {paymentMessage && (
          <div className="payment-message" role="status">
            {paymentMessage}
          </div>
        )}

        {currentPage === "dashboard" && (
          <Dashboard goToBuilder={goToBuilder} />
        )}

        {currentPage === "builder" && (
          <PizzaBuilder
            selectedPizza={selectedPizza}
            setCartItems={setCartItems}
            goToCart={goToCart}
          />
        )}

        {currentPage === "cart" && (
          <Cart
            cartItems={cartItems}
            setCartItems={setCartItems}
            goToBuilder={goToBuilder}
            goToDashboard={goToDashboard}
          />
        )}

        {currentPage === "adminLogin" && !isAdmin && (
          <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
        )}

        {currentPage === "inventory" && isAdmin && <AdminInventory />}

        {currentPage === "adminOrders" && isAdmin && <AdminOrders />}

        {currentPage === "adminPizzas" && isAdmin && <AdminPizzas />}

        {currentPage === "login" && (
          <Login
            onLoginSuccess={handleCustomerLoginSuccess}
            goToRegister={goToRegister}
          />
        )}

        {currentPage === "register" && (
          <Register goToLogin={goToLogin} />
        )}

        {currentPage === "orders" && <OrderHistory />}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <div className="footer-brand">🍕 PizzaCraft</div>
            <p>Made with love. Served fresh.</p>
          </div>

          <p>
            © {new Date().getFullYear()} PizzaCraft. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
