
import { useState } from "react";
import "./Cart.css";

const pizzaImage =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80";

function Cart({ cartItems, setCartItems, goToBuilder, goToDashboard }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const formatPrice = (price) =>
    `Rs. ${Number(price).toLocaleString()}`;

  const updateQuantity = (index, change) => {
    setMessage("");

    setCartItems((current) =>
      current
        .map((item, i) =>
          i === index
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (index) => {
    setMessage("");
    setCartItems((current) => current.filter((_, i) => i !== index));
  };

  const placeOrder = async () => {
    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please log in before placing an order.");
      return;
    }

    if (cartItems.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            name: item.name,
            quantity: Number(item.quantity),
            price: Number(item.price),
            base: item.base || "",
            sauce: item.sauce || "",
            cheese: item.cheese || "",
            vegetables: item.vegetables || [],
          })),
          totalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to start your order.");
      }

      if (!data.checkoutUrl) {
        throw new Error(
          "Payment checkout link was not received. Please try again."
        );
      }

      // Save the cart until payment is confirmed.
      // The payment-return handler in App.jsx will clear it.
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setMessage(error.message || "Unable to start payment.");
      setLoading(false);
    }
  };

  return (
    <main className="cart-page">
      <div className="cart-heading">
        <span className="cart-eyebrow">YOUR PIZZA SELECTION</span>
        <h1>
          Your <span>Shopping Cart.</span>
        </h1>
        <p>Your favorites are just a few steps away.</p>
      </div>

      <div className="cart-navigation">
        <button
          type="button"
          className="cart-back-btn"
          onClick={goToDashboard}
        >
          ← Back to Home
        </button>

        <button
          type="button"
          className="cart-continue-btn"
          onClick={goToBuilder}
        >
          + Add another pizza
        </button>
      </div>

      {cartItems.length === 0 ? (
        <section className="cart-empty-state">
          <span className="cart-empty-icon">🍕</span>
          <h2>Your cart is feeling lonely.</h2>
          <p>
            You haven't added any pizzas yet. Let's make something delicious!
          </p>

          <button
            type="button"
            className="cart-checkout-btn"
            onClick={goToBuilder}
          >
            Customize a Pizza →
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-column">
            <div className="cart-items-heading">
              <h2>Your items</h2>
              <span>
                {cartItems.length}{" "}
                {cartItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            {cartItems.map((item, index) => (
              <article
                className="cart-item-card"
                key={`${item.name}-${index}`}
              >
                <img
                  className="cart-item-image"
                  src={pizzaImage}
                  alt="Pizza"
                />

                <div className="cart-item-details">
                  <h3>{item.name}</h3>

                  <div className="cart-ingredient-tags">
                    {item.base && <span>{item.base}</span>}
                    {item.sauce && <span>{item.sauce}</span>}
                    {item.cheese && <span>{item.cheese}</span>}
                  </div>

                  <p className="cart-vegetables">
                    <strong>Vegetables:</strong>{" "}
                    {item.vegetables?.length
                      ? item.vegetables.join(", ")
                      : "None"}
                  </p>

                  <strong className="cart-item-price">
                    {formatPrice(item.price)}
                    <small> / pizza</small>
                  </strong>

                  <div className="cart-item-actions">
                    <div className="cart-quantity">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, -1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(index, 1)}
                        disabled={item.quantity >= 20}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-item-subtotal">
                  <span>Subtotal</span>
                  <strong>
                    {formatPrice(
                      Number(item.price) * Number(item.quantity)
                    )}
                  </strong>
                </div>
              </article>
            ))}

            <button
              type="button"
              className="cart-continue-link"
              onClick={goToBuilder}
            >
              ← Continue customizing
            </button>
          </section>

          <aside className="cart-summary">
            <span className="cart-eyebrow">THE FINAL COUNT</span>
            <h2>Order Summary</h2>

            <p className="cart-summary-description">
              Review your selection before placing your order.
            </p>

            <div className="cart-summary-line">
              <span>Items</span>
              <strong>
                {cartItems.reduce(
                  (sum, item) => sum + Number(item.quantity),
                  0
                )}{" "}
                pizza(s)
              </strong>
            </div>

            <div className="cart-summary-line">
              <span>Subtotal</span>
              <strong>{formatPrice(totalAmount)}</strong>
            </div>

            <div className="cart-summary-line">
              <span>Delivery</span>
              <strong>Not included</strong>
            </div>

            <div className="cart-summary-total">
              <span>Total</span>
              <strong>{formatPrice(totalAmount)}</strong>
            </div>

            <p className="cart-delivery-note">
              Final delivery charges, if applicable, are not included in this
              displayed total.
            </p>

            <button
              type="button"
              className="cart-checkout-btn"
              onClick={placeOrder}
              disabled={loading || cartItems.length === 0}
            >
              {loading ? "Connecting to Safepay..." : "Pay with Safepay"}
              {!loading && <span>→</span>}
            </button>

            <div className="cart-secure-note">
              <span>✓</span> Secure payment through Safepay.
            </div>

            {message && (
              <div className="cart-message" role="alert">
                {message}
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

export default Cart;
