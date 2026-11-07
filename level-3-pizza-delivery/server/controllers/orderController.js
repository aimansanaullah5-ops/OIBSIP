
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Inventory = require("../models/inventory");
const checkLowStock = require("../utils/lowStockNotifier");
const safepay = require("../config/safepay");

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// Find an inventory item by category and name.
const findInventoryItem = async (category, name) => {
  return Inventory.findOne({
    category,
    name: {
      $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  });
};

// Calculate the inventory required for an order.
const buildStockPlan = async (items) => {
  const requirements = new Map();

  for (const item of items) {
    const ingredients = [
      { category: "base", name: item.base },
      { category: "sauce", name: item.sauce },
      { category: "cheese", name: item.cheese },
      ...item.vegetables.map((name) => ({
        category: "vegetable",
        name,
      })),
    ].filter((ingredient) => ingredient.name);

    for (const ingredient of ingredients) {
      const key = `${ingredient.category}:${ingredient.name.toLowerCase()}`;
      const existing = requirements.get(key);

      if (existing) {
        existing.pizzaCount += item.quantity;
      } else {
        requirements.set(key, {
          ...ingredient,
          pizzaCount: item.quantity,
        });
      }
    }
  }

  const stockPlan = [];

  for (const requirement of requirements.values()) {
    const inventoryItem = await findInventoryItem(
      requirement.category,
      requirement.name
    );

    if (!inventoryItem) {
      throw new Error(
        `Inventory item not found: ${requirement.name} (${requirement.category}).`
      );
    }

    if (
      !Number.isFinite(inventoryItem.usagePerPizza) ||
      inventoryItem.usagePerPizza <= 0
    ) {
      throw new Error(
        `Invalid usagePerPizza for ${inventoryItem.name}.`
      );
    }

    const quantityUsed =
      inventoryItem.usagePerPizza * requirement.pizzaCount;

    if (inventoryItem.quantity < quantityUsed) {
      throw new Error(
        `Not enough stock for ${inventoryItem.name}.`
      );
    }

    stockPlan.push({
      inventoryId: inventoryItem._id,
      name: inventoryItem.name,
      quantityUsed,
    });
  }

  return stockPlan;
};

// Deduct inventory once, only after confirmed payment.
const deductInventory = async (order) => {
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: "paid",
      inventoryDeducted: false,
    },
    { $set: { inventoryDeducted: true } },
    { new: true }
  );

  if (!claimedOrder) return;

  const completed = [];

  try {
    for (const deduction of order.inventoryDeduction || []) {
      const result = await Inventory.updateOne(
        {
          _id: deduction.inventoryId,
          quantity: { $gte: deduction.quantityUsed },
        },
        {
          $inc: {
            quantity: -deduction.quantityUsed,
          },
        }
      );

      if (result.modifiedCount !== 1) {
        throw new Error(
          `Insufficient stock for inventory item ${deduction.inventoryId}.`
        );
      }

      completed.push(deduction);
    }

    for (const deduction of completed) {
      try {
        await checkLowStock(deduction.inventoryId);
      } catch (error) {
        console.error(
          "Low-stock notification error:",
          error.message
        );
      }
    }
  } catch (error) {
    for (const deduction of completed.reverse()) {
      await Inventory.updateOne(
        { _id: deduction.inventoryId },
        {
          $inc: {
            quantity: deduction.quantityUsed,
          },
        }
      );
    }

    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          inventoryDeducted: false,
        },
      }
    );

    throw error;
  }
};

// Mark an order as paid after payment confirmation.
const markPaymentSuccessful = async (tracker, reference = null) => {
  const order = await Order.findOne({
    safepayTracker: tracker,
  });

  if (!order) {
    throw new Error(
      "No order found for this Safepay tracker."
    );
  }

  if (order.paymentStatus === "paid") {
    return order;
  }

  order.paymentStatus = "paid";
  order.paymentReference = reference;

  await order.save();

  await deductInventory(order);

  return order;
};

