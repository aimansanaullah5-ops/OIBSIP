
import { useCallback, useEffect, useState } from "react";
import useOrderTracking from "../hooks/useOrderTracking";
import "./OrderHistory.css";

const API_URL = "http://localhost:5000/api/orders";
const FALLBACK_PIZZA_IMAGE =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const handleOrderStatusUpdated = useCallback((update) => {
    setOrders((current) =>
      current.map((order) =>
        String(order._id) === String(update.orderId)
          ? {
              ...order,
              orderStatus: update.orderStatus,
              updatedAt: update.updatedAt,
            }
          : order
      )
    );
  }, []);

  useOrderTracking(handleOrderStatusUpdated);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setOrders([]);
      setMessage("Please log in to view your order history.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setMessage("");

      const response = await fetch(`${API_URL}/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load your orders.");
      }

      if (!Array.isArray(data.orders)) {
        throw new Error("The server returned an unexpected order format.");
      }

      setOrders(data.orders);

      if (data.orders.length === 0) {
        setMessage("You haven't placed any orders yet.");
      }
    } catch (error) {
      console.error("Order history error:", error);
      setMessage(error.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString("en-PK");

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Date unavailable";

    return parsed.toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const normalizeStatus = (status) =>
    String(status || "Pending")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status).toLowerCase();

    if (
      ["delivered", "completed", "paid", "success"].includes(normalized)
    ) {
      return "oh-status--success";
    }

    if (
      ["cancelled", "canceled", "failed", "rejected"].includes(normalized)
    ) {
      return "oh-status--danger";
    }

    if (
      [
        "preparing",
        "in kitchen",
        "out for delivery",
        "sent to delivery",
        "processing",
        "order received",
      ].includes(normalized)
    ) {
      return "oh-status--progress";
    }

    return "oh-status--pending";
  };

  const getPizzaImage = (item) =>
    item.image ||
    item.pizza?.image ||
    item.pizzaId?.image ||
    FALLBACK_PIZZA_IMAGE;

  const getOrderImage = (order) => {
    const firstItem = order.items?.[0];
    return firstItem ? getPizzaImage(firstItem) : FALLBACK_PIZZA_IMAGE;
  };

  const getItemName = (item) =>
    item.name || item.pizza?.name || item.pizzaId?.name || "Custom Pizza";

  const getOrderTotal = (order) => {
    if (order.totalAmount != null) return Number(order.totalAmount) || 0;

    return (order.items || []).reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  };

  const getItemPrice = (item) =>
    Number(item.price || 0) * Number(item.quantity || 1);

  return (
    <main className="oh-page">
      <section className="oh-hero">
        <div className="oh-hero__content">
          <span className="oh-eyebrow">YOUR PIZZA JOURNEY</span>
          <h1>
            My <span>Orders.</span>
          </h1>
          <p>
            Track your orders, check their status, and revisit
            <br className="oh-desktop-break" /> your favorite pizza moments.
          </p>
        </div>

      <div className="oh-hero__image">
  <img
    src="https://images.unsplash.com/photo-1579751626657-72bc17010498?w=900&auto=format&fit=crop"
    alt="Freshly baked pizza"
    onError={(event) => {
      event.currentTarget.style.display = "none";
    }}
  />
</div>
      </section>

      <section className="oh-content">
        <div className="oh-toolbar">
          <div>
            <h2>Your Orders</h2>
            <p>Here's a list of all your past orders.</p>
          </div>

          <button
            type="button"
            className="oh-refresh"
            onClick={() => fetchOrders(true)}
            disabled={loading || refreshing}
          >
            <span aria-hidden="true">↻</span>
            {refreshing ? "Refreshing..." : "Refresh Orders"}
          </button>
        </div>

        {!loading && orders.length > 0 && (
          <div className="oh-order-count">
            {orders.length} {orders.length === 1 ? "order" : "orders"} found
          </div>
        )}

        {loading ? (
          <div className="oh-state">
            <span className="oh-spinner" />
            <h3>Finding your orders...</h3>
            <p>Just a moment while we get everything ready.</p>
          </div>
        ) : message ? (
          <div className="oh-state">
            <div className="oh-state__icon">
              {localStorage.getItem("token") ? "🍕" : "🔐"}
            </div>
            <h3>
              {localStorage.getItem("token")
                ? "Nothing on your plate yet"
                : "Login required"}
            </h3>
            <p>{message}</p>

            {localStorage.getItem("token") && (
              <button
                type="button"
                className="oh-primary-button"
                onClick={() => (window.location.hash = "#pizza-menu")}
              >
                Explore the menu
              </button>
            )}
          </div>
        ) : (
          <div className="oh-orders">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;

              return (
                <article className="oh-order-card" key={order._id}>
                  <div className="oh-order-card__main">
                    <img
                      className="oh-order-image"
                      src={getOrderImage(order)}
                      alt={getItemName(order.items?.[0] || {})}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_PIZZA_IMAGE;
                      }}
                    />

                    <div className="oh-order-info">
                      <h3>
                        Order #{String(order._id).slice(-6).toUpperCase()}
                      </h3>

                      <p className="oh-date">
                        <span aria-hidden="true">▦</span>
                        {formatDate(order.createdAt)}
                      </p>

                      <div className="oh-item-list">
                        {(order.items || []).map((item, index) => (
                          <div
                            className="oh-item-line"
                            key={item._id || `${order._id}-${index}`}
                          >
                            <span className="oh-mini-pizza" aria-hidden="true">
                              🍕
                            </span>
                            <span className="oh-item-name">
                              {getItemName(item)}
                            </span>
                            <span className="oh-item-quantity">
                              × {item.quantity || 1}
                            </span>
                            <span className="oh-item-price">
                              Rs. {formatPrice(getItemPrice(item))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="oh-order-summary">
                      <span
                        className={`oh-status ${getStatusClass(
                          order.orderStatus
                        )}`}
                      >
                        <span className="oh-status-dot" />
                        {normalizeStatus(order.orderStatus)}
                      </span>

                      <span className="oh-total-label">Total Amount</span>
                      <strong className="oh-total">
                        Rs. {formatPrice(getOrderTotal(order))}
                      </strong>
                    </div>

                    <div className="oh-order-action">
                      <button
                        type="button"
                        className="oh-details-button"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? null : order._id)
                        }
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                        <span aria-hidden="true">
                          {isExpanded ? "↑" : "→"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="oh-expanded-details">
                      <div>
                        <span>Full order ID</span>
                        <strong>{order._id}</strong>
                      </div>

                      <div>
                        <span>Payment status</span>
                        <strong
                          className={`oh-status ${getStatusClass(
                            order.paymentStatus
                          )}`}
                        >
                          {normalizeStatus(order.paymentStatus)}
                        </strong>
                      </div>

                      <div>
                        <span>Last updated</span>
                        <strong>{formatDate(order.updatedAt || order.createdAt)}</strong>
                      </div>

                      <div className="oh-expanded-items">
                        <span>Order items and customizations</span>
                        {(order.items || []).map((item, index) => (
                          <div key={item._id || `${order._id}-detail-${index}`}>
                            <strong>{getItemName(item)}</strong>
                            <p>
                              Quantity: {item.quantity || 1}
                              {item.base ? ` · Base: ${item.base}` : ""}
                              {item.sauce ? ` · Sauce: ${item.sauce}` : ""}
                              {item.cheese ? ` · Cheese: ${item.cheese}` : ""}
                              {Array.isArray(item.vegetables) &&
                              item.vegetables.length
                                ? ` · Vegetables: ${item.vegetables.join(", ")}`
                                : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default OrderHistory;
