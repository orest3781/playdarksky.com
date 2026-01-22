// =====================================================
// ACHIEVEMENT SYSTEM
// Tracks milestones and unlocks rewards
// =====================================================

const ACHIEVEMENTS = {
    // =====================================================
    // PROGRESSION ACHIEVEMENTS
    // =====================================================
    
    first_flight: {
        id: 'first_flight',
        name: 'First Flight',
        description: 'Complete your first escape attempt',
        icon: '🛸',
        category: 'progression',
        tier: 'bronze',
        requirement: { type: 'runs_completed', value: 1 },
        reward: { type: 'currency', value: 100 },
        hidden: false
    },
    
    five_minute_survivor: {
        id: 'five_minute_survivor',
        name: 'Quick Study',
        description: 'Evade capture for 5 minutes',
        icon: '⏱️',
        category: 'progression',
        tier: 'bronze',
        requirement: { type: 'survival_time', value: 300 },
        reward: { type: 'currency', value: 150 },
        hidden: false
    },
    
    ten_minute_survivor: {
        id: 'ten_minute_survivor',
        name: 'Getting Comfortable',
        description: 'Evade capture for 10 minutes',
        icon: '⏱️',
        category: 'progression',
        tier: 'silver',
        requirement: { type: 'survival_time', value: 600 },
        reward: { type: 'currency', value: 300 },
        hidden: false
    },
    
    twenty_minute_survivor: {
        id: 'twenty_minute_survivor',
        name: 'Seasoned Evader',
        description: 'Evade capture for 20 minutes',
        icon: '⏱️',
        category: 'progression',
        tier: 'gold',
        requirement: { type: 'survival_time', value: 1200 },
        reward: { type: 'currency', value: 500 },
        hidden: false
    },
    
    full_run: {
        id: 'full_run',
        name: 'The Long Night',
        description: 'Survive for 30 minutes',
        icon: '🌟',
        category: 'progression',
        tier: 'legendary',
        requirement: { type: 'survival_time', value: 1800 },
        reward: { type: 'unlock_uap', value: 'triangle' },
        hidden: false
    },
    
    endless_survivor: {
        id: 'endless_survivor',
        name: 'Endless Survivor',
        description: 'Survive for 45 minutes in endless mode',
        icon: '♾️',
        category: 'progression',
        tier: 'legendary',
        requirement: { type: 'survival_time', value: 2700 },
        reward: { type: 'currency', value: 1000 },
        hidden: false
    },
    
    hour_long: {
        id: 'hour_long',
        name: 'The Hour of Power',
        description: 'Survive for 1 full hour',
        icon: '⏰',
        category: 'progression',
        tier: 'legendary',
        requirement: { type: 'survival_time', value: 3600 },
        reward: { type: 'currency', value: 2500 },
        hidden: true
    },
    
    level_10: {
        id: 'level_10',
        name: 'Novice',
        description: 'Reach level 10 in a single run',
        icon: '📈',
        category: 'progression',
        tier: 'bronze',
        requirement: { type: 'level_reached', value: 10 },
        reward: { type: 'currency', value: 100 },
        hidden: false
    },
    
    level_25: {
        id: 'level_25',
        name: 'Veteran',
        description: 'Reach level 25 in a single run',
        icon: '📈',
        category: 'progression',
        tier: 'silver',
        requirement: { type: 'level_reached', value: 25 },
        reward: { type: 'unlock_uap', value: 'orb' },
        hidden: false
    },
    
    level_50: {
        id: 'level_50',
        name: 'Ascended',
        description: 'Reach level 50 in a single run',
        icon: '📈',
        category: 'progression',
        tier: 'legendary',
        requirement: { type: 'level_reached', value: 50 },
        reward: { type: 'unlock_difficulty', value: 'nightmare' },
        hidden: false
    },
    
    // =====================================================
    // COMBAT ACHIEVEMENTS
    // =====================================================
    
    first_blood: {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Defeat your first enemy',
        icon: '⚔️',
        category: 'combat',
        tier: 'bronze',
        requirement: { type: 'kills', value: 1 },
        reward: { type: 'currency', value: 50 },
        hidden: false
    },
    
    century: {
        id: 'century',
        name: 'Century',
        description: 'Defeat 100 enemies in a single run',
        icon: '💯',
        category: 'combat',
        tier: 'bronze',
        requirement: { type: 'kills_single_run', value: 100 },
        reward: { type: 'currency', value: 100 },
        hidden: false
    },
    
    thousand: {
        id: 'thousand',
        name: 'One Thousand',
        description: 'Defeat 1,000 enemies in a single run',
        icon: '🎯',
        category: 'combat',
        tier: 'silver',
        requirement: { type: 'kills_single_run', value: 1000 },
        reward: { type: 'currency', value: 300 },
        hidden: false
    },
    
    mass_destruction: {
        id: 'mass_destruction',
        name: 'Mass Destruction',
        description: 'Defeat 5,000 enemies in a single run',
        icon: '💀',
        category: 'combat',
        tier: 'gold',
        requirement: { type: 'kills_single_run', value: 5000 },
        reward: { type: 'unlock_weapon', value: 'plasmaLance' },
        hidden: false
    },
    
    elite_hunter: {
        id: 'elite_hunter',
        name: 'Elite Hunter',
        description: 'Defeat 10 elite enemies',
        icon: '🎖️',
        category: 'combat',
        tier: 'silver',
        requirement: { type: 'elite_kills', value: 10 },
        reward: { type: 'currency', value: 250 },
        hidden: false
    },
    
    boss_slayer: {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat a boss enemy',
        icon: '👑',
        category: 'combat',
        tier: 'gold',
        requirement: { type: 'boss_kills', value: 1 },
        reward: { type: 'unlock_artifact', value: 'foo_fighter_orb' },
        hidden: false
    },
    
    carrier_killer: {
        id: 'carrier_killer',
        name: 'Carrier Killer',
        description: 'Defeat the USS Nimitz',
        icon: '🚢',
        category: 'combat',
        tier: 'legendary',
        requirement: { type: 'specific_kill', value: 'nimitzCarrier' },
        reward: { type: 'unlock_uap', value: 'saucer' },
        hidden: false
    },
    
    ford_destroyer: {
        id: 'ford_destroyer',
        name: 'Ford-Class Destroyer',
        description: 'Defeat the USS Gerald R. Ford',
        icon: '⚓',
        category: 'combat',
        tier: 'legendary',
        requirement: { type: 'specific_kill', value: 'fordCarrier' },
        reward: { type: 'unlock_artifact', value: 'flir_footage' },
        hidden: false
    },
    
    ace_defeated: {
        id: 'ace_defeated',
        name: 'Ace Defeated',
        description: 'Defeat Commander Fravor',
        icon: '✈️',
        category: 'combat',
        tier: 'gold',
        requirement: { type: 'specific_kill', value: 'acePilot' },
        reward: { type: 'unlock_lore', value: 'fravor_testimony' },
        hidden: false
    },
    
    // =====================================================
    // COLLECTION ACHIEVEMENTS
    // =====================================================
    
    codex_novice: {
        id: 'codex_novice',
        name: 'Codex Novice',
        description: 'Discover 25% of all collectibles',
        icon: '📖',
        category: 'collection',
        tier: 'bronze',
        requirement: { type: 'collection_percent', value: 25 },
        reward: { type: 'currency', value: 500 },
        hidden: false
    },
    
    codex_researcher: {
        id: 'codex_researcher',
        name: 'Codex Researcher',
        description: 'Discover 50% of all collectibles',
        icon: '📚',
        category: 'collection',
        tier: 'silver',
        requirement: { type: 'collection_percent', value: 50 },
        reward: { type: 'unlock_difficulty', value: 'hard' },
        hidden: false
    },
    
    codex_expert: {
        id: 'codex_expert',
        name: 'Codex Expert',
        description: 'Discover 75% of all collectibles',
        icon: '🎓',
        category: 'collection',
        tier: 'gold',
        requirement: { type: 'collection_percent', value: 75 },
        reward: { type: 'unlock_uap', value: 'cigar' },
        hidden: false
    },
    
    codex_master: {
        id: 'codex_master',
        name: 'Codex Master',
        description: 'Discover 100% of all collectibles',
        icon: '👁️',
        category: 'collection',
        tier: 'legendary',
        requirement: { type: 'collection_percent', value: 100 },
        reward: { type: 'unlock_difficulty', value: 'apocalypse' },
        hidden: true
    },
    
    artifact_collector: {
        id: 'artifact_collector',
        name: 'Artifact Collector',
        description: 'Collect 10 different artifacts',
        icon: '💎',
        category: 'collection',
        tier: 'silver',
        requirement: { type: 'artifacts_collected', value: 10 },
        reward: { type: 'currency', value: 400 },
        hidden: false
    },
    
    lore_seeker: {
        id: 'lore_seeker',
        name: 'Lore Seeker',
        description: 'Unlock all lore documents',
        icon: '🔍',
        category: 'collection',
        tier: 'gold',
        requirement: { type: 'lore_unlocked', value: 'all' },
        reward: { type: 'unlock_artifact', value: 'roswell_metal' },
        hidden: false
    },
    
    // =====================================================
    // EVENT-SPECIFIC ACHIEVEMENTS
    // =====================================================
    
    first_contact: {
        id: 'first_contact',
        name: 'First Contact',
        description: 'Investigate the Nimitz encounter',
        icon: '🛸',
        category: 'events',
        tier: 'silver',
        requirement: { type: 'event_investigated', value: 'nimitz2004' },
        reward: { type: 'unlock_lore', value: 'five_observables' },
        hidden: false
    },
    
    original_witness: {
        id: 'original_witness',
        name: 'Original Witness',
        description: 'Investigate the Kenneth Arnold sighting',
        icon: '📜',
        category: 'events',
        tier: 'bronze',
        requirement: { type: 'event_investigated', value: 'kenethArnold1947' },
        reward: { type: 'unlock_lore', value: 'project_sign' },
        hidden: false
    },
    
    crash_investigator: {
        id: 'crash_investigator',
        name: 'Crash Investigator',
        description: 'Investigate the Roswell incident',
        icon: '💥',
        category: 'events',
        tier: 'gold',
        requirement: { type: 'event_investigated', value: 'roswell1947' },
        reward: { type: 'unlock_lore', value: 'majestic_12' },
        hidden: false
    },
    
    mass_witness: {
        id: 'mass_witness',
        name: 'Mass Witness',
        description: 'Investigate the Phoenix Lights',
        icon: '👥',
        category: 'events',
        tier: 'silver',
        requirement: { type: 'event_investigated', value: 'phoenixLights1997' },
        reward: { type: 'unlock_artifact', value: 'phoenix_footage' },
        hidden: false
    },
    
    wave_survivor: {
        id: 'wave_survivor',
        name: 'Wave Survivor',
        description: 'Investigate the Belgian Wave',
        icon: '🌊',
        category: 'events',
        tier: 'silver',
        requirement: { type: 'event_investigated', value: 'belgianWave1990' },
        reward: { type: 'unlock_artifact', value: 'belgian_radar_tape' },
        hidden: false
    },
    
    operation_saucer: {
        id: 'operation_saucer',
        name: 'Operation Saucer',
        description: 'Investigate the Colares UFO flap',
        icon: '🔬',
        category: 'events',
        tier: 'gold',
        requirement: { type: 'event_investigated', value: 'colares1977' },
        reward: { type: 'unlock_artifact', value: 'operation_saucer_files' },
        hidden: false
    },
    
    // =====================================================
    // CHALLENGE ACHIEVEMENTS
    // =====================================================
    
    pacifist: {
        id: 'pacifist',
        name: 'Pacifist',
        description: 'Survive 5 minutes without attacking',
        icon: '☮️',
        category: 'challenge',
        tier: 'gold',
        requirement: { type: 'pacifist_time', value: 300 },
        reward: { type: 'currency', value: 1000 },
        hidden: true
    },
    
    untouchable: {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Complete a run without taking damage',
        icon: '👻',
        category: 'challenge',
        tier: 'legendary',
        requirement: { type: 'no_damage_run', value: true },
        reward: { type: 'unlock_cosmetic', value: 'ethereal_trail' },
        hidden: true
    },
    
    speedrunner: {
        id: 'speedrunner',
        name: 'Speedrunner',
        description: 'Reach level 20 in under 10 minutes',
        icon: '⚡',
        category: 'challenge',
        tier: 'gold',
        requirement: { type: 'level_time', value: { level: 20, time: 600 } },
        reward: { type: 'currency', value: 750 },
        hidden: true
    },
    
    glass_cannon: {
        id: 'glass_cannon',
        name: 'Glass Cannon',
        description: 'Deal 100,000 damage with only 1 weapon',
        icon: '🔮',
        category: 'challenge',
        tier: 'gold',
        requirement: { type: 'single_weapon_damage', value: 100000 },
        reward: { type: 'unlock_weapon', value: 'vortexMine' },
        hidden: true
    },
    
    arsenal: {
        id: 'arsenal',
        name: 'Arsenal',
        description: 'Have 6 weapons equipped at once',
        icon: '🎰',
        category: 'challenge',
        tier: 'silver',
        requirement: { type: 'weapons_equipped', value: 6 },
        reward: { type: 'currency', value: 300 },
        hidden: false
    },
    
    evolution: {
        id: 'evolution',
        name: 'Evolution',
        description: 'Evolve a weapon',
        icon: '🧬',
        category: 'challenge',
        tier: 'silver',
        requirement: { type: 'weapon_evolved', value: 1 },
        reward: { type: 'currency', value: 400 },
        hidden: false
    },
    
    // =====================================================
    // SECRET ACHIEVEMENTS
    // =====================================================
    
    foo_fighter: {
        id: 'foo_fighter',
        name: 'Foo Fighter',
        description: 'Discover the WWII mystery lights',
        icon: '💡',
        category: 'secret',
        tier: 'gold',
        requirement: { type: 'event_investigated', value: 'fooFighters1944' },
        reward: { type: 'unlock_uap', value: 'orb' },
        hidden: true
    },
    
    battle_survivor: {
        id: 'battle_survivor',
        name: 'Battle Survivor',
        description: 'Survive 1,400 projectiles in one run',
        icon: '🎆',
        category: 'secret',
        tier: 'legendary',
        requirement: { type: 'projectiles_dodged', value: 1400 },
        reward: { type: 'unlock_artifact', value: 'la_photo' },
        hidden: true
    },
    
    disclosure: {
        id: 'disclosure',
        name: 'Disclosure',
        description: 'Unlock all government documents',
        icon: '📋',
        category: 'secret',
        tier: 'legendary',
        requirement: { type: 'government_docs', value: 'all' },
        reward: { type: 'unlock_ending', value: 'true_ending' },
        hidden: true
    }
};