// Create order and Safepay checkout.
const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    const userId =
      req.user?.userId || req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your order must contain at least one item.",
      });
    }

    const normalizedItems = [];

    for (const item of items) {
      if (
        !item.name ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0
      ) {
        return res.status(400).json({
          message: "Invalid order item.",
        });
      }

      if (
        item.vegetables !== undefined &&
        (
          !Array.isArray(item.vegetables) ||
          !item.vegetables.every(
            (value) => typeof value === "string"
          )
        )
      ) {
        return res.status(400).json({
          message: "Vegetables must be a list of names.",
        });
      }

      normalizedItems.push({
        name: item.name.trim(),
        quantity: Number(item.quantity),
        price: Number(item.price),
        base: item.base?.trim() || "",
        sauce: item.sauce?.trim() || "",
        cheese: item.cheese?.trim() || "",
        vegetables: (item.vegetables || []).map(
          (value) => value.trim()
        ),
      });
    }

    const calculatedTotal = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (
      !Number.isFinite(Number(totalAmount)) ||
      Math.abs(calculatedTotal - Number(totalAmount)) > 0.01 ||
      calculatedTotal <= 0
    ) {
      return res.status(400).json({
        message: "Invalid order total.",
      });
    }

    // Check stock availability without deducting it.
    const stockPlan = await buildStockPlan(normalizedItems);

    const order = await Order.create({
      user: userId,
      items: normalizedItems,
      totalAmount: calculatedTotal,
      paymentStatus: "pending",
      orderStatus: "Order Received",

      inventoryDeduction: stockPlan.map((entry) => ({
        inventoryId: entry.inventoryId,
        quantityUsed: entry.quantityUsed,
      })),

      inventoryDeducted: false,
      stockRestored: false,
    });

    try {
      // Create Safepay payment session.
      const paymentResponse =
        await safepay.payments.session.setup({
          merchant_api_key: process.env.SAFEPAY_API_KEY,
          intent: "CYBERSOURCE",
          mode: "payment",
          entry_mode: "raw",
          currency: "PKR",
          amount: Math.round(calculatedTotal * 100),

          metadata: {
            order_id: String(order._id),
          },

          include_fees: false,
        });

      const tracker =
        paymentResponse?.data?.tracker?.token ||
        paymentResponse?.tracker?.token;

      if (!tracker) {
        throw new Error(
          "Safepay did not return a payment tracker."
        );
      }

      // Create Safepay authentication token.
      const authResponse =
        await safepay.client.passport.create();

      const tbt = authResponse?.data;

      if (!tbt) {
        throw new Error(
          "Safepay authentication token was not generated."
        );
      }

      // Generate Safepay checkout URL.
      const checkoutUrl =
        safepay.checkout.createCheckoutUrl({
          env:
            process.env.SAFEPAY_ENV === "production"
              ? "production"
              : "sandbox",

          tracker,
          tbt,
          source: "hosted",

          redirect_url:
            `${FRONTEND_URL}/payment-return/${order._id}`,

          cancel_url:
            `${FRONTEND_URL}/payment-cancelled/${order._id}`,
        });

      if (!checkoutUrl) {
        throw new Error(
          "Safepay checkout URL was not generated."
        );
      }

      // Debug Safepay redirect URLs.
      const checkoutPage = new URL(checkoutUrl);

      console.log(
        "Safepay return URL:",
        checkoutPage.searchParams.get("redirect_url")
      );

      console.log(
        "Safepay cancel URL:",
        checkoutPage.searchParams.get("cancel_url")
      );

      // Save tracker with the order.
      order.safepayTracker = tracker;
      await order.save();

      return res.status(201).json({
        message: "Order created. Continue to Safepay to pay.",
        orderId: order._id,
        checkoutUrl,
      });
    } catch (error) {
      console.error("Safepay checkout error:", error);

      await Order.deleteOne({
        _id: order._id,
        paymentStatus: "pending",
      });

      return res.status(500).json({
        message: "Unable to create Safepay checkout.",
      });
    }
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      message: error.message || "Unable to create order.",
    });
  }
};

