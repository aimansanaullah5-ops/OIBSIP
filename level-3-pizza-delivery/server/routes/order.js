
const express = require("express");
const router = express.Router();

const {
  createOrder,
  verifyPayment,
  handleSafepayWebhook,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const adminProtect = require("../middleware/adminMiddleware");

// Create an order and start Safepay checkout.
router.post("/", authMiddleware, createOrder);

// Verify payment after the customer returns from Safepay.
router.get(
  "/verify-payment/:orderId",
  authMiddleware,
  verifyPayment
);

// Receive Safepay payment notifications.
router.post("/safepay-webhook", handleSafepayWebhook);

// Customer order history.
router.get("/my-orders", authMiddleware, getMyOrders);

// Admin order management.
router.get("/admin/all", adminProtect, getAllOrders);
router.patch("/admin/:id/status", adminProtect, updateOrderStatus);

module.exports = router;
