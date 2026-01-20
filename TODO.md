# Dark Sky - Issue Tracker

> **Project:** UFO Survivor  
> **Last Updated:** January 4, 2026

---

## ✅ Recently Completed

| Date | Changes |
|------|---------|
| Session 1 | Implemented: Records screen, Settings screen, Codex UI, Difficulty selection, UFO Events integration, Artifacts system |
| Session 2 | Fixed: Magnet pickup speed, performance caps (entities reduced), phase balance tuning |
| Session 3 | **Enemy Design Overhaul:** Stealth visibility system, hazard zones (bombs/orbital strikes), B-2 bomber drops bombs, Ford carrier spawns drones, Nimitz spawns elite squadrons, Seahawk deploys sonar buoys, DroneSwarm cluster spawning, brightened Phase 3-4 enemy colors, added new sounds (launch, droneBuzz, alarm, sonarPing, stealthReveal) |
| Session 4 | **Feature Fixes:** Weapon evolutions now trigger on weapon max level or passive acquisition (+ hint when combo available), Abilities UI bar added (keys 1-5), Run Modifiers selectable in difficulty modal (max 3), added singularityPulse evolved weapon. **QoL:** Quit confirmation dialog, HULL label fix, real closure rate calculation, power-ups start at 0 |
| Session 5 | **High Priority Fixes:** Achievement system fully wired up with reward claiming (currency, UAP unlocks, difficulty unlocks, etc.), Error boundary added to game loop (catches errors, allows recovery), Verified DEBUG_MODE wrapping for console.logs and debug code, playSound made exception-safe with try-catch, Added UFO namespace wrapper to reduce global pollution. **Medium Priority (ALL COMPLETE):** Tutorial overlay, verified Records/damage cap already done, Phase 1 pacing tuned, S-curve XP, 5 colorblind palettes, ARIA accessibility (labels, roles, skip-link, focus indicators), Full control rebinding UI with save/load, Virtual joystick + action buttons for mobile |

---

## 🚨 Critical (Game-Breaking / Blocking)

| # | Status | Issue | Location | Details |
|---|--------|-------|----------|---------|
| 1 | [x] | Records screen not implemented | `ui.js:136-137` | Shows `alert('Records coming soon!')` - placeholder |
| 2 | [x] | Settings screen not implemented | `ui.js:144-145` | Shows `alert('Settings coming soon!')` - no volume/option control |
| 3 | [x] | Codex/Collection UI missing | `codex.js` | Data exists (662 lines) but no UI to view it |
| 4 | [x] | Difficulty selection UI missing | `difficulty.js` | 4 difficulty tiers defined but no way to select them |
| 5 | [x] | UFO Events integration incomplete | `ufoEvents.js` | 719 lines of lore data with no in-game access |
| 6 | [x] | Artifacts system not connected | `codex.js:59-100` | Diablo-style artifacts defined but not dropping/usable |

---

## 🔴 High Priority (Major Issues)

### Code Quality

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 7 | [x] | Debug code in production | `main.js:61-150` | Already wrapped in DEBUG_MODE flag |
| 8 | [x] | Excessive console.log statements | Multiple files (~20+) | Already wrapped in DEBUG_MODE checks |
| 9 | [x] | Uses alert() for UI | `ui.js:137` | No remaining alert() calls |
| 10 | [x] | Optional chaining on sound | `this.game.playSound?.()` everywhere | playSound now try-catch wrapped, never throws |
| 11 | [x] | No error boundaries | `game.js` | Added try-catch with recovery in gameLoop |
| 12 | [x] | Global namespace pollution | All JS files | Added UFO namespace wrapper (backwards compatible) |

