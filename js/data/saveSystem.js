// =====================================================
// SAVE & PROGRESSION SYSTEM
// Persistent data management and meta-progression
// =====================================================

const SAVE_VERSION = 1;
const SAVE_KEY = 'ufo_survivor_save';

// =====================================================
// DEFAULT SAVE DATA
// =====================================================
const DEFAULT_SAVE = {
    version: SAVE_VERSION,
    
    // Player progression
    totalCurrency: 0,
    prestigeLevel: 0,
    prestigePoints: 0,
    
    // Statistics
    stats: {
        totalPlayTime: 0,
        runsCompleted: 0,
        runsAttempted: 0,
        totalKills: 0,
        totalDeaths: 0,
        totalXPEarned: 0,
        highestLevel: 0,
        longestSurvival: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        bossesDefeated: 0,
        elitesDefeated: 0,
        pickupsCollected: 0,
        artifactsFound: 0,
        weaponsEvolved: 0
    },
    
    // Best run stats
    bestRuns: {
        longestSurvival: { time: 0, date: null, difficulty: 'normal' },
        highestLevel: { level: 0, date: null, difficulty: 'normal' },
        mostKills: { kills: 0, date: null, difficulty: 'normal' },
        highestDamage: { damage: 0, date: null, difficulty: 'normal' }
    },
    
    // Collections
    collections: {
        ufoEvents: [],      // Investigated UFO event IDs
        enemies: [],        // Encountered enemy type IDs
        artifacts: [],      // Collected artifact IDs
        lore: [],          // Unlocked lore document IDs
        weapons: []         // Used weapon IDs
    },
    
    // Unlocks
    unlocks: {
        difficulties: ['normal'],
        modifiers: ['glass_cannon', 'tank'],
        uapTypes: ['saucer'],     // Playable craft
        weapons: ['plasma'],      // Available weapons
        cosmetics: []             // Visual upgrades
    },
    
    // Achievements
    achievements: [],
    achievementProgress: {},
    
    // Settings
    settings: {
        masterVolume: 1.0,
        sfxVolume: 0.8,
        musicVolume: 0.6,
        screenShake: true,
        showDamageNumbers: true,
        showMinimap: true,
        particleQuality: 'high'
    },
    
    // Last session
    lastPlayed: null,
    totalLaunches: 0
};

// =====================================================
// ADVANCED SAVE MANAGER CLASS
// (For future use - current game uses SaveManager in utils.js)
// =====================================================
class AdvancedSaveManager {
    constructor() {
        this.data = null;
        this.dirty = false;
        this.autoSaveInterval = null;
    }
    
