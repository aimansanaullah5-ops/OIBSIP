const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Please login."
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("Authorization header format:", authHeader.split(" ")[0]);
console.log("Token parts received:", token ? token.split(".").length : 0);
console.log("Token length:", token ? token.length : 0);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  }catch (error) {
    console.error("JWT verification failed:", error.name, error.message);

    return res.status(401).json({
      message: "Invalid or expired token"
    });
  } 
};

module.exports = protect;