### Incomplete Features

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 13 | [x] | Weapon evolutions not working | `weapons.js:118-170` | Fixed: Evolution check on weapon max + passive acquire |
| 14 | [x] | Run modifiers system incomplete | `difficulty.js#L150+` | Fixed: Modifiers selectable in difficulty modal |
| 15 | [x] | Achievement rewards not claimed | `achievements.js` | Fixed: AchievementTracker now wired up, rewards auto-applied |
| 16 | [x] | UAP active abilities not working | `uapTypes.js` | Fixed: Keys 1-5 bound, ability bar UI added |
| 17 | [x] | AdvancedSaveManager unused | `saveSystem.js:79` | Not needed - simple SaveManager works fine |

---

## 🟡 Medium Priority (Quality of Life)

### Player Experience

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 18 | [x] | No tutorial | `ui.js`, `index.html` | Added tutorial overlay with controls + tips, shows on first play |
| 19 | [x] | No control rebinding | `game.js`, `ui.js`, `constants.js` | Full rebinding UI in Settings, saves to localStorage |
| 20 | [x] | No pause during level-up | `game.js` | N/A - upgrades are pickup-based, no level-up screen |
| 21 | [x] | No run history / statistics display | `saveSystem.js` | Already implemented in Records screen |
| 22 | [x] | 30-minute run too long | `constants.js:11` | Already has 10/30/45 min options in difficulty modal |
| 23 | [x] | Power-ups given at start | `game.js:86-92` | Fixed: Inventory starts at 0 |
| 24 | [x] | No confirmation for Quit | `ui.js:170` | Fixed: Added confirmation modal |

### UI/UX Issues

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 25 | [x] | UAP preview canvas may not render | `ui.js:1661+` | Already implemented: drawUAPOnCanvas draws each UAP type |
| 26 | [x] | Health bar labeled "SHLD" | `index.html:182` | Fixed: Changed to "HULL" |
| 27 | [x] | Closure rate is random | `ui.js:279` | Fixed: Now calculates from enemy velocity |
| 28 | [x] | No colorblind mode | `constants.js`, `ui.js` | Added 5 color palettes (normal, deuteranopia, protanopia, tritanopia, high contrast) + shape indicator option |
| 29 | [x] | No screen reader support | `index.html`, `style.css` | Added ARIA labels, roles, skip-link, focus indicators, reduced motion & high contrast CSS |
| 30 | [x] | Mobile touch controls basic | `game.js`, `style.css` | Added virtual joystick + action buttons, responsive layout |

### Balance

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 31 | [x] | Phase 1 may feel slow | `spawner.js:19-35` | Tuned: faster spawns (0.4s), more enemies (4 base), higher growth rate |
| 32 | [x] | XP curve is linear | `player.js` | Implemented S-curve: fast early, slow mid (Lv15-25), fast late |
| 33 | [x] | Time scaling uncapped for damage | `enemy.js:27` | Already capped at 50% like HP |

---

## 🟢 Low Priority (Polish / Tech Debt)

### Performance

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 34 | [ ] | No spatial partitioning for collisions | `game.js` | `SPATIAL_GRID_SIZE` defined but unclear usage |
| 35 | [ ] | Individual draw calls | `particles.js` | Could batch similar particles |
| 36 | [ ] | Object creation in hot paths | Various | Pre-allocate vectors/objects |
| 37 | [ ] | No frame rate limiter | `game.js` | `requestAnimationFrame` only |

### Code Architecture

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 38 | [ ] | game.js is 2372 lines | `game.js` | Split into smaller modules |
| 39 | [ ] | player.js is 1579 lines | `player.js` | Extract weapon/ability logic |
| 40 | [ ] | ui.js is 1760 lines | `ui.js` | Split by screen/component |
| 41 | [ ] | constants.js is 1179 lines | `constants.js` | Split into `weapons.config`, `enemies.config`, etc. |
| 42 | [ ] | No TypeScript | All files | Type safety would catch bugs |
| 43 | [ ] | No ES modules | All files | Uses script tags, global scope |
| 44 | [ ] | No build process | `index.html` | Raw JS, cache busting via `?v=` |
| 45 | [ ] | No minification | - | Could reduce load time |
| 46 | [ ] | No source maps | - | Hard to debug in production |
| 47 | [ ] | No unit tests | - | Game logic untested |

