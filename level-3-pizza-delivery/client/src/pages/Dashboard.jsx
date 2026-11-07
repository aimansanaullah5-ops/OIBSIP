
import { useEffect, useState } from "react";
import "./Dashboard.css";

const pizzaImages = [
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",
];

function Dashboard({ goToBuilder }) {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPizzas = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/pizzas");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch pizzas");
        }

        setPizzas(Array.isArray(data.pizzas) ? data.pizzas : []);
      } catch (error) {
        console.error("Pizza fetch error:", error);
        setError(error.message || "Unable to load pizzas.");
      } finally {
        setLoading(false);
      }
    };

    fetchPizzas();
  }, []);

  return (
    <div className="pizza-dashboard">
      <section className="pizza-hero">
        <div className="hero-content">
          <span className="hero-label">FRESH FROM OUR OVEN</span>
          <h1>
            Good food.
            <br />
            Great <span>pizza.</span>
          </h1>
          <p>
            Handcrafted with love, loaded with flavor, and made just the
            way you like it.
          </p>

          <div className="hero-actions">
            <button className="pizza-primary-btn" onClick={goToBuilder}>
              Customize Your Pizza <span>→</span>
            </button>
            <a className="pizza-secondary-btn" href="#pizza-menu">
              Explore Menu
            </a>
          </div>

          <div className="hero-promise">
            <span>🍅 Fresh ingredients</span>
            <span>🍕 Made for you</span>
          </div>
        </div>

        <div className="hero-image-wrap">
          <img
            className="hero-pizza-image"
            src={pizzaImages[0]}
            alt="Freshly baked pizza with delicious toppings"
          />
          <div className="hero-image-note">
            <span className="note-icon">✦</span>
            <div>
              <strong>Made with love</strong>
              <small>Freshly prepared for you</small>
            </div>
          </div>
        </div>
        <span className="hero-decoration">PIZZA TIME</span>
      </section>

      <section className="pizza-menu-section" id="pizza-menu">
        <div className="menu-heading">
          <div>
            <span className="section-eyebrow">OUR MENU</span>
            <h2>Find your <span>favorite.</span></h2>
            <p>Delicious choices, fresh ingredients, unforgettable bites.</p>
          </div>

          <button
            className="menu-view-all"
            onClick={goToBuilder}
            type="button"
          >
            Build your own <span>↗</span>
          </button>
        </div>

        {loading ? (
          <div className="pizza-state">
            <span className="pizza-loader">🍕</span>
            <h3>Getting the oven ready...</h3>
            <p>Loading our delicious pizzas.</p>
          </div>
        ) : error ? (
          <div className="pizza-state pizza-error">
            <span>!</span>
            <h3>We couldn't load the menu.</h3>
            <p>{error}</p>
            <button
              className="pizza-primary-btn"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : pizzas.length === 0 ? (
          <div className="pizza-state">
            <span className="empty-pizza">🍕</span>
            <h3>Our menu is getting ready.</h3>
            <p>No pizzas are available right now. Please check back soon.</p>
            <button className="pizza-primary-btn" onClick={goToBuilder}>
              Customize Your Pizza
            </button>
          </div>
        ) : (
          <div className="pizza-card-grid">
            {pizzas.map((pizza, index) => (
              <article className="pizza-card" key={pizza._id}>
                <div className="pizza-card-image-wrap">
                  <img
                    className="pizza-card-image"
                    src={pizza.image || pizzaImages[index % pizzaImages.length]}
                    alt={pizza.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        pizzaImages[index % pizzaImages.length];
                    }}
                  />
                  <span className="pizza-card-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="pizza-card-content">
                  <div className="pizza-card-title-row">
                    <h3>{pizza.name}</h3>
                    <span className="pizza-card-star">★ 4.8</span>
                  </div>

                  <p className="pizza-card-description">
                    {pizza.description || "Freshly prepared with delicious ingredients."}
                  </p>

                  <div className="pizza-card-footer">
                    <div>
                      <small>Starting at</small>
                      <strong>Rs. {Number(pizza.price).toLocaleString()}</strong>
                    </div>

                    <button
                      className="pizza-add-btn"
                      onClick={() => goToBuilder(pizza)}
                      aria-label={`Customize ${pizza.name}`}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="pizza-custom-banner">
        <div className="custom-banner-icon">🍕</div>
        <div className="custom-banner-text">
          <span>YOUR PIZZA, YOUR RULES</span>
          <h2>Create a pizza that's uniquely yours.</h2>
          <p>Choose your base, sauce, cheese, and favorite toppings.</p>
        </div>
        <button className="pizza-banner-btn" onClick={goToBuilder}>
          Start Creating <span>→</span>
        </button>
      </section>
    </div>
  );
}

export default Dashboard;
