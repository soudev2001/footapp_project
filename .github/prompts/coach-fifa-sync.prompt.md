---
description: "Enhance or create FootApp coach screens (lineup, tactics, convocation, events) with FIFA-style UI, full data synchronization, and email notifications. Use when: coach screen, FIFA style, sync tactics, convocation lineup, send email notification, enhance composition."
agent: "agent"
argument-hint: "Describe the coach feature or screen to enhance (e.g., 'add email notification after convocation', 'sync tactics with lineup screen')"
---

# FootApp Coach Screen — FIFA-Style Enhancement

You are enhancing the **FootApp** mobile coach module. Every screen must feel like a **FIFA Ultimate Team** interface: dark gradients, colored position badges, sleek cards, smooth interactions.

## Architecture

- **Backend**: Flask + MongoDB (local Docker `mongo:7`, no auth, port 27017, db `FootClubApp`)
- **Mobile**: Expo 55 / React Native 0.83 / TypeScript 5.9 / Expo Router
- **Drag & Drop**: Native `onStartShouldSetResponder` / `onResponderMove` (NO gesture-handler/reanimated)
- **Theme**: Import from `../../constants/theme` → `Colors`, `Spacing`, `FontSizes`, `BorderRadius`
- **Services**: `../../services/coach` → all API calls (`getTactics`, `getLineup`, `saveLineup`, `getRoster`, `sendConvocation`, etc.)
- **Backend routes**: `app/routes/api.py` under `/coach/*`
- **Backend services**: `app/services/player_service.py`, `app/services/event_service.py`, `app/services/email_service.py`

## Data Synchronization Rules

All coach screens MUST share and sync data:

1. **Tactics ↔ Lineup**: Selecting a tactic auto-applies its `formation`. Lineup's formation picker shows saved tactics as shortcuts.
2. **Lineup ↔ Convocation**: Convocation auto-loads saved lineup (starters + subs) as pre-selected players on mount. A tactic chip in the counter bar shows the active system.
3. **Convocation ↔ Events**: Dropdown picker for upcoming events/matches. Match events show opponent + DOM/EXT badge.
4. **Convocation → Email**: After `sendConvocation()`, trigger email notification to selected players with event details, formation, and tactic name.
5. **Tactics ↔ Dashboard**: Coach dashboard quick-access cards link to lineup/tactics. Season stats reflect tactic usage.

## FIFA-Style UI Guidelines

### Color Coding by Position
```
GK: #F57C00 (orange)    | LB/CB/RB/LWB/RWB: #1565C0 (blue)
CDM/CM: #2E7D32 (green) | CAM: #7B1FA2 (purple)
LM/RM: #00838F (cyan)   | LW/RW/ST: #C62828 (red)
```

### Design Patterns
- **Dark pitch background**: `#1a1a2e` for lineup/tactics pitch views
- **Glassmorphism cards**: `rgba(255,255,255,0.1)` backgrounds with subtle borders
- **Gold captain badge**: `#FFD700` circle with "C"
- **Set-piece badges**: Blue chips (P, FK, CK) below player dots
- **Gradient section headers**: Icons + title + count badge
- **Elevation = hierarchy**: dragging players get `elevation: 12`, cards get `elevation: 2`
- **Formation chips**: Rounded pills with active state = `Colors.primary` fill
- **W/D/L bar**: Proportional colored bar (green/orange/red) for season stats
- **Podium medals**: Gold `#FFD700`, Silver `#C0C0C0`, Bronze `#CD7F32` for top scorers
- **Swap mode**: Blue accent banner + glow border on swap targets

### Component Patterns
- `DraggablePlayer`: Responder-based drag, position-colored dot, role label, number, name
- `RolePicker`: Horizontal scroll of player chips for captain/penalty/free-kick/corner
- `BenchSlot`: Compact card with dot + name + position + close button
- `FormationPicker`: Modal grid (8 formations) + tactic shortcuts
- `ParamPicker`: Segmented control for pressing/tempo/bloc/width
- Dropdowns: Full-width card with icon + title + subtitle + chevron → Modal with FlatList

## Email Integration Pattern

When implementing email for convocation:
```python
# In app/routes/api.py or app/services/email_service.py
# After successful convocation save, send email with:
# - Event name, date, location
# - Formation + tactic name (if set)
# - Player's convocation status
# Use app/services/email_service.py send_email() function
```

## Validation Checklist

Before finishing:
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] All imports use relative paths from the file location
- [ ] Theme constants used (no hardcoded colors except position palette above)
- [ ] `any` types annotated in `.filter()` / `.map()` callbacks to satisfy strict TS
- [ ] Data loads use `Promise.all()` for parallel fetching
- [ ] Error handling with `Alert.alert()` and `.catch()` fallbacks
- [ ] French labels for all UI text (Effectif, Tactiques, Convocation, Bilan, etc.)

## Reference Files

- [theme.ts](../../mobile/constants/theme.ts) — Color/spacing/font constants
- [coach.ts](../../mobile/services/coach.ts) — All coach API service functions
- [lineup.tsx](../../mobile/app/coach/lineup.tsx) — Composition screen with drag & drop
- [tactics.tsx](../../mobile/app/coach/tactics.tsx) — Tactical presets CRUD
- [convocation.tsx](../../mobile/app/coach/convocation.tsx) — Player convocation with sync
- [index.tsx](../../mobile/app/coach/index.tsx) — Coach dashboard
- [api.py](../../app/routes/api.py) — Backend coach routes
- [player_service.py](../../app/services/player_service.py) — Lineup/tactics backend logic
- [email_service.py](../../app/services/email_service.py) — Email sending service
