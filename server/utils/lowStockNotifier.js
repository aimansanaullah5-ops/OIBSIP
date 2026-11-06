
const Inventory = require("../models/inventory");
const sendEmail = require("./sendEmail");

const notifiedItems = new Set();

const checkLowStock = async (itemId) => {
  try {
    const item = await Inventory.findById(itemId);

    if (!item) return;

    const isLow = item.quantity <= item.threshold;

    // Stock recovered: allow a future low-stock alert.
    if (!isLow) {
      notifiedItems.delete(String(item._id));
      return;
    }

    // Don't send repeated alerts for the same item.
    if (notifiedItems.has(String(item._id))) return;

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.error("Low-stock alert skipped: ADMIN_EMAIL is missing.");
      return;
    }

    await sendEmail(
      adminEmail,
      `Low stock alert: ${item.name}`,
      `
        <h2>Low Stock Alert</h2>
        <p>An inventory item has reached its low-stock threshold.</p>
        <ul>
          <li><strong>Item:</strong> ${item.name}</li>
          <li><strong>Category:</strong> ${item.category}</li>
          <li><strong>Current quantity:</strong> ${item.quantity} ${item.unit}</li>
          <li><strong>Threshold:</strong> ${item.threshold} ${item.unit}</li>
        </ul>
        <p>Please restock this item.</p>
      `
    );

    // Mark notified only after the email sends successfully.
    notifiedItems.add(String(item._id));
    console.log(`Low-stock alert sent for ${item.name}`);
  } catch (error) {
    console.error("Low-stock notification error:", error.message);
  }
};

module.exports = checkLowStock;
