const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "users.json");

// ---------- tiny JSON "database" ----------
function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// ---------- middleware ----------
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 } // 1 hour
  })
);
app.use(express.static(path.join(__dirname, "public")));

// Protects page routes: no session means back to the login page
function requireLogin(req, res, next) {
  if (!req.session.userEmail) {
    return res.redirect("/login.html");
  }
  next();
}

// ---------- API ----------
app.post("/api/register", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (password.length < 8 || !/\d/.test(password)) {
    return res.status(400).json({
      error: "Password must be at least 8 characters and contain at least 1 number."
    });
  }

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ id: Date.now(), email, passwordHash, createdAt: new Date().toISOString() });
  writeUsers(users);

  res.status(201).json({ message: "Registration successful. You can now log in." });
});

app.post("/api/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = readUsers().find((u) => u.email === email);
  const valid = user && (await bcrypt.compare(password, user.passwordHash));

  // Same message for a wrong email and a wrong password, so we never reveal which one failed
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  req.session.userEmail = user.email;
  res.json({ message: "Login successful." });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out." });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.session.userEmail) {
    return res.status(401).json({ error: "Not logged in." });
  }
  res.json({ email: req.session.userEmail });
});

// ---------- pages ----------
// dashboard.html lives in /views (not /public) so it can only be reached through this protected route
app.get("/dashboard", requireLogin, (req, res) => {
  res.set("Cache-Control", "no-store");   // stops the Back button from showing it after logout
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/", (req, res) => res.redirect("/login.html"));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});