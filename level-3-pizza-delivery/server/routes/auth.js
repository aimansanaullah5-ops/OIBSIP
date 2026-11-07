
const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  checkResetToken,
  resendVerificationEmail
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

// Register
router.post("/register", registerUser);

// Verify email
router.get("/verify-email/:token", verifyEmail);

// Resend verification email
router.post("/resend-verification", resendVerificationEmail);

// Login
router.post("/login", loginUser);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Check reset password link
router.get("/reset-password/:token", checkResetToken);

// Reset password
router.post("/reset-password/:token", resetPassword);

// Protected profile
router.get("/profile", protect, (req, res) => {
  res.json({
    message: "You are authorized!",
    user: req.user
  });
});

module.exports = router;

