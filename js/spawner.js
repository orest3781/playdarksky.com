// =====================================================
// ENEMY SPAWNER - Balanced phase-based spawning system
// =====================================================

class Spawner {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.currentWave = 0;
        
        // =====================================================
        // PHASE SPAWN CONFIGURATIONS
        // Each phase has distinct enemy composition and pacing
        // =====================================================
        this.phaseConfig = [
            // ===== PHASE 1: INVESTIGATION (0:00 - 5:00) =====
            // Gradual buildup - player gets comfortable with controls
            // Focus: Learning mechanics, light combat
            // TUNED: Faster pacing to feel more engaging from the start
            {
                spawnRate: 0.3,       // Spawn wave every 0.3 seconds (was 0.4)
                baseCount: 5,         // Start with 5 enemies (was 4)
                countGrowth: 1.0,     // Add 1 enemy per minute (was 0.8)
                enemies: [
                    { type: 'reconDrone', weight: 35 },    // Weak fodder
                    { type: 'scoutPlane', weight: 30 },    // Slightly tougher
                    { type: 'patrolJet', weight: 25 },     // Medium threat
                    { type: 'helicopter', weight: 10 }     // Tanky orbiter
                ],
                eliteChance: 0.03,    // 3% elite spawn chance (was 2%)
                maxEnemies: 100,      // Increased cap (was 60)
                description: 'Light reconnaissance forces'
            },
            
            // ===== PHASE 2: ENGAGEMENT (5:00 - 10:00) =====
            // Full military engagement - organized squadrons
            // Focus: Handling groups, positioning
            {
                spawnRate: 0.3,       // Faster spawns (was 0.4)
                baseCount: 6,         // More enemies (was 4)
                countGrowth: 0.8,     // (was 0.6)
                enemies: [
                    { type: 'patrolJet', weight: 20 },
                    { type: 'fighterSquadron', weight: 35 }, // Swarm behavior
                    { type: 'attackHelicopter', weight: 15 }, // Shooting enemies
                    { type: 'seahawk', weight: 20 },
                    { type: 'missileFrigate', weight: 10 }   // Slow but dangerous
                ],
                eliteChance: 0.05,
                maxEnemies: 120,      // (was 80)
                description: 'Full military response'
            },
            
            // ===== PHASE 3: ESCALATION (10:00 - 17:00) =====
            // Advanced units - stealth, high speed, heavy armor
            // Focus: Threat prioritization, build optimization
            {
                spawnRate: 0.35,
                baseCount: 5,
                countGrowth: 0.7,
                enemies: [
                    { type: 'fighterSquadron', weight: 15 },
                    { type: 'raptor', weight: 30 },          // Fast strafers
                    { type: 'f35', weight: 20 },             // Stealth fighters
                    { type: 'b2Bomber', weight: 12 },        // Bombing runs
                    { type: 'submarine', weight: 8 },        // Surprise attacks
                    { type: 'attackHelicopter', weight: 15 }
                ],
                eliteChance: 0.08,
                elitePool: ['aegisCruiser', 'destroyer'],
                maxEnemies: 120,
                description: 'Advanced interceptors'
            },
            
            // ===== PHASE 4: DESPERATE MEASURES (17:00 - 24:00) =====
            // Experimental weapons, drone swarms, orbital strikes
            // Focus: Survival, avoiding hazards
            {
                spawnRate: 0.3,
                baseCount: 6,
                countGrowth: 0.8,
                enemies: [
                    { type: 'raptor', weight: 15 },
                    { type: 'experimentalCraft', weight: 25 }, // Mimic behavior
                    { type: 'droneSwarm', weight: 20 },       // Overwhelming numbers
                    { type: 'blackHawk', weight: 15 },        // Stealth pursuit
                    { type: 'railgunTank', weight: 10 },      // Heavy hitters
                    { type: 'f35', weight: 15 }
                ],
                eliteChance: 0.12,
                elitePool: ['aegisCruiser', 'acePilot'],
                hazardChance: 0.01,   // 1% orbital strike warning
                maxEnemies: 120,
                description: 'Experimental weapons deployed'
            },
            
            // ===== PHASE 5: FINAL STAND (24:00 - 30:00) =====
            // Everything - carrier groups, elite squadrons, boss rush
            // Focus: Ultimate test of build and skill
            {
                spawnRate: 0.25,
                baseCount: 8,
                countGrowth: 1.0,
                enemies: [
                    { type: 'eliteSquadron', weight: 25 },    // Elite fighters
                    { type: 'experimentalCraft', weight: 20 },
                    { type: 'droneSwarm', weight: 15 },
                    { type: 'globalHawk', weight: 15 },       // Surveillance
                    { type: 'blackHawk', weight: 15 },
                    { type: 'acePilot', weight: 10 }          // Mini-boss level
                ],
                eliteChance: 0.15,
                elitePool: ['nuclearSub', 'aegisCruiser', 'acePilot'],
                hazardChance: 0.02,
                maxEnemies: 150,
                description: 'Total warfare'
            }
        ];
        