// Verify payment after customer returns from Safepay.
const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { tracker } = req.query;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    const userId =
      req.user?.userId || req.user?._id || req.user?.id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.json({
        message: "Payment successful.",
        order,
      });
    }

    // Remove any extra query string Safepay may append.
    const paymentTracker = (
      tracker || order.safepayTracker || ""
    ).split("?")[0];

    if (
      !paymentTracker ||
      paymentTracker !== order.safepayTracker
    ) {
      return res.status(400).json({
        message: "Payment tracker does not match this order.",
      });
    }

    console.log(
      "Verifying Safepay tracker:",
      paymentTracker
    );

    // Fetch payment status directly from Safepay.
    const response =
      await safepay.reporter.payments.fetch(paymentTracker);

    // Safepay returns state directly inside response.data.
    const paymentData = response?.data;
    const state = paymentData?.state;

    console.log("Safepay payment state:", state);

    // Confirm both successful payment and successful capture.
    const successfulAttempt =
      paymentData?.attempts?.find(
        (attempt) =>
          attempt.is_success === true &&
          attempt.capture
      );

    const isPaymentSuccessful =
      state === "TRACKER_ENDED" &&
      Boolean(successfulAttempt);

    if (isPaymentSuccessful) {
      const paymentReference =
        successfulAttempt.capture.token ||
        paymentData?.charge?.capture?.token ||
        paymentData?.charge?.token ||
        null;

      const updatedOrder =
        await markPaymentSuccessful(
          paymentTracker,
          paymentReference
        );

      return res.status(200).json({
        message: "Payment successful.",
        order: updatedOrder,
      });
    }

    return res.status(202).json({
      message: "Payment is not confirmed yet.",
      paymentState: state || "PENDING",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      message: "Unable to verify payment.",
    });
  }
};

// Safepay webhook handler.
const handleSafepayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-sfpy-signature"];

    if (
      !signature ||
      !req.body ||
      !Buffer.isBuffer(req.body)
    ) {
      return res.status(400).send(
        "Invalid webhook request."
      );
    }

    const event = safepay.webhooks.constructEvent(
      req.body,
      signature,
      process.env.SAFEPAY_WEBHOOK_SECRET
    );

    // Ignore valid events unrelated to order payments.
    if (
      !["payment.succeeded", "payment.failed"].includes(
        event.type
      )
    ) {
      return res.sendStatus(200);
    }

    const tracker = event.data?.tracker;

    if (!tracker) {
      return res.status(400).send(
        "Missing payment tracker."
      );
    }

    if (
      event.type === "payment.succeeded" &&
      event.data.success !== false
    ) {
      await markPaymentSuccessful(tracker);
    }

    if (event.type === "payment.failed") {
      await Order.updateOne(
        {
          safepayTracker: tracker,
          paymentStatus: "pending",
        },
        {
          $set: {
            paymentStatus: "failed",
          },
        }
      );
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "Safepay webhook error:",
      error.message
    );

    return res.status(400).send(
      "Webhook verification or processing failed."
    );
  }
};

// Get orders belonging to the logged-in customer.
const getMyOrders = async (req, res) => {
  try {
    const userId =
      req.user?.userId || req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in first.",
      });
    }

    const orders = await Order.find({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Your orders fetched successfully.",
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      message: "Unable to fetch your orders.",
    });
  }
};

// Admin: Get all customer orders.
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      message: "All orders fetched successfully.",
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      message: "Unable to fetch all orders.",
    });
  }
};

// Admin: Update order status and restore stock when cancelled.
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "Order Received",
      "In Kitchen",
      "Sent to Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (
      order.orderStatus === "Cancelled" &&
      orderStatus !== "Cancelled"
    ) {
      return res.status(400).json({
        message: "A cancelled order cannot be reopened.",
      });
    }

    if (
      orderStatus === "Cancelled" &&
      order.orderStatus !== "Cancelled" &&
      order.inventoryDeducted &&
      !order.stockRestored
    ) {
      for (const deduction of order.inventoryDeduction || []) {
        await Inventory.updateOne(
          {
            _id: deduction.inventoryId,
          },
          {
            $inc: {
              quantity: deduction.quantityUsed,
            },
          }
        );

        try {
          await checkLowStock(deduction.inventoryId);
        } catch (error) {
          console.error(
            "Low-stock notification error:",
            error.message
          );
        }
      }

      order.stockRestored = true;
    }

    order.orderStatus = orderStatus;
    await order.save();

    const io = req.app.get("io");

    if (io) {
      io.to(`user:${String(order.user)}`).emit(
        "orderStatusUpdated",
        {
          orderId: String(order._id),
          orderStatus: order.orderStatus,
          updatedAt: order.updatedAt,
        }
      );
    }

    return res.status(200).json({
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      message: "Unable to update order status.",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleSafepayWebhook,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};
