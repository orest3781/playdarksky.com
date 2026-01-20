# UFO Survivor - ComfyUI Sprite Generation Guide

## Quick Start
1. Load `comfyui-sprite-workflow.json` into ComfyUI
2. Change the positive prompt for each UAP type
3. Update the filename in SaveImage node
4. Queue and generate!

## Workflow Settings

### Recommended Models
- **SDXL Base**: `sd_xl_base_1.0.safetensors` (best quality)
- **Alternative**: `dreamshaper_xl.safetensors` (more stylized)
- **For pixel art**: `pixel-art-xl.safetensors`

### Generation Settings
| Setting | Value | Notes |
|---------|-------|-------|
| Resolution | 1024x1024 | SDXL native, resize to 128x128 after |
| CFG Scale | 7.5 | Balance between prompt adherence and quality |
| Steps | 25 | Good quality/speed balance |
| Sampler | dpmpp_2m | Fast and high quality |
| Scheduler | karras | Better detail preservation |

---

## PLAYER UAP PROMPTS

### Style Prefix (add to ALL prompts):
```
Consistent 2D top-down game sprite art style, clean vector-like edges, 
slight glow effects, military/sci-fi aesthetic, dark space game theme,
facing right, transparent background, centered composition, no shadow,
```

### Negative Prompt (use for ALL):
```
blurry, low quality, jpeg artifacts, watermark, text, logo, signature, 
3D render, realistic photo, perspective view, side view, multiple objects, 
busy background, gradient background, noise, grain, distorted, deformed
```

---

### 1. SAUCER (saucer.png)
```
Top-down view of a classic flying saucer UFO, facing right, metallic silver disc 
with raised dome center, glowing cyan-blue lights around rim, 2D game sprite style, 
transparent background, centered, no shadow, 128x128
```
**Filename**: `sprites/player/saucer`

---

### 2. TRIANGLE (triangle.png)
```
Top-down view of a black triangle UFO, facing right with point leading, 
matte dark gray black stealth surface, three red lights at each corner, 
angular sharp edges, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/triangle`

---

### 3. ORB (orb.png)
```
Top-down view of a luminous glowing energy orb UFO, facing right, 
bright yellow-white plasma sphere with soft glow halo, ethereal appearance, 
foo fighter style, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/orb`

---

### 4. CIGAR (cigar.png)
```
Top-down view of a cigar-shaped UFO mothership, facing right, 
elongated metallic gray cylindrical craft, subtle panel line details, 
white glow along length, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/cigar`

---

### 5. TIC TAC (tictac.png)
```
Top-down view of a tic tac shaped UFO, facing right, smooth white featureless 
capsule pill shape, clean seamless porcelain surface, subtle cyan glow outline, 
Nimitz UAP style, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/tictac`

---

### 6. ADAMSKI (adamski.png)
```
Top-down view of an Adamski-style scout ship UFO, facing right, 
bell-shaped saucer craft with three ball landing gear visible underneath, 
copper bronze metallic color, porthole windows around rim, 
2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/adamski`

---

### 7. JELLYFISH (jellyfish.png)
```
Top-down view of a jellyfish-shaped UAP, facing right, translucent organic dome 
with trailing tentacle-like appendages streaming behind, soft teal aqua bioluminescent 
glow, alien organic appearance, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/jellyfish`

---

### 8. CUBE (cube.png)
```
Top-down view of a cube-in-sphere UAP, facing right, dark geometric cube 
inside a translucent glowing blue energy sphere, angular sharp edges visible 
through force field, Ryan Graves style, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/cube`

---

### 9. GIMBAL (gimbal.png)
```
Top-down view of a gimbal UFO, facing right, disc-shaped craft with visible 
rotation ring mechanism around edge, orange-red glowing accents, appears to be 
rotating, Navy video style, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/gimbal`

---

### 10. GO FAST (gofast.png)
```
Top-down view of a sleek fast-moving UFO, facing right, streamlined aerodynamic 
elongated oval shape with pointed ends, cyan-blue speed trail effect, motion blur feel, 
Navy Go Fast video style, 2D game sprite style, transparent background, centered, no shadow
```
**Filename**: `sprites/player/gofast`

---

## ENEMY PROMPTS

### Phase 1 - Basic Units (Coast Guard / Early Response)

#### patrol.png
```
Top-down view of a Coast Guard patrol boat, facing right, white hull with 
orange diagonal stripe, small vessel, military style, 2D game sprite, 
transparent background, centered, no shadow, 64x64
```

#### scout.png
```
Top-down view of a small reconnaissance drone, facing right, gray quadcopter 
with camera, compact surveillance UAV, 2D game sprite, transparent background, 
centered, no shadow, 48x48
```

#### helicopter.png
```
Top-down view of a Coast Guard helicopter, facing right, white and orange 
Jayhawk rescue helicopter, rotor blades visible, 2D game sprite, transparent 
background, centered, no shadow, 64x64
```

#### recon.png
```
Top-down view of a recon aircraft, facing right, small gray surveillance plane, 
twin engine, 2D game sprite, transparent background, centered, no shadow, 64x64
```

#### cutter.png
```
Top-down view of a Coast Guard cutter ship, facing right, white hull with 
red stripe, medium patrol vessel, deck details, 2D game sprite, transparent 
background, centered, no shadow, 80x40
```

---

### Phase 2 - Military Response

#### fighter.png
```
Top-down view of an F/A-18 Super Hornet fighter jet, facing right, gray Navy 
camouflage, twin engines, swept wings, 2D game sprite, transparent background, 
centered, no shadow, 64x64
```

