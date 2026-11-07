
const express = require("express");

const {
  getAllPizzas,
  getPizzaById,
  createPizza,
  updatePizza,
  deletePizza
} = require("../controllers/pizzaController");

const adminProtect = require("../middleware/adminMiddleware");
const uploadPizzaImage = require("../middleware/uploadPizzaImage");

const router = express.Router();

// Customers can view the menu.
router.get("/", getAllPizzas);
router.get("/:id", getPizzaById);

// Only authenticated admins can manage pizzas.
router.post(
  "/",
  adminProtect,
  uploadPizzaImage.single("image"),
  createPizza
);

router.put(
  "/:id",
  adminProtect,
  uploadPizzaImage.single("image"),
  updatePizza
);

router.delete("/:id", adminProtect, deletePizza);

module.exports = router;
