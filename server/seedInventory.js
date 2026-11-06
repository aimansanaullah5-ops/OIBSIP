
require("dotenv").config();
const mongoose = require("mongoose");
const Inventory = require("./models/Inventory");

const starterItems = [
  { name: "Classic Hand Tossed", category: "base", quantity: 100 },
  { name: "Thin Crust", category: "base", quantity: 100 },
  { name: "Cheese Burst", category: "base", quantity: 100 },
  { name: "Whole Wheat", category: "base", quantity: 100 },
  { name: "Stuffed Crust", category: "base", quantity: 100 },

  { name: "Classic Tomato", category: "sauce", quantity: 100 },
  { name: "Spicy Sauce", category: "sauce", quantity: 100 },
  { name: "BBQ Sauce", category: "sauce", quantity: 100 },
  { name: "Garlic Sauce", category: "sauce", quantity: 100 },
  { name: "Pesto Sauce", category: "sauce", quantity: 100 },

  { name: "Mozzarella", category: "cheese", quantity: 100 },
  { name: "Cheddar", category: "cheese", quantity: 100 },
  { name: "Parmesan", category: "cheese", quantity: 100 },
  { name: "Feta", category: "cheese", quantity: 100 },

  { name: "Tomato", category: "vegetable", quantity: 100 },
  { name: "Onion", category: "vegetable", quantity: 100 },
  { name: "Capsicum", category: "vegetable", quantity: 100 },
  { name: "Olives", category: "vegetable", quantity: 100 },
  { name: "Mushrooms", category: "vegetable", quantity: 100 },
  { name: "Jalapeños", category: "vegetable", quantity: 100 },
];

async function seedInventory() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    for (const item of starterItems) {
      await Inventory.updateOne(
        { category: item.category, name: item.name },
        {
          $setOnInsert: {
            ...item,
            threshold: 20,
          },
        },
        { upsert: true }
      );
    }

    console.log("Starter inventory added successfully.");
  } catch (error) {
    console.error("Inventory seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedInventory();
