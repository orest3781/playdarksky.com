// =====================================================
// GAME CONSTANTS
// =====================================================

// Global namespace to reduce pollution (backwards compatible)
// All classes and constants are still global but also accessible via UFO namespace
window.UFO = window.UFO || {};

// Debug mode - set to false for production
const DEBUG_MODE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
window.UFO.DEBUG_MODE = DEBUG_MODE;

const GAME_CONFIG = {
    // World settings
    WORLD_WIDTH: 4000,      // Large play area
    WORLD_HEIGHT: 4000,
    
    // Endless Mode - no time limit, survive as long as possible
    ENDLESS_MODE: true,
    
    // Phase timing (phases loop after Phase 5 with increasing difficulty)
    PHASE_LOOP_START: 30 * 60,   // 30 minutes - when phases start looping
    PHASE_LOOP_DURATION: 10 * 60, // Each loop cycle is 10 minutes
    
    // XP and leveling - Balanced for 30-minute run
    // Target: Level 15-20 by Phase 3, Level 30-40 by end
    // Level 1: 15 XP, Level 10: ~150 XP, Level 20: ~600 XP, Level 30: ~1800 XP
    BASE_XP_REQUIRED: 15,
    XP_GROWTH_RATE: 1.25,   // Smoother curve than before
    MAX_LEVEL: 50,
    
    // Level milestones (for weapon/passive unlocks)
    LEVEL_MILESTONES: [5, 10, 15, 20, 25, 30, 40, 50],
    
    // Physics
    PICKUP_MAGNET_RANGE: 100,
    PICKUP_MAGNET_SPEED: 400,
    
    // Performance
    MAX_ENEMIES: 200,
    MAX_PROJECTILES: 300,
    MAX_PARTICLES: 800,
    SPATIAL_GRID_SIZE: 100,
    
    // Balance tuning
    PLAYER_BASE_DPS_TARGET: 50,      // Expected DPS at level 1
    PLAYER_DPS_PER_LEVEL: 15,        // DPS increase per level
    ENEMY_HP_SCALE_PER_MINUTE: 0.05, // 5% HP increase per minute
    ENEMY_HP_SCALE_CAP: 0.5,         // Max 50% bonus from time
    
    // Salvage System - Reroll costs scale exponentially
    SALVAGE_REROLL_COSTS: [10, 25, 50, 100], // Cost per reroll (index = reroll count)
    SALVAGE_REROLL_MAX: 4,                    // Max rerolls per pickup
    UPGRADE_CHOICES_COUNT: 3,                 // Number of choices shown
    UPGRADE_PICKUP_TIMEOUT: 20,               // Seconds before upgrade disappears
    
    // Weapon Duration System
    WEAPON_DURATION_ENABLED: true,           // Weapons expire and need refreshing
    WEAPON_BASE_DURATION: 45,                // Base duration in seconds
    WEAPON_DURATION_PER_LEVEL: 10,           // Extra seconds per weapon level
    WEAPON_WARNING_THRESHOLD: 10,            // Show warning when this many seconds left
    STARTING_WEAPON_PERMANENT: true          // Starting weapon never expires
};

// =====================================================
// COLORBLIND ACCESSIBILITY - Color Palettes
// Maps semantic colors to accessible alternatives
// =====================================================
const COLOR_PALETTES = {
    normal: {
        // Primary game colors
        player: '#00ffcc',
        playerGlow: '#00ffcc',
        enemy: '#ff3333',
        enemyGlow: '#ff6666',
        elite: '#ff8800',
        eliteGlow: '#ffaa00',
        boss: '#ff00ff',
        bossGlow: '#ff66ff',
        // Pickups
        xp: '#00ff00',
        health: '#ff3333',
        currency: '#ffff00',
        powerup: '#ff6600',
        // UI
        damage: '#ff4444',
        heal: '#00ff00',
        shield: '#00ccff',
        warning: '#ff3300',
        success: '#00ff00'
    },
    deuteranopia: { // Green-blind (most common)
        player: '#00d4ff',
        playerGlow: '#00d4ff',
        enemy: '#ff6644',
        enemyGlow: '#ff8866',
        elite: '#ffbb00',
        eliteGlow: '#ffdd00',
        boss: '#ff44ff',
        bossGlow: '#ff88ff',
        xp: '#00d4ff',       // Blue instead of green
        health: '#ff6644',
        currency: '#ffff00',
        powerup: '#ff9944',
        damage: '#ff6644',
        heal: '#00d4ff',
        shield: '#00aaff',
        warning: '#ff6644',
        success: '#00d4ff'
    },
    protanopia: { // Red-blind
        player: '#00ffcc',
        playerGlow: '#00ffcc',
        enemy: '#ddaa00',    // Yellow-orange instead of red
        enemyGlow: '#ffcc00',
        elite: '#ffdd00',
        eliteGlow: '#ffff00',
        boss: '#dd88ff',
        bossGlow: '#eeccff',
        xp: '#00ff00',
        health: '#ddaa00',
        currency: '#00ffcc',  // Cyan instead of yellow
        powerup: '#ffcc00',
        damage: '#ddaa00',
        heal: '#00ff00',
        shield: '#00aaff',
        warning: '#ddaa00',
        success: '#00ff00'
    },
    tritanopia: { // Blue-blind (rare)
        player: '#00ff88',
        playerGlow: '#00ff88',
        enemy: '#ff4444',
        enemyGlow: '#ff6666',
        elite: '#ff8800',
        eliteGlow: '#ffaa00',
        boss: '#ff00aa',
        bossGlow: '#ff66cc',
        xp: '#88ff00',
        health: '#ff4444',
        currency: '#ff8800',  // Orange instead of yellow
        powerup: '#ff6600',
        damage: '#ff4444',
        heal: '#88ff00',
        shield: '#00ff88',
        warning: '#ff4444',
        success: '#88ff00'
    },
    highContrast: {
        player: '#ffffff',
        playerGlow: '#ffffff',
        enemy: '#ff0000',
        enemyGlow: '#ff0000',
        elite: '#ffff00',
        eliteGlow: '#ffff00',
        boss: '#ff00ff',
        bossGlow: '#ff00ff',
        xp: '#00ff00',
        health: '#ff0000',
        currency: '#ffff00',
        powerup: '#ff8800',
        damage: '#ff0000',
        heal: '#00ff00',
        shield: '#00ffff',
        warning: '#ff0000',
        success: '#00ff00'
    }
};
window.UFO.COLOR_PALETTES = COLOR_PALETTES;

// Current color mode - default to normal
let CURRENT_COLOR_MODE = 'normal';
window.UFO.CURRENT_COLOR_MODE = CURRENT_COLOR_MODE;

