# Accessibility Guidelines

## Semantic HTML

- **Structural Landmarks:** Use `<header>`, `<main>`, `<aside>`, and `<footer>` to define page regions.
- **Content Grouping:**
  - `<article>` for each event card, using `aria-labelledby` to link the card to its specific heading ID.
  - `<ul>` / `<li>` for the events list so screen readers announce the total item count.
- **Dates & Times:**
  - `<time datetime="2026-02-04">` for machine readability.
  - For time zones: `<abbr title="Pacific Time">PT</abbr>` works, or for better support: `PT<span class="visually-hidden"> (Pacific Time)</span>`.
- **Heading Hierarchy:** Maintain a strict nested order (`h1` → `h2` → `h3`) without skipping levels to preserve the document outline.

## Skip Navigation

- **Implementation:** A "Skip to events" link as the first element in the `<body>`.
- **Behavior:** Hidden by default, becomes visible on `:focus`.
- **Target:** Point to the `<main>` or event container ID. If the target is not an interactive element, add `tabindex="-1"` to it to ensure focus moves correctly in all browsers.

## ARIA & Dynamic States

- **Live Regions:**
  - `role="status"` on the loading spinner (implies `aria-live="polite"`, so don't add both).
  - `aria-live="polite"` on the events container to announce when the list updates or filters are applied.
- **Loading States:** Toggle `aria-busy="true"` on the container while data is fetching.
- **Contextual Labels:** Use `aria-label` on Zoom/Action buttons to provide full context (e.g., "Join Community Conversation on Wednesday, Feb 4 via Zoom").
- **Decorative Elements:** Use `aria-hidden="true"` on SVGs or icons that are purely visual to hide them from the accessibility tree.

## Screen Reader Support

- **Visually Hidden Class:** Use a `.visually-hidden` CSS class for screen-reader-only text (e.g., "opens in new tab" warnings or expanded date formats).
- **Metadata:** Ensure a unique, descriptive `<title>` for every page view and a clear `<meta name="description">`.

## Keyboard & Motion

- **Focus Visibility:** Never use `outline: none`. Ensure focus indicators are high-contrast and easy to spot.
- **Reduced Motion:** Wrap animations (like loading spinners) in a media query:

```css
@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}
```

- **Focus Trapping:** If using modals, ensure the Tab key stays within the modal until it is closed.

## Visual & Touch Design

- **Contrast Ratio:**
  - 4.5:1 for standard text.
  - 3:1 for large text (18pt+) and essential UI component state changes (focus, hover, borders, icons).
- **Touch Targets:**
  - Minimum: 24x24 CSS pixels (WCAG 2.2 Level AA).
  - Recommended: 44x44 CSS pixels for optimal usability (WCAG AAA/Apple/Google standard).