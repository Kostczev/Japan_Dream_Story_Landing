# Japan Dream Story Landing

Interactive storytelling landing page featuring a custom horizontal scroll section and validated form flow. Built without frameworks to demonstrate scroll architecture, layout control, and modular JavaScript structure.

---

## Stack

- HTML5
- CSS (Flex / Grid / Animations)
- Vanilla JavaScript (ES6 Modules)
- No external libraries

---

## Features

- Custom horizontal scroll section (sticky + transform-based progress mapping)
- Resize-aware layout recalculation (debounced)
- Client-side form validation (no page reload)
- Modular class-based JS architecture
- Fully responsive layout

---

## Architecture Notes

The horizontal scroll behavior is implemented via a sticky container and transform-driven progress mapping.  
Scroll distance is calculated based on track width and viewport size.

All components are structured as independent modules to allow reuse and lifecycle control.

---

## Live Demo

https://kostczev.github.io/Japan_Dream_Story_Landing/