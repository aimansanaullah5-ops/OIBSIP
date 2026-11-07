# Task 2: Tribute Page

A tribute page dedicated to Marie Curie, built with HTML and CSS.

## Screenshot
![Tribute page for Marie Curie](screenshot.png)

## Features
- Page title with the subject's name and a one-line tagline
- Prominent portrait image (public domain, from Wikimedia Commons)
- Four-paragraph biography
- Timeline of key achievements, laid out as cards with CSS Grid
- Styled quote block
- Four background colours across the sections (plum, blush, dusty mauve, plum)
- Two fonts: Playfair Display for headings and Inter for body text
- Responsive layout that works on desktop and mobile

## How it works
- The page is split into semantic sections: header, biography, achievements and quote.
- Colours are stored as CSS variables in `:root`, so the whole palette can be changed in one place.
- The timeline uses `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`, so the cards wrap automatically on smaller screens.
- Font sizes use `clamp()` so headings scale with the screen width.

## Resources
- Facts checked against Britannica and Wikipedia and rewritten in my own words
- Portrait: <name from the Wikimedia Commons file page>, Public domain, via Wikimedia Commons
- I used an AI assistant to help draft the page content and structure, then checked the facts and edited the text myself.