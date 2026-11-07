const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    icon: {
      type: String,
      default: "🍕",
    },
  },
  { _id: false }
);

const pizzaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },

    bases: {
      type: [ingredientSchema],
      default: [{ name: "Classic Hand Tossed", price: 0, icon: "🍞" }],
    },
    sauces: {
      type: [ingredientSchema],
      default: [{ name: "Classic Tomato", price: 0, icon: "🍅" }],
    },
    cheeses: {
      type: [ingredientSchema],
      default: [{ name: "Mozzarella", price: 0, icon: "🧀" }],
    },
    vegetables: {
      type: [ingredientSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Pizza || mongoose.model("Pizza", pizzaSchema);