// Helper function to get accessible color
function getColor(colorKey) {
    const palette = COLOR_PALETTES[CURRENT_COLOR_MODE] || COLOR_PALETTES.normal;
    return palette[colorKey] || COLOR_PALETTES.normal[colorKey];
}
window.UFO.getColor = getColor;

// Helper to set color mode
function setColorMode(mode) {
    if (COLOR_PALETTES[mode]) {
        CURRENT_COLOR_MODE = mode;
        window.UFO.CURRENT_COLOR_MODE = mode;
    }
}
window.UFO.setColorMode = setColorMode;

// =====================================================
// KEYBINDINGS - Rebindable Controls
// =====================================================
const DEFAULT_KEYBINDINGS = {
    // Movement
    moveUp: ['KeyW', 'ArrowUp'],
    moveDown: ['KeyS', 'ArrowDown'],
    moveLeft: ['KeyA', 'ArrowLeft'],
    moveRight: ['KeyD', 'ArrowRight'],
    // Actions - 5-action system
    phaseShift: ['Space'],      // SPACE - Dash (always available)
    powerOverdrive: ['KeyQ'],   // Q - Offensive powerup
    powerShield: ['KeyE'],      // E - Defensive powerup
    powerChronoBurst: ['KeyF'], // F - Time manipulation powerup
    uapSpecial: ['KeyR'],       // R - UAP unique ability OR Droplet
    pause: ['Escape']
};
window.UFO.DEFAULT_KEYBINDINGS = DEFAULT_KEYBINDINGS;
window.DEFAULT_KEYBINDINGS = DEFAULT_KEYBINDINGS; // Global access for game.js

// Display names for keybinding UI
const KEYBINDING_LABELS = {
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    moveLeft: 'Move Left',
    moveRight: 'Move Right',
    phaseShift: 'Dash (SPACE)',
    powerOverdrive: 'Overdrive (Q)',
    powerShield: 'Shield (E)',
    powerChronoBurst: 'Chrono Burst (F)',
    uapSpecial: 'UAP Special (R)',
    pause: 'Pause'
};
window.UFO.KEYBINDING_LABELS = KEYBINDING_LABELS;

// Convert key code to display name
function keyCodeToDisplay(code) {
    const displayMap = {
        'KeyW': 'W', 'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D',
        'KeyQ': 'Q', 'KeyE': 'E', 'KeyF': 'F', 'KeyR': 'R',
        'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
        'Space': 'SPACE', 'Escape': 'ESC',
        'ShiftLeft': 'L-SHIFT', 'ShiftRight': 'R-SHIFT',
        'ControlLeft': 'L-CTRL', 'ControlRight': 'R-CTRL',
        'AltLeft': 'L-ALT', 'AltRight': 'R-ALT',
        'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 
        'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
        'Tab': 'TAB', 'Enter': 'ENTER', 'Backspace': 'BACKSPACE'
    };
    return displayMap[code] || code.replace('Key', '');
}
window.UFO.keyCodeToDisplay = keyCodeToDisplay;

// Current keybindings (loaded from save or defaults)
let currentKeybindings = JSON.parse(JSON.stringify(DEFAULT_KEYBINDINGS));
window.UFO.currentKeybindings = currentKeybindings;

// Load keybindings from settings
function loadKeybindings(savedBindings) {
    if (savedBindings && typeof savedBindings === 'object') {
        // Merge saved with defaults (in case new bindings were added)
        currentKeybindings = { ...DEFAULT_KEYBINDINGS };
        for (const [action, keys] of Object.entries(savedBindings)) {
            if (DEFAULT_KEYBINDINGS[action]) {
                currentKeybindings[action] = Array.isArray(keys) ? keys : [keys];
            }
        }
    }
    window.UFO.currentKeybindings = currentKeybindings;
}
window.UFO.loadKeybindings = loadKeybindings;
window.loadKeybindings = loadKeybindings; // Global access for game.js

// Set a keybinding
function setKeybinding(action, keyCode, slot = 0) {
    if (!currentKeybindings[action]) return false;
    
    // Remove this key from any other action first
    for (const [act, keys] of Object.entries(currentKeybindings)) {
        const idx = keys.indexOf(keyCode);
        if (idx !== -1 && act !== action) {
            keys.splice(idx, 1);
        }
    }
    
    // Set the new binding
    if (!currentKeybindings[action]) currentKeybindings[action] = [];
    currentKeybindings[action][slot] = keyCode;
    window.UFO.currentKeybindings = currentKeybindings;
    return true;
}
window.UFO.setKeybinding = setKeybinding;

// Check if a key is bound to an action
function isKeyBound(action, keyCode) {
    return currentKeybindings[action]?.includes(keyCode) ?? false;
}
window.UFO.isKeyBound = isKeyBound;
window.isKeyBound = isKeyBound; // Global access for game.js

// Reset keybindings to defaults
function resetKeybindings() {
    currentKeybindings = JSON.parse(JSON.stringify(DEFAULT_KEYBINDINGS));
    window.UFO.currentKeybindings = currentKeybindings;
}
window.UFO.resetKeybindings = resetKeybindings;

// =====================================================
// RADAR SITE OBJECTIVES
// Military installations that increase enemy spawns
// =====================================================
const RADAR_SITE_CONFIG = {
    // Ship count per phase (spawns additional ships as phases progress)
    SHIPS_PER_PHASE: [4, 2, 3, 3, 4], // Phase 1: 4, Phase 2: +2, Phase 3: +3, Phase 4: +3, Phase 5: +4
    MIN_SITE_DISTANCE: 600,           // Minimum distance between ships (reduced for more ships)
    
    // Ship health (scaled 8x)
    SHIP_HEALTH: 2400,                // Total ship HP - scaled 8x
    
    // Detection mechanics
    DETECTION_RADIUS: 500,            // Radius where player is "detected"
    DETECTION_SPAWN_MULTIPLIER: 1.5,  // 50% more spawns when in detection zone
    PING_INTERVAL: 2.0,               // Seconds between radar pings
    
    // SAM missiles - balanced for player health (60-180 HP)
    SAM_FIRE_RATE: 3.0,               // Seconds between missile launches (was 2.5)
    MISSILE_SPEED: 200,               // Missile velocity (was 250, easier to dodge)
    MISSILE_DAMAGE: 25,               // Damage per missile hit (was 200 - way too high!)
    MISSILE_TRACKING: true,           // Missiles track player
    
    // Rewards
    DESTRUCTION_REWARD: 100,          // Currency for destroying ship
    XP_PER_COMPONENT: 100,            // Base XP for destruction
};