// Achievement categories
const ACHIEVEMENT_CATEGORIES = {
    progression: { name: 'Progression', icon: '📊', color: '#44aaff' },
    combat: { name: 'Combat', icon: '⚔️', color: '#ff4444' },
    collection: { name: 'Collection', icon: '📖', color: '#ffaa44' },
    events: { name: 'Events', icon: '🛸', color: '#44ff88' },
    challenge: { name: 'Challenge', icon: '🏆', color: '#ff44ff' },
    secret: { name: 'Secret', icon: '❓', color: '#aaaaaa' }
};

// Achievement tiers
const ACHIEVEMENT_TIERS = {
    bronze: { name: 'Bronze', color: '#cd7f32', points: 10 },
    silver: { name: 'Silver', color: '#c0c0c0', points: 25 },
    gold: { name: 'Gold', color: '#ffd700', points: 50 },
    legendary: { name: 'Legendary', color: '#ff6600', points: 100 }
};

// =====================================================
// ACHIEVEMENT TRACKER CLASS
// =====================================================
class AchievementTracker {
    constructor(saveData, game = null) {
        this.game = game;
        this.saveData = saveData;
        this.unlocked = saveData.achievements || [];
        this.progress = saveData.achievementProgress || {};
        this.totalPoints = this.calculatePoints();
        this.pendingRewards = []; // Queue for rewards to show to player
    }
    
