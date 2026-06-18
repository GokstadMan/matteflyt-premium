## Goal
Add a discrete (small, unobtrusive) dark-mode option that matches MatteFlyt's brand — deep navy base with mint accents — instead of the generic gray shadcn defaults currently sitting in `.dark`.

## What gets built

### 1. Theme provider + toggle hook
- New `src/components/theme-provider.tsx`: tiny client-only provider that reads `localStorage("matteflyt-theme")` (values: `light` | `dark` | `system`), applies `class="dark"` to `<html>`, and listens for OS theme changes when `system` is selected. Defaults to `system`.
- Inline pre-hydration script in `src/routes/__root.tsx` `<head>` so the correct class is set before first paint — prevents the light-mode flash on refresh.

### 2. Discrete toggle button
- New `src/components/theme-toggle.tsx`: a small 36px icon button (sun/moon from `lucide-react`) with a 3-option dropdown (Light / Dark / System). Ghost variant, sits quietly in the nav.
- Mounted in the landing nav (`src/routes/index.tsx`) and the authenticated app header so it's available everywhere.

### 3. Brand-matched dark palette (in `src/styles.css`)
Replace the generic gray `.dark` block with tokens that extend the existing MatteFlyt palette:
- `--background`: very deep navy (`oklch(0.16 0.04 258)`) — derived from `--mf-navy-deep`
- `--foreground`: soft mint-tinted white
- `--card` / `--popover`: one step lighter navy with subtle mint tint
- `--primary`: mint (inverted role — mint pops on dark) with navy `--primary-foreground`
- `--accent`: mint-500 retained
- `--border` / `--input`: low-opacity mint
- Dark variants of `--gradient-hero`, `--gradient-premium`, `--shadow-*`

### 4. Dark-aware utilities
The current `glass-card` and `glass-nav` hardcode light colors. Add `.dark` overrides so they render as smoked navy glass instead of washed-out white in dark mode. `gradient-text` gets a dark variant that uses mint→cyan so it stays legible.

### 5. Verification
- View preview at desktop + mobile in both themes.
- Spot-check: landing hero, pricing cards, dashboard, quiz, leaderboard, auth page — confirm no hardcoded `bg-white`/`text-black` slipped in (quick rg sweep).

## Out of scope
- No per-user theme preference stored in the database (localStorage only).
- No new color scales beyond what's needed for the dark mapping.
- No redesign of components — only token swaps.

## Files touched
- `src/styles.css` — rewrite `.dark` block, add dark variants for glass/gradient utilities
- `src/routes/__root.tsx` — add pre-hydration theme script
- `src/components/theme-provider.tsx` — new
- `src/components/theme-toggle.tsx` — new
- `src/routes/index.tsx` — mount toggle in nav
- Authenticated header (wherever the dashboard nav lives) — mount toggle
