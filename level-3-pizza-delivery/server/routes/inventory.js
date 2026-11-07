const express = require("express");

const {
  getInventory,
  getLowStockItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require("../controllers/inventoryController");

const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// All inventory routes require admin
router.use(adminMiddleware);

// Get all inventory
router.get("/", getInventory);

// Get low-stock inventory
router.get("/low-stock", getLowStockItems);

// Create inventory item
router.post("/", createInventoryItem);

// Update inventory item
router.put("/:id", updateInventoryItem);

// Delete inventory item
router.delete("/:id", deleteInventoryItem);

module.exports = router;