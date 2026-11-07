const express = require("express");

const {
  loginAdmin,
  getAdminProfile
} = require("../controllers/adminController");

const adminProtect = require("../middleware/adminMiddleware");

const router = express.Router();


// Admin login
router.post("/login", loginAdmin);


// Protected admin profile
router.get("/profile", adminProtect, getAdminProfile);


module.exports = router;