    calculatePoints() {
        return this.unlocked.reduce((total, id) => {
            const achievement = ACHIEVEMENTS[id];
            if (achievement) {
                return total + ACHIEVEMENT_TIERS[achievement.tier].points;
            }
            return total;
        }, 0);
    }
    
    checkAchievement(id, value) {
        if (this.unlocked.includes(id)) return null;
        
        const achievement = ACHIEVEMENTS[id];
        if (!achievement) return null;
        
        const req = achievement.requirement;
        let earned = false;
        
        switch (req.type) {
            case 'runs_completed':
            case 'survival_time':
            case 'level_reached':
            case 'kills':
            case 'kills_single_run':
            case 'elite_kills':
            case 'boss_kills':
            case 'collection_percent':
            case 'artifacts_collected':
            case 'pacifist_time':
            case 'projectiles_dodged':
            case 'single_weapon_damage':
            case 'weapons_equipped':
            case 'weapon_evolved':
                earned = value >= req.value;
                this.progress[id] = Math.min(value, req.value);
                break;
                
            case 'specific_kill':
            case 'event_investigated':
                earned = value === req.value;
                break;
                
            case 'no_damage_run':
                earned = value === true;
                break;
                
            case 'level_time':
                earned = value.level >= req.value.level && value.time <= req.value.time;
                break;
                
            case 'lore_unlocked':
            case 'government_docs':
                earned = value === 'all';
                break;
        }
        
        if (earned) {
            this.unlock(id);
            this.claimReward(achievement);
            return achievement;
        }
        
        return null;
    }
    
