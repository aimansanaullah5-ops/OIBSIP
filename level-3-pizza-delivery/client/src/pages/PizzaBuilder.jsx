
import { useEffect, useState } from "react";
import "./PizzaBuilder.css";

const bases = [
  { name: "Classic Hand Tossed", price: 250, icon: "🍞" },
  { name: "Thin Crust", price: 220, icon: "🥨" },
  { name: "Cheese Burst", price: 350, icon: "🧀" },
  { name: "Whole Wheat", price: 280, icon: "🌾" },
  { name: "Stuffed Crust", price: 400, icon: "🍕" },
];

const sauces = [
  { name: "Classic Tomato", price: 40, icon: "🍅" },
  { name: "Spicy Sauce", price: 50, icon: "🌶️" },
  { name: "BBQ Sauce", price: 60, icon: "🍖" },
  { name: "Garlic Sauce", price: 50, icon: "🧄" },
  { name: "Pesto Sauce", price: 80, icon: "🌿" },
];

const cheeses = [
  { name: "Mozzarella", price: 100, icon: "🧀" },
  { name: "Cheddar", price: 120, icon: "🟡" },
  { name: "Parmesan", price: 150, icon: "✨" },
  { name: "Feta", price: 130, icon: "🥛" },
];

const vegetables = [
  { name: "Tomato", price: 30, icon: "🍅" },
  { name: "Onion", price: 20, icon: "🧅" },
  { name: "Capsicum", price: 30, icon: "🫑" },
  { name: "Olives", price: 50, icon: "🫒" },
  { name: "Mushrooms", price: 60, icon: "🍄" },
  { name: "Jalapeños", price: 40, icon: "🌶️" },
];

const pizzaImage =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85";

const normalizeIngredients = (items, fallback) => {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback;
  }

  return items.map((item) =>
    typeof item === "string"
      ? { name: item, price: 0, icon: "🍕" }
      : {
          name: item.name,
          price: Number(item.price) || 0,
          icon: item.icon || "🍕",
        }
  );
};

