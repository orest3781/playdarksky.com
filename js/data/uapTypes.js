// =====================================================
// UAP (UNIDENTIFIED AERIAL PHENOMENA) TYPES
// Playable craft based on documented UFO sightings
// =====================================================

const UAP_TYPES = {
    // =====================================================
    // STARTER CRAFT
    // =====================================================
    
    saucer: {
        id: 'saucer',
        name: 'Classic Saucer',
        description: 'The iconic flying disc. Balanced stats for beginners.',
        lore: 'First reported in Kenneth Arnold\'s 1947 sighting that coined the term "flying saucer".',
        
        icon: '🛸',
        color: '#88ccff',
        unlockRequirement: null, // Default starter
        startingWeapon: 'warpProjectiles',
        
        stats: {
            maxHealth: 100,
            speed: 200,
            pickupRadius: 80,
            armor: 0
        },
        
        abilities: {
            passive: {
                name: 'Disc Deflection',
                description: '5% chance to deflect projectiles',
                effect: { deflectChance: 0.05 }
            },
            active: null
        },
        
        weaponAffinity: null, // No bonus
        
        visual: {
            shape: 'ellipse',
            size: { width: 40, height: 20 },
            glow: '#88ccff',
            trail: 'standard'
        }
    },
    
    // =====================================================
    // EARLY UNLOCKS
    // =====================================================
    
    triangle: {
        id: 'triangle',
        name: 'Black Triangle',
        description: 'Fast and deadly. Low health but high speed.',
        lore: 'Triangular craft seen during the Belgian UFO Wave (1989-1990), with thousands of witnesses.',
        
        icon: '🔺',
        color: '#333333',
        unlockRequirement: { type: 'survival_time', value: 1800 },
        startingWeapon: 'plasmaBurst',
        
        stats: {
            maxHealth: 70,
            speed: 280,
            pickupRadius: 60,
            armor: 0
        },
        
        abilities: {
            passive: {
                name: 'Stealth Mode',
                description: 'Enemies take 0.5s longer to target you',
                effect: { targetingDelay: 0.5 }
            },
            active: {
                name: 'Phase Shift',
                description: 'Become invulnerable for 2 seconds. 60s cooldown.',
                cooldown: 60,
                duration: 2
            }
        },
        
        weaponAffinity: { 
            weapon: 'emp', 
            bonus: { damage: 1.15 } 
        },
        
        visual: {
            shape: 'triangle',
            size: { width: 35, height: 40 },
            glow: '#ff4444',
            trail: 'ember'
        }
    },
    
    orb: {
        id: 'orb',
        name: 'Luminous Orb',
        description: 'Pure energy form. High damage but fragile.',
        lore: 'Foo Fighters reported by WWII pilots - mysterious glowing orbs that followed aircraft.',
        
        icon: '🔮',
        color: '#ffff00',
        unlockRequirement: { type: 'level_reached', value: 25 },
        startingWeapon: 'probeSwarm',
        
        stats: {
            maxHealth: 60,
            speed: 220,
            pickupRadius: 100,
            armor: 0
        },
        
        abilities: {
            passive: {
                name: 'Energy Form',
                description: '+20% damage dealt, +25% damage taken',
                effect: { damageBonus: 1.2, damageTaken: 1.25 }
            },
            active: {
                name: 'Nova Burst',
                description: 'Release an energy wave dealing 50 damage to nearby enemies. 45s cooldown.',
                cooldown: 45,
                damage: 50,
                radius: 200
            }
        },
        
        weaponAffinity: { 
            weapon: 'plasma', 
            bonus: { damage: 1.2, projectileSpeed: 1.15 } 
        },
        
        visual: {
            shape: 'circle',
            size: { width: 30, height: 30 },
            glow: '#ffff88',
            trail: 'energy'
        }
    },
    
    // =====================================================
    // MID-GAME UNLOCKS
    // =====================================================
    
    cigar: {
        id: 'cigar',
        name: 'Cigar Craft',
        description: 'Massive carrier type. Slow but extremely durable.',
        lore: 'Cigar-shaped mother ships reported worldwide, often seen "deploying" smaller craft.',
        
        icon: '🚀',
        color: '#aaaaaa',
        unlockRequirement: { type: 'collection_percent', value: 75 },
        startingWeapon: 'menInBlack',
        
        stats: {
            maxHealth: 180,
            speed: 140,
            pickupRadius: 70,
            armor: 15
        },
        
        abilities: {
            passive: {
                name: 'Reinforced Hull',
                description: 'Reduce all damage by flat 15',
                effect: { flatDamageReduction: 15 }
            },
            active: {
                name: 'Deploy Drones',
                description: 'Deploy 3 orb drones that orbit and fire. 90s cooldown.',
                cooldown: 90,
                droneCount: 3,
                droneDuration: 15
            }
        },
        
        weaponAffinity: { 
            weapon: 'missiles', 
            bonus: { projectileCount: 1 } 
        },
        
        visual: {
            shape: 'ellipse',
            size: { width: 60, height: 20 },
            glow: '#ffffff',
            trail: 'exhaust'
        }
    },
    
    ticTac: {
        id: 'ticTac',
        name: 'Tic Tac',
        description: 'The Nimitz UAP. Extreme maneuverability.',
        lore: 'The famous "Tic Tac" observed by Navy pilots in 2004, exhibiting impossible acceleration.',
        
        icon: '💊',
        color: '#ffffff',
        unlockRequirement: { type: 'boss_kills', value: 10 },
        startingWeapon: 'ionTrail',
        
        stats: {
            maxHealth: 85,
            speed: 300,
            pickupRadius: 75,
            armor: 5
        },
        
        abilities: {
            passive: {
                name: 'Transmedium',
                description: '+10% speed, ignore slowdown effects',
                effect: { speedBonus: 1.1, immuneSlow: true }
            },
            active: {
                name: 'Instant Acceleration',
                description: 'Dash in facing direction, invulnerable during dash. 20s cooldown.',
                cooldown: 20,
                distance: 300,
                invulnerable: true
            }
        },
        
        weaponAffinity: { 
            weapon: 'beam', 
            bonus: { damage: 1.1, range: 1.2 } 
        },
        
        visual: {
            shape: 'capsule',
            size: { width: 45, height: 22 },
            glow: '#ffffff',
            trail: 'warp'
        }
    },
    
    // =====================================================
    // LATE-GAME UNLOCKS
    // =====================================================
    
    adamski: {
        id: 'adamski',
        name: 'Adamski Scout',
        description: 'The contactee craft. Balanced with support abilities.',
        lore: 'George Adamski\'s famous photos from the 1950s sparked the contactee movement.',
        
        icon: '🪐',
        color: '#cc8844',
        unlockRequirement: { type: 'events_investigated', value: 15 },
        startingWeapon: 'abductionRay',
        
        stats: {
            maxHealth: 110,
            speed: 190,
            pickupRadius: 120,
            armor: 5
        },
        
        abilities: {
            passive: {
                name: 'Cosmic Awareness',
                description: '+50% pickup radius, see enemy health bars',
                effect: { pickupBonus: 1.5, showHealthBars: true }
            },
            active: {
                name: 'Healing Wave',
                description: 'Restore 25% of max health. 120s cooldown.',
                cooldown: 120,
                healPercent: 0.25
            }
        },
        
        weaponAffinity: { 
            weapon: 'tractorBeam', 
            bonus: { range: 1.3, pullStrength: 1.25 } 
        },
        
        visual: {
            shape: 'adamski',
            size: { width: 45, height: 35 },
            glow: '#ffcc44',
            trail: 'sparkle'
        }
    },
    
    jellyfish: {
        id: 'jellyfish',
        name: 'Jellyfish UAP',
        description: 'Organic appearance. Regenerates health over time.',
        lore: 'Bizarre "jellyfish" shaped UAP reported over military bases, seemingly aware of observers.',
        
        icon: '🎐',
        color: '#44ffaa',
        unlockRequirement: { type: 'survival_time_total', value: 18000 },
        startingWeapon: 'radarJammer',
        
        stats: {
            maxHealth: 95,
            speed: 170,
            pickupRadius: 85,
            armor: 0
        },
        
        abilities: {
            passive: {
                name: 'Regeneration',
                description: 'Regenerate 1% max health per second',
                effect: { healthRegen: 0.01 }
            },
            active: {
                name: 'Tentacle Grasp',
                description: 'Slow all enemies in range by 50% for 5 seconds. 75s cooldown.',
                cooldown: 75,
                slowPercent: 0.5,
                duration: 5,
                radius: 250
            }
        },
        
        weaponAffinity: { 
            weapon: 'tesla', 
            bonus: { chainCount: 1, chainRange: 1.2 } 
        },
        
        visual: {
            shape: 'jellyfish',
            size: { width: 35, height: 50 },
            glow: '#44ffaa',
            trail: 'tendril'
        }
    },
    
    // =====================================================
    // PRESTIGE/SECRET UNLOCKS
    // =====================================================
    
    cube: {
        id: 'cube',
        name: 'The Cube',
        description: 'The Ryan Graves cube-in-sphere. Defensive powerhouse.',
        lore: 'Cube-shaped object within a translucent sphere, reported by Navy pilots over the East Coast.',
        
        icon: '🧊',
        color: '#8888ff',
        unlockRequirement: { type: 'prestige_level', value: 5 },
        startingWeapon: 'singularityEngine',
        
        stats: {
            maxHealth: 140,
            speed: 160,
            pickupRadius: 90,
            armor: 20
        },
        
        abilities: {
            passive: {
                name: 'Sphere Shield',
                description: 'Absorb 20 damage from each hit',
                effect: { damageAbsorb: 20 }
            },
            active: {
                name: 'Dimension Lock',
                description: 'Freeze all enemies in place for 3 seconds. 90s cooldown.',
                cooldown: 90,
                duration: 3,
                radius: 350
            }
        },
        
        weaponAffinity: { 
            weapon: 'shield', 
            bonus: { blockChance: 1.25, reflectDamage: 1.5 } 
        },
        
        visual: {
            shape: 'cube-sphere',
            size: { width: 40, height: 40 },
            glow: '#8888ff',
            trail: 'geometric'
        }
    },
    
    gimbal: {
        id: 'gimbal',
        name: 'Gimbal',
        description: 'The rotating craft. Weapon-focused glass cannon.',
        lore: 'Named after the Navy\'s 2015 "Gimbal" video showing a rotating craft formation.',
        
        icon: '🌀',
        color: '#ff8844',
        unlockRequirement: { type: 'achievement', value: 'arsenal' },
        startingWeapon: 'cropCircle',
        
        stats: {
            maxHealth: 75,
            speed: 210,
            pickupRadius: 70,
            armor: 0
        },
        
        abilities: {
            passive: {
                name: 'Weapon Master',
                description: '+15% all weapon damage, +10% attack speed',
                effect: { allWeaponDamage: 1.15, attackSpeed: 1.1 }
            },
            active: {
                name: 'Weapons Hot',
                description: 'Double fire rate for 8 seconds. 60s cooldown.',
                cooldown: 60,
                duration: 8,
                fireRateMultiplier: 2
            }
        },
        
        weaponAffinity: null, // Bonus to ALL weapons
        
        visual: {
            shape: 'disc-rotating',
            size: { width: 38, height: 38 },
            glow: '#ff8844',
            trail: 'rotation'
        }
    },
    
    goFast: {
        id: 'goFast',
        name: 'Go Fast',
        description: 'Pure speed. Named after the Navy video.',
        lore: 'The "Go Fast" UAP from 2015, tracked by Navy pilots moving at incredible speeds.',
        
        icon: '💨',
        color: '#44aaff',
        unlockRequirement: { type: 'achievement', value: 'speedrunner' },
        startingWeapon: 'plasmaBurst',
        
        stats: {
            maxHealth: 65,
            speed: 350,
            pickupRadius: 60,
            armor: 0
        },
        
        abilities: {
            passive: {
                name: 'Velocity',
                description: 'Damage increases with speed. Up to +30%',
                effect: { speedDamageBonus: true, maxBonus: 0.3 }
            },
            active: {
                name: 'Burst Speed',
                description: '+100% speed for 5 seconds. 30s cooldown.',
                cooldown: 30,
                duration: 5,
                speedMultiplier: 2
            }
        },
        
        weaponAffinity: { 
            weapon: 'laser', 
            bonus: { piercing: 1 } 
        },
        
        visual: {
            shape: 'streak',
            size: { width: 35, height: 15 },
            glow: '#44aaff',
            trail: 'speed'
        }
    }
};

