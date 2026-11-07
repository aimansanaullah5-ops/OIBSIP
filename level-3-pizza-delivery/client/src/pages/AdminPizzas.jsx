
import { useEffect, useState } from "react";
import "./AdminPizzas.css";

const API_URL = "http://localhost:5000/api/pizzas";

const INGREDIENT_CATEGORIES = [
  { key: "bases", label: "Pizza Bases", icon: "🍞" },
  { key: "sauces", label: "Sauces", icon: "🍅" },
  { key: "cheeses", label: "Cheeses", icon: "🧀" },
  { key: "vegetables", label: "Vegetables", icon: "🥦" },
];

const DEFAULT_INGREDIENTS = {
  bases: [
    { name: "Classic Hand Tossed", price: "0", icon: "🍞" },
  ],
  sauces: [
    { name: "Classic Tomato", price: "0", icon: "🍅" },
  ],
  cheeses: [
    { name: "Mozzarella", price: "0", icon: "🧀" },
  ],
  vegetables: [
    { name: "Olives", price: "30", icon: "🫒" },
  ],
};

const emptyForm = () => ({
  name: "",
  description: "",
  price: "",
  image: null,
  bases: DEFAULT_INGREDIENTS.bases.map((item) => ({ ...item })),
  sauces: DEFAULT_INGREDIENTS.sauces.map((item) => ({ ...item })),
  cheeses: DEFAULT_INGREDIENTS.cheeses.map((item) => ({ ...item })),
  vegetables: DEFAULT_INGREDIENTS.vegetables.map((item) => ({ ...item })),
});

function normalizeIngredients(items, category) {
  const defaults = DEFAULT_INGREDIENTS[category];

  if (!Array.isArray(items) || items.length === 0) {
    return defaults.map((item) => ({ ...item }));
  }

  return items.map((item) => {
    if (typeof item === "string") {
      return {
        name: item,
        price: "0",
        icon: defaults[0]?.icon || "🍕",
      };
    }

    return {
      name: item?.name || "",
      price: String(item?.price ?? 0),
      icon: item?.icon || defaults[0]?.icon || "🍕",
    };
  });
}

