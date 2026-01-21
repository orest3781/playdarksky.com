# Audio Files for Dark Sky UFO Survivor

Drop your audio files here (.mp3, .wav, or .ogg) and uncomment the corresponding line in `js/sound.js` to enable them.

## File Naming Convention

Use these exact filenames (or update the paths in sound.js):

### Weapons (High Priority - Most Frequent)
| File | Description |
|------|-------------|
| `shoot.mp3` | Primary weapon fire |
| `shoot-heavy.mp3` | Heavy weapon fire |
| `plasma.mp3` | Plasma weapon |
| `missile.mp3` | Missile launch |
| `railgun.mp3` | Railgun shot |

### Explosions (High Priority - Satisfying Feedback)
| File | Description |
|------|-------------|
| `explosion.mp3` | Standard explosion |
| `explosion-small.mp3` | Small explosion (frequent) |
| `explosion-big.mp3` | Large explosion (bosses) |

### Pickups (Medium Priority - Reward Feedback)
| File | Description |
|------|-------------|
| `pickup.mp3` | Generic pickup |
| `pickup-xp.mp3` | XP orb collection (very frequent, keep short!) |
| `pickup-health.mp3` | Health pickup |
| `pickup-powerup.mp3` | Power-up/ultimate fragment |

### Player
| File | Description |
|------|-------------|
| `hit.mp3` | Player takes damage |
| `death.mp3` | Player death |
| `heal.mp3` | Health restored |
| `shield.mp3` | Shield activate |
| `boost.mp3` | Speed boost |

### Level/Progress
| File | Description |
|------|-------------|
| `level-up.mp3` | Level up fanfare |
| `upgrade.mp3` | Upgrade selected |
| `phase-change.mp3` | Game phase transition |
| `victory.mp3` | Game won |

### UI
| File | Description |
|------|-------------|
| `click.mp3` | Button click |
| `hover.mp3` | Button hover |
| `select.mp3` | Selection made |
| `error.mp3` | Error/invalid action |
| `pause.mp3` | Game paused |

### Alerts/Warnings
| File | Description |
|------|-------------|
| `warning.mp3` | Generic warning |
| `missile-alert.mp3` | Incoming missile |
| `radar-ping.mp3` | Radar detection |
| `boss-warning.mp3` | Boss incoming |

### Enemies
| File | Description |
|------|-------------|
| `enemy-shoot.mp3` | Enemy fires |
| `enemy-spawn.mp3` | Enemy appears |
| `launch.mp3` | Enemy launch sound |
| `drone-buzz.mp3` | Drone enemy |
| `alarm.mp3` | Alert/siren |
| `sonar-ping.mp3` | Sonar detection |
| `stealth-reveal.mp3` | Stealth enemy revealed |

### Abilities
| File | Description |
|------|-------------|
| `ability.mp3` | Generic ability |
| `chrono-burst.mp3` | Time slow ability |
| `phase-shift.mp3` | Phase shift |
| `overdrive.mp3` | Overdrive mode |

---

## How to Enable

1. Drop your audio file in this folder
2. Open `js/sound.js`
3. Find the `audioFiles` object (around line 55)
4. Uncomment the line for your sound

Example - to enable a custom explosion sound:
```js
// Before:
// explosion: 'Assets/audio/explosion.mp3',

// After:
explosion: 'Assets/audio/explosion.mp3',
```

## Recommended Sources (Free)
- https://opengameart.org/content/50-cc0-sci-fi-sfx (CC0 - no attribution)
- https://mattflat.itch.io/sci-fi-space-sound-effects-asset-pack (82 sounds!)
- https://mixkit.co/free-sound-effects/sci-fi/
- https://pixabay.com/sound-effects/search/sci-fi/
- https://freesound.org/people/steaq/packs/27617/

## Tips
- Keep sounds SHORT (especially `shoot` and `pickup-xp`)
- Normalize volume levels
- MP3 is smallest, WAV is highest quality, OGG is good balance
- Test in-game - some sounds play rapidly and overlap