// UAP Categories for UI organization
const UAP_CATEGORIES = {
    starter: {
        name: 'Starter',
        uaps: ['saucer'],
        description: 'Available from the start'
    },
    classic: {
        name: 'Classic Sightings',
        uaps: ['triangle', 'orb', 'cigar', 'adamski'],
        description: 'Based on historical UFO reports'
    },
    modern: {
        name: 'Modern UAP',
        uaps: ['ticTac', 'jellyfish', 'cube', 'gimbal', 'goFast'],
        description: 'Based on recent Navy encounters'
    }
};

// =====================================================
// COSMETICS
// Visual customizations for UAPs
// =====================================================
const COSMETICS = {
    trails: {
        standard: { name: 'Standard', color: null },
        ember: { name: 'Ember Trail', color: '#ff4400' },
        energy: { name: 'Energy Trail', color: '#44ffff' },
        exhaust: { name: 'Exhaust Trail', color: '#888888' },
        warp: { name: 'Warp Trail', color: '#aa44ff' },
        sparkle: { name: 'Sparkle Trail', color: '#ffff44' },
        tendril: { name: 'Tendril Trail', color: '#44ff88' },
        geometric: { name: 'Geometric Trail', color: '#8888ff' },
        rotation: { name: 'Rotation Trail', color: '#ff8844' },
        speed: { name: 'Speed Trail', color: '#44aaff' },
        golden: { name: 'Golden Trail', color: '#ffd700', unlock: { type: 'prestige', value: 50 } },
        ethereal: { name: 'Ethereal Trail', color: '#ffffff', unlock: { type: 'achievement', value: 'untouchable' } },
        cosmic: { name: 'Cosmic Trail', color: '#ff00ff', unlock: { type: 'prestige', value: 100 } }
    },
    
    auras: {
        none: { name: 'None', color: null },
        fire: { name: 'Fire Aura', color: '#ff4400', unlock: { type: 'kills', value: 50000 } },
        ice: { name: 'Ice Aura', color: '#44ffff', unlock: { type: 'survival_time', value: 36000 } },
        lightning: { name: 'Lightning Aura', color: '#ffff00', unlock: { type: 'boss_kills', value: 25 } },
        cosmic: { name: 'Cosmic Aura', color: '#ff00ff', unlock: { type: 'prestige', value: 100 } }
    }
};

// Export
if (typeof module !== 'undefined') {
    module.exports = { 
        UAP_TYPES, 
        UAP_CATEGORIES,
        COSMETICS
    };
}
