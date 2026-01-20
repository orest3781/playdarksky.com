// =====================================================
// UPGRADE & SHOP SYSTEM
// Permanent upgrades purchasable between runs
// =====================================================

// =====================================================
// PERMANENT UPGRADES (Meta-progression)
// =====================================================
const PERMANENT_UPGRADES = {
    // =====================================================
    // OFFENSE TREE
    // =====================================================
    
    damage_1: {
        id: 'damage_1',
        name: 'Weapon Calibration I',
        description: '+5% base damage',
        icon: '⚔️',
        tree: 'offense',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [100, 200, 400, 800, 1600],
        effect: { damage: 0.05 },
        requires: []
    },
    
    damage_2: {
        id: 'damage_2',
        name: 'Weapon Calibration II',
        description: '+3% base damage per level',
        icon: '⚔️',
        tree: 'offense',
        tier: 2,
        maxLevel: 10,
        costPerLevel: [500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000],
        effect: { damage: 0.03 },
        requires: ['damage_1:5']
    },
    
    attack_speed_1: {
        id: 'attack_speed_1',
        name: 'Rapid Fire I',
        description: '+3% attack speed',
        icon: '⚡',
        tree: 'offense',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [100, 200, 400, 800, 1600],
        effect: { attackSpeed: 0.03 },
        requires: []
    },
    
    attack_speed_2: {
        id: 'attack_speed_2',
        name: 'Rapid Fire II',
        description: '+2% attack speed per level',
        icon: '⚡',
        tree: 'offense',
        tier: 2,
        maxLevel: 10,
        costPerLevel: [500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000],
        effect: { attackSpeed: 0.02 },
        requires: ['attack_speed_1:5']
    },
    
    crit_chance: {
        id: 'crit_chance',
        name: 'Precision Targeting',
        description: '+2% critical hit chance',
        icon: '🎯',
        tree: 'offense',
        tier: 2,
        maxLevel: 10,
        costPerLevel: [300, 450, 675, 1000, 1500, 2250, 3375, 5000, 7500, 11250],
        effect: { critChance: 0.02 },
        requires: ['damage_1:3']
    },
    
    crit_damage: {
        id: 'crit_damage',
        name: 'Critical Overload',
        description: '+10% critical damage',
        icon: '💥',
        tree: 'offense',
        tier: 3,
        maxLevel: 5,
        costPerLevel: [1000, 2000, 4000, 8000, 16000],
        effect: { critDamage: 0.1 },
        requires: ['crit_chance:5']
    },
    
    projectile_count: {
        id: 'projectile_count',
        name: 'Multi-Emitter',
        description: '+1 projectile for primary weapons',
        icon: '✨',
        tree: 'offense',
        tier: 3,
        maxLevel: 2,
        costPerLevel: [5000, 15000],
        effect: { projectileCount: 1 },
        requires: ['damage_2:5', 'attack_speed_2:5']
    },
    
    // =====================================================
    // DEFENSE TREE
    // =====================================================
    
    health_1: {
        id: 'health_1',
        name: 'Hull Reinforcement I',
        description: '+10 max health',
        icon: '❤️',
        tree: 'defense',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [100, 200, 400, 800, 1600],
        effect: { maxHealth: 10 },
        requires: []
    },
    
    health_2: {
        id: 'health_2',
        name: 'Hull Reinforcement II',
        description: '+8 max health per level',
        icon: '❤️',
        tree: 'defense',
        tier: 2,
        maxLevel: 10,
        costPerLevel: [500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000],
        effect: { maxHealth: 8 },
        requires: ['health_1:5']
    },
    
    armor_1: {
        id: 'armor_1',
        name: 'Armor Plating I',
        description: '+2 armor (flat damage reduction)',
        icon: '🛡️',
        tree: 'defense',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [150, 300, 600, 1200, 2400],
        effect: { armor: 2 },
        requires: []
    },
    
    armor_2: {
        id: 'armor_2',
        name: 'Armor Plating II',
        description: '+1 armor per level',
        icon: '🛡️',
        tree: 'defense',
        tier: 2,
        maxLevel: 10,
        costPerLevel: [600, 900, 1350, 2000, 3000, 4500, 6750, 10000, 15000, 22500],
        effect: { armor: 1 },
        requires: ['armor_1:5']
    },
    
    regen: {
        id: 'regen',
        name: 'Self-Repair Systems',
        description: '+0.5 health regen per second',
        icon: '💚',
        tree: 'defense',
        tier: 2,
        maxLevel: 5,
        costPerLevel: [400, 800, 1600, 3200, 6400],
        effect: { healthRegen: 0.5 },
        requires: ['health_1:3']
    },
    
    damage_reduction: {
        id: 'damage_reduction',
        name: 'Energy Dampeners',
        description: '+2% damage reduction',
        icon: '🔰',
        tree: 'defense',
        tier: 3,
        maxLevel: 5,
        costPerLevel: [1500, 3000, 6000, 12000, 24000],
        effect: { damageReduction: 0.02 },
        requires: ['armor_2:5', 'regen:3']
    },
    
    revive: {
        id: 'revive',
        name: 'Emergency Protocols',
        description: '+1 revive per run',
        icon: '💫',
        tree: 'defense',
        tier: 3,
        maxLevel: 2,
        costPerLevel: [10000, 25000],
        effect: { revives: 1 },
        requires: ['health_2:5']
    },
    
    // =====================================================
    // UTILITY TREE
    // =====================================================
    
    speed_1: {
        id: 'speed_1',
        name: 'Propulsion Upgrade I',
        description: '+5% movement speed',
        icon: '👟',
        tree: 'utility',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [100, 200, 400, 800, 1600],
        effect: { moveSpeed: 0.05 },
        requires: []
    },
    
    speed_2: {
        id: 'speed_2',
        name: 'Propulsion Upgrade II',
        description: '+3% movement speed per level',
        icon: '👟',
        tree: 'utility',
        tier: 2,
        maxLevel: 5,
        costPerLevel: [500, 1000, 2000, 4000, 8000],
        effect: { moveSpeed: 0.03 },
        requires: ['speed_1:5']
    },
    
    pickup_radius: {
        id: 'pickup_radius',
        name: 'Tractor Field',
        description: '+10% pickup radius',
        icon: '🧲',
        tree: 'utility',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [75, 150, 300, 600, 1200],
        effect: { pickupRadius: 0.1 },
        requires: []
    },
    
    xp_gain: {
        id: 'xp_gain',
        name: 'Data Analysis',
        description: '+5% XP gain',
        icon: '📊',
        tree: 'utility',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [150, 300, 600, 1200, 2400],
        effect: { xpGain: 0.05 },
        requires: []
    },
    
    xp_gain_2: {
        id: 'xp_gain_2',
        name: 'Advanced Analysis',
        description: '+3% XP gain per level',
        icon: '📊',
        tree: 'utility',
        tier: 2,
        maxLevel: 10,
        costPerLevel: [500, 750, 1125, 1687, 2531, 3796, 5694, 8541, 12812, 19218],
        effect: { xpGain: 0.03 },
        requires: ['xp_gain:5']
    },
    
    luck: {
        id: 'luck',
        name: 'Quantum Probability',
        description: '+5% luck (better drops, more crits)',
        icon: '🍀',
        tree: 'utility',
        tier: 2,
        maxLevel: 5,
        costPerLevel: [400, 800, 1600, 3200, 6400],
        effect: { luck: 0.05 },
        requires: ['pickup_radius:3']
    },
    
    cooldown: {
        id: 'cooldown',
        name: 'Energy Capacitors',
        description: '-5% ability cooldowns',
        icon: '⏳',
        tree: 'utility',
        tier: 3,
        maxLevel: 5,
        costPerLevel: [1000, 2000, 4000, 8000, 16000],
        effect: { cooldownReduction: 0.05 },
        requires: ['speed_2:3', 'xp_gain_2:5']
    },
    
    // =====================================================
    // SPECIAL TREE
    // =====================================================
    
    weapon_slot: {
        id: 'weapon_slot',
        name: 'Hardpoint Expansion',
        description: '+1 weapon slot',
        icon: '🔧',
        tree: 'special',
        tier: 2,
        maxLevel: 2,
        costPerLevel: [5000, 15000],
        effect: { weaponSlots: 1 },
        requires: ['damage_1:5', 'health_1:5']
    },
    
    starting_weapon: {
        id: 'starting_weapon',
        name: 'Secondary Armament',
        description: 'Start runs with an additional random weapon',
        icon: '🎁',
        tree: 'special',
        tier: 3,
        maxLevel: 1,
        costPerLevel: [20000],
        effect: { startingWeapons: 1 },
        requires: ['weapon_slot:2']
    },
    
    artifact_slot: {
        id: 'artifact_slot',
        name: 'Relic Chamber',
        description: '+1 artifact slot',
        icon: '💎',
        tree: 'special',
        tier: 2,
        maxLevel: 2,
        costPerLevel: [3000, 10000],
        effect: { artifactSlots: 1 },
        requires: []
    },
    
    currency_gain: {
        id: 'currency_gain',
        name: 'Resource Extraction',
        description: '+10% currency from runs',
        icon: '💰',
        tree: 'special',
        tier: 1,
        maxLevel: 5,
        costPerLevel: [200, 400, 800, 1600, 3200],
        effect: { currencyGain: 0.1 },
        requires: []
    },
    
    lore_find: {
        id: 'lore_find',
        name: 'Archaeological Protocols',
        description: '+15% lore document drop rate',
        icon: '📜',
        tree: 'special',
        tier: 2,
        maxLevel: 3,
        costPerLevel: [500, 1500, 4500],
        effect: { loreDropRate: 0.15 },
        requires: []
    },
    
    event_chance: {
        id: 'event_chance',
        name: 'Event Tracking',
        description: '+10% chance for UFO event encounters',
        icon: '🛸',
        tree: 'special',
        tier: 2,
        maxLevel: 5,
        costPerLevel: [800, 1600, 3200, 6400, 12800],
        effect: { eventChance: 0.1 },
        requires: ['lore_find:1']
    }
};

