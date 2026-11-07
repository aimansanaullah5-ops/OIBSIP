const Inventory = require("../models/Inventory");

const deductInventoryForPizza = async (pizza) => {
  const quantity = pizza.quantity || 1;

  const requiredItems = [
    {
      category: "base",
      name: pizza.base.name,
      quantity
    },
    {
      category: "sauce",
      name: pizza.sauce.name,
      quantity
    },
    {
      category: "cheese",
      name: pizza.cheese.name,
      quantity
    }
  ];

  // Add vegetables
  if (pizza.vegetables && pizza.vegetables.length > 0) {
    pizza.vegetables.forEach((vegetable) => {
      requiredItems.push({
        category: "vegetable",
        name: vegetable.name,
        quantity
      });
    });
  }

  // Check stock first
  for (const item of requiredItems) {
    const inventoryItem = await Inventory.findOne({
      category: item.category,
      name: item.name
    });

    if (!inventoryItem) {
      throw new Error(
        `Inventory item not found: ${item.name}`
      );
    }

    if (inventoryItem.quantity < item.quantity) {
      throw new Error(
        `Not enough stock for ${item.name}`
      );
    }
  }

  // Deduct stock
  for (const item of requiredItems) {
    await Inventory.findOneAndUpdate(
      {
        category: item.category,
        name: item.name,
        quantity: { $gte: item.quantity }
      },
      {
        $inc: {
          quantity: -item.quantity
        }
      },
      {
        returnDocument: "after"
      }
    );
  }

  return true;
};

module.exports = {
  deductInventoryForPizza
};