// =====================================================
// TEMPORARY POWER-UPS (Keys Q, E, F)
// Dropped by enemies, limited duration buffs
// SIMPLIFIED SYSTEM: 3 pickups (Q/E/SPACE) + R for UAP Special
// =====================================================
const POWERUPS = {
    // SPACE - Always available, energy-based dash
    phaseShift: {
        key: 'SPACE',
        name: 'PHASE SHIFT',
        icon: '💨',
        description: 'Instant teleport dash through enemies - energy recharges over time',
        type: 'mobility',
        color: '#ff00ff',
        glowColor: '#ff88ff',
        duration: 0.3, // Brief invulnerability after dash
        usesEnergy: true,
        energyCost: 33, // 3 dashes max
        // Effects
        dashDistance: 250,
        invulnerableTime: 0.3,
        // Not dropped - always available
        dropChance: 0,
        eliteDropChance: 0,
        bossDropChance: 0
    },
    // Q - Offensive powerup (pickup)
    overdrive: {
        key: 'Q',
        name: 'OVERDRIVE',
        icon: '⚡',
        description: 'Weapons fire 3x faster with +100% damage for 8 seconds',
        type: 'offense',
        color: '#ff6600',
        glowColor: '#ffaa00',
        duration: 8.0,
        // Effects
        attackSpeedMult: 3.0,
        damageMult: 2.0,
        extraProjectiles: 2,
        // Drop settings
        dropChance: 0.012,
        eliteDropChance: 0.20,
        bossDropChance: 1.0
    },
    // E - Defensive powerup (pickup)
    shield: {
        key: 'E',
        name: 'QUANTUM SHIELD',
        icon: '🛡️',
        description: 'Invulnerability for 6 seconds - damages nearby enemies',
        type: 'defense',
        color: '#00ccff',
        glowColor: '#66ffff',
        duration: 6.0,
        // Effects
        invulnerable: true,
        reflectDamage: 400,
        reflectRadius: 60,
        healOnHit: 3,
        // Drop settings
        dropChance: 0.010,
        eliteDropChance: 0.18,
        bossDropChance: 0.9
    },
    // F - CHRONO BURST (time manipulation)
    chronoBurst: {
        key: 'F',
        name: 'CHRONO BURST',
        icon: '⏱️',
        description: 'Time dilation field - slow enemies, speed up player, magnetize XP',
        type: 'utility',
        color: '#ffff00',
        glowColor: '#ffffaa',
        duration: 8.0,
        // Effects
        speedBoost: 1.5,           // Player 50% faster
        enemySlowdown: 0.4,        // Enemies 60% slower
        xpMagnetRange: 400,        // XP magnetism radius
        // Drop settings
        dropChance: 0.008,
        eliteDropChance: 0.15,
        bossDropChance: 0.8
    },
    // R - Ultimate Power-up (player selects which one before the run)
    // The actual effects are defined in ULTIMATES constant
    ultimate: {
        key: 'R',
        name: 'ULTIMATE',  // Name is dynamic based on selection
        icon: '⭐',        // Icon is dynamic based on selection
        description: 'Your selected ultimate ability',
        type: 'ultimate',
        color: '#ffaa00',
        glowColor: '#ffdd66',
        // Drop settings - rare but achievable
        dropChance: 0.005,         // 0.5% from normal enemies
        eliteDropChance: 0.15,     // 15% from elites
        bossDropChance: 0.8        // 80% from bosses
    }
};

// =====================================================
// SCI-FI ULTIMATES - Selectable R-Key Power-ups
// Player chooses their ultimate before each run
// Inspired by iconic sci-fi weapons/abilities
// =====================================================
const ULTIMATES = {
    droplet: {
        id: 'droplet',
        name: 'THE DROPLET',
        source: 'Three Body Problem',
        icon: '💧',
        sprite: 'droplet',
        description: 'Transform into the indestructible Trisolaran probe',
        lore: 'A single droplet destroyed the entire human fleet in seconds...',
        color: '#c0c0c0',
        glowColor: '#ffffff',
        duration: 10.0,
        // Effects
        invulnerable: true,
        speedBoost: 3.0,
        ramDamage: 99999,
        ramRadius: 40,
        knockbackForce: 800,
        // Drawback: No XP/salvage collection during transformation
        noCollection: true,
        vulnerableAfter: 2.0  // 2s vulnerability after effect ends
    },
    
    replicators: {
        id: 'replicators',
        name: 'REPLICATOR SWARM',
        source: 'Stargate',
        icon: '🕷️',
        sprite: 'replicators',
        description: 'Deploy self-replicating drones that seek and destroy',
        lore: 'They consume technology and multiply. Unstoppable.',
        color: '#888888',
        glowColor: '#aaaaaa',
        duration: 15.0,
        // Effects
        droneCount: 8,
        droneHP: 30,
        droneDamage: 25,
        droneSpeed: 350,
        replicateOnKill: true,    // Killed enemy spawns new drone (up to max)
        maxDrones: 12
    }
};

// Default ultimate selection
const DEFAULT_ULTIMATE = 'droplet';

// =====================================================
// LEGACY ABILITIES - DEPRECATED
// Replaced by simplified 4-action system:
// SPACE=Dash, Q=Overdrive, E=Shield, R=UAP Special
// =====================================================
/* ABILITIES REMOVED - keeping for reference
const ABILITIES = {
    plasmaNova: {
        key: 1,
        name: 'PLASMA NOVA',
        icon: '💥',
        description: 'Release a devastating energy burst that damages all nearby enemies',
        type: 'offensive',
        color: '#ff4400',
        maxCharges: 3,
        baseRadius: 300,
        baseDamage: 640,       // Scaled 8x
        // Per-level upgrades
        radiusPerLevel: 50,
        damagePerLevel: 160    // Scaled 8x
    },
    phaseCloak: {
        key: 2,
        name: 'PHASE CLOAK',
        icon: '👻',
        description: 'Become intangible - enemies pass right through you',
        type: 'defensive',
        color: '#8800ff',
        maxCharges: 2,
        baseDuration: 2.0,
        // Per-level upgrades
        durationPerLevel: 0.5
    },
    gravityBomb: {
        key: 3,
        name: 'GRAVITY BOMB',
        icon: '🕳️',
        description: 'Deploy a singularity that pulls in and crushes enemies',
        type: 'control',
        color: '#4400aa',
        maxCharges: 2,
        baseRadius: 200,
        baseDamage: 120,       // Scaled 8x (per tick)
        baseDuration: 3.0,
        basePullForce: 400,
        // Per-level upgrades
        radiusPerLevel: 30,
        damagePerLevel: 40,    // Scaled 8x
        durationPerLevel: 0.5
    },
    shieldMatrix: {
        key: 4,
        name: 'SHIELD MATRIX',
        icon: '🛡️',
        description: 'Generate an energy barrier that absorbs incoming damage',
        type: 'defensive',
        color: '#00aaff',
        maxCharges: 2,
        baseShieldHP: 400,     // Scaled 8x
        baseDuration: 8.0,
        // Per-level upgrades
        shieldHPPerLevel: 200, // Scaled 8x
        durationPerLevel: 2.0
    },
    timeWarp: {
        key: 5,
        name: 'TIME WARP',
        icon: '⏱️',
        description: 'Distort spacetime - enemies move at a crawl while you move freely',
        type: 'utility',
        color: '#ffff00',
        maxCharges: 2,
        baseDuration: 4.0,
        baseSlowAmount: 0.2, // Enemies at 20% speed
        // Per-level upgrades
        durationPerLevel: 1.0,
        slowPerLevel: -0.03 // Gets slower
    }
};
END OF LEGACY ABILITIES */