// Upgrade trees
const UPGRADE_TREES = {
    offense: { name: 'Offense', icon: '⚔️', color: '#ff4444' },
    defense: { name: 'Defense', icon: '🛡️', color: '#44ff44' },
    utility: { name: 'Utility', icon: '⚙️', color: '#4444ff' },
    special: { name: 'Special', icon: '✨', color: '#ffaa00' }
};

// =====================================================
// UPGRADE MANAGER CLASS
// =====================================================
class UpgradeManager {
    constructor(saveData) {
        this.purchased = saveData.upgrades || {};
        this.totalSpent = saveData.upgradeSpent || 0;
    }
    
    getLevel(upgradeId) {
        return this.purchased[upgradeId] || 0;
    }
    
    canAfford(upgradeId, currency) {
        const upgrade = PERMANENT_UPGRADES[upgradeId];
        if (!upgrade) return false;
        
        const currentLevel = this.getLevel(upgradeId);
        if (currentLevel >= upgrade.maxLevel) return false;
        
        const cost = upgrade.costPerLevel[currentLevel];
        return currency >= cost;
    }
    
    meetsRequirements(upgradeId) {
        const upgrade = PERMANENT_UPGRADES[upgradeId];
        if (!upgrade) return false;
        
        for (const req of upgrade.requires) {
            const [reqId, reqLevel] = req.split(':');
            if (this.getLevel(reqId) < parseInt(reqLevel)) {
                return false;
            }
        }
        return true;
    }
    
