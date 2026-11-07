# Task 1: Calculator

A browser-based calculator built with HTML, CSS and vanilla JavaScript.

## Screenshot
![Calculator](screenshot.png)

## Features
- Number buttons (0-9) and decimal point
- Addition, subtraction, multiplication and division
- Equals, Clear (C) and Backspace (removes digits and operators)
- Division by zero shows an error message instead of crashing
- Operator chaining without a reset
- Button layout built with CSS Grid
- No `eval()`: all logic is written with variables and conditionals

## How it works
- One click listener on the button container reads `data-` attributes to decide the action.
- `calculate()` uses a `switch` statement to apply the operator.
- Operations are evaluated left to right as they are entered, like a basic pocket calculator (5 + 3 × 2 = 16).



## What I learned
While testing, I found two bugs: backspace was not removing the operator, and
the C button stopped working. I fixed both and tested the calculator again.

## Resources
- MDN: addEventListener, switch, parseFloat
- I used an AI assistant to help me understand the chaining logic, and I tested and debugged the code myself.