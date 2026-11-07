
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["base", "sauce", "cheese", "vegetable"],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: "portions",
    },
    usagePerPizza: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
  },
  { timestamps: true }
);

inventorySchema.index({ category: 1, name: 1 }, { unique: true });

module.exports =
  mongoose.models.Inventory ||
  mongoose.model("Inventory", inventorySchema);
