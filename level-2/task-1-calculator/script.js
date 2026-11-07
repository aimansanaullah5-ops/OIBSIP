// ---------- DOM ----------
const currentEl = document.getElementById("current");
const expressionEl = document.getElementById("expression");
const buttonsEl = document.querySelector(".buttons");

// ---------- STATE ----------
let currentInput = "0";      // number shown on screen
let firstNumber = null;      // number saved before an operator
let operator = null;         // "+", "-", "*", "/" waiting to be used
let startNewNumber = false;  // true after pressing an operator or =
let hasError = false;

const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };

// ---------- THE MATH (replaces your 4 handlers) ----------
function calculate(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/":
      if (b === 0) return null;   // null = division by zero
      return a / b;
  }
}

function roundResult(value) {
  return parseFloat(value.toFixed(10));   // fixes 0.1 + 0.2
}

// ---------- BUTTON ACTIONS ----------
function appendNumber(num) {
  if (startNewNumber || currentInput === "0") {
    currentInput = num;
    startNewNumber = false;
  } else {
    currentInput += num;
  }
}

function appendDecimal() {
  if (startNewNumber) {
    currentInput = "0.";
    startNewNumber = false;
    return;
  }
  if (!currentInput.includes(".")) {
    currentInput += ".";
  }
}

function chooseOperator(op) {
  if (operator === null) {
    firstNumber = parseFloat(currentInput);
  } else if (!startNewNumber) {
    // an operator is already waiting: finish it first (this is chaining)
    const result = calculate(firstNumber, parseFloat(currentInput), operator);
    if (result === null) { showError(); return; }
    firstNumber = roundResult(result);
    currentInput = String(firstNumber);
  }
  operator = op;
  startNewNumber = true;
}

function equals() {
  if (operator === null || startNewNumber) return;   // nothing to calculate
  const result = calculate(firstNumber, parseFloat(currentInput), operator);
  if (result === null) { showError(); return; }
  currentInput = String(roundResult(result));
  firstNumber = null;
  operator = null;
  startNewNumber = true;
}

function backspace() {
  // Case 1: an operator was just pressed ("5 +") -> remove the operator
  if (startNewNumber && operator !== null) {
    currentInput = String(firstNumber);
    firstNumber = null;
    operator = null;
    startNewNumber = false;
    return;
  }

  // Case 2: a finished result is on screen -> leave it alone
  if (startNewNumber) return;

  // Case 3: remove the last digit
  currentInput = currentInput.slice(0, -1);

  if (currentInput === "" || currentInput === "-") {
    if (operator !== null) {
      // nothing left of the second number -> go back to "5 +"
      currentInput = String(firstNumber);
      startNewNumber = true;
    } else {
      currentInput = "0";
    }
  }
}


function clearAll() {
  currentInput = "0";
  firstNumber = null;
  operator = null;
  startNewNumber = false;
  hasError = false;
}

function showError() {
  clearAll();
  currentInput = "Cannot divide by 0";
  hasError = true;
}

// ---------- DISPLAY ----------
function updateDisplay() {
  currentEl.textContent = currentInput;
  expressionEl.textContent =
    operator !== null ? `${firstNumber} ${symbols[operator]}` : "";
}

// ---------- ONE LISTENER FOR ALL BUTTONS ----------
buttonsEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;

  if (hasError) clearAll();   // any button after an error starts fresh

  if (btn.dataset.number !== undefined) {
    appendNumber(btn.dataset.number);
  } else if (btn.dataset.operator) {
    chooseOperator(btn.dataset.operator);
  } else if (btn.dataset.action === "decimal") {
    appendDecimal();
  } else if (btn.dataset.action === "equals") {
    equals();
  } else if (btn.dataset.action === "backspace") {
    backspace();
  } else if (btn.dataset.action === "clear") {
    clearAll();
  }
  updateDisplay();
});