    purchase(upgradeId, currency) {
        const upgrade = PERMANENT_UPGRADES[upgradeId];
        if (!upgrade) return { success: false, error: 'Invalid upgrade' };
        
        if (!this.meetsRequirements(upgradeId)) {
            return { success: false, error: 'Requirements not met' };
        }
        
        const currentLevel = this.getLevel(upgradeId);
        if (currentLevel >= upgrade.maxLevel) {
            return { success: false, error: 'Already maxed' };
        }
        
        const cost = upgrade.costPerLevel[currentLevel];
        if (currency < cost) {
            return { success: false, error: 'Not enough currency' };
        }
        
        this.purchased[upgradeId] = currentLevel + 1;
        this.totalSpent += cost;
        
        return { success: true, cost, newLevel: currentLevel + 1 };
    }
    
    getTotalEffects() {
        const effects = {};
        
        for (const [id, level] of Object.entries(this.purchased)) {
            const upgrade = PERMANENT_UPGRADES[id];
            if (!upgrade || level <= 0) continue;
            
            for (const [stat, value] of Object.entries(upgrade.effect)) {
                effects[stat] = (effects[stat] || 0) + (value * level);
            }
        }
        
        return effects;
    }
    
    getTreeProgress(treeName) {
        let purchased = 0;
        let total = 0;
        
        for (const [id, upgrade] of Object.entries(PERMANENT_UPGRADES)) {
            if (upgrade.tree === treeName) {
                total += upgrade.maxLevel;
                purchased += this.getLevel(id);
            }
        }
        
        return { purchased, total, percentage: total > 0 ? (purchased / total) * 100 : 0 };
    }
    