    // Load save from localStorage
    load() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.data = this.migrate(parsed);
            } else {
                this.data = this.createNew();
            }
        } catch (e) {
            console.error('Failed to load save:', e);
            this.data = this.createNew();
        }
        
        this.data.totalLaunches++;
        this.data.lastPlayed = new Date().toISOString();
        this.dirty = true;
        
        return this.data;
    }
    
    // Create fresh save
    createNew() {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }
    
    // Migrate old saves to new format
    migrate(oldSave) {
        // Add any missing fields from default
        const migrated = this.mergeDeep(
            JSON.parse(JSON.stringify(DEFAULT_SAVE)), 
            oldSave
        );
        
        // Version-specific migrations
        if (oldSave.version < SAVE_VERSION) {
            // Handle version upgrades here
            migrated.version = SAVE_VERSION;
        }
        
        return migrated;
    }
    
    // Deep merge helper
    mergeDeep(target, source) {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], this.mergeDeep(target[key], source[key]));
            }
        }
        return { ...target, ...source };
    }
    
    // Save to localStorage
    save() {
        if (!this.data) return false;
        
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
            this.dirty = false;
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            return false;
        }
    }
    
    // Start auto-save
    startAutoSave(intervalMs = 30000) {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            if (this.dirty) {
                this.save();
            }
        }, intervalMs);
    }
    
    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    // Update stat
    addStat(statName, value) {
        if (this.data.stats[statName] !== undefined) {
            this.data.stats[statName] += value;
            this.dirty = true;
        }
    }
    
    // Set stat if higher
    setStatIfHigher(statName, value) {
        if (this.data.stats[statName] !== undefined && value > this.data.stats[statName]) {
            this.data.stats[statName] = value;
            this.dirty = true;
        }
    }
    
    // Add currency
    addCurrency(amount) {
        this.data.totalCurrency += amount;
        this.dirty = true;
    }
    
    // Spend currency
    spendCurrency(amount) {
        if (this.data.totalCurrency >= amount) {
            this.data.totalCurrency -= amount;
            this.dirty = true;
            return true;
        }
        return false;
    }
    
    // Add to collection
    addToCollection(collectionName, id) {
        if (this.data.collections[collectionName] && 
            !this.data.collections[collectionName].includes(id)) {
            this.data.collections[collectionName].push(id);
            this.dirty = true;
            return true;
        }
        return false;
    }
    
    // Check if collected
    isCollected(collectionName, id) {
        return this.data.collections[collectionName]?.includes(id) || false;
    }
    
    // Add unlock
    addUnlock(unlockType, id) {
        if (this.data.unlocks[unlockType] && 
            !this.data.unlocks[unlockType].includes(id)) {
            this.data.unlocks[unlockType].push(id);
            this.dirty = true;
            return true;
        }
        return false;
    }
    
    // Check if unlocked
    isUnlocked(unlockType, id) {
        return this.data.unlocks[unlockType]?.includes(id) || false;
    }
    
    // Update best run
    updateBestRun(category, value, difficulty) {
        const best = this.data.bestRuns[category];
        const valueKey = category === 'longestSurvival' ? 'time' : 
                        category === 'highestLevel' ? 'level' :
                        category === 'mostKills' ? 'kills' : 'damage';
        
        if (value > best[valueKey]) {
            best[valueKey] = value;
            best.date = new Date().toISOString();
            best.difficulty = difficulty;
            this.dirty = true;
            return true;
        }
        return false;
    }
    
    // Complete a run
    completeRun(runData) {
        this.data.stats.runsCompleted++;
        this.data.stats.runsAttempted++;
        this.addStat('totalPlayTime', runData.survivalTime);
        this.addStat('totalKills', runData.kills);
        this.addStat('totalXPEarned', runData.xpEarned);
        this.addStat('totalDamageDealt', runData.damageDealt);
        
        this.setStatIfHigher('highestLevel', runData.level);
        this.setStatIfHigher('longestSurvival', runData.survivalTime);
        
        this.updateBestRun('longestSurvival', runData.survivalTime, runData.difficulty);
        this.updateBestRun('highestLevel', runData.level, runData.difficulty);
        this.updateBestRun('mostKills', runData.kills, runData.difficulty);
        this.updateBestRun('highestDamage', runData.damageDealt, runData.difficulty);
        
        // Add currency earned
        this.addCurrency(runData.currencyEarned);
        
        this.dirty = true;
        this.save();
    }
    
    // Record death
    recordDeath() {
        this.data.stats.totalDeaths++;
        this.data.stats.runsAttempted++;
        this.dirty = true;
    }
    
    // Prestige
    prestige() {
        if (this.data.stats.runsCompleted < 10) return false;
        
        this.data.prestigeLevel++;
        this.data.prestigePoints += this.calculatePrestigePoints();
        
        // Reset some progress
        // (Keep collections, achievements, unlocks)
        this.data.totalCurrency = Math.floor(this.data.totalCurrency * 0.1);
        
        this.dirty = true;
        this.save();
        return true;
    }
    
    calculatePrestigePoints() {
        const stats = this.data.stats;
        let points = 0;
        
        points += Math.floor(stats.totalKills / 10000);
        points += Math.floor(stats.totalPlayTime / 3600);
        points += stats.runsCompleted * 2;
        points += Math.floor(stats.highestLevel / 10);
        
        return Math.max(1, points);
    }
    
    // Get prestige bonuses
    getPrestigeBonuses() {
        const level = this.data.prestigeLevel;
        return {
            maxHealth: level * 2,
            damage: level * 1,
            xpGain: level * 1,
            pickupRadius: level * 1,
            movementSpeed: level * 0.5
        };
    }
    
    // Export save (for backup)
    exportSave() {
        return btoa(JSON.stringify(this.data));
    }
    
    // Import save (from backup)
    importSave(encoded) {
        try {
            const decoded = JSON.parse(atob(encoded));
            this.data = this.migrate(decoded);
            this.dirty = true;
            this.save();
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }
    
    // Reset save
    reset() {
        this.data = this.createNew();
        this.dirty = true;
        this.save();
    }
}

