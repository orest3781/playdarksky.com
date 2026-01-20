# UFO Survivor - Designer Sprite Workflow

## Required Custom Nodes

Install these via **ComfyUI Manager** before using:

| Node | Purpose |
|------|---------|
| **comfyui-rembg** | Background removal for transparency |
| **ComfyUI Essentials** | ImageResize+ node |

---

## Workflow Overview

```
┌─────────────┐   ┌──────────────────┐   ┌───────────┐   ┌──────────────────┐
│  1. MODEL   │ → │   2. PROMPTS     │ → │ 3. SAMPLE │ → │ 4. POST-PROCESS  │
│             │   │                  │   │           │   │                  │
│ Checkpoint  │   │ Style (locked)   │   │ KSampler  │   │ Remove BG        │
│ Loader      │   │ Subject (edit!)  │   │ VAE       │   │ Resize 128x128   │
│             │   │ Negative(locked) │   │           │   │ Save PNG         │
└─────────────┘   └──────────────────┘   └───────────┘   └──────────────────┘
```

---

## How to Use

### Step 1: Load the Workflow
- Open ComfyUI
- Drag `ufo-sprite-workflow.json` into the canvas
- Or: Load → Browse → Select the file

### Step 2: Edit ONLY the Green Nodes
The workflow has color-coded nodes:

| Color | Meaning |
|-------|---------|
| 🟢 **Green** | EDIT THIS - Subject description & filename |
| 🔴 **Red** | DON'T TOUCH - Style & negative prompts |
| 🔵 **Blue** | Info notes |
| 🟣 **Purple** | Post-processing (auto) |

### Step 3: Change the Subject Prompt
Edit the **"✏️ SUBJECT"** node with descriptions like:

```
classic flying saucer UFO, metallic silver disc with raised dome center, glowing cyan-blue lights around rim
```

### Step 4: Set the Filename
Edit the **"💾 SAVE SPRITE"** node:
```
sprites/player/saucer
sprites/enemy/phase1/patrol
sprites/enemy/phase5/nimitz
```

### Step 5: Generate
- Press **Queue Prompt** (or Ctrl+Enter)
- Wait ~15 seconds
- Check the **"🎮 Game Size Preview"** for the 128x128 result

---

## Subject Prompts Reference

### Player UAPs

| Sprite | Subject Prompt |
|--------|----------------|
| saucer | `classic flying saucer UFO, metallic silver disc with raised dome center, glowing cyan-blue lights around rim` |
| triangle | `black triangle UFO, matte dark stealth surface, three red lights at each corner, angular sharp edges` |
| orb | `luminous glowing energy orb UFO, bright yellow-white plasma sphere with soft glow halo, ethereal` |
| cigar | `cigar-shaped UFO mothership, elongated metallic gray cylindrical craft, white glow along length` |
| tictac | `tic tac shaped UFO, smooth white featureless capsule, clean seamless surface, subtle cyan glow outline` |
| adamski | `Adamski-style scout ship, bell-shaped craft with three ball landing gear, copper bronze metallic, portholes` |
| jellyfish | `jellyfish-shaped UAP, translucent organic dome with trailing tentacle appendages, teal bioluminescent glow` |
| cube | `cube-in-sphere UAP, dark geometric cube inside translucent glowing blue sphere, angular edges visible` |
| gimbal | `gimbal UFO, disc-shaped craft with rotation ring mechanism, orange-red glowing accents, appears rotating` |
| gofast | `sleek fast UFO, streamlined aerodynamic elongated oval, pointed ends, cyan-blue motion blur trail` |

### Phase 1 Enemies (Coast Guard)

| Sprite | Subject Prompt |
|--------|----------------|
| patrol | `Coast Guard patrol boat, white hull with orange diagonal stripe, small vessel from above` |
| scout | `small reconnaissance quadcopter drone, gray with camera, compact surveillance UAV` |
| helicopter | `Coast Guard Jayhawk rescue helicopter, white and orange, rotor blades visible from above` |
| recon | `small gray reconnaissance aircraft, twin engine surveillance plane` |
| cutter | `Coast Guard cutter ship, white hull with red stripe, medium patrol vessel with deck details` |

