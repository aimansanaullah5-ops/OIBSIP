
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const pizzaRoutes = require("./routes/pizza");
const inventoryRoutes = require("./routes/inventory");
const orderRoutes = require("./routes/order");

const { handleSafepayWebhook } = require("./controllers/orderController");

const app = express();

app.use(cors());

// Safepay webhook must receive the raw body before express.json().
app.post(
  "/api/orders/safepay-webhook",
  express.raw({ type: "application/json" }),
  handleSafepayWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pizzas", pizzaRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Pizza Delivery API is running!" });
});

module.exports = app;
 