// =====================================================
// RUN TRACKER CLASS
// Tracks stats during a single run
// =====================================================
class RunTracker {
    constructor(difficulty, modifiers) {
        this.difficulty = difficulty;
        this.modifiers = modifiers;
        this.startTime = Date.now();
        
        this.stats = {
            survivalTime: 0,
            kills: 0,
            eliteKills: 0,
            bossKills: 0,
            level: 1,
            xpEarned: 0,
            damageDealt: 0,
            damageTaken: 0,
            pickupsCollected: 0,
            weaponsUsed: new Set(),
            enemiesEncountered: new Set(),
            eventsTriggered: new Set()
        };
        
        this.currencyEarned = 0;
    }
    
    update(deltaTime) {
        this.stats.survivalTime += deltaTime;
    }
    
    recordKill(enemyType, isElite, isBoss) {
        this.stats.kills++;
        this.stats.enemiesEncountered.add(enemyType);
        
        if (isElite) this.stats.eliteKills++;
        if (isBoss) this.stats.bossKills++;
    }
    
    recordDamage(amount, toPlayer) {
        if (toPlayer) {
            this.stats.damageTaken += amount;
        } else {
            this.stats.damageDealt += amount;
        }
    }
    
    recordXP(amount) {
        this.stats.xpEarned += amount;
    }
    
    recordPickup(type) {
        this.stats.pickupsCollected++;
    }
    
    recordWeaponUse(weaponId) {
        this.stats.weaponsUsed.add(weaponId);
    }
    
    recordEvent(eventId) {
        this.stats.eventsTriggered.add(eventId);
    }
    
    setLevel(level) {
        this.stats.level = level;
    }
    
    addCurrency(amount) {
        this.currencyEarned += amount;
    }
    
    getResults() {
        return {
            difficulty: this.difficulty,
            modifiers: this.modifiers,
            survivalTime: this.stats.survivalTime,
            kills: this.stats.kills,
            eliteKills: this.stats.eliteKills,
            bossKills: this.stats.bossKills,
            level: this.stats.level,
            xpEarned: this.stats.xpEarned,
            damageDealt: this.stats.damageDealt,
            damageTaken: this.stats.damageTaken,
            pickupsCollected: this.stats.pickupsCollected,
            weaponsUsed: Array.from(this.stats.weaponsUsed),
            enemiesEncountered: Array.from(this.stats.enemiesEncountered),
            eventsTriggered: Array.from(this.stats.eventsTriggered),
            currencyEarned: this.currencyEarned,
            duration: Date.now() - this.startTime
        };
    }
}

// =====================================================
// CURRENCY CALCULATOR
// =====================================================
function calculateRunCurrency(runData, difficultyMultiplier, modifierBonus) {
    let base = 0;
    
    // Time bonus
    base += Math.floor(runData.survivalTime / 60) * 10;
    
    // Kill bonus
    base += Math.floor(runData.kills * 0.1);
    base += runData.eliteKills * 5;
    base += runData.bossKills * 50;
    
    // Level bonus
    base += runData.level * 5;
    
    // Apply multipliers
    let total = base * difficultyMultiplier;
    total *= (1 + modifierBonus);
    
    // Completion bonus
    if (runData.survivalTime >= 1800) {
        total *= 2;
    }
    
    return Math.floor(total);
}

// Export
if (typeof module !== 'undefined') {
    module.exports = { 
        AdvancedSaveManager, 
        RunTracker,
        calculateRunCurrency,
        DEFAULT_SAVE
    };
}
