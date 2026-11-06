
import { useEffect, useState } from "react";
import "./AdminInventory.css";

const API_URL = "http://localhost:5000/api/inventory";

function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    category: "base",
    name: "",
    quantity: "",
    threshold: 5,
  });

  const getToken = () => localStorage.getItem("adminToken");

  const lowStockItems = inventory.filter(
    (item) => Number(item.quantity) <= Number(item.threshold)
  );

  const categoryLabel = (category) =>
    category.charAt(0).toUpperCase() + category.slice(1);

  const fetchInventory = async () => {
    try {
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Admin login required. Please log in again.");
      }

      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch inventory.");
      }

      setInventory(Array.isArray(data.inventory) ? data.inventory : []);
    } catch (err) {
      console.error("Fetch inventory error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addInventory = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("Please enter an ingredient name.");
      return;
    }

    if (
      form.quantity === "" ||
      !Number.isInteger(Number(form.quantity)) ||
      Number(form.quantity) < 0 ||
      !Number.isInteger(Number(form.threshold)) ||
      Number(form.threshold) < 0
    ) {
      setError("Quantity and threshold must be whole numbers, 0 or greater.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          category: form.category,
          name: form.name.trim(),
          quantity: Number(form.quantity),
          threshold: Number(form.threshold),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add inventory item.");
      }

      setForm({
        category: "base",
        name: "",
        quantity: "",
        threshold: 5,
      });

      setMessage("Inventory item added successfully.");
      await fetchInventory();
    } catch (err) {
      console.error("Add inventory error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateQuantity = async (item) => {
    const newQuantity = window.prompt(
      `Enter new quantity for ${item.name}:`,
      item.quantity
    );

    if (newQuantity === null) return;

    const newThreshold = window.prompt(
      `Enter low-stock threshold for ${item.name}:`,
      item.threshold
    );

    if (newThreshold === null) return;

    if (
      newQuantity.trim() === "" ||
      !Number.isInteger(Number(newQuantity)) ||
      Number(newQuantity) < 0 ||
      newThreshold.trim() === "" ||
      !Number.isInteger(Number(newThreshold)) ||
      Number(newThreshold) < 0
    ) {
      window.alert("Quantity and threshold must be whole numbers, 0 or greater.");
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          quantity: Number(newQuantity),
          threshold: Number(newThreshold),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update inventory.");
      }

      const updatedItem = data.inventoryItem;

      if (updatedItem && updatedItem._id) {
        setInventory((previous) =>
          previous.map((current) =>
            current._id === updatedItem._id
              ? { ...current, ...updatedItem }
              : current
          )
        );
      } else {
        await fetchInventory();
      }

      setMessage(
        `${item.name} updated successfully. Quantity: ${newQuantity}, threshold: ${newThreshold}.`
      );
    } catch (err) {
      console.error("Update inventory error:", err);
      setError(err.message);
    }
  };

  const deleteInventory = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete inventory item.");
      }

      setMessage(`${item.name} deleted successfully.`);
      await fetchInventory();
    } catch (err) {
      console.error("Delete inventory error:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="ai-page">
        <div className="ai-state">
          <span className="ai-spinner" />
          <h2>Loading inventory...</h2>
          <p>Getting your ingredient stock ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-page">
      <section className="ai-hero">
        <div>
          <span className="ai-eyebrow">PIZZACRAFT ADMIN</span>
          <h1>Inventory <span>Management.</span></h1>
          <p>Keep ingredients organized, monitor stock, and make sure every pizza is ready to serve.</p>
        </div>

        <div className="ai-hero-icon" aria-hidden="true">🍕</div>
      </section>

      {message && (
        <div className="ai-notice ai-notice--success" role="status">
          <span>✓</span> {message}
        </div>
      )}

      {error && (
        <div className="ai-notice ai-notice--error" role="alert">
          <span>!</span> {error}
        </div>
      )}

      <section className="ai-stats">
        <article className="ai-stat-card">
          <span className="ai-stat-icon">📦</span>
          <div>
            <p>Total ingredients</p>
            <strong>{inventory.length}</strong>
          </div>
        </article>

        <article className="ai-stat-card">
          <span className="ai-stat-icon">✓</span>
          <div>
            <p>Stock available</p>
            <strong>{inventory.filter((item) => Number(item.quantity) > Number(item.threshold)).length}</strong>
          </div>
        </article>

        <article className={`ai-stat-card ${lowStockItems.length ? "ai-stat-card--warning" : ""}`}>
          <span className="ai-stat-icon">⚠</span>
          <div>
            <p>Low-stock items</p>
            <strong>{lowStockItems.length}</strong>
          </div>
        </article>
      </section>

      <section className={`ai-alert ${lowStockItems.length ? "ai-alert--warning" : "ai-alert--good"}`}>
        <div className="ai-alert-heading">
          <span className="ai-alert-symbol">{lowStockItems.length ? "⚠" : "✓"}</span>
          <div>
            <h2>{lowStockItems.length ? "Stock needs attention" : "Stock looks good"}</h2>
            <p>
              {lowStockItems.length
                ? `${lowStockItems.length} ingredient${lowStockItems.length === 1 ? "" : "s"} at or below the set threshold. Consider restocking.`
                : "All ingredients are above their low-stock thresholds."}
            </p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="ai-alert-list">
            {lowStockItems.map((item) => (
              <div className="ai-alert-item" key={item._id}>
                <span>{item.name}</span>
                <strong>{item.quantity} left</strong>
                <small>Threshold: {item.threshold}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ai-panel">
        <div className="ai-section-heading">
          <div>
            <span className="ai-eyebrow">STOCK CONTROL</span>
            <h2>Add an ingredient</h2>
            <p>Register a new base, sauce, cheese, or vegetable.</p>
          </div>
        </div>

        <form className="ai-form" onSubmit={addInventory}>
          <div className="ai-field">
            <label htmlFor="ai-category">Category</label>
            <select id="ai-category" name="category" value={form.category} onChange={handleChange}>
              <option value="base">Base</option>
              <option value="sauce">Sauce</option>
              <option value="cheese">Cheese</option>
              <option value="vegetable">Vegetable</option>
            </select>
          </div>

          <div className="ai-field ai-field--name">
            <label htmlFor="ai-name">Ingredient name</label>
            <input
              id="ai-name"
              type="text"
              name="name"
              placeholder="e.g. Mozzarella cheese"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="ai-field">
            <label htmlFor="ai-quantity">Quantity</label>
            <input
              id="ai-quantity"
              type="number"
              name="quantity"
              min="0"
              step="1"
              placeholder="0"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="ai-field">
            <label htmlFor="ai-threshold">Low-stock threshold</label>
            <input
              id="ai-threshold"
              type="number"
              name="threshold"
              min="0"
              step="1"
              value={form.threshold}
              onChange={handleChange}
              required
            />
          </div>

          <button className="ai-primary-button" type="submit" disabled={saving}>
            {saving ? "Adding..." : "+ Add ingredient"}
          </button>
        </form>
      </section>

      <section className="ai-panel ai-inventory-panel">
        <div className="ai-section-heading ai-inventory-heading">
          <div>
            <span className="ai-eyebrow">INGREDIENT OVERVIEW</span>
            <h2>Current inventory</h2>
            <p>Update quantities or remove ingredients you no longer use.</p>
          </div>
          <button className="ai-secondary-button" type="button" onClick={fetchInventory}>
            ↻ Refresh
          </button>
        </div>

        {inventory.length === 0 ? (
          <div className="ai-empty">
            <span>📦</span>
            <h3>No ingredients yet</h3>
            <p>Add your first ingredient using the form above.</p>
          </div>
        ) : (
          <div className="ai-table-wrap">
            <table className="ai-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Stock status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((item) => {
                  const isLowStock = Number(item.quantity) <= Number(item.threshold);

                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="ai-product-name">
                          <span className="ai-product-icon">🥫</span>
                          <strong>{item.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="ai-category">{categoryLabel(item.category)}</span>
                      </td>
                      <td>
                        <strong className="ai-quantity">{item.quantity}</strong>
                      </td>
                      <td>{item.threshold}</td>
                      <td>
                        <span className={`ai-stock-badge ${isLowStock ? "ai-stock-badge--low" : "ai-stock-badge--good"}`}>
                          <span />
                          {isLowStock ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td>
                        <div className="ai-actions">
                          <button
                            className="ai-action-button"
                            type="button"
                            onClick={() => updateQuantity(item)}
                          >
                            Update
                          </button>
                          <button
                            className="ai-action-button ai-action-button--delete"
                            type="button"
                            onClick={() => deleteInventory(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminInventory;
