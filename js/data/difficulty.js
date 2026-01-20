// =====================================================
// DIFFICULTY & RUN MODIFIER SYSTEM
// Diablo-style difficulty tiers with escalating rewards
// =====================================================

const DIFFICULTY_TIERS = {
    // =====================================================
    // BASE DIFFICULTIES
    // =====================================================
    
    normal: {
        id: 'normal',
        name: 'Normal',
        description: 'Standard experience for new pilots',
        icon: '⬜',
        color: '#ffffff',
        unlockRequirement: null, // Available by default
        
        modifiers: {
            enemyHealth: 1.0,
            enemyDamage: 1.0,
            enemySpeed: 1.0,
            spawnRate: 1.0,
            eliteChance: 1.0,
            bossHealth: 1.0
        },
        
        rewards: {
            xpMultiplier: 1.0,
            currencyMultiplier: 1.0,
            lootQuality: 1.0,
            artifactDropChance: 0.02
        },
        
        restrictions: {
            maxLevel: 50,
            elitesEnabled: true,
            bossesEnabled: true
        }
    },
    
    hard: {
        id: 'hard',
        name: 'Hard',
        description: 'Military coordination has improved',
        icon: '🟨',
        color: '#ffcc00',
        unlockRequirement: { type: 'collection_percent', value: 50 },
        
        modifiers: {
            enemyHealth: 1.5,
            enemyDamage: 1.25,
            enemySpeed: 1.1,
            spawnRate: 1.2,
            eliteChance: 1.5,
            bossHealth: 1.5
        },
        
        rewards: {
            xpMultiplier: 1.25,
            currencyMultiplier: 1.5,
            lootQuality: 1.25,
            artifactDropChance: 0.04
        },
        
        restrictions: {
            maxLevel: 60,
            elitesEnabled: true,
            bossesEnabled: true
        }
    },
    
    nightmare: {
        id: 'nightmare',
        name: 'Nightmare',
        description: 'DEFCON 2 - All forces mobilized',
        icon: '🟥',
        color: '#ff4444',
        unlockRequirement: { type: 'level_reached', value: 50 },
        
        modifiers: {
            enemyHealth: 2.5,
            enemyDamage: 1.75,
            enemySpeed: 1.2,
            spawnRate: 1.5,
            eliteChance: 2.0,
            bossHealth: 2.5
        },
        
        rewards: {
            xpMultiplier: 1.75,
            currencyMultiplier: 2.5,
            lootQuality: 1.75,
            artifactDropChance: 0.08
        },
        
        restrictions: {
            maxLevel: 75,
            elitesEnabled: true,
            bossesEnabled: true
        },
        
        special: {
            additionalAffixes: 1
        }
    },
    
    apocalypse: {
        id: 'apocalypse',
        name: 'Apocalypse',
        description: 'DEFCON 1 - Nuclear option authorized',
        icon: '☢️',
        color: '#ff0000',
        unlockRequirement: { type: 'codex_complete', value: true },
        
        modifiers: {
            enemyHealth: 4.0,
            enemyDamage: 2.5,
            enemySpeed: 1.35,
            spawnRate: 2.0,
            eliteChance: 3.0,
            bossHealth: 4.0
        },
        
        rewards: {
            xpMultiplier: 3.0,
            currencyMultiplier: 5.0,
            lootQuality: 2.5,
            artifactDropChance: 0.15
        },
        
        restrictions: {
            maxLevel: 100,
            elitesEnabled: true,
            bossesEnabled: true
        },
        
        special: {
            additionalAffixes: 2,
            nukeWaves: true,
            eliteSwarms: true
        }
    }
};

// =====================================================
// RUN MODIFIERS (Placeholder - Not yet implemented)
// =====================================================

const RUN_MODIFIERS = {};

const MODIFIER_CATEGORIES = {};