// =====================================================
// PHASE DEFINITIONS - Core gameplay progression
// Each phase has distinct identity, enemies, and mechanics
// =====================================================
const PHASES = [
    // Phase 1: DETECTED (0:00 - 5:00)
    // You've been spotted. Military scrambling to respond.
    {
        name: 'DETECTED',
        subtitle: 'They\'ve Found You',
        description: 'Your presence has been detected. Military forces are scrambling to intercept.',
        startTime: 0,
        endTime: 5 * 60,
        color: '#44aa44',
        bgTint: 'rgba(40, 80, 40, 0.1)',
        // Difficulty modifiers
        enemyHealthMod: 1.0,
        enemyDamageMod: 1.0,
        enemySpeedMod: 1.0,
        xpMod: 1.0,
        // Phase mechanics
        mechanics: [
            'Standard enemy spawns',
            'Radar sites begin tracking'
        ]
    },
    // Phase 2: ENGAGED (5:00 - 10:00)
    // They're coming for you. Fighter squadrons deployed.
    {
        name: 'ENGAGED',
        subtitle: 'Under Fire',
        description: 'Full military response authorized. Fighter squadrons closing on your position.',
        startTime: 5 * 60,
        endTime: 10 * 60,
        color: '#aaaa44',
        bgTint: 'rgba(80, 80, 40, 0.1)',
        enemyHealthMod: 1.15,
        enemyDamageMod: 1.1,
        enemySpeedMod: 1.05,
        xpMod: 1.15,
        mechanics: [
            'Increased spawn rates',
            'Naval vessels enter combat',
            'Missile frigates begin bombardment'
        ]
    },
    // Phase 3: REINFORCED (10:00 - 17:00)
    // Backup has arrived. They're not letting you escape.
    {
        name: 'REINFORCED',
        subtitle: 'Nowhere to Hide',
        description: 'Reinforcements inbound. Advanced interceptors and stealth bombers joining the hunt.',
        startTime: 10 * 60,
        endTime: 17 * 60,
        color: '#cc8844',
        bgTint: 'rgba(100, 60, 30, 0.15)',
        enemyHealthMod: 1.35,
        enemyDamageMod: 1.25,
        enemySpeedMod: 1.1,
        xpMod: 1.3,
        mechanics: [
            'Elite enemies spawn regularly',
            'Stealth bomber runs',
            'Aegis cruiser support'
        ]
    },
    // Phase 4: SCRAMBLE (17:00 - 24:00)
    // Everything they have. Black projects revealed.
    {
        name: 'SCRAMBLE',
        subtitle: 'Black Projects',
        description: 'Classified weapons systems deployed. They\'re throwing everything at you.',
        startTime: 17 * 60,
        endTime: 24 * 60,
        color: '#aa4444',
        bgTint: 'rgba(100, 40, 40, 0.15)',
        enemyHealthMod: 1.6,
        enemyDamageMod: 1.45,
        enemySpeedMod: 1.15,
        xpMod: 1.5,
        mechanics: [
            'Experimental craft deployed',
            'Drone swarm tactics',
            'Mini-boss waves',
            'Orbital strike warnings'
        ]
    },
    // Phase 5: CONTAINMENT (24:00+)
    // Total military response - continues indefinitely with scaling difficulty
    {
        name: 'CONTAINMENT',
        subtitle: 'No Escape',
        description: 'Full containment protocol. All remaining forces committed to your destruction.',
        startTime: 24 * 60,
        endTime: Infinity,  // Endless mode - no end
        color: '#ff4444',
        bgTint: 'rgba(120, 30, 30, 0.2)',
        enemyHealthMod: 1.85,
        enemyDamageMod: 1.6,
        enemySpeedMod: 1.15,
        xpMod: 2.0,
        mechanics: [
            'Maximum spawn intensity',
            'Multiple bosses active',
            'Ace pilot squadrons',
            'Carrier battle groups',
            'Constant elite spawns'
        ]
    }
];

// Endless mode scaling - multipliers applied per 10-minute cycle after Phase 5
// Reduced values for smoother difficulty curve
const ENDLESS_SCALING = {
    healthPerCycle: 0.15,    // +15% enemy HP per cycle (was 25%)
    damagePerCycle: 0.10,    // +10% enemy damage per cycle (was 15%)
    speedPerCycle: 0.03,     // +3% enemy speed per cycle (was 5%) - capped at 50% bonus
    speedCap: 1.5,           // Max speed multiplier
    spawnRatePerCycle: 0.05  // +5% spawn rate per cycle (was 10%)
};

// UAP_TYPES is defined in js/data/uapTypes.js

