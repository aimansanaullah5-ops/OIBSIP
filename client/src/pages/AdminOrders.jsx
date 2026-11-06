
import { useCallback, useEffect, useState } from "react";
import "./AdminOrders.css";

const API_URL = "http://localhost:5000/api/orders";

const ORDER_STATUSES = [
  "Order Received",
  "In Kitchen",
  "Sent to Delivery",
  "Delivered",
  "Cancelled",
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    const token = localStorage.getItem("adminToken");

    if (!token) {
      setError("Admin login required. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch orders.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      setError("Admin login required. Please log in again.");
      return;
    }

    setUpdatingId(orderId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/admin/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderStatus: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status.");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: data.order.orderStatus }
            : order
        )
      );

      setMessage(`Order status updated to "${newStatus}".`);
    } catch (err) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingId("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <main className="admin-orders">
        <p className="admin-orders__info">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="admin-orders">
      <div className="admin-orders__heading-row">
        <div>
          <h1 className="admin-orders__heading">
            Admin Order Management
          </h1>
          <p className="admin-orders__subtitle">
            View customer orders and update their progress.
          </p>
        </div>

        <button
          type="button"
          className="admin-orders__button"
          onClick={fetchOrders}
        >
          Refresh Orders
        </button>
      </div>

      {error && (
        <p className="admin-orders__error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="admin-orders__success" role="status">
          {message}
        </p>
      )}

      <div className="admin-orders__summary">
        <div className="admin-orders__summary-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="admin-orders__summary-card">
          <span>Pending Orders</span>
          <strong>
            {
              orders.filter(
                (order) =>
                  order.orderStatus === "Order Received" ||
                  order.orderStatus === "In Kitchen"
              ).length
            }
          </strong>
        </div>

        <div className="admin-orders__summary-card">
          <span>Delivered Orders</span>
          <strong>
            {
              orders.filter(
                (order) => order.orderStatus === "Delivered"
              ).length
            }
          </strong>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="admin-orders__info">No orders found.</p>
      ) : (
        <div className="admin-orders__list">
          {orders.map((order) => (
            <section
              key={order._id}
              className="admin-orders__card"
            >
              <div className="admin-orders__header">
                <div>
                  <h2 className="admin-orders__order-title">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </h2>
                  <p className="admin-orders__muted">
                    Placed: {formatDate(order.createdAt)}
                  </p>
                </div>

                <span className="admin-orders__status-badge">
                  {order.orderStatus}
                </span>
              </div>

              <div className="admin-orders__customer">
                <p>
                  <strong>Customer:</strong>{" "}
                  {order.user?.name || "Unknown customer"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {order.user?.email || "Not available"}
                </p>
                <p>
                  <strong>Payment status:</strong>{" "}
                  {order.paymentStatus || "pending"}
                </p>
              </div>

              <h3 className="admin-orders__items-heading">
                Order Items
              </h3>

              <div className="admin-orders__items">
                {(order.items || []).map((item, index) => (
                  <div
                    key={`${order._id}-${index}`}
                    className="admin-orders__item"
                  >
                    <div className="admin-orders__item-details">
                      <strong>{item.name}</strong>
                      <p className="admin-orders__muted">
                        Quantity: {item.quantity}
                      </p>

                      {item.base && <p>Base: {item.base}</p>}
                      {item.sauce && <p>Sauce: {item.sauce}</p>}
                      {item.cheese && <p>Cheese: {item.cheese}</p>}

                      {item.vegetables?.length > 0 && (
                        <p>
                          Vegetables: {item.vegetables.join(", ")}
                        </p>
                      )}
                    </div>

                    <strong>
                      Rs.{" "}
                      {(
                        Number(item.price || 0) *
                        Number(item.quantity || 0)
                      ).toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="admin-orders__footer">
                <div>
                  <span className="admin-orders__muted">
                    Order Total
                  </span>
                  <h3 className="admin-orders__total">
                    Rs.{" "}
                    {Number(order.totalAmount || 0).toLocaleString()}
                  </h3>
                </div>

                <div className="admin-orders__status-control">
                  <label
                    htmlFor={`status-${order._id}`}
                    className="admin-orders__label"
                  >
                    Update Order Status
                  </label>

                  <select
                    id={`status-${order._id}`}
                    className="admin-orders__select"
                    value={order.orderStatus}
                    disabled={updatingId === order._id}
                    onChange={(event) =>
                      handleStatusChange(
                        order._id,
                        event.target.value
                      )
                    }
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {updatingId === order._id && (
                    <small>Updating...</small>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

export default AdminOrders;