export default function AdminPizzas() {
  const [pizzas, setPizzas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getAdminToken = () => localStorage.getItem("adminToken");

  const loadPizzas = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load pizzas");
      }

      setPizzas(data.pizzas || []);
    } catch (err) {
      setError(err.message || "Could not load pizzas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPizzas();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "image") {
      const file = files?.[0] || null;

      setForm((previous) => ({
        ...previous,
        image: file,
      }));

      setPreview((previous) => {
        if (previous.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }

        return file ? URL.createObjectURL(file) : "";
      });

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);

    setPreview((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return "";
    });
  };

  const startEdit = (pizza) => {
    setEditingId(pizza._id);

    setForm({
      name: pizza.name || "",
      description: pizza.description || "",
      price: String(pizza.price ?? ""),
      image: null,
      bases: normalizeIngredients(pizza.bases, "bases"),
      sauces: normalizeIngredients(pizza.sauces, "sauces"),
      cheeses: normalizeIngredients(pizza.cheeses, "cheeses"),
      vegetables: normalizeIngredients(pizza.vegetables, "vegetables"),
    });

    setPreview(pizza.image || "");
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const updateIngredient = (category, index, field, value) => {
    setForm((previous) => ({
      ...previous,
      [category]: previous[category].map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  const addIngredient = (category) => {
    const defaultIcon =
      DEFAULT_INGREDIENTS[category][0]?.icon || "🍕";

    setForm((previous) => ({
      ...previous,
      [category]: [
        ...previous[category],
        {
          name: "",
          price: "0",
          icon: defaultIcon,
        },
      ],
    }));
  };

  const removeIngredient = (category, index) => {
    setForm((previous) => ({
      ...previous,
      [category]: previous[category].filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const validateIngredients = () => {
    for (const category of INGREDIENT_CATEGORIES) {
      const items = form[category.key];

      if (
        category.key !== "vegetables" &&
        items.length === 0
      ) {
        return `Add at least one option for ${category.label}.`;
      }

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];

        if (!item.name.trim()) {
          return `Enter a name for every option in ${category.label}.`;
        }

        if (
          item.price === "" ||
          !Number.isFinite(Number(item.price)) ||
          Number(item.price) < 0
        ) {
          return `Enter a valid non-negative price for ${item.name}.`;
        }
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const token = getAdminToken();

    if (!token) {
      setError(
        "Admin token not found. Log in to the admin dashboard first."
      );
      return;
    }

    if (!form.name.trim() || !form.description.trim()) {
      setError("Enter the pizza name and description.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError("Enter a valid non-negative pizza price.");
      return;
    }

    const ingredientError = validateIngredients();

    if (ingredientError) {
      setError(ingredientError);
      return;
    }

    const body = new FormData();

    body.append("name", form.name.trim());
    body.append("description", form.description.trim());
    body.append("price", form.price);

    if (form.image) {
      body.append("image", form.image);
    }

    for (const category of INGREDIENT_CATEGORIES) {
      const cleanedIngredients = form[category.key].map((item) => ({
        name: item.name.trim(),
        price: Number(item.price),
        icon: item.icon.trim() || category.icon,
      }));

      body.append(
        category.key,
        JSON.stringify(cleanedIngredients)
      );
    }

    setSaving(true);

    try {
      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save pizza");
      }

      setMessage(data.message || "Pizza saved successfully");

      resetForm();
      await loadPizzas();
    } catch (err) {
      setError(err.message || "Could not save pizza");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pizza) => {
    const confirmed = window.confirm(
      `Delete "${pizza.name}" from the menu?`
    );

    if (!confirmed) return;

    const token = getAdminToken();

    if (!token) {
      setError("Admin token not found. Log in again.");
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/${pizza._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete pizza");
      }

      setMessage(data.message || "Pizza deleted successfully");

      if (editingId === pizza._id) {
        resetForm();
      }

      await loadPizzas();
    } catch (err) {
      setError(err.message || "Could not delete pizza");
    }
  };

  return (
    <main className="admin-pizzas">
      <header className="admin-pizzas__header">
        <div>
          <p className="admin-pizzas__eyebrow">
            PIZZACRAFT ADMIN
          </p>
          <h1>Pizza Menu Management</h1>
          <p>
            Add pizzas, upload photos and manage ingredients and
            their extra prices.
          </p>
        </div>

        <button
          className="admin-pizzas__secondary"
          type="button"
          onClick={loadPizzas}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh menu"}
        </button>
      </header>

      {message && (
        <div className="admin-pizzas__notice" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-pizzas__error" role="alert">
          {error}
        </div>
      )}

      <section className="admin-pizzas__layout">
        <form
          className="admin-pizzas__form"
          onSubmit={handleSubmit}
        >
          <h2>{editingId ? "Edit pizza" : "Add a new pizza"}</h2>

          <label htmlFor="pizza-name">Pizza name</label>
          <input
            id="pizza-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Pepperoni Feast"
            required
          />

          <label htmlFor="pizza-description">
            Description
          </label>
          <textarea
            id="pizza-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the toppings and flavour"
            rows={4}
            required
          />

          <label htmlFor="pizza-price">
            Starting price (PKR)
          </label>
          <input
            id="pizza-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            placeholder="949"
            required
          />

          <p className="admin-pizzas__hint">
            This is the base price of the pizza. Selected
            ingredient prices will be added to it.
          </p>

          <label htmlFor="pizza-image">
            Pizza photo {editingId ? "(optional)" : ""}
          </label>
          <input
            id="pizza-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
          />

          {preview && (
            <div className="admin-pizzas__preview">
              <img src={preview} alt="Pizza preview" />
            </div>
          )}

          <p className="admin-pizzas__hint">
            JPG, PNG or WEBP. Maximum file size: 5 MB.
            {editingId &&
              " Leave the photo empty to keep the current image."}
          </p>

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              marginTop: "24px",
              paddingTop: "20px",
            }}
          >
            <h2>Customize this pizza</h2>
            <p className="admin-pizzas__hint">
              Add the options customers can choose for this
              particular pizza. Prices are extra charges in PKR.
            </p>

            {INGREDIENT_CATEGORIES.map((category) => (
              <section
                key={category.key}
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  {category.icon} {category.label}
                </h3>

                {form[category.key].map((item, index) => (
                  <div
                    key={`${category.key}-${index}`}
                    style={{
                      display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(75px, 1fr) 75px auto",              
                      gap: "8px",
                      alignItems: "end",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <label
                        htmlFor={`${category.key}-name-${index}`}
                      >
                        Name
                      </label>
                      <input
                        id={`${category.key}-name-${index}`}
                        value={item.name}
                        onChange={(event) =>
                          updateIngredient(
                            category.key,
                            index,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Option name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${category.key}-price-${index}`}
                      >
                        Extra PKR
                      </label>
                      <input
                        id={`${category.key}-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(event) =>
                          updateIngredient(
                            category.key,
                            index,
                            "price",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`${category.key}-icon-${index}`}
                      >
                        Icon
                      </label>
                      <input
                        id={`${category.key}-icon-${index}`}
                        value={item.icon}
                        onChange={(event) =>
                          updateIngredient(
                            category.key,
                            index,
                            "icon",
                            event.target.value
                          )
                        }
                        maxLength={8}
                        placeholder="🍕"
                      />
                    </div>

                    <button
                      type="button"
                      className="admin-pizzas__danger"
                      onClick={() =>
                        removeIngredient(category.key, index)
                      }
                      disabled={
                        category.key !== "vegetables" &&
                        form[category.key].length <= 1
                      }
                      title={
                        category.key !== "vegetables" &&
                        form[category.key].length <= 1
                          ? "Keep at least one option"
                          : "Remove this option"
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="admin-pizzas__secondary"
                  onClick={() => addIngredient(category.key)}
                >
                  + Add {category.label.slice(0, -1)}
                </button>
              </section>
            ))}
          </div>

          <div className="admin-pizzas__actions">
            <button
              className="admin-pizzas__primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Add pizza"}
            </button>

            {editingId && (
              <button
                className="admin-pizzas__secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="admin-pizzas__menu">
          <div className="admin-pizzas__menu-heading">
            <h2>Current menu</h2>
            <span>{pizzas.length} pizzas</span>
          </div>

          {loading && pizzas.length === 0 ? (
            <p>Loading menu...</p>
          ) : pizzas.length === 0 ? (
            <p>
              No pizzas found. Add your first pizza using the form.
            </p>
          ) : (
            <div className="admin-pizzas__grid">
              {pizzas.map((pizza) => (
                <article
                  className="admin-pizzas__card"
                  key={pizza._id}
                >
                  {pizza.image ? (
                    <img
                      className="admin-pizzas__image"
                      src={pizza.image}
                      alt={pizza.name}
                    />
                  ) : (
                    <div className="admin-pizzas__no-image">
                      No photo uploaded
                    </div>
                  )}

                  <div className="admin-pizzas__card-body">
                    <h3>{pizza.name}</h3>
                    <p>{pizza.description}</p>
                    <strong>
                      PKR {Number(pizza.price).toLocaleString()}
                    </strong>

                    <p className="admin-pizzas__hint">
                      {(pizza.bases || []).length} bases ·{" "}
                      {(pizza.sauces || []).length} sauces ·{" "}
                      {(pizza.cheeses || []).length} cheeses ·{" "}
                      {(pizza.vegetables || []).length} vegetables
                    </p>

                    <div className="admin-pizzas__actions">
                      <button
                        type="button"
                        className="admin-pizzas__secondary"
                        onClick={() => startEdit(pizza)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="admin-pizzas__danger"
                        onClick={() => handleDelete(pizza)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
