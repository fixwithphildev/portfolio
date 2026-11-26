# Atabo Philip Isaac — Portfolio

Personal portfolio: full stack development and IT infrastructure.

It's a hand-written static site with no framework and no build step:

```
index.html      the page: semantic HTML
css/styles.css  all styling: modern CSS
js/main.js      optional enhancements (the page works without it)
favicon.svg
vercel.json     Vercel: serve the files as they are
```

## HTML

- **Landmarks:**
  - `header`/`nav` hold the navigation.
  - `main` holds the content, with a "Skip to content" link to it.
  - `footer` closes the page.
- **Headings:** one `h1` (the name). Each section (`section` with `aria-labelledby`) has an `h2`, and items inside it have an `h3`.
- **Elements that match the content:**
  - Lists are real lists: skills in `ul`, projects in `ol` with an `article` each, certifications in `ol`.
  - The stats are a `dl`.
  - The contact details sit in an `address`.
- **Accessible form:**
  - Every field has a visible `label`.
  - Fields use the right input types (`email`) and `autocomplete`, and are `required`.
  - A note is linked with `aria-describedby`.
- **Links:**
  - "View live" links say what they open and that they open a new tab (visually hidden text).
  - Decorative parts (the marquee, the floating tags) are hidden from screen readers with `aria-hidden`.
- **The page head:** a real `<title>`, description and Open Graph tags.

## CSS

- **Structure:**
  - Cascade layers (`@layer reset, base, layout, components, motion`).
  - Custom properties for every colour, font and spacing value.
  - Native CSS nesting.
- **Layout:**
  - Grid and flexbox throughout.
  - `repeat(auto-fit, minmax(min(100%, …), 1fr))` grids that change from two columns to one with no media query.
  - A container query (`@container`) lets each project card lay itself out by its own width.
- **Sizing:**
  - Fluid type and spacing with `clamp()`.
  - Logical properties (`margin-inline`, `padding-block`, `inline-size`).
  - Media query range syntax (`width <= 760px`).
  - `100svh` hero.
- **Colour:**
  - Accent colours tinted with `color-mix()`.
  - Grey text keeps at least 4.5:1 contrast.
  - `color-scheme: dark`.
- **Small modern features:**
  - Individual transform properties (`translate`).
  - `text-wrap: balance`/`pretty`.
  - `:focus-visible` and `:user-invalid`.
  - A `counter()` for the certification numbers.
  - Standard `scrollbar-color`.
- **Accessibility:**
  - `prefers-reduced-motion` turns off animation.
  - The custom cursor only appears with a mouse.

## Running it

Open `index.html` in a browser, or serve the folder with any static server.

## Deploying

Vercel deploys every push to `main`. A pull request gets a preview link first.