        // =====================================================
        // SPECIAL WAVE EVENTS - Scripted moments throughout run
        // Creates memorable encounters and difficulty spikes
        // =====================================================
        this.specialWaves = [
            // ----- PHASE 1: INVESTIGATION (0:00 - 5:00) -----
            { time: 5, type: 'initial', enemy: 'patrolJet', count: 6, message: 'THEY\'VE SPOTTED YOU' },
            { time: 20, type: 'swarm', enemy: 'reconDrone', count: 15, message: 'DRONES SCANNING YOUR POSITION' },
            { time: 45, type: 'swarm', enemy: 'scoutPlane', count: 12 },
            { time: 75, type: 'elite', enemy: 'helicopter', count: 4, message: 'HELICOPTERS CLOSING IN' },
            { time: 110, type: 'swarm', enemy: 'patrolJet', count: 18 },
            { time: 150, type: 'swarm', enemy: 'reconDrone', count: 25 },
            { time: 200, type: 'elite', enemy: 'cutter', count: 2, message: 'COAST GUARD HUNTING YOU' },
            { time: 260, type: 'ring', enemy: 'patrolJet', count: 16 },
            
            // ----- PHASE 2: ENGAGEMENT (5:00 - 10:00) -----
            { time: 300, type: 'boss', enemy: 'destroyer', count: 1, message: 'DESTROYER TARGETING YOU' },
            { time: 330, type: 'swarm', enemy: 'fighterSquadron', count: 20 },
            { time: 380, type: 'elite', enemy: 'attackHelicopter', count: 5, message: 'APACHES ON YOUR TAIL' },
            { time: 420, type: 'ring', enemy: 'seahawk', count: 12 },
            { time: 480, type: 'swarm', enemy: 'fighterSquadron', count: 30 },
            { time: 540, type: 'elite', enemy: 'missileFrigate', count: 3, message: 'MISSILES LOCKED ON YOU' },
            
            // ----- PHASE 3: ESCALATION (10:00 - 17:00) -----
            { time: 600, type: 'boss', enemy: 'acePilot', count: 1, message: 'ACE PILOT HUNTING YOU' },
            { time: 660, type: 'swarm', enemy: 'raptor', count: 18, message: 'RAPTORS VECTORING TO YOU' },
            { time: 720, type: 'stealth', enemy: 'b2Bomber', count: 3, message: 'BOMBERS TRACKING YOU' },
            { time: 780, type: 'elite', enemy: 'aegisCruiser', count: 1, message: 'AEGIS HAS YOUR SIGNATURE' },
            { time: 840, type: 'swarm', enemy: 'f35', count: 15 },
            { time: 900, type: 'ring', enemy: 'raptor', count: 20 },
            { time: 960, type: 'elite', enemy: 'submarine', count: 2, message: 'SUBMARINES BENEATH YOU' },
            
            // ----- PHASE 4: DESPERATE MEASURES (17:00 - 24:00) -----
            { time: 1020, type: 'boss', enemy: 'acePilot', count: 2, message: 'TWO ACES AFTER YOU' },
            { time: 1080, type: 'hazard', enemy: 'orbitalStrike', count: 3, message: 'THEY\'RE FIRING FROM ORBIT!' },
            { time: 1140, type: 'swarm', enemy: 'droneSwarm', count: 8, message: 'DRONE STORM CONVERGING' },
            { time: 1200, type: 'boss', enemy: 'nimitzCarrier', count: 1, message: 'CARRIER BATTLE GROUP FOUND YOU' },
            { time: 1260, type: 'elite', enemy: 'experimentalCraft', count: 8 },
            { time: 1320, type: 'elite', enemy: 'railgunTank', count: 3, message: 'RAILGUNS AIMING AT YOU' },
            { time: 1380, type: 'ring', enemy: 'blackHawk', count: 10 },
            
            // ----- PHASE 5: FINAL STAND (24:00+) - ENDLESS -----
            { time: 1440, type: 'boss', enemy: 'acePilot', count: 3, message: 'ELITE ACES WANT YOUR HEAD' },
            { time: 1500, type: 'hazard', enemy: 'orbitalStrike', count: 5, message: 'RAINING FIRE ON YOU!' },
            { time: 1560, type: 'swarm', enemy: 'eliteSquadron', count: 25, message: 'TOP GUNS SCRAMBLED FOR YOU' },
            { time: 1620, type: 'boss', enemy: 'nuclearSub', count: 2, message: 'NUCLEAR SUBS SURFACING' },
            { time: 1680, type: 'swarm', enemy: 'droneSwarm', count: 12 },
            { time: 1740, type: 'boss', enemy: 'fordCarrier', count: 1, message: 'SUPERCARRIER DEPLOYING EVERYTHING' },
            { time: 1770, type: 'ring', enemy: 'acePilot', count: 4, message: 'NOWHERE LEFT TO RUN' }
            // No victory - endless mode continues until death
        ];
        