// =====================================================
// ENEMY TYPES - Balanced per phase with distinct roles
// Health scaled 8x for satisfying damage numbers
// =====================================================
const ENEMY_TYPES = {
    // ===== PHASE 1: INVESTIGATION (0:00 - 5:00) =====
    // Light reconnaissance units - learning player patterns
    
    reconDrone: {
        name: 'Recon Drone',
        phase: 0,
        tier: 'fodder',
        health: 60,           // Low HP fodder
        speed: 80,            // Moderately fast
        damage: 6,            // Low damage
        xp: 1,
        size: 12,
        color: '#888888',
        shape: 'circle',
        behavior: 'chase',
        description: 'Basic surveillance drone. Fast but fragile.'
    },
    scoutPlane: {
        name: 'Scout Plane',
        phase: 0,
        tier: 'fodder',
        health: 90,
        speed: 100,
        damage: 8,
        xp: 1,
        size: 14,
        color: '#6699aa',
        shape: 'triangle',
        behavior: 'chase',
        description: 'Light reconnaissance aircraft.'
    },
    patrolJet: {
        name: 'F/A-18 Patrol',
        phase: 0,
        tier: 'common',
        health: 160,          // Medium HP
        speed: 110,
        damage: 12,
        xp: 2,
        size: 18,
        color: '#4488aa',
        shape: 'triangle',
        behavior: 'chase',
        description: 'Standard fighter jet on patrol duty.'
    },
    helicopter: {
        name: 'Search Helicopter',
        phase: 0,
        tier: 'common',
        health: 240,          // Tanky but slow
        speed: 50,
        damage: 10,
        xp: 3,
        size: 24,
        color: '#446644',
        shape: 'circle',
        behavior: 'orbit',
        description: 'Search and rescue helicopter. Orbits at distance.'
    },
    cutter: {
        name: 'Coast Guard Cutter',
        phase: 0,
        tier: 'elite',
        health: 480,          // Mini-elite for phase 1
        speed: 30,
        damage: 18,
        xp: 6,
        size: 32,
        color: '#ff6633',
        shape: 'rect',
        behavior: 'chase',
        elite: true,
        description: 'Armed coast guard vessel. Slow but durable.'
    },
    
    // ===== PHASE 2: ENGAGEMENT (5:00 - 10:00) =====
    // Full military response - organized squadrons
    
    fighterSquadron: {
        name: 'Fighter Squadron',
        phase: 1,
        tier: 'common',
        health: 180,
        speed: 130,
        damage: 14,
        xp: 2,
        size: 16,
        color: '#5599cc',
        shape: 'triangle',
        behavior: 'swarm',
        description: 'Coordinated fighter formation. Strength in numbers.'
    },
    attackHelicopter: {
        name: 'AH-64 Apache',
        phase: 1,
        tier: 'common',
        health: 320,
        speed: 65,
        damage: 20,
        xp: 4,
        size: 26,
        color: '#556644',
        shape: 'circle',
        behavior: 'strafe',
        shoots: true,
        shootRate: 2500,
        description: 'Attack helicopter with missile pods.'
    },
    missileFrigate: {
        name: 'Missile Frigate',
        phase: 1,
        tier: 'tough',
        health: 720,
        speed: 22,
        damage: 30,
        xp: 8,
        size: 34,
        color: '#556677',
        shape: 'rect',
        behavior: 'slow',
        shoots: true,
        shootRate: 3000,
        description: 'Naval frigate with guided missiles.'
    },
    seahawk: {
        name: 'SH-60 Seahawk',
        phase: 1,
        tier: 'common',
        health: 280,
        speed: 70,
        damage: 16,
        xp: 4,
        size: 24,
        color: '#667799',
        shape: 'circle',
        behavior: 'orbit',
        shoots: false,
        deploysSonar: true,
        sonarRate: 4000,
        description: 'Naval helicopter. Deploys sonar buoys that slow nearby enemies.'
    },
    destroyer: {
        name: 'Arleigh Burke',
        phase: 1,
        tier: 'elite',
        health: 1200,
        speed: 18,
        damage: 35,
        xp: 15,
        size: 44,
        color: '#667788',
        shape: 'rect',
        behavior: 'slow',
        shoots: true,
        shootRate: 2000,
        elite: true,
        description: 'Guided missile destroyer. Heavy firepower.'
    },
    
    // ===== PHASE 3: ESCALATION (10:00 - 17:00) =====
    // Advanced interceptors and stealth units
    
    raptor: {
        name: 'F-22 Raptor',
        phase: 2,
        tier: 'common',
        health: 380,
        speed: 170,
        damage: 24,
        xp: 4,
        size: 20,
        color: '#5566aa',
        shape: 'triangle',
        behavior: 'strafe',
        description: 'Advanced air superiority fighter. Fast and agile.'
    },
    f35: {
        name: 'F-35 Lightning',
        phase: 2,
        tier: 'common',
        health: 440,
        speed: 150,
        damage: 28,
        xp: 5,
        size: 22,
        color: '#6677aa',
        shape: 'triangle',
        behavior: 'chase',
        shoots: true,
        shootRate: 2500,
        stealth: true,
        stealthRange: 250,
        description: 'Stealth multirole fighter. Invisible until close.'
    },
    b2Bomber: {
        name: 'B-2 Spirit',
        phase: 2,
        tier: 'tough',
        health: 800,
        speed: 90,
        damage: 45,
        xp: 12,
        size: 38,
        color: '#3a3a5e',
        shape: 'triangle',
        behavior: 'bombing',
        dropsBombs: true,
        bombRate: 2000,
        bombDamage: 60,
        bombRadius: 80,
        stealth: true,
        stealthRange: 300,
        description: 'Stealth bomber. Drops damaging bomb zones.'
    },
    aegisCruiser: {
        name: 'Aegis Cruiser',
        phase: 2,
        tier: 'elite',
        health: 2000,
        speed: 15,
        damage: 35,
        xp: 25,
        size: 50,
        color: '#666688',
        shape: 'rect',
        behavior: 'slow',
        shoots: true,
        shootRate: 1500,
        elite: true,
        description: 'Guided missile cruiser. Area denial specialist.'
    },
    submarine: {
        name: 'Virginia Class',
        phase: 2,
        tier: 'tough',
        health: 1000,
        speed: 25,
        damage: 50,
        xp: 15,
        size: 40,
        color: '#4466aa',
        shape: 'rect',
        behavior: 'slow',
        shoots: true,
        shootRate: 4000,
        stealth: true,
        stealthRange: 200,
        description: 'Nuclear attack submarine. Launches cruise missiles.'
    },
    
    // ===== PHASE 4: DESPERATE MEASURES (17:00 - 24:00) =====
    // Experimental and black project units
    
    experimentalCraft: {
        name: 'Aurora',
        phase: 3,
        tier: 'common',
        health: 560,
        speed: 200,
        damage: 32,
        xp: 6,
        size: 24,
        color: '#8844aa',
        shape: 'diamond',
        behavior: 'mimic',
        description: 'Classified hypersonic craft. Mimics player movement.'
    },
    droneSwarm: {
        name: 'Drone Swarm',
        phase: 3,
        tier: 'fodder',
        health: 50,
        speed: 140,
        damage: 4,
        xp: 2,
        size: 8,
        color: '#99aacc',
        shape: 'circle',
        behavior: 'swarm',
        spawnsCluster: true,
        clusterCount: 8,
        clusterSpread: 60,
        description: 'Autonomous micro-drones. Overwhelm with numbers.'
    },
    railgunTank: {
        name: 'Railgun Platform',
        phase: 3,
        tier: 'tough',
        health: 1400,
        speed: 20,
        damage: 80,
        xp: 18,
        size: 45,
        color: '#556655',
        shape: 'rect',
        behavior: 'stationary',
        shoots: true,
        shootRate: 3500,
        description: 'Experimental railgun emplacement. Devastating single shots.'
    },
    blackHawk: {
        name: 'MH-X Silent Hawk',
        phase: 3,
        tier: 'common',
        health: 480,
        speed: 85,
        damage: 25,
        xp: 7,
        size: 28,
        color: '#4a4a6a',
        shape: 'circle',
        behavior: 'pursuit',
        stealth: true,
        stealthRange: 180,
        shoots: true,
        shootRate: 1800,
        description: 'Stealth helicopter. Invisible until very close.'
    },
    orbitalStrike: {
        name: 'Orbital Strike',
        phase: 3,
        tier: 'hazard',
        health: 1,
        speed: 0,
        damage: 200,
        xp: 0,
        size: 100,
        color: '#ff4444',
        shape: 'warning',
        behavior: 'hazard',
        warningTime: 2.0,
        strikeRadius: 120,
        description: 'Kinetic bombardment from orbit. Avoid the red zone!'
    },
    
    // ===== PHASE 5: FINAL STAND (24:00 - 30:00) =====
    // Everything humanity has - bosses and elite squads
    
    acePilot: {
        name: 'Cmdr. Fravor',
        phase: 4,
        tier: 'miniboss',
        health: 1800,
        speed: 210,
        damage: 55,
        xp: 60,
        size: 26,
        color: '#ffcc00',
        shape: 'triangle',
        behavior: 'pursuit',
        elite: true,
        description: 'Legendary pilot. Relentless pursuit tactics.'
    },
    eliteSquadron: {
        name: 'Top Gun Squadron',
        phase: 4,
        tier: 'common',
        health: 600,
        speed: 180,
        damage: 40,
        xp: 8,
        size: 22,
        color: '#ddaa33',
        shape: 'triangle',
        behavior: 'swarm',
        description: 'Elite fighter squadron. Coordinated attacks.'
    },
    nuclearSub: {
        name: 'Ohio Class',
        phase: 4,
        tier: 'elite',
        health: 2400,
        speed: 12,
        damage: 80,
        xp: 40,
        size: 55,
        color: '#3355aa',
        shape: 'rect',
        behavior: 'slow',
        shoots: true,
        shootRate: 5000,
        elite: true,
        description: 'Ballistic missile submarine. Nuclear option.'
    },
    nimitzCarrier: {
        name: 'USS Nimitz',
        phase: 4,
        tier: 'boss',
        health: 12000,
        speed: 8,
        damage: 60,
        xp: 300,
        size: 140,
        color: '#6688aa',
        shape: 'rect',
        behavior: 'boss',
        shoots: true,
        shootRate: 1000,
        launchesSquadrons: true,
        squadronSpawnRate: 5000,
        boss: true,
        description: 'Supercarrier. Launches elite fighter squadrons.'
    },
    fordCarrier: {
        name: 'USS Gerald R. Ford',
        phase: 4,
        tier: 'boss',
        health: 18000,
        speed: 6,
        damage: 80,
        xp: 500,
        size: 160,
        color: '#5577aa',
        shape: 'rect',
        behavior: 'bossDrones',
        shoots: true,
        shootRate: 800,
        launchesDrones: true,
        droneSpawnRate: 4000,
        boss: true,
        description: 'Next-gen supercarrier. Deploys autonomous drone swarms.'
    },
    globalHawk: {
        name: 'RQ-4 Global Hawk',
        phase: 4,
        tier: 'tough',
        health: 700,
        speed: 120,
        damage: 30,
        xp: 10,
        size: 30,
        color: '#aaaacc',
        shape: 'triangle',
        behavior: 'orbit',
        shoots: true,
        shootRate: 2000,
        description: 'High-altitude surveillance drone. Marks targets.'
    }
};