    // Claim and apply reward for an achievement
    claimReward(achievement) {
        if (!achievement || !achievement.reward) return null;
        
        const reward = achievement.reward;
        let rewardText = '';
        
        switch (reward.type) {
            case 'currency':
                if (this.saveData) {
                    this.saveData.currency = (this.saveData.currency || 0) + reward.value;
                }
                rewardText = `+${reward.value} Credits`;
                break;
                
            case 'unlock_uap':
                if (this.saveData && !this.saveData.unlockedUAPs?.includes(reward.value)) {
                    this.saveData.unlockedUAPs = this.saveData.unlockedUAPs || ['saucer'];
                    this.saveData.unlockedUAPs.push(reward.value);
                }
                rewardText = `Unlocked UAP: ${reward.value}`;
                break;
                
            case 'unlock_difficulty':
                if (this.saveData) {
                    this.saveData.unlockedDifficulties = this.saveData.unlockedDifficulties || ['normal'];
                    if (!this.saveData.unlockedDifficulties.includes(reward.value)) {
                        this.saveData.unlockedDifficulties.push(reward.value);
                    }
                }
                rewardText = `Unlocked Difficulty: ${reward.value}`;
                break;
                
            case 'unlock_weapon':
                if (this.saveData) {
                    this.saveData.unlockedWeapons = this.saveData.unlockedWeapons || [];
                    if (!this.saveData.unlockedWeapons.includes(reward.value)) {
                        this.saveData.unlockedWeapons.push(reward.value);
                    }
                }
                rewardText = `Unlocked Weapon: ${reward.value}`;
                break;
                
            case 'unlock_artifact':
                if (this.saveData) {
                    this.saveData.unlockedArtifacts = this.saveData.unlockedArtifacts || [];
                    if (!this.saveData.unlockedArtifacts.includes(reward.value)) {
                        this.saveData.unlockedArtifacts.push(reward.value);
                    }
                }
                rewardText = `Unlocked Artifact: ${reward.value}`;
                break;
                
            case 'unlock_lore':
                if (this.saveData) {
                    this.saveData.unlockedLore = this.saveData.unlockedLore || [];
                    if (!this.saveData.unlockedLore.includes(reward.value)) {
                        this.saveData.unlockedLore.push(reward.value);
                    }
                }
                rewardText = `Unlocked Lore: ${reward.value}`;
                break;
        }
        
        // Queue reward notification
        this.pendingRewards.push({
            achievement: achievement,
            rewardText: rewardText
        });
        
        // Show in-game notification if game is available
        if (this.game?.ui?.showWarning) {
            this.game.ui.showWarning(`🏆 ${achievement.name}`, 'success');
            if (rewardText) {
                setTimeout(() => {
                    this.game.ui.showWarning(rewardText, 'info');
                }, 1500);
            }
        }
        
        return reward;
    }
    