        this.triggeredSpecials = new Set();
        this.initialBurstSpawned = false;
        this.lastPhase = -1;
        this.endlessCycle = 0;  // Track endless mode cycles
        this.lastCycleTime = 0;
    }
    
    getCurrentPhase() {
        const time = this.game.gameTime;
        for (let i = PHASES.length - 1; i >= 0; i--) {
            if (time >= PHASES[i].startTime) {
                return i;
            }
        }
        return 0;
    }
    
    // Get endless mode cycle number (each cycle = 10 minutes after 30 min mark)
    getEndlessCycle() {
        const time = this.game.gameTime;
        if (time < GAME_CONFIG.PHASE_LOOP_START) return 0;
        return Math.floor((time - GAME_CONFIG.PHASE_LOOP_START) / (GAME_CONFIG.PHASE_LOOP_DURATION || 600)) + 1;
    }
    
    // Get phase difficulty modifiers (with endless scaling)
    getPhaseModifiers() {
        const phase = PHASES[this.getCurrentPhase()];
        const cycle = this.getEndlessCycle();
        
        // Base modifiers from phase
        let health = phase.enemyHealthMod || 1.0;
        let damage = phase.enemyDamageMod || 1.0;
        let speed = phase.enemySpeedMod || 1.0;
        let xp = phase.xpMod || 1.0;
        
        // Apply endless scaling with diminishing returns
        if (cycle > 0 && typeof ENDLESS_SCALING !== 'undefined') {
            // Use sqrt for diminishing returns on later cycles
            const effectiveCycle = Math.sqrt(cycle) * Math.sqrt(cycle > 1 ? cycle : 1);
            health *= 1 + (ENDLESS_SCALING.healthPerCycle * effectiveCycle);
            damage *= 1 + (ENDLESS_SCALING.damagePerCycle * effectiveCycle);
            
            // Speed has a hard cap
            const speedBonus = Math.min(
                ENDLESS_SCALING.speedPerCycle * cycle,
                (ENDLESS_SCALING.speedCap || 1.5) - 1
            );
            speed *= 1 + speedBonus;
            
            xp *= 1 + (cycle * 0.3);  // Reduced XP scaling
        }
        
        return { health, damage, speed, xp };
    }
    
    // Announce phase transitions
    checkPhaseTransition() {
        const currentPhase = this.getCurrentPhase();
        if (currentPhase !== this.lastPhase) {
            this.lastPhase = currentPhase;
            const phase = PHASES[currentPhase];
            if (currentPhase > 0) {
                // Trigger epic phase transition
                this.game.triggerPhaseTransition(currentPhase, phase);
                // Longer pause for dramatic effect
                this.spawnTimer = -2.0;
            }
        }
    }
    
    // Spawn initial burst of enemies so player is immediately in action
    spawnInitialBurst() {
        if (this.initialBurstSpawned) return;
        this.initialBurstSpawned = true;
        
        const player = this.game.player;
        
        // Spawn balanced ring of Phase 1 enemies
        const enemyTypes = [
            'reconDrone', 'reconDrone', 'scoutPlane', 'scoutPlane', 
            'patrolJet', 'patrolJet', 'reconDrone', 'scoutPlane'
        ];
        
        enemyTypes.forEach((type, i) => {
            const angle = (i / enemyTypes.length) * Math.PI * 2 + Math.random() * 0.3;
            const distance = 350 + Math.random() * 150; // 350-500 units away
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            
            // Clamp to world bounds
            const clampedX = Math.max(100, Math.min(GAME_CONFIG.WORLD_WIDTH - 100, x));
            const clampedY = Math.max(100, Math.min(GAME_CONFIG.WORLD_HEIGHT - 100, y));
            
            this.game.spawnEnemy(type, clampedX, clampedY);
        });
    }
    
    update(dt) {
        const phase = this.getCurrentPhase();
        const config = this.phaseConfig[phase];
        
        // Check for phase transitions
        this.checkPhaseTransition();
        
        // Spawn initial burst immediately when game starts
        if (this.game.gameTime > 0.1 && !this.initialBurstSpawned) {
            this.spawnInitialBurst();
        }
        
        // Check for special waves
        this.checkSpecialWaves();
        
        // Regular spawning with endless mode rate adjustment
        this.spawnTimer += dt;
        
        // Apply spawn rate scaling but cap at minimum 0.15s between waves
        const cycle = this.getEndlessCycle();
        let effectiveSpawnRate = config.spawnRate;
        if (cycle > 0 && typeof ENDLESS_SCALING !== 'undefined') {
            const rateBonus = ENDLESS_SCALING.spawnRatePerCycle * cycle;
            effectiveSpawnRate = Math.max(0.15, config.spawnRate / (1 + rateBonus));
        }
        
        if (this.spawnTimer >= effectiveSpawnRate) {
            this.spawnTimer = 0;
            
            // Check if below max enemies - cap at 150 to maintain playability
            const currentEnemies = this.game.enemyPool.getActive().length;
            const maxEnemies = Math.min(config.maxEnemies, 150);
            if (currentEnemies < maxEnemies) {
                this.spawnWave(config);
            }
        }
        
        // Random hazard spawns for later phases
        if (config.hazardChance && Math.random() < config.hazardChance * dt) {
            this.spawnHazard();
        }
    }
    
    spawnWave(config) {
        // Get spawn multiplier from radar sites (increases when player is in detection zone)
        const radarMultiplier = this.game.radarSiteManager ? 
            this.game.radarSiteManager.getSpawnMultiplier() : 1.0;
        
        // Calculate spawn count with time-based growth (capped for playability)
        const minutesPlayed = this.game.gameTime / 60;
        const growthBonus = Math.min((config.countGrowth || 0.5) * minutesPlayed, 8);  // Cap growth bonus
        const baseCount = config.baseCount + Math.floor(growthBonus);
        const count = Math.min(Math.ceil(baseCount * radarMultiplier), 12);  // Cap at 12 per wave
        
        // Spawn regular enemies
        for (let i = 0; i < count; i++) {
            const enemyType = this.selectEnemy(config.enemies);
            const pos = this.getSpawnPosition();
            this.game.spawnEnemy(enemyType, pos.x, pos.y);
        }
        
        // Chance to spawn elite enemy
        if (config.eliteChance && Math.random() < config.eliteChance) {
            const elitePool = config.elitePool || ['cutter'];
            const eliteType = elitePool[Math.floor(Math.random() * elitePool.length)];
            const pos = this.getSpawnPosition();
            this.game.spawnEnemy(eliteType, pos.x, pos.y);
        }
    }
    
    spawnHazard() {
        // Spawn orbital strike warning near player
        const player = this.game.player;
        const angle = Math.random() * Math.PI * 2;
        const dist = 200 + Math.random() * 200;
        const x = player.x + Math.cos(angle) * dist;
        const y = player.y + Math.sin(angle) * dist;
        
        // Clamp to world bounds
        const clampedX = Math.max(100, Math.min(GAME_CONFIG.WORLD_WIDTH - 100, x));
        const clampedY = Math.max(100, Math.min(GAME_CONFIG.WORLD_HEIGHT - 100, y));
        
        this.game.spawnEnemy('orbitalStrike', clampedX, clampedY);
    }
    
    selectEnemy(enemies) {
        const totalWeight = enemies.reduce((sum, e) => sum + e.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const enemy of enemies) {
            random -= enemy.weight;
            if (random <= 0) {
                return enemy.type;
            }
        }
        
        return enemies[0].type;
    }
    
    getSpawnPosition() {
        const player = this.game.player;
        const minDist = 400;
        const maxDist = 600;
        
        // Spawn outside camera view but within world
        const angle = Utils.random(0, Math.PI * 2);
        const dist = Utils.random(minDist, maxDist);
        
        let x = player.x + Math.cos(angle) * dist;
        let y = player.y + Math.sin(angle) * dist;
        
        // Clamp to world bounds
        x = Utils.clamp(x, 50, GAME_CONFIG.WORLD_WIDTH - 50);
        y = Utils.clamp(y, 50, GAME_CONFIG.WORLD_HEIGHT - 50);
        
        return { x, y };
    }
    
    checkSpecialWaves() {
        const time = this.game.gameTime;
        
        for (const special of this.specialWaves) {
            if (time >= special.time && !this.triggeredSpecials.has(special.time)) {
                this.triggeredSpecials.add(special.time);
                this.triggerSpecialWave(special);
            }
        }
        
        // Endless mode: spawn extra boss waves every 2 minutes after 30 min mark
        const cycle = this.getEndlessCycle();
        if (cycle > 0) {
            const cycleTime = Math.floor(time / 120); // Every 2 minutes
            if (cycleTime > this.lastCycleTime) {
                this.lastCycleTime = cycleTime;
                this.triggerEndlessBossWave(cycle);
            }
        }
    }
    
    triggerEndlessBossWave(cycle) {
        const player = this.game.player;
        const bossTypes = ['acePilot', 'nuclearSub', 'fordCarrier', 'nimitzCarrier'];
        const eliteTypes = ['experimentalCraft', 'aegisCruiser', 'railgunTank'];
        
        // Show cycle milestone messages
        if (cycle % 3 === 0) {
            this.game.showWarning(`THREAT LEVEL ${cycle}`, 'boss');
        }
        
        // Boss wave - more bosses as cycles increase
        const bossCount = Math.min(1 + Math.floor(cycle / 2), 4);
        for (let i = 0; i < bossCount; i++) {
            const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
            const angle = (i / bossCount) * Math.PI * 2 + Math.random() * 0.3;
            const dist = 600 + Math.random() * 100;
            this.game.spawnEnemy(
                bossType,
                player.x + Math.cos(angle) * dist,
                player.y + Math.sin(angle) * dist
            );
        }
        
        // Elite swarm
        const eliteCount = 3 + cycle;
        for (let i = 0; i < eliteCount; i++) {
            const eliteType = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
            const pos = this.getSpawnPosition();
            this.game.spawnEnemy(eliteType, pos.x, pos.y);
        }
        
        if (this.game.screenShakeAmount !== undefined) {
            this.game.screenShakeAmount = 10 + cycle;
        }
    }
    
    triggerSpecialWave(special) {
        const player = this.game.player;
        
        // Show warning message
        const warningType = special.type === 'boss' ? 'boss' : 
                          special.type === 'hazard' ? 'danger' : 'alert';
        const message = special.message || `${special.enemy.toUpperCase()} WAVE`;
        this.game.showWarning(message, warningType);
        
        // Spawn with delay for dramatic effect
        setTimeout(() => {
            switch (special.type) {
                case 'swarm':
                    // Spawn many enemies in a scattered circle
                    for (let i = 0; i < special.count; i++) {
                        const angle = (i / special.count) * Math.PI * 2 + Math.random() * 0.5;
                        const dist = 450 + Math.random() * 150;
                        this.game.spawnEnemy(
                            special.enemy,
                            player.x + Math.cos(angle) * dist,
                            player.y + Math.sin(angle) * dist
                        );
                    }
                    break;
                    
                case 'ring':
                    // Perfect ring formation
                    for (let i = 0; i < special.count; i++) {
                        const angle = (i / special.count) * Math.PI * 2;
                        const dist = 500;
                        this.game.spawnEnemy(
                            special.enemy,
                            player.x + Math.cos(angle) * dist,
                            player.y + Math.sin(angle) * dist
                        );
                    }
                    break;
                    
                case 'elite':
                    // Spawn elite enemies at random positions
                    for (let i = 0; i < special.count; i++) {
                        const pos = this.getSpawnPosition();
                        this.game.spawnEnemy(special.enemy, pos.x, pos.y);
                    }
                    break;
                    
                case 'boss':
                    // Boss spawn with screen shake
                    for (let i = 0; i < special.count; i++) {
                        const angle = (i / special.count) * Math.PI * 2;
                        const dist = 600;
                        this.game.spawnEnemy(
                            special.enemy,
                            player.x + Math.cos(angle) * dist,
                            player.y + Math.sin(angle) * dist
                        );
                    }
                    if (this.game.screenShakeAmount !== undefined) {
                        this.game.screenShakeAmount = 15;
                    }
                    break;
                    
                case 'stealth':
                    // Stealth enemies from outside view
                    for (let i = 0; i < special.count; i++) {
                        const pos = this.getSpawnPosition();
                        // Spawn further out
                        const extraDist = 200;
                        const angle = Math.atan2(pos.y - player.y, pos.x - player.x);
                        this.game.spawnEnemy(
                            special.enemy,
                            pos.x + Math.cos(angle) * extraDist,
                            pos.y + Math.sin(angle) * extraDist
                        );
                    }
                    break;
                    
                case 'hazard':
                    // Orbital strikes around player
                    for (let i = 0; i < special.count; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 150 + Math.random() * 200;
                        this.game.spawnEnemy(
                            special.enemy,
                            player.x + Math.cos(angle) * dist,
                            player.y + Math.sin(angle) * dist
                        );
                    }
                    break;
                    
                case 'initial':
                default:
                    // Standard spawn
                    for (let i = 0; i < special.count; i++) {
                        const pos = this.getSpawnPosition();
                        this.game.spawnEnemy(special.enemy, pos.x, pos.y);
                    }
                    break;
            }
        }, 1500);
    }
    
    reset() {
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.currentWave = 0;
        this.triggeredSpecials.clear();
        this.initialBurstSpawned = false;
        this.lastPhase = -1;
    }
}