// =====================================================
// WEAPONS - Balanced for 30-minute progression
// Base damage balanced against Phase 1 enemy HP (60-160)
// Level 8 weapons should handle Phase 3-4 enemies
// =====================================================
const WEAPONS = {
    // ===== STARTING WEAPONS =====
    // Each starter has a unique mechanic that rewards different playstyles
    
    plasmaBurst: {
        name: 'Plasma Burst',
        icon: '💥',
        description: 'AOE pulse that scales with your speed - move fast, hit hard!',
        type: 'plasmaBurst',
        tier: 'starter',
        baseDamage: 80,            // Base damage when stationary
        baseRadius: 70,
        baseCooldown: 1200,
        maxLevel: 8,
        levelBonuses: {
            damage: 30,            // Level 8: 290 damage
            radius: 12,            // Level 8: 154 radius
            cooldown: -80          // Level 8: 640ms
        },
        speedScaling: 2.0,         // At max speed: 2x damage, 1.5x radius
        color: '#ff6600',
        dps: 67
    },
    
    abductionRay: {
        name: 'Abduction Ray',
        icon: '👽',
        description: 'Mark enemies for abduction - marked targets take +50% damage from all sources',
        type: 'abductionRay',
        tier: 'starter',
        baseDamage: 50,            // Low direct damage
        baseMarks: 3,              // Enemies marked per activation
        baseCooldown: 2000,
        baseRange: 250,
        markDuration: 4000,        // 4 seconds marked
        markDamageBonus: 0.5,      // +50% damage from all sources
        maxLevel: 8,
        levelBonuses: {
            damage: 20,            // Level 8: 190 damage
            marks: 1,              // Level 8: 10 marks
            cooldown: -100,        // Level 8: 1300ms
            range: 30              // Level 8: 460 range
        },
        color: '#00ff88',
        dps: 25
    },
    
    warpProjectiles: {
        name: 'Warp Bolts',
        icon: '🌀',
        description: 'Phase-shifting bolts that teleport through enemies, hitting from behind',
        type: 'warpProjectiles',
        tier: 'starter',
        baseDamage: 90,
        baseProjectiles: 3,
        baseCooldown: 1400,
        baseRange: 350,
        warpDistance: 80,          // How far they teleport past first target
        maxLevel: 8,
        levelBonuses: {
            damage: 35,            // Level 8: 335 damage
            projectiles: 1,        // Level 8: 10 projectiles
            cooldown: -70          // Level 8: 910ms
        },
        color: '#aa44ff',
        dps: 193
    },
    
    ionTrail: {
        name: 'Ion Trail',
        icon: '⚡',
        description: 'Leave a damaging energy trail while moving - stop moving, stop damage',
        type: 'ionTrail',
        tier: 'starter',
        baseDamage: 40,            // Per tick while enemies in trail
        trailWidth: 30,
        trailDuration: 2000,       // Trail lingers 2 seconds
        baseCooldown: 100,         // Creates trail segments frequently
        maxLevel: 8,
        levelBonuses: {
            damage: 15,            // Level 8: 145 damage/tick
            trailWidth: 5,         // Level 8: 65 width
            trailDuration: 200     // Level 8: 3400ms duration
        },
        color: '#00ffff',
        dps: 400                   // High if constantly moving
    },
    
    probeSwarm: {
        name: 'Probe Swarm',
        icon: '🛸',
        description: 'Deploy probes that orbit you, then swarm and detonate on enemies',
        type: 'probeSwarm',
        tier: 'starter',
        baseDamage: 120,           // Per probe explosion
        baseProbes: 4,             // Probes deployed per wave
        baseCooldown: 3500,
        orbitTime: 2000,           // Orbit for 2 seconds before attacking
        maxLevel: 8,
        levelBonuses: {
            damage: 45,            // Level 8: 435 damage
            probes: 1,             // Level 8: 11 probes
            cooldown: -200         // Level 8: 2100ms
        },
        color: '#88ffaa',
        dps: 137
    },
    
    // ===== UNCOMMON WEAPONS =====
    // Mid-tier with interesting mechanics
    
    cropCircle: {
        name: 'Crop Circle',
        icon: '🌾',
        description: 'Create expanding rings - enemies at the edge take TRIPLE damage',
        type: 'cropCircle',
        tier: 'uncommon',
        baseDamage: 60,            // Center damage
        edgeDamageMultiplier: 3.0, // 3x at edge
        baseRadius: 120,
        baseCooldown: 2800,
        expandTime: 800,           // Time to reach full size
        maxLevel: 8,
        levelBonuses: {
            damage: 25,            // Level 8: 235 center, 705 edge
            radius: 20,            // Level 8: 260 radius
            cooldown: -150         // Level 8: 1750ms
        },
        color: '#aaff00'
    },
    
    cattleMutilator: {
        name: 'Cattle Mutilator',
        icon: '🐄',
        description: 'Mark a random enemy - killing it drops health and pulls all XP to you',
        type: 'cattleMutilator',
        tier: 'uncommon',
        baseDamage: 0,             // No direct damage
        markDuration: 8000,        // 8 seconds to kill target
        healthDropAmount: 15,      // Health dropped on kill
        xpPullRadius: 500,         // Pull XP from this radius
        baseCooldown: 10000,
        maxLevel: 8,
        levelBonuses: {
            markDuration: 1000,    // Level 8: 15 seconds
            healthDrop: 5,         // Level 8: 50 health
            xpPullRadius: 100,     // Level 8: 1200 radius
            cooldown: -600         // Level 8: 5800ms
        },
        color: '#ff4488'
    },
    
    menInBlack: {
        name: 'Men in Black',
        icon: '🕴️',
        description: 'Spawn MIB agents that erase weak enemies and deal % damage to strong ones',
        type: 'menInBlack',
        tier: 'uncommon',
        baseDamage: 100,           // Flat damage to strong enemies
        percentDamage: 0.15,       // 15% current HP damage
        executeThreshold: 0.2,     // Instakill enemies below 20% HP
        baseAgents: 2,
        agentDuration: 5000,
        baseCooldown: 6000,
        maxLevel: 8,
        levelBonuses: {
            damage: 40,            // Level 8: 380 damage
            percentDamage: 0.02,   // Level 8: 29% HP damage
            agents: 1,             // Level 8: 9 agents
            cooldown: -300         // Level 8: 3900ms
        },
        color: '#222222'
    },
    
    radarJammer: {
        name: 'Radar Jammer',
        icon: '📡',
        description: 'Confuse enemies in radius - they attack each other for 3 seconds',
        type: 'radarJammer',
        tier: 'uncommon',
        baseDamage: 0,             // Enemies damage each other
        baseRadius: 100,
        confuseDuration: 3000,
        baseCooldown: 12000,
        maxLevel: 8,
        levelBonuses: {
            radius: 20,            // Level 8: 240 radius
            confuseDuration: 300,  // Level 8: 5100ms confusion
            cooldown: -700         // Level 8: 7100ms
        },
        color: '#ffaa00'
    },
    
    // ===== RARE WEAPONS =====
    // Powerful with significant risk/reward
    
    singularityEngine: {
        name: 'Singularity Engine',
        icon: '⚫',
        description: 'HOLD STILL to charge a devastating black hole - moving cancels charge!',
        type: 'singularityEngine',
        tier: 'rare',
        baseDamage: 500,           // Massive damage
        chargeTime: 2500,          // Must stand still 2.5 seconds
        baseRadius: 150,
        pullStrength: 200,         // Pulls enemies in
        baseCooldown: 15000,
        maxLevel: 8,
        levelBonuses: {
            damage: 150,           // Level 8: 1550 damage
            chargeTime: -150,      // Level 8: 1450ms charge
            radius: 25,            // Level 8: 325 radius
            cooldown: -800         // Level 8: 9400ms
        },
        color: '#440088'
    },
    
    timelineSplice: {
        name: 'Timeline Splice',
        icon: '⏰',
        description: 'Create a time echo that replays your last 4 seconds of movement and attacks',
        type: 'timelineSplice',
        tier: 'rare',
        baseDamage: 0,             // Echo deals 80% of your weapon damage
        echoDamagePercent: 0.8,
        echoDelay: 1500,           // Echo starts 1.5 seconds behind you
        echoDuration: 4000,        // Replays 4 seconds
        baseCooldown: 20000,
        maxLevel: 8,
        levelBonuses: {
            echoDamagePercent: 0.05, // Level 8: 115% damage
            echoDuration: 500,     // Level 8: 7.5 seconds
            cooldown: -1000        // Level 8: 13000ms
        },
        color: '#00ffff'
    },
    
    closeEncounter: {
        name: 'Close Encounter',
        icon: '👁️',
        description: 'Enemies that touch you are ABDUCTED - removed from play, grants bonus XP',
        type: 'closeEncounter',
        tier: 'rare',
        baseDamage: 9999,          // Instakill on contact
        abductRadius: 25,          // Very close range
        xpBonus: 2.0,              // 2x XP from abducted enemies
        maxAbductsPerSecond: 3,    // Rate limit
        baseCooldown: 100,         // Always checking
        maxLevel: 8,
        levelBonuses: {
            abductRadius: 5,       // Level 8: 60 radius
            xpBonus: 0.25,         // Level 8: 3.75x XP
            maxAbducts: 1          // Level 8: 10 per second
        },
        color: '#ffffff'
    },
    
    // ===== LEGACY WEAPONS (kept for compatibility) =====
    
    chainLightning: {
        name: 'Chain Lightning',
        icon: '⛈',
        description: 'Arcing electricity that jumps between nearby enemies',
        type: 'chain',
        tier: 'uncommon',
        baseDamage: 110,
        baseChains: 3,
        chainDamageDecay: 0.8,
        baseCooldown: 2200,
        chainRange: 150,
        maxLevel: 8,
        levelBonuses: {
            damage: 45,
            chains: 1,
            cooldown: -120
        },
        color: '#88ccff'
    },
    
    energyOrbit: {
        name: 'Energy Orbit',
        icon: '💫',
        description: 'Orbiting plasma spheres that damage enemies on contact',
        type: 'orbit',
        tier: 'uncommon',
        baseDamage: 80,
        baseOrbs: 2,
        baseSpeed: 3.5,
        orbitRadius: 70,
        maxLevel: 8,
        levelBonuses: {
            damage: 35,
            orbs: 1
        },
        color: '#ffff44'
    }
};