### Miscellaneous

| # | Status | Issue | Location | Fix |
|---|--------|-------|----------|-----|
| 48 | [ ] | Script version inconsistencies | `index.html:401-420` | Mixed `v=19`, `v=20`, `v=21` |
| 49 | [ ] | Missing theme-music.wav handling | `sound.js:47-54` | Fallback exists but file may be missing |
| 50 | [ ] | UAP classification map incomplete | `ui.js:306-313` | Only 5 UAPs mapped, others show "UAP/UK" |
| 51 | [ ] | Legacy abilities code | `constants.js:166-200` | Comment says "keeping for backwards compatibility" |
| 52 | [ ] | Duplicate save systems | `utils.js` + `saveSystem.js` | Two different save implementations |

---

## 📋 Quick Reference by File

| File | Issues |
|------|--------|
| `ui.js` | #1, #2, #8, #9, #24, #27 |
| `main.js` | #7, #8 |
| `game.js` | #10, #11, #20, #23, #38 |
| `player.js` | #16, #39 |
| `constants.js` | #22, #32, #41, #51 |
| `weapons.js` | #13 |
| `difficulty.js` | #4, #14 |
| `codex.js` | #3, #6 |
| `ufoEvents.js` | #5 |
| `achievements.js` | #15 |
| `saveSystem.js` | #17, #21, #52 |
| `sound.js` | #49 |
| `spawner.js` | #31 |
| `enemy.js` | #33 |
| `index.html` | #25, #26, #48 |

---

## 🎯 Recommended Fix Order

### ✅ COMPLETED - Critical & High Priority
- [x] Implement Settings screen (volume, screen shake, etc.)
- [x] Implement Records screen (run history, stats)
- [x] Add difficulty selection to main menu
- [x] Wire up weapon evolution system
- [x] Connect Codex/Collection UI
- [x] Implement achievement reward claiming
- [x] Remove debug code or add build process (wrapped in DEBUG_MODE)
- [x] Fix "SHLD" label, fake closure rate
- [x] Error boundaries in game loop
- [x] Namespace wrapper for globals

### Week 1: Player Experience (Medium Priority)
- [x] #18 - Add tutorial overlay for new players
- [x] #20 - Pause during level-up (N/A - pickup-based upgrades)
- [x] #21 - Run history / statistics display screen
- [x] #22 - Short run mode (already has 10/30/45 min options)

### Week 2: Accessibility & Mobile
- [x] #19 - Control rebinding (full rebind UI in Settings with save/load)
- [x] #28 - Colorblind mode (5 palettes: normal, deuteranopia, protanopia, tritanopia, high contrast)
- [x] #29 - Screen reader support (ARIA labels, skip-link, focus indicators)
- [x] #30 - Mobile touch controls (virtual joystick + action buttons)

### Week 3: Balance & Polish
- [ ] #25 - UAP preview canvas rendering
- [x] #31 - Phase 1 pacing (tuned spawner for faster engagement)
- [x] #32 - XP curve tuning (S-curve implemented)
- [x] #33 - Time scaling already capped for enemy damage

### Week 4+: Architecture (Low Priority)
- [ ] #38-41 - Split large files (game.js, player.js, ui.js, constants.js)
- [ ] #42-43 - Add TypeScript / ES modules
- [ ] #44-46 - Build pipeline with minification & source maps
- [ ] #47 - Unit tests for game logic
- [ ] #48-52 - Misc cleanup (script versions, duplicate systems)

---

## 📊 Progress Summary

| Priority | Total | Complete | Remaining |
|----------|-------|----------|-----------|

*Updated: January 11, 2026*
| 🚨 Critical | 6 | 6 | 0 |
| 🔴 High | 11 | 11 | 0 |
| 🟡 Medium | 16 | 16 | 0 |
| 🟢 Low | 19 | 0 | 19 |
| **Total** | **52** | **33** | **19** |

---

*Mark tasks complete by changing `[ ]` to `[x]`*