### Phase 2 Enemies (Military)

| Sprite | Subject Prompt |
|--------|----------------|
| fighter | `F/A-18 Super Hornet fighter jet, gray Navy camouflage, twin engines, swept wings from above` |
| apache | `AH-64 Apache attack helicopter, dark olive military green, rotor visible, weapon pods` |
| seahawk | `SH-60 Seahawk helicopter, gray Navy anti-submarine helicopter, rotor visible from above` |
| destroyer | `Arleigh Burke destroyer warship, gray Navy, AEGIS radar dome, missile launchers from above` |
| frigate | `Navy frigate warship, gray hull, helicopter pad visible, smaller than destroyer` |

### Phase 3 Enemies (Advanced)

| Sprite | Subject Prompt |
|--------|----------------|
| raptor | `F-22 Raptor stealth fighter, gray angular stealth geometry, twin engines from above` |
| bomber | `B-2 Spirit stealth bomber, black flying wing design, angular stealth shape from above` |
| cruiser | `Ticonderoga cruiser warship, gray Navy, large AEGIS vessel, missile systems from above` |
| lighting | `F-35 Lightning II stealth fighter, gray angular design, single engine from above` |
| submarine | `submarine surfaced, black hull, conning tower visible, Los Angeles class from above` |

### Phase 4 Enemies (Black Ops)

| Sprite | Subject Prompt |
|--------|----------------|
| aurora | `Aurora hypersonic spy plane, black triangular experimental aircraft, sleek classified design` |
| hawk | `advanced stealth drone, dark gray flying wing UAV, futuristic military drone` |
| swarm | `drone swarm cluster, multiple small interconnected drones in formation, glowing links` |
| railgun | `railgun platform vehicle, heavy armored with electromagnetic cannon, futuristic weapon` |
| orbitalwarning | `satellite weapon platform, orbital defense satellite with solar panels and weapon array` |

### Phase 5 Enemies (Bosses)

| Sprite | Subject Prompt |
|--------|----------------|
| nimitz | `USS Nimitz aircraft carrier, massive gray supercarrier, flight deck with aircraft, island structure` |
| ford | `USS Gerald R Ford aircraft carrier, modern supercarrier, electromagnetic catapults, full deck` |
| ohio | `Ohio-class submarine, large black ballistic missile submarine, surfaced from above` |
| fravor | `elite F/A-18 Super Hornet, gray Navy fighter with special ace markings, VFA-41 Black Aces` |
| topgun | `F-14 Tomcat fighter jet, gray with variable sweep wings extended, ace pilot markings` |

---

## Batch Generation Tips

### Method 1: Manual Queue
1. Change subject prompt
2. Change filename
3. Queue Prompt
4. Repeat for each sprite

### Method 2: Use Prompt Queue
1. Right-click on Subject node
2. "Convert to Input" 
3. Add "Primitive" node with text list
4. Queue batch

### Method 3: Save Workflow Variants
- Save separate workflow files for each sprite
- `workflow-saucer.json`, `workflow-triangle.json`, etc.
- Load and queue each one

---

## Troubleshooting

### Red outline on nodes
- Missing custom node - install via ComfyUI Manager

### No transparency in output
- Make sure rembg node is connected
- Check that rembg model is downloaded (first run downloads it)

### Sprite looks wrong direction
- The style prompt includes "facing right" - don't remove it
- All sprites should face → for correct game rotation

### Image quality issues
- Increase steps to 40 for better detail
- Try different seeds (randomize is on by default)
- Adjust CFG between 7-9

### File not saving
- Check folder path exists: `sprites/player/` or `sprites/enemy/phaseX/`
- ComfyUI saves to its `/output/` folder by default

---

## Output Location

ComfyUI saves to:
```
ComfyUI/output/sprites/player/saucer_00001_.png
ComfyUI/output/sprites/enemy/phase1/patrol_00001_.png
```

Copy the final PNGs to your game's Assets folder:
```
ufo-survivor/Assets/sprites/player/saucer.png
ufo-survivor/Assets/sprites/enemy/phase1/patrol.png
```