// Permanent upgrades (Star Chart System)
const UPGRADES = {
    propulsion: {
        name: 'Propulsion',
        icon: '🚀',
        color: '#44aaff',
        upgrades: [
            { name: 'Speed Boost', desc: '+5% movement speed', cost: 50, maxLevel: 5, effect: { speed: 0.05 }, x: 15, y: 15 },
            { name: 'Quick Start', desc: '+10% acceleration', cost: 75, maxLevel: 3, effect: { accel: 0.1 }, x: 25, y: 30 },
            { name: 'Phase Cooldown', desc: '-10% ability cooldowns', cost: 100, maxLevel: 3, effect: { cooldown: -0.1 }, x: 15, y: 45 },
            { name: 'Instant Shift', desc: 'Unlock teleport dash (Press SHIFT)', cost: 500, maxLevel: 1, effect: { dash: true }, x: 35, y: 45 }
        ]
    },
    defense: {
        name: 'Defense',
        icon: '🛡',
        color: '#44ff44',
        upgrades: [
            { name: 'Hull Plating', desc: '+10% max health', cost: 50, maxLevel: 5, effect: { health: 0.1 }, x: 85, y: 15 },
            { name: 'Shield Field', desc: '+5% damage resistance', cost: 75, maxLevel: 4, effect: { resistance: 0.05 }, x: 75, y: 30 },
            { name: 'Auto Repair', desc: '+1 health regen/sec', cost: 100, maxLevel: 3, effect: { regen: 1 }, x: 85, y: 45 },
            { name: 'Emergency Phase', desc: 'Auto-dodge lethal hit (once)', cost: 500, maxLevel: 1, effect: { secondChance: true }, x: 65, y: 45 }
        ]
    },
    weapons: {
        name: 'Weapons',
        icon: '🔫',
        color: '#ff4444',
        upgrades: [
            { name: 'Power Core', desc: '+5% damage', cost: 50, maxLevel: 5, effect: { damage: 0.05 }, x: 15, y: 85 },
            { name: 'Rapid Fire', desc: '+5% attack speed', cost: 75, maxLevel: 4, effect: { attackSpeed: 0.05 }, x: 25, y: 70 },
            { name: 'Wide Beam', desc: '+5% area of effect', cost: 75, maxLevel: 4, effect: { aoe: 0.05 }, x: 15, y: 55 },
            { name: 'Weapon Slot', desc: '+1 weapon slot', cost: 750, maxLevel: 2, effect: { weaponSlots: 1 }, x: 35, y: 55 }
        ]
    },
    recon: {
        name: 'Reconnaissance',
        icon: '📡',
        color: '#ffff44',
        upgrades: [
            { name: 'Magnet Field', desc: '+10% pickup range', cost: 50, maxLevel: 5, effect: { pickupRange: 0.1 }, x: 85, y: 85 },
            { name: 'Analysis', desc: '+5% XP gain', cost: 75, maxLevel: 5, effect: { xpGain: 0.05 }, x: 75, y: 70 },
            { name: 'Salvage', desc: '+3% rare drop chance', cost: 100, maxLevel: 4, effect: { dropChance: 0.03 }, x: 85, y: 55 },
            { name: 'Tactical Reset', desc: '+1 Reroll per run', cost: 500, maxLevel: 3, effect: { rerolls: 1 }, x: 65, y: 55 }
        ]
    }
};

