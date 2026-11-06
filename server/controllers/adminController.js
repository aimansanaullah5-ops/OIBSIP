
const jwt = require("jsonwebtoken");

// Admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error("Admin credentials are missing from .env");

      return res.status(500).json({
        message: "Admin login is not configured"
      });
    }

    const emailMatches =
      email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

    const passwordMatches =
      password === process.env.ADMIN_PASSWORD;

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid admin email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        message: "Authentication is not configured"
      });
    }

    const token = jwt.sign(
      { role: "admin", email: process.env.ADMIN_EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// Protected admin profile
const getAdminProfile = (req, res) => {
  return res.status(200).json({
    message: "Admin profile fetched successfully",
    admin: {
      email: req.admin?.email || process.env.ADMIN_EMAIL,
      role: "admin"
    }
  });
};

module.exports = {
  loginAdmin,
  getAdminProfile
};