    // Check multiple achievements at once based on current stats
    checkAll(stats) {
        const newlyUnlocked = [];
        
        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (this.unlocked.includes(id)) continue;
            
            const req = achievement.requirement;
            let value = null;
            
            // Map stat names to achievement requirement types
            switch (req.type) {
                case 'runs_completed':
                    value = stats.totalRuns;
                    break;
                case 'survival_time':
                    value = stats.survivalTime;
                    break;
                case 'level_reached':
                    value = stats.level;
                    break;
                case 'kills':
                    value = stats.totalKills;
                    break;
                case 'kills_single_run':
                    value = stats.kills;
                    break;
                case 'elite_kills':
                    value = stats.eliteKills;
                    break;
                case 'boss_kills':
                    value = stats.bossKills;
                    break;
            }
            
            if (value !== null) {
                const result = this.checkAchievement(id, value);
                if (result) {
                    newlyUnlocked.push(result);
                }
            }
        }
        
        return newlyUnlocked;
    }
    
    unlock(id) {
        if (!this.unlocked.includes(id)) {
            this.unlocked.push(id);
            this.totalPoints = this.calculatePoints();
            return true;
        }
        return false;
    }
    
    isUnlocked(id) {
        return this.unlocked.includes(id);
    }
    
    getProgress(id) {
        const achievement = ACHIEVEMENTS[id];
        if (!achievement) return null;
        
        const current = this.progress[id] || 0;
        const required = achievement.requirement.value;
        
        return {
            current,
            required,
            percentage: typeof required === 'number' ? (current / required) * 100 : 0
        };
    }
    
    getUnlockedByCategory(category) {
        return this.unlocked.filter(id => ACHIEVEMENTS[id]?.category === category);
    }
    
    save() {
        return {
            achievements: this.unlocked,
            achievementProgress: this.progress
        };
    }
}

// Export
if (typeof module !== 'undefined') {
    module.exports = { 
        ACHIEVEMENTS, 
        ACHIEVEMENT_CATEGORIES, 
        ACHIEVEMENT_TIERS, 
        AchievementTracker 
    };
}
