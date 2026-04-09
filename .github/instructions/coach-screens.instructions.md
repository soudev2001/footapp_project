---
applyTo: "mobile/app/coach/**"
description: "FIFA-style UI conventions for all FootApp coach screens. Applied automatically to lineup, tactics, convocation, dashboard, match-center, roster, attendance, scouting, and all coach sub-screens."
---

# Coach Screen Conventions — FIFA Style

## Theme

Always import from `../../constants/theme`:
```ts
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
```
Never hardcode colors except the position palette below.

## Position Color Palette

```
GK: #F57C00 | LB/CB/RB/LWB/RWB: #1565C0
CDM/CM: #2E7D32 | CAM: #7B1FA2
LM/RM: #00838F | LW/RW/ST: #C62828
```

## Visual Rules

- Dark backgrounds for pitch views: `#1a1a2e`
- Cards: `Colors.white` with `elevation: 2`, `borderRadius: BorderRadius.lg`
- Active states: `Colors.primary` fill with white text
- Badges: gold `#FFD700` for captain, `Colors.accent` for set-pieces
- Section headers: icon + bold title + optional count badge in a row
- Dropdowns: card with icon + title + subtitle + chevron → Modal FlatList
- Stat bars: proportional colored segments (green/orange/red)
- All UI labels in **French**

## Data Sync

- Screens loading coach data must use `Promise.all()` for parallel fetches
- Lineup data should be pre-loaded in convocation to auto-select players
- Tactics should be available as shortcuts in lineup's formation picker
- Dashboard quick-access cards must link to all coach screens

## Drag & Drop

Use native Responder system only (`onStartShouldSetResponder`, `onResponderMove`, `onResponderRelease`). Do NOT add `react-native-gesture-handler` or `react-native-reanimated`.

## TypeScript

- Annotate callback params in `.filter()` / `.map()` with `(p: any)` to satisfy strict mode
- Always handle API errors with `.catch()` fallbacks and `Alert.alert()`
- Use `toId()` helper to normalize MongoDB `_id` / `$oid` formats

## Service Layer

All API calls go through `../../services/coach.ts`. Backend routes are under `/coach/*` in `app/routes/api.py`.