    save() {
        return {
            upgrades: this.purchased,
            upgradeSpent: this.totalSpent
        };
    }
}

// =====================================================
// SHOP ITEMS (Consumables & One-time purchases)
// =====================================================
const SHOP_ITEMS = {
    // Consumables
    xp_booster: {
        id: 'xp_booster',
        name: 'XP Booster',
        description: '+50% XP for 1 run',
        icon: '📈',
        type: 'consumable',
        cost: 500,
        effect: { xpMultiplier: 1.5, duration: 'run' },
        maxStack: 10
    },
    
    currency_booster: {
        id: 'currency_booster',
        name: 'Currency Booster',
        description: '+50% currency for 1 run',
        icon: '💵',
        type: 'consumable',
        cost: 500,
        effect: { currencyMultiplier: 1.5, duration: 'run' },
        maxStack: 10
    },
    
    loot_finder: {
        id: 'loot_finder',
        name: 'Loot Finder',
        description: '+100% artifact drop rate for 1 run',
        icon: '🔍',
        type: 'consumable',
        cost: 750,
        effect: { artifactDropRate: 2.0, duration: 'run' },
        maxStack: 5
    },
    
    // Keys/Unlocks
    event_key: {
        id: 'event_key',
        name: 'Event Access Key',
        description: 'Unlocks a random locked UFO event',
        icon: '🔑',
        type: 'unlock',
        cost: 2000,
        effect: { unlockRandomEvent: true },
        maxStack: 1
    },
    
    weapon_blueprint: {
        id: 'weapon_blueprint',
        name: 'Weapon Blueprint',
        description: 'Unlocks a random locked weapon',
        icon: '📋',
        type: 'unlock',
        cost: 3000,
        effect: { unlockRandomWeapon: true },
        maxStack: 1
    },
    
    // Rerolls
    weapon_reroll: {
        id: 'weapon_reroll',
        name: 'Weapon Reroll Token',
        description: 'Reroll weapon choices during a run',
        icon: '🎰',
        type: 'consumable',
        cost: 200,
        effect: { rerollWeapons: 1 },
        maxStack: 20
    },
    
    artifact_reroll: {
        id: 'artifact_reroll',
        name: 'Artifact Reroll Token',
        description: 'Reroll artifact choices during a run',
        icon: '🔄',
        type: 'consumable',
        cost: 300,
        effect: { rerollArtifacts: 1 },
        maxStack: 10
    }
};

// =====================================================
// SHOP MANAGER CLASS
// =====================================================
class ShopManager {
    constructor(saveData) {
        this.inventory = saveData.shopInventory || {};
    }
    
    getItemCount(itemId) {
        return this.inventory[itemId] || 0;
    }
    
    canPurchase(itemId, currency) {
        const item = SHOP_ITEMS[itemId];
        if (!item) return false;
        
        const currentCount = this.getItemCount(itemId);
        if (currentCount >= item.maxStack) return false;
        
        return currency >= item.cost;
    }
    
    purchase(itemId, currency) {
        const item = SHOP_ITEMS[itemId];
        if (!item) return { success: false, error: 'Invalid item' };
        
        if (!this.canPurchase(itemId, currency)) {
            return { success: false, error: 'Cannot purchase' };
        }
        
        this.inventory[itemId] = (this.inventory[itemId] || 0) + 1;
        return { success: true, cost: item.cost };
    }
    
    useItem(itemId) {
        if (this.getItemCount(itemId) > 0) {
            this.inventory[itemId]--;
            return SHOP_ITEMS[itemId].effect;
        }
        return null;
    }
    
    save() {
        return {
            shopInventory: this.inventory
        };
    }
}

// Export
if (typeof module !== 'undefined') {
    module.exports = { 
        PERMANENT_UPGRADES, 
        UPGRADE_TREES,
        UpgradeManager,
        SHOP_ITEMS,
        ShopManager
    };
}