// =====================================================
// DIFFICULTY MANAGER CLASS
// =====================================================
class DifficultyManager {
    constructor(saveData) {
        this.unlockedDifficulties = saveData.difficulties || ['normal'];
        this.unlockedModifiers = []; // Modifiers not yet implemented
        this.currentDifficulty = 'normal';
        this.activeModifiers = [];
    }
    
    setDifficulty(id) {
        if (this.isDifficultyUnlocked(id)) {
            this.currentDifficulty = id;
            return true;
        }
        return false;
    }
    
    toggleModifier(id) {
        if (!this.isModifierUnlocked(id)) return false;
        
        const index = this.activeModifiers.indexOf(id);
        if (index >= 0) {
            this.activeModifiers.splice(index, 1);
        } else {
            // Max 3 modifiers
            if (this.activeModifiers.length >= 3) return false;
            this.activeModifiers.push(id);
        }
        return true;
    }
    
    isDifficultyUnlocked(id) {
        return this.unlockedDifficulties.includes(id);
    }
    
    isModifierUnlocked(id) {
        return this.unlockedModifiers.includes(id);
    }
    
    unlockDifficulty(id) {
        if (!this.unlockedDifficulties.includes(id)) {
            this.unlockedDifficulties.push(id);
            return true;
        }
        return false;
    }
    
    unlockModifier(id) {
        if (!this.unlockedModifiers.includes(id)) {
            this.unlockedModifiers.push(id);
            return true;
        }
        return false;
    }
    
    getEffectiveStats() {
        const difficulty = DIFFICULTY_TIERS[this.currentDifficulty];
        const stats = { ...difficulty.modifiers };
        const rewards = { ...difficulty.rewards };
        
        // Apply modifier effects
        for (const modId of this.activeModifiers) {
            const mod = RUN_MODIFIERS[modId];
            if (mod) {
                // Multiply stats
                for (const [key, value] of Object.entries(mod.effects)) {
                    if (typeof value === 'number') {
                        stats[key] = (stats[key] || 1) * value;
                    } else {
                        stats[key] = value;
                    }
                }
                
                // Add reward bonuses
                for (const [key, value] of Object.entries(mod.rewards)) {
                    rewards[key] = (rewards[key] || 0) + value;
                }
            }
        }
        
        return { stats, rewards };
    }
    
    getRunDescription() {
        const parts = [DIFFICULTY_TIERS[this.currentDifficulty].name];
        
        if (this.activeModifiers.length > 0) {
            const modNames = this.activeModifiers.map(id => RUN_MODIFIERS[id].name);
            parts.push(`+ ${modNames.join(', ')}`);
        }
        
        return parts.join(' ');
    }
    
    save() {
        return {
            difficulties: this.unlockedDifficulties,
            modifiers: this.unlockedModifiers
        };
    }
}

// =====================================================
// PRESTIGE SYSTEM (Post-game progression)
// =====================================================
const PRESTIGE_BONUSES = {
    // Permanent stat bonuses per prestige level
    bonusPerLevel: {
        maxHealth: 2,        // +2% max health per level
        damage: 1,           // +1% damage per level
        xpGain: 1,           // +1% XP gain per level
        pickupRadius: 1,     // +1% pickup radius per level
        movementSpeed: 0.5   // +0.5% movement speed per level
    },
    
    maxLevel: 100,
    
    // Milestone unlocks
    milestones: {
        10: { type: 'unlock_uap', value: 'triangle_elite' },
        25: { type: 'unlock_modifier', value: 'permadeath' },
        50: { type: 'unlock_cosmetic', value: 'golden_trail' },
        75: { type: 'unlock_modifier', value: 'chaos' },
        100: { type: 'unlock_cosmetic', value: 'cosmic_aura' }
    }
};

// Export
if (typeof module !== 'undefined') {
    module.exports = { 
        DIFFICULTY_TIERS, 
        RUN_MODIFIERS, 
        MODIFIER_CATEGORIES,
        DifficultyManager,
        PRESTIGE_BONUSES
    };
}