function PizzaBuilder({ selectedPizza, setCartItems, goToCart }) {
  const activeBases = selectedPizza
    ? normalizeIngredients(selectedPizza.bases, [])
    : bases;

  const activeSauces = selectedPizza
    ? normalizeIngredients(selectedPizza.sauces, [])
    : sauces;

  const activeCheeses = selectedPizza
    ? normalizeIngredients(selectedPizza.cheeses, [])
    : cheeses;

  const activeVegetables = selectedPizza
    ? normalizeIngredients(selectedPizza.vegetables, [])
    : vegetables;

  const [base, setBase] = useState("");
  const [sauce, setSauce] = useState("");
  const [cheese, setCheese] = useState("");
  const [selectedVegetables, setSelectedVegetables] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBase(activeBases[0]?.name || "");
    setSauce(activeSauces[0]?.name || "");
    setCheese(activeCheeses[0]?.name || "");

    setSelectedVegetables(
      selectedPizza ? [] : ["Tomato"]
    );

    setQuantity(1);
    setMessage("");
  }, [selectedPizza]);

  const basePrice =
    Number(activeBases.find((item) => item.name === base)?.price) || 0;

  const saucePrice =
    Number(activeSauces.find((item) => item.name === sauce)?.price) || 0;

  const cheesePrice =
    Number(activeCheeses.find((item) => item.name === cheese)?.price) || 0;

  const vegetablesPrice = activeVegetables
    .filter((item) => selectedVegetables.includes(item.name))
    .reduce((sum, item) => sum + item.price, 0);

  const startingPrice = selectedPizza
    ? Number(selectedPizza.price) || 0
    : 0;

  const unitPrice =
    startingPrice +
    basePrice +
    saucePrice +
    cheesePrice +
    vegetablesPrice;

  const totalPrice = unitPrice * quantity;

  const toggleVegetable = (name) => {
    setSelectedVegetables((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );

    setMessage("");
  };

  const addToCart = () => {
    if (!base || !sauce || !cheese) {
      setMessage("Please select a base, sauce, and cheese.");
      return;
    }

    const ingredientsDescription = [
      base,
      sauce,
      cheese,
      ...selectedVegetables,
    ].join(" - ");

    const pizza = {
      name: selectedPizza
        ? `${selectedPizza.name} (${ingredientsDescription})`
        : `Signature Pizza (${ingredientsDescription})`,
      base,
      sauce,
      cheese,
      vegetables: [...selectedVegetables],
      price: unitPrice,
      quantity,
    };

    setCartItems((current) => {
      const existing = current.find(
        (item) =>
          item.name === pizza.name && item.price === pizza.price
      );

      if (existing) {
        return current.map((item) =>
          item.name === pizza.name && item.price === pizza.price
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...current, pizza];
    });

    setMessage("Your pizza has been added to the cart!");
  };

  const renderChoices = (items, selected, onSelect, groupName) => (
    <div className="builder-choice-grid">
      {items.length === 0 ? (
        <p>No options available for this pizza.</p>
      ) : (
        items.map((item) => (
          <label
            key={item.name}
            className={`builder-choice ${
              selected === item.name ? "choice-selected" : ""
            }`}
          >
            <input
              type="radio"
              name={groupName}
              value={item.name}
              checked={selected === item.name}
              onChange={() => {
                onSelect(item.name);
                setMessage("");
              }}
            />

            <span className="choice-icon">{item.icon}</span>

            <span className="choice-info">
              <strong>{item.name}</strong>
              <small>Rs. {item.price}</small>
            </span>

            <span className="choice-check">
              {selected === item.name ? "✓" : ""}
            </span>
          </label>
        ))
      )}
    </div>
  );

  return (
    <main className="builder-page">
      <header className="builder-heading">
        <span className="builder-eyebrow">MADE YOUR WAY</span>

        <h1>
          {selectedPizza ? (
            <>Customize <span>{selectedPizza.name}.</span></>
          ) : (
            <>Build Your <span>Perfect Pizza.</span></>
          )}
        </h1>

        <p>
          {selectedPizza
            ? selectedPizza.description
            : "Pick your favorites, choose your toppings, and make it yours."}
        </p>
      </header>

      <div className="builder-layout">
        <aside className="builder-preview-column">
          <div className="builder-preview-card">
            <div className="preview-topline">
              <span>YOUR CREATION</span>
              <span className="preview-live"><i /> LIVE PREVIEW</span>
            </div>

            <div className="builder-pizza-picture">
              <img
                src={selectedPizza?.image || pizzaImage}
                alt={selectedPizza?.name || "Your signature pizza"}
              />
              <span className="preview-badge">🍕 Made for you</span>
            </div>

            <div className="preview-description">
              <h2>{selectedPizza?.name || "Your Signature Pizza"}</h2>
              <p>
                {base}, {sauce}, {cheese}
                {selectedVegetables.length
                  ? `, ${selectedVegetables.join(", ")}`
                  : ""}
              </p>
            </div>

            <div className="preview-mini-stats">
              <div>
                <span>Base</span>
                <strong>{base}</strong>
              </div>
              <div>
                <span>Toppings</span>
                <strong>{selectedVegetables.length} selected</strong>
              </div>
            </div>

            <div className="preview-price">
              <div>
                <span>Price per pizza</span>
                <strong>Rs. {unitPrice.toLocaleString()}</strong>
              </div>
              <span className="preview-price-icon">✦</span>
            </div>
          </div>

          <div className="builder-tip">
            <span>💡</span>
            <p>
              <strong>Chef's tip</strong> Choose your favorite vegetables
              for extra flavor and crunch.
            </p>
          </div>
        </aside>

        <div className="builder-options-column">
          <section className="builder-section">
            <div className="builder-section-heading">
              <span className="builder-step">01</span>
              <div>
                <h2>Choose your base</h2>
                <p>Start with the perfect crust.</p>
              </div>
            </div>
            {renderChoices(activeBases, base, setBase, "base")}
          </section>

          <section className="builder-section">
            <div className="builder-section-heading">
              <span className="builder-step">02</span>
              <div>
                <h2>Pick your sauce</h2>
                <p>Choose the flavor foundation.</p>
              </div>
            </div>
            {renderChoices(activeSauces, sauce, setSauce, "sauce")}
          </section>

          <section className="builder-section">
            <div className="builder-section-heading">
              <span className="builder-step">03</span>
              <div>
                <h2>Add your cheese</h2>
                <p>Make every bite delicious.</p>
              </div>
            </div>
            {renderChoices(activeCheeses, cheese, setCheese, "cheese")}
          </section>

          <section className="builder-section">
            <div className="builder-section-heading">
              <span className="builder-step">04</span>
              <div>
                <h2>Choose your vegetables</h2>
                <p>Select as many as you like.</p>
              </div>
              <span className="builder-optional">MULTI-SELECT</span>
            </div>

            <div className="builder-vegetable-grid">
              {activeVegetables.length === 0 ? (
                <p>No vegetables available for this pizza.</p>
              ) : (
                activeVegetables.map((item) => {
                  const checked = selectedVegetables.includes(item.name);

                  return (
                    <label
                      key={item.name}
                      className={`builder-vegetable ${
                        checked ? "vegetable-selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVegetable(item.name)}
                      />
                      <span className="vegetable-icon">{item.icon}</span>
                      <span className="vegetable-info">
                        <strong>{item.name}</strong>
                        <small>+ Rs. {item.price}</small>
                      </span>
                      <span className="vegetable-check">
                        {checked ? "✓" : "+"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="builder-summary-column">
          <div className="builder-summary-card">
            <span className="builder-eyebrow">YOUR ORDER</span>
            <h2>Order Summary</h2>
            <p className="summary-intro">
              Everything that goes into your pizza.
            </p>

            <div className="summary-lines">
              {selectedPizza && (
                <div>
                  <span>{selectedPizza.name} base price</span>
                  <strong>Rs. {startingPrice}</strong>
                </div>
              )}

              <div>
                <span>{base}</span>
                <strong>Rs. {basePrice}</strong>
              </div>
              <div>
                <span>{sauce}</span>
                <strong>Rs. {saucePrice}</strong>
              </div>
              <div>
                <span>{cheese}</span>
                <strong>Rs. {cheesePrice}</strong>
              </div>
              <div>
                <span>Vegetables</span>
                <strong>Rs. {vegetablesPrice}</strong>
              </div>
            </div>

            <div className="summary-quantity">
              <span>Quantity</span>
              <div className="quantity-controls">
                <button
                  type="button"
                  onClick={() => {
                    setQuantity((q) => Math.max(1, q - 1));
                    setMessage("");
                  }}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >−</button>

                <strong>{quantity}</strong>

                <button
                  type="button"
                  onClick={() => {
                    setQuantity((q) => Math.min(20, q + 1));
                    setMessage("");
                  }}
                  disabled={quantity >= 20}
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>

            <div className="summary-total">
              <span>Total price</span>
              <strong>Rs. {totalPrice.toLocaleString()}</strong>
            </div>

            <button
              className="builder-add-cart"
              type="button"
              onClick={addToCart}
            >
              <span>🛒</span> Add to Cart <span>→</span>
            </button>

            <button
              className="builder-view-cart"
              type="button"
              onClick={goToCart}
            >
              View Cart
            </button>

            {message && (
              <div className="builder-success" role="status">
                <span>✓</span>
                <p>{message}</p>
              </div>
            )}

            <div className="summary-footer">
              <span>✓</span> Freshly prepared just for you
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default PizzaBuilder;