#### apache.png
```
Top-down view of an AH-64 Apache attack helicopter, facing right, dark olive 
military green, rotor disc visible, weapon pods, 2D game sprite, transparent 
background, centered, no shadow, 64x64
```

#### seahawk.png
```
Top-down view of an SH-60 Seahawk helicopter, facing right, gray Navy 
anti-submarine helicopter, rotor visible, 2D game sprite, transparent 
background, centered, no shadow, 64x64
```

#### destroyer.png
```
Top-down view of an Arleigh Burke destroyer, facing right, gray Navy warship, 
AEGIS radar dome, missile launchers, 2D game sprite, transparent background, 
centered, no shadow, 96x32
```

#### frigate.png
```
Top-down view of a Navy frigate, facing right, gray warship, smaller than 
destroyer, helicopter pad visible, 2D game sprite, transparent background, 
centered, no shadow, 80x28
```

---

### Phase 3 - Advanced Military

#### raptor.png
```
Top-down view of an F-22 Raptor stealth fighter, facing right, gray angular 
stealth geometry, twin engines, advanced fighter jet, 2D game sprite, 
transparent background, centered, no shadow, 64x64
```

#### bomber.png
```
Top-down view of a B-2 Spirit stealth bomber, facing right, black flying wing 
design, angular stealth shape, 2D game sprite, transparent background, 
centered, no shadow, 80x48
```

#### cruiser.png
```
Top-down view of a Ticonderoga cruiser, facing right, gray Navy warship, 
large AEGIS vessel, missile systems, 2D game sprite, transparent background, 
centered, no shadow, 100x32
```

#### lighting.png (F-35)
```
Top-down view of an F-35 Lightning II stealth fighter, facing right, gray 
angular stealth design, single engine, 2D game sprite, transparent background, 
centered, no shadow, 64x64
```

#### submarine.png
```
Top-down view of a submarine surfaced, facing right, black hull, conning tower 
visible, Los Angeles class style, 2D game sprite, transparent background, 
centered, no shadow, 96x24
```

---

### Phase 4 - Black Ops / Experimental

#### aurora.png
```
Top-down view of the Aurora hypersonic spy plane, facing right, black triangular 
experimental aircraft, sleek classified design, 2D game sprite, transparent 
background, centered, no shadow, 72x48
```

#### hawk.png
```
Top-down view of an advanced stealth drone, facing right, dark gray flying wing 
UAV, futuristic military drone, 2D game sprite, transparent background, 
centered, no shadow, 64x40
```

#### swarm.png
```
Top-down view of a drone swarm cluster, facing right, multiple small interconnected 
drones in formation, glowing links between units, 2D game sprite, transparent 
background, centered, no shadow, 64x64
```

#### railgun.png
```
Top-down view of a railgun platform vehicle, facing right, heavy armored 
vehicle with electromagnetic cannon, futuristic weapon system, 2D game sprite, 
transparent background, centered, no shadow, 80x48
```

#### orbitalwarning.png
```
Top-down view of a satellite weapon platform, facing right, orbital defense 
satellite with solar panels and weapon array, 2D game sprite, transparent 
background, centered, no shadow, 64x64
```

---

### Phase 5 - Boss Units

#### nimitz.png
```
Top-down view of USS Nimitz aircraft carrier, facing right, massive gray 
supercarrier, flight deck with aircraft, island superstructure, 2D game sprite, 
transparent background, centered, no shadow, 160x48
```

#### ford.png
```
Top-down view of USS Gerald R Ford aircraft carrier, facing right, modern 
supercarrier, electromagnetic catapults, full flight deck, 2D game sprite, 
transparent background, centered, no shadow, 160x48
```

#### ohio.png
```
Top-down view of Ohio-class submarine, facing right, large black ballistic 
missile submarine, surfaced view, 2D game sprite, transparent background, 
centered, no shadow, 128x28
```

#### fravor.png (Commander Fravor's F/A-18)
```
Top-down view of Commander Fravor's F/A-18 Super Hornet, facing right, gray 
Navy fighter with special markings, VFA-41 Black Aces squadron, elite pilot 
aircraft, 2D game sprite, transparent background, centered, no shadow, 72x72
```

#### topgun.png
```
Top-down view of Top Gun elite F-14 Tomcat, facing right, iconic gray fighter 
jet, variable sweep wings extended, ace pilot markings, 2D game sprite, 
transparent background, centered, no shadow, 80x64
```

---

## Post-Processing Tips

### Transparent Background
If your model doesn't generate transparent backgrounds:
1. Use **Remove Background** node
2. Or use **Rembg** custom node
3. Manual cleanup in image editor

### Resize to Game Size
```
Player sprites: 128x128 → resize to 64x64 or 48x48 for game
Enemy sprites: Various sizes based on unit type
```

### Color Consistency
- Player UAPs: Glowing, ethereal colors
- Phase 1 enemies: White/orange (Coast Guard)
- Phase 2-3 enemies: Gray (military)
- Phase 4 enemies: Black/dark (stealth/black ops)
- Phase 5 bosses: Large, detailed, gray

### Batch Generation
1. Use **Prompt from file** node to load all prompts
2. Use **Save Image (Sequence)** for auto-naming
3. Generate all at once overnight

---

## File Structure
```
Assets/sprites/
├── player/
│   ├── saucer.png
│   ├── triangle.png
│   ├── orb.png
│   ├── cigar.png
│   ├── tictac.png
│   ├── adamski.png
│   ├── jellyfish.png
│   ├── cube.png
│   ├── gimbal.png
│   └── gofast.png
└── enemy/
    ├── phase1/
    ├── phase2/
    ├── phase3/
    ├── phase4/
    └── phase5/
```