// =====================================================
// WEAPON EVOLUTIONS
// =====================================================

const EVOLUTIONS = {
    gravityWave: {
        passive: 'spinach',
        evolved: 'singularityPulse'
    },
    empPulse: {
        passive: 'emptyTome',
        evolved: 'staticField'
    },
    gravityWell: {
        passive: 'magnet',
        evolved: 'blackHole'
    },
    droneSwarm: {
        passive: 'duplicator',
        evolved: 'hunterKiller'
    },
    energyOrbit: {
        passive: 'wings',
        evolved: 'teslaBarrier'
    },
    chainLightning: {
        passive: 'candelabrador',
        evolved: 'thunderGod'
    }
};

// Add evolved weapons to WEAPONS object
Object.assign(WEAPONS, {
    singularityPulse: {
        name: 'SINGULARITY PULSE',
        icon: '🌌',
        description: 'EVOLVED: Creates devastating gravity pulses that implode enemies',
        type: 'projectile',
        baseDamage: 35,
        baseProjectiles: 8,
        baseCooldown: 600,
        baseSpeed: 500,
        baseRadius: 80, // Explosion radius
        maxLevel: 1, // Evolved weapons don't level up
        levelBonuses: {},
        color: '#9933ff',
        isEvolved: true
    },
    plasmaStorm: {
        name: 'PLASMA STORM',
        icon: '☄️',
        description: 'EVOLVED: Continuous stream of high-energy plasma',
        type: 'projectile',
        baseDamage: 25,
        baseProjectiles: 12,
        baseCooldown: 200, // Extremely fast
        baseSpeed: 700,
        maxLevel: 1, // Evolved weapons don't level up
        levelBonuses: {},
        color: '#ff3300',
        isEvolved: true
    },
    staticField: {
        name: 'STATIC FIELD',
        icon: '⚡',
        description: 'EVOLVED: Permanent EMP field that vaporizes enemies',
        type: 'aoe',
        baseDamage: 30,
        baseRadius: 250,
        baseCooldown: 500,
        maxLevel: 1,
        levelBonuses: {},
        color: '#00ffff',
        isEvolved: true
    },
    blackHole: {
        name: 'EVENT HORIZON',
        icon: '⚫',
        description: 'EVOLVED: Massive gravity singularity that crushes everything',
        type: 'zone',
        baseDamage: 50,
        baseRadius: 150,
        baseCooldown: 4000,
        baseDuration: 3500,
        maxLevel: 1,
        levelBonuses: {},
        color: '#440088',
        isEvolved: true
    },
    hunterKiller: {
        name: 'HUNTER KILLERS',
        icon: '🛸',
        description: 'EVOLVED: Swarm of elite drones with laser weaponry',
        type: 'minion',
        baseDamage: 25,
        baseDrones: 6,
        baseCooldown: 2000,
        maxLevel: 1,
        levelBonuses: {},
        color: '#ff00ff',
        isEvolved: true
    },
    teslaBarrier: {
        name: 'TESLA BARRIER',
        icon: '🛡️',
        description: 'EVOLVED: High-velocity shield that electrocutes enemies',
        type: 'orbit',
        baseDamage: 35,
        baseOrbs: 4,
        baseSpeed: 6,
        maxLevel: 1,
        levelBonuses: {},
        color: '#ffff00',
        isEvolved: true
    },
    thunderGod: {
        name: 'THUNDER GOD',
        icon: '🌩️',
        description: 'EVOLVED: Global lightning strikes that chain infinitely',
        type: 'chain',
        baseDamage: 40,
        baseChains: 10,
        baseCooldown: 1500,
        maxLevel: 1,
        levelBonuses: {},
        color: '#ffffff',
        isEvolved: true
    }
});
