// ---------- DOM ----------
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const pendingList = document.getElementById("pending-list");
const completedList = document.getElementById("completed-list");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");

// ---------- STATE ----------
let tasks = loadTasks();   // [{ id, text, completed, createdAt, completedAt }]
let editingId = null;      // id of the task being edited, or null

// ---------- STORAGE (localStorage) ----------
function loadTasks() {
  try {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  } catch (error) {
    // storage not available: the app still works, it just won't remember
  }
}

// ---------- ACTIONS ----------
function addTask(text) {
  tasks.push({
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: Date.now(),
    completedAt: null
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  task.completedAt = task.completed ? Date.now() : null;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  if (editingId === id) editingId = null;
  saveTasks();
  render();
}

function startEdit(id) {
  editingId = id;
  render();
}

function saveEdit(id, newText) {
  const text = newText.trim();
  if (text === "") return;          // don't allow an empty task
  const task = tasks.find((t) => t.id === id);
  if (task) task.text = text;
  editingId = null;
  saveTasks();
  render();
}

// ---------- RENDER ----------
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function createTaskItem(task) {
  const li = document.createElement("li");
  li.className = "task";
  li.dataset.id = task.id;

  const body = document.createElement("div");
  body.className = "task-body";

  if (editingId === task.id) {
    const field = document.createElement("input");
    field.type = "text";
    field.className = "edit-input";
    field.value = task.text;
    body.appendChild(field);
  } else {
    const text = document.createElement("span");
    text.className = task.completed ? "task-text done" : "task-text";
    text.textContent = task.text;   // textContent, never innerHTML, so user text can't inject HTML
    body.appendChild(text);
  }

  const time = document.createElement("small");
  time.className = "time";
  time.textContent = task.completed
    ? `Added ${formatTime(task.createdAt)} · Completed ${formatTime(task.completedAt)}`
    : `Added ${formatTime(task.createdAt)}`;
  body.appendChild(time);

  const actions = document.createElement("div");
  actions.className = "actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "toggle-btn";
  toggleBtn.textContent = task.completed ? "Undo" : "Mark Complete";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "edit-btn";
  editBtn.textContent = editingId === task.id ? "Save" : "Edit";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";

  actions.append(toggleBtn, editBtn, deleteBtn);
  li.append(body, actions);
  return li;
}

function renderList(listEl, items, emptyMessage) {
  listEl.innerHTML = "";
  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = emptyMessage;
    listEl.appendChild(li);
    return;
  }
  items.forEach((task) => listEl.appendChild(createTaskItem(task)));
}

function render() {
  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  pendingCount.textContent = `${pending.length} pending`;
  completedCount.textContent = `${completed.length} completed`;

  renderList(pendingList, pending, "No pending tasks. Add one above!");
  renderList(completedList, completed, "Nothing completed yet. You've got this!");

  // put the cursor in the edit box when editing
  if (editingId !== null) {
    const field = document.querySelector(".edit-input");
    if (field) {
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    }
  }
}

// ---------- EVENTS ----------
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (text === "") return;
  addTask(text);
  input.value = "";
  input.focus();
});

function handleListClick(event) {
  const item = event.target.closest(".task");
  if (!item) return;
  const id = Number(item.dataset.id);

  if (event.target.classList.contains("toggle-btn")) {
    toggleTask(id);
  } else if (event.target.classList.contains("delete-btn")) {
    deleteTask(id);
  } else if (event.target.classList.contains("edit-btn")) {
    if (editingId === id) {
      saveEdit(id, item.querySelector(".edit-input").value);
    } else {
      startEdit(id);
    }
  }
}

function handleListKeydown(event) {
  if (!event.target.classList.contains("edit-input")) return;
  const id = Number(event.target.closest(".task").dataset.id);
  if (event.key === "Enter") saveEdit(id, event.target.value);
  if (event.key === "Escape") { editingId = null; render(); }
}

[pendingList, completedList].forEach((list) => {
  list.addEventListener("click", handleListClick);
  list.addEventListener("keydown", handleListKeydown);
});

// ---------- START ----------
render();