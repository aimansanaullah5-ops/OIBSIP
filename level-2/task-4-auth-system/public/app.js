// ---------- helpers ----------
async function postJSON(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return { ok: response.ok, result };
  } catch (error) {
    return { ok: false, result: { error: "Could not reach the server." } };
  }
}

function showMessage(text, type) {
  const message = document.getElementById("message");
  message.textContent = text;
  message.className = `message ${type}`;
}

// ---------- REGISTER ----------
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = registerForm.email.value.trim();
    const password = registerForm.password.value;

    if (!email || !password) {
      showMessage("Please fill in all fields.", "error");
      return;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      showMessage("Password must be at least 8 characters and contain at least 1 number.", "error");
      return;
    }

    const { ok, result } = await postJSON("/api/register", { email, password });
    if (ok) {
      showMessage(result.message, "success");
      registerForm.reset();
      setTimeout(() => { window.location.href = "/login.html"; }, 1500);
    } else {
      showMessage(result.error || "Something went wrong.", "error");
    }
  });
}

// ---------- LOGIN ----------
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
      showMessage("Please fill in all fields.", "error");
      return;
    }

    const { ok, result } = await postJSON("/api/login", { email, password });
    if (ok) {
      window.location.href = "/dashboard";
    } else {
      showMessage(result.error || "Something went wrong.", "error");
    }
  });
}

// ---------- DASHBOARD ----------
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  const welcome = document.getElementById("welcome");

  fetch("/api/me")
    .then((response) => response.json())
    .then((data) => {
      if (data.email) welcome.textContent = `Welcome, ${data.email}`;
    })
    .catch(() => {});

  logoutBtn.addEventListener("click", async () => {
    await postJSON("/api/logout", {});
    window.location.href = "/login.html";
  });
}