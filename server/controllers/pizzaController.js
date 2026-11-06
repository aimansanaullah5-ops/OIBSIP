
const Pizza = require("../models/pizza");

const INGREDIENT_FIELDS = ["bases", "sauces", "cheeses", "vegetables"];

const DEFAULT_INGREDIENTS = {
  bases: [{ name: "Classic Hand Tossed", price: 0, icon: "🍞" }],
  sauces: [{ name: "Classic Tomato", price: 0, icon: "🍅" }],
  cheeses: [{ name: "Mozzarella", price: 0, icon: "🧀" }],
  vegetables: [],
};

const normalizeIngredients = (value, fallback = []) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  let items = value;

  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = items.split(",");
    }
  }

  if (!Array.isArray(items)) {
    throw new Error("Ingredients must be an array.");
  }

  return items.map((item) => {
    const ingredient =
      typeof item === "string" ? { name: item } : item;

    const name = String(ingredient?.name || "").trim();
    const price = Number(ingredient?.price ?? 0);

    if (!name) {
      throw new Error("Every ingredient needs a name.");
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Invalid price for ingredient: ${name}`);
    }

    return {
      name,
      price,
      icon: String(ingredient.icon || "🍕"),
    };
  });
};

const sendError = (res, error, action) => {
  console.error(`${action} error:`, error);

  if (error.message?.startsWith("Ingredients") ||
      error.message?.startsWith("Every ingredient") ||
      error.message?.startsWith("Invalid price")) {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Server error" });
};

// GET /api/pizzas
const getAllPizzas = async (req, res) => {
  try {
    const pizzas = await Pizza.find().sort({ createdAt: -1 });
    return res.json({ message: "Pizzas fetched successfully", pizzas });
  } catch (error) {
    return sendError(res, error, "Get pizzas");
  }
};

// GET /api/pizzas/:id
const getPizzaById = async (req, res) => {
  try {
    const pizza = await Pizza.findById(req.params.id);

    if (!pizza) {
      return res.status(404).json({ message: "Pizza not found" });
    }

    return res.json({ message: "Pizza fetched successfully", pizza });
  } catch (error) {
    return sendError(res, error, "Get pizza");
  }
};

// POST /api/pizzas
const createPizza = async (req, res) => {
  try {
    const { name, description, price } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      price === undefined ||
      price === ""
    ) {
      return res.status(400).json({
        message: "Name, description and price are required",
      });
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number",
      });
    }

    const pizzaData = {
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      image: req.file?.path || "",
    };

    for (const field of INGREDIENT_FIELDS) {
      pizzaData[field] = normalizeIngredients(
        req.body[field],
        DEFAULT_INGREDIENTS[field]
      );
    }

    const pizza = await Pizza.create(pizzaData);

    return res.status(201).json({
      message: "Pizza created successfully",
      pizza,
    });
  } catch (error) {
    return sendError(res, error, "Create pizza");
  }
};

// PUT /api/pizzas/:id
const updatePizza = async (req, res) => {
  try {
    const pizza = await Pizza.findById(req.params.id);

    if (!pizza) {
      return res.status(404).json({ message: "Pizza not found" });
    }

    const { name, description, price } = req.body || {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Pizza name cannot be empty",
        });
      }
      pizza.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          message: "Description cannot be empty",
        });
      }
      pizza.description = description.trim();
    }

    if (price !== undefined && price !== "") {
      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          message: "Price must be a valid non-negative number",
        });
      }

      pizza.price = numericPrice;
    }

    for (const field of INGREDIENT_FIELDS) {
      if (req.body[field] !== undefined) {
        pizza[field] = normalizeIngredients(req.body[field], pizza[field]);
      }
    }

    // Preserve the existing photo unless a new one is uploaded.
    if (req.file) {
      pizza.image = req.file.path;
    }

    await pizza.save();

    return res.json({ message: "Pizza updated successfully", pizza });
  } catch (error) {
    return sendError(res, error, "Update pizza");
  }
};

// DELETE /api/pizzas/:id
const deletePizza = async (req, res) => {
  try {
    const pizza = await Pizza.findByIdAndDelete(req.params.id);

    if (!pizza) {
      return res.status(404).json({ message: "Pizza not found" });
    }

    return res.json({ message: "Pizza deleted successfully" });
  } catch (error) {
    return sendError(res, error, "Delete pizza");
  }
};

module.exports = {
  getAllPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza,
};
