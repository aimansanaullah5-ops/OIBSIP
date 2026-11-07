
const mongoose = require("mongoose");
const Inventory = require("../models/inventory");
const checkLowStock = require("../utils/lowStockNotifier");

const validCategories = ["base", "sauce", "cheese", "vegetable"];

// Get all inventory items
const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({
      category: 1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      inventory,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

// Get inventory items at or below their stock threshold
const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: {
        $lte: ["$quantity", "$threshold"],
      },
    }).sort({
      category: 1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Low-stock items fetched successfully",
      count: lowStockItems.length,
      inventory: lowStockItems,
    });
  } catch (error) {
    console.error("Get low-stock items error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch low-stock items",
    });
  }
};

// Create a new inventory item
const createInventoryItem = async (req, res) => {
  try {
    const {
      category,
      name,
      quantity,
      threshold,
      unit,
      usagePerPizza,
    } = req.body;

    if (!category || !name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category and name are required",
      });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
        validCategories,
      });
    }

    const numericFields = {
      quantity: quantity ?? 0,
      threshold: threshold ?? 5,
      usagePerPizza: usagePerPizza ?? 1,
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid non-negative number`,
        });
      }
    }

    const trimmedName = name.trim();

    const existingItem = await Inventory.findOne({
      category,
      name: trimmedName,
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: "This inventory item already exists in this category",
      });
    }

    const inventoryItem = await Inventory.create({
      category,
      name: trimmedName,
      quantity: numericFields.quantity,
      threshold: numericFields.threshold,
      unit: unit?.trim() || "portions",
      usagePerPizza: numericFields.usagePerPizza,
    });

    // Send an alert if the new item is already low on stock.
    await checkLowStock(inventoryItem._id);

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      inventoryItem,
    });
  } catch (error) {
    console.error("Create inventory item error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This inventory item already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create inventory item",
    });
  }
};

// Update an inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    const inventoryItem = await Inventory.findById(id);

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    const {
      category,
      name,
      quantity,
      threshold,
      unit,
      usagePerPizza,
    } = req.body;

    if (category !== undefined) {
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
          validCategories,
        });
      }

      inventoryItem.category = category;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }

      inventoryItem.name = name.trim();
    }

    const numericUpdates = {
      quantity,
      threshold,
      usagePerPizza,
    };

    for (const [field, value] of Object.entries(numericUpdates)) {
      if (value !== undefined) {
        if (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} must be a valid non-negative number`,
          });
        }

        inventoryItem[field] = value;
      }
    }

    if (unit !== undefined) {
      if (typeof unit !== "string" || !unit.trim()) {
        return res.status(400).json({
          success: false,
          message: "Unit must be a non-empty string",
        });
      }

      inventoryItem.unit = unit.trim();
    }

    await inventoryItem.save();

    // Check whether the updated quantity now requires an alert.
    await checkLowStock(inventoryItem._id);

    return res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      inventoryItem,
    });
  } catch (error) {
    console.error("Update inventory item error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An item with this name and category already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update inventory item",
    });
  }
};

// Delete an inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item ID",
      });
    }

    const inventoryItem = await Inventory.findByIdAndDelete(id);

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Delete inventory item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete inventory item",
    });
  }
};

module.exports = {
  getInventory,
  getLowStockItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};
