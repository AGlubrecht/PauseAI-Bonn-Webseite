# Design Dependencies Overview

This document maps the interconnected spacing relationships in the layout system. Changing one value often requires updating others. The **logo square size (42px)** is the anchor measurement from which many other values derive.

## Nav Height

| Breakpoint | Formula | Result |
|---|---|---|
| Desktop (>768px) | `var(--nav-height)` | 62px |
| Mobile (≤768px) | `calc(42px + 2 * var(--spacing-sm))` | 74px |

The mobile nav is taller to give the 42px logo equal padding (`--spacing-sm` = 16px) on all four sides.

**Defined in:** `components.css` — `.nav` and mobile `.nav` override

## Nav Inner Padding (mobile)

```
padding: 0 calc(var(--spacing-sm) + 12px) 0 var(--spacing-sm)
```

- **Left:** `var(--spacing-sm)` (16px) — matches logo's desired side padding
- **Right:** `calc(var(--spacing-sm) + 12px)` (28px) — matches the vertical whitespace above the 18px-tall hamburger toggle: `(74 - 18) / 2 = 28px`

**Defined in:** `components.css` — mobile `.nav__inner`

## Brand (Logo + Text) Gap

| Breakpoint | Value | Rationale |
|---|---|---|
| Desktop | `0.625rem` (10px) | Matches `(nav-height - logo) / 2 = (62 - 42) / 2` |
| Mobile | `var(--spacing-sm)` (16px) | Matches left padding of logo |

**Defined in:** `components.css` — `.nav__brand` and mobile `.nav__brand` override

## Desktop Content Alignment

On desktop, content is left-aligned to the logo text (not the logo square). This is achieved by:

```
.container        → padding-left: calc(42px + 2 * 0.625rem)  /* logo + 2 gaps */
.nav__inner       → padding-left: calc(42px + 2 * 0.625rem)  /* same */
.nav__brand       → margin-left: calc(-42px - 0.625rem)       /* pulls logo into padding */
```

On mobile, all of these collapse to `padding: 0 var(--spacing-sm)` with `margin-left: 0`.

**Defined in:** `layout.css` — `.container`; `components.css` — `.nav__inner`, `.nav__brand`

## Mobile Menu Overlay Padding

```
padding: var(--spacing-sm) calc(var(--spacing-sm) + 42px + var(--spacing-sm)) var(--spacing-lg)
```

The left/right padding is `var(--spacing-sm) + 42px + var(--spacing-sm)` = 16 + 42 + 16 = 74px. This aligns the menu link text with the brand text by offsetting past the logo square + its surrounding gaps.

**Defined in:** `components.css` — mobile `.nav__menu--open`

## Footer Height

Footer height mirrors nav height at each breakpoint:

| Breakpoint | Value |
|---|---|
| Desktop | `var(--nav-height)` (62px) |
| Mobile | `calc(42px + 2 * var(--spacing-sm))` (74px) |

**Defined in:** `components.css` — `.footer` and mobile `.footer` override

## Content Top Offset (fixed nav clearance)

Pages must add top padding to clear the fixed nav. Each page type handles this:

| Page type | Desktop padding-top | Mobile (≤768px) | Small mobile (≤480px) |
|---|---|---|---|
| **Hero** (index) | `calc(var(--nav-height) + var(--spacing-xxl))` | Same (uses `--nav-height`) | Same |
| **Legal pages** | `calc(var(--nav-height) + var(--spacing-xxl))` | `calc(42px + 2*var(--spacing-sm) + var(--spacing-xl))` | `calc(42px + 2*var(--spacing-sm) + var(--spacing-lg))` |
| **Regular sections** | `var(--spacing-xxl)` (no nav offset) | `var(--spacing-xl)` | `var(--spacing-lg)` |

**Note:** The hero uses `--nav-height` directly (doesn't account for taller mobile nav), but this works because the hero has generous padding. Legal pages use the explicit mobile formula because their spacing is tighter.

**Defined in:** `components.css` — `.hero`, `.legal-page`, and their media queries; `layout.css` — `.section`

## Events Section Title Alignment

```
Desktop: padding-left: calc(42px + 2 * 0.625rem)  /* aligns with container */
Mobile:  padding-left: var(--spacing-sm)            /* matches mobile container */
```

**Defined in:** `components.css` — `.section--events .section__title`

## Dependency Chain

```
Logo size (42px)
├── Nav height: desktop = --nav-height (62px), mobile = 42 + 2 * --spacing-sm (74px)
│   ├── Footer height (mirrors nav)
│   ├── Hero padding-top (nav-height + spacing)
│   ├── Legal page padding-top (nav-height + spacing, with mobile formula)
│   └── Toggle right padding: (nav-height - toggle-height) / 2
├── Brand gap: desktop = 0.625rem, mobile = --spacing-sm
├── Container padding-left: 42 + 2 * gap (desktop only)
├── Nav__inner padding-left: 42 + 2 * gap (desktop only)
├── Nav__brand margin-left: -(42 + gap) (desktop only)
└── Menu overlay padding: --spacing-sm + 42 + --spacing-sm
```
