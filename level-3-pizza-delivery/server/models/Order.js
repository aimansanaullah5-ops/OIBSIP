const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        base: { type: String, default: "" },
        sauce: { type: String, default: "" },
        cheese: { type: String, default: "" },
        vegetables: { type: [String], default: [] },
      },
    ],

    totalAmount: { type: Number, required: true, min: 0 },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Order Received",
        "In Kitchen",
        "Sent to Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Received",
    },

    safepayTracker: {
      type: String,
      default: null,
      index: true,
    },

    paymentReference: {
      type: String,
      default: null,
    },

    inventoryDeducted: {
      type: Boolean,
      default: false,
    },

    inventoryDeduction: [
      {
        inventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
          required: true,
        },
        quantityUsed: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    stockRestored: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);