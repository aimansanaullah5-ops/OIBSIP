const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Inventory = require("../models/Inventory");

dotenv.config();

const inventoryData = [
  // Bases
  {
    category: "base",
    name: "Thin Crust",
    quantity: 50,
    threshold: 10
  },
  {
    category: "base",
    name: "Classic Crust",
    quantity: 50,
    threshold: 10
  },
  {
    category: "base",
    name: "Cheese Burst",
    quantity: 40,
    threshold: 10
  },
  {
    category: "base",
    name: "Whole Wheat",
    quantity: 40,
    threshold: 10
  },
  {
    category: "base",
    name: "Pan Crust",
    quantity: 40,
    threshold: 10
  },

  // Sauces
  {
    category: "sauce",
    name: "Tomato Sauce",
    quantity: 50,
    threshold: 10
  },
  {
    category: "sauce",
    name: "BBQ Sauce",
    quantity: 40,
    threshold: 10
  },
  {
    category: "sauce",
    name: "Spicy Sauce",
    quantity: 40,
    threshold: 10
  },
  {
    category: "sauce",
    name: "Garlic Sauce",
    quantity: 40,
    threshold: 10
  },
  {
    category: "sauce",
    name: "Creamy Sauce",
    quantity: 40,
    threshold: 10
  },

  // Cheese
  {
    category: "cheese",
    name: "Mozzarella",
    quantity: 50,
    threshold: 10
  },
  {
    category: "cheese",
    name: "Cheddar",
    quantity: 40,
    threshold: 10
  },
  {
    category: "cheese",
    name: "Parmesan",
    quantity: 30,
    threshold: 10
  },

  // Vegetables
  {
    category: "vegetable",
    name: "Onion",
    quantity: 50,
    threshold: 10
  },
  {
    category: "vegetable",
    name: "Capsicum",
    quantity: 50,
    threshold: 10
  },
  {
    category: "vegetable",
    name: "Tomato",
    quantity: 50,
    threshold: 10
  },
  {
    category: "vegetable",
    name: "Olives",
    quantity: 40,
    threshold: 10
  },
  {
    category: "vegetable",
    name: "Mushrooms",
    quantity: 40,
    threshold: 10
  },
  {
    category: "vegetable",
    name: "Jalapeno",
    quantity: 40,
    threshold: 10
  }
];

const seedInventory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    for (const item of inventoryData) {
      const existingItem = await Inventory.findOne({
        category: item.category,
        name: item.name
      });

      if (existingItem) {
        console.log(
          `Already exists: ${item.category} - ${item.name}`
        );
        continue;
      }

      await Inventory.create(item);

      console.log(
        `Created: ${item.category} - ${item.name}`
      );
    }

    console.log("Inventory seeding completed");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Inventory seed error:", error);
    process.exit(1);
  }
};

seedInventory();