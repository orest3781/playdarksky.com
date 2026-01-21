// =====================================================
// PLAYER ENTITY
// =====================================================

class Player {
    constructor(game, uapType = 'saucer') {
        this.game = game;
        this.uapType = uapType;
        
        // Debug: check if UAP_TYPES is available
        if (typeof UAP_TYPES === 'undefined') {
            console.error('CRITICAL: UAP_TYPES is not defined! Check script load order.');
            throw new Error('UAP_TYPES not loaded');
        }
        
        this.uapData = UAP_TYPES[uapType];
        
        if (!this.uapData) {
            console.error(`CRITICAL: UAP type "${uapType}" not found in UAP_TYPES. Available types:`, Object.keys(UAP_TYPES));
            throw new Error(`Invalid UAP type: ${uapType}`);
        }
        
        // Get sprite from cache
        this.sprite = Player.spriteCache[uapType.toLowerCase()] || Player.spriteCache[uapType] || null;
        
        // Position (center of world)
        this.x = GAME_CONFIG.WORLD_WIDTH / 2;
        this.y = GAME_CONFIG.WORLD_HEIGHT / 2;
        
        // Stats from UAP type
        this.baseStats = { ...this.uapData.stats };
        this.stats = { 
            ...this.baseStats,
            // Ensure core stats exist (some UAPs don't define them)
            healthRegen: this.baseStats.healthRegen || 0,
            damage: this.baseStats.damage || 1,
            cooldownReduction: this.baseStats.cooldownReduction || 0,
            resistance: 0,
            xpMultiplier: 1,
            luck: 1,
            area: 1,
            attackSpeed: 1,
            accelMultiplier: 1,
            dash: false,
            secondChance: false,
            extraWeaponSlots: 0,
            startLevel: 1,
            rerolls: 0
        };
        
        // Apply permanent upgrades
        this.applyUpgrades();
        
        // Current state
        this.health = this.stats.maxHealth;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        
        // Movement - Enhanced physics
        this.vx = 0;
        this.vy = 0;
        this.targetVx = 0;
        this.targetVy = 0;
        
        // Movement physics constants
        this.acceleration = 2500;      // How fast we reach target velocity
        this.deceleration = 1800;      // How fast we slow down when no input
        this.maxSpeed = this.stats.speed;
        this.turnSpeed = 8;            // How responsive direction changes are
        this.friction = 0.98;          // Slight velocity damping
        
        // Input smoothing
        this.inputBuffer = { x: 0, y: 0 };
        this.inputSmoothing = 0.3;     // How much to smooth input (0-1)
        
        // Movement state
        this.isMoving = false;
        this.facingAngle = 0;          // Direction player is facing
        this.moveAngle = 0;            // Direction of movement
        this.tilt = 0;                 // Visual tilt for banking effect
        
        // Boost system (legacy - kept for compatibility)
        this.boostMultiplier = 2.0;    // Speed multiplier when boosting
        this.boostEnergy = 100;        // Current boost energy (0-100)
        this.boostMaxEnergy = 100;     // Maximum boost energy
        this.boostDrainRate = 40;      // Energy drain per second while boosting
        this.boostRechargeRate = 25;   // Energy recharge per second when not boosting
        this.boostRechargeDelay = 0.5; // Delay before recharge starts
        this.boostCooldownTimer = 0;   // Timer for recharge delay
        this.isBoosting = false;       // Current boost state
        
        // Phase Shift energy system
        this.phaseEnergy = 100;        // Current phase energy (0-100)
        this.phaseMaxEnergy = 100;     // Maximum phase energy
        this.phaseRechargeRate = 20;   // Energy recharge per second
        
        // Dash system
        this.dashCooldown = 0;
        this.dashCooldownTime = 3.0;   // Seconds between dashes
        
        // Size
        this.radius = 20;
        
        // XP and Level
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = this.calculateXpRequired(1);
        this.pendingLevelUps = 0; // Queue for multiple level-ups
        
        // Weapons
        this.weapons = [];
        this.maxWeapons = 6;
        
        // Passive Items (Vampire Survivors style)
        this.passiveItems = [];
        this.maxPassiveItems = 6;
        
        // Passive stat bonuses (computed from items)
        this.passiveBonuses = {
            damage: 0,
            cooldown: 0,
            projectiles: 0,
            health: 0,
            speed: 0,
            critChance: 0,
            critDamage: 0,
            pickupRange: 0,
            xpGain: 0,
            aoe: 0
        };
        
        // === LEGACY ABILITIES (Disabled - Using 4-Action System) ===
        this.abilities = {}; // Kept for compatibility, no longer populated
        this.abilityPower = 1.0; // Global multiplier from Power Core drops
        // this.initAbilities(); // DISABLED - Legacy system removed
        
        // Add starting weapon
        this.addWeapon(this.uapData.startingWeapon);
        
        // Visual effects
        this.glowPhase = 0;
        this.trailTimer = 0;
    }
    
    /* LEGACY ABILITY SYSTEM - DISABLED
    initAbilities() {
        for (const [id, data] of Object.entries(ABILITIES)) {
            this.abilities[id] = {
                id: id,
                data: data,
                charges: data.maxCharges,
                maxCharges: data.maxCharges,
                level: 1,
                active: false,
                timer: 0,
                // Active effect state
                shieldHP: 0
            };
        }
    }
    END LEGACY */
    
    // New simplified init - abilities are now empty
    initAbilities() {
        // Legacy system removed - using 4-action system (SPACE/Q/E/R)
        this.abilities = {};
    }
    
    useAbility(abilityKey) {
        // Find ability by key number
        const abilityId = Object.keys(this.abilities).find(id => 
            this.abilities[id].data.key === abilityKey
        );
        
        if (!abilityId) return false;
        
        const ability = this.abilities[abilityId];
        
        // Check if can use
        if (ability.charges <= 0 || ability.active) return false;
        
        // Consume charge
        ability.charges--;
        
        // Execute ability
        this.executeAbility(ability);
        
        return true;
    }
    
    executeAbility(ability) {
        const data = ability.data;
        const level = ability.level;
        const power = this.abilityPower;
        
        switch(ability.id) {
            case 'plasmaNova':
                this.castPlasmaNova(ability, level, power);
                break;
            case 'phaseCloak':
                this.castPhaseCloak(ability, level, power);
                break;
            case 'gravityBomb':
                this.castGravityBomb(ability, level, power);
                break;
            case 'shieldMatrix':
                this.castShieldMatrix(ability, level, power);
                break;
            case 'timeWarp':
                this.castTimeWarp(ability, level, power);
                break;
        }
        
        // Play sound effect
        this.game.playSound?.('ability');
    }
    
    castPlasmaNova(ability, level, power) {
        const data = ability.data;
        const radius = data.baseRadius + data.radiusPerLevel * (level - 1);
        const damage = (data.baseDamage + data.damagePerLevel * (level - 1)) * power * this.stats.damage;
        
        // Damage all enemies in radius
        for (const enemy of this.game.enemies) {
            if (!enemy.active) continue;
            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist < radius) {
                // Damage falloff based on distance
                const falloff = 1 - (dist / radius) * 0.5;
                enemy.takeDamage(damage * falloff, this);
                
                // Knockback
                const angle = Utils.angle(this.x, this.y, enemy.x, enemy.y);
                enemy.knockbackX = Math.cos(angle) * 500;
                enemy.knockbackY = Math.sin(angle) * 500;
            }
        }
        
        // Visual effects
        this.game.screenFlash.add(data.color, 0.3, 0.6);
        this.game.screenShake(15);
        
        // Expanding ring effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.game.particles.ring(this.x, this.y, radius * (i + 1) / 3, data.color);
            }, i * 100);
        }
        
        // Particles
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            this.game.particles.spawn(
                this.x + Math.cos(angle) * 30,
                this.y + Math.sin(angle) * 30,
                data.color, 8
            );
        }
        
        this.game.ui.showWarning('YOUR PLASMA NOVA ERUPTS!', 'alert');
    }
    
    castPhaseCloak(ability, level, power) {
        const data = ability.data;
        const duration = data.baseDuration + data.durationPerLevel * (level - 1);
        
        ability.active = true;
        ability.timer = duration;
        
        // Make player intangible
        this.phased = true;
        
        // Visual
        this.game.screenFlash.add(data.color, 0.2, 0.3);
        this.game.ui.showWarning('YOU PHASE OUT OF REALITY', 'info');
    }
    
    castGravityBomb(ability, level, power) {
        const data = ability.data;
        const radius = data.baseRadius + data.radiusPerLevel * (level - 1);
        const damage = (data.baseDamage + data.damagePerLevel * (level - 1)) * power * this.stats.damage;
        const duration = data.baseDuration + data.durationPerLevel * (level - 1);
        const pullForce = data.basePullForce;
        
        // Spawn gravity bomb at player position
        this.game.spawnGravityBomb(this.x, this.y, radius, damage, duration, pullForce, data.color);
        
        this.game.screenShake(10);
        this.game.ui.showWarning('YOU DEPLOY A SINGULARITY', 'info');
    }
    
    castShieldMatrix(ability, level, power) {
        const data = ability.data;
        const shieldHP = (data.baseShieldHP + data.shieldHPPerLevel * (level - 1)) * power;
        const duration = data.baseDuration + data.durationPerLevel * (level - 1);
        
        ability.active = true;
        ability.timer = duration;
        ability.shieldHP = shieldHP;
        ability.maxShieldHP = shieldHP;
        
        this.game.screenFlash.add(data.color, 0.2, 0.3);
        this.game.ui.showWarning('YOUR SHIELDS ARE UP', 'info');
    }
    
    castTimeWarp(ability, level, power) {
        const data = ability.data;
        const duration = data.baseDuration + data.durationPerLevel * (level - 1);
        const slowAmount = Math.max(0.05, data.baseSlowAmount + data.slowPerLevel * (level - 1));
        
        ability.active = true;
        ability.timer = duration;
        
        // Apply slow to game
        this.game.timeWarpActive = true;
        this.game.timeWarpSlow = slowAmount;
        
        this.game.screenFlash.add(data.color, 0.3, 0.4);
        this.game.ui.showWarning('YOU BEND TIME ITSELF', 'info');
    }
    
    updateAbilities(dt) {
        for (const ability of Object.values(this.abilities)) {
            // Active abilities countdown
            if (ability.active) {
                ability.timer -= dt;
                if (ability.timer <= 0) {
                    this.endAbility(ability);
                }
            }
            
            // Passive charge regeneration (if not at max)
            // Each ability has a cooldown timer that regenerates one charge
            if (!ability.cooldownTimer) ability.cooldownTimer = 0;
            
            if (ability.charges < ability.maxCharges) {
                const rechargeTime = 20; // 20 seconds per charge
                ability.cooldownTimer += dt;
                
                if (ability.cooldownTimer >= rechargeTime) {
                    ability.charges++;
                    ability.cooldownTimer = 0;
                    
                    // Visual feedback
                    this.game.particles.spawn(this.x, this.y - 30, ability.data.color, 10);
                }
            } else {
                ability.cooldownTimer = 0;
            }
        }
    }
    
    endAbility(ability) {
        ability.active = false;
        ability.timer = 0;
        
        switch(ability.id) {
            case 'phaseCloak':
                this.phased = false;
                break;
            case 'shieldMatrix':
                ability.shieldHP = 0;
                break;
            case 'timeWarp':
                this.game.timeWarpActive = false;
                this.game.timeWarpSlow = 1;
                break;
        }
    }
    
    // Called when player takes damage - check for shield
    absorbDamageWithShield(amount) {
        const shield = this.abilities.shieldMatrix;
        // If shield ability doesn't exist or isn't active, return full damage
        if (!shield || !shield.active || shield.shieldHP <= 0) {
            return amount;
        }
        
        const absorbed = Math.min(amount, shield.shieldHP);
        shield.shieldHP -= absorbed;
        
        // Shield break
        if (shield.shieldHP <= 0) {
            this.endAbility(shield);
            this.game.particles.explosion(this.x, this.y, '#00aaff', 20);
        }
        
        return amount - absorbed; // Return remaining damage
    }
    
    // Restore charges (from pickup)
    restoreAbilityCharges(amount = 1) {
        for (const ability of Object.values(this.abilities)) {
            ability.charges = Math.min(ability.maxCharges, ability.charges + amount);
        }
    }
    
    // Upgrade a random ability
    upgradeRandomAbility() {
        const abilities = Object.values(this.abilities);
        const upgradeable = abilities.filter(a => a.level < 5); // Max level 5
        if (upgradeable.length === 0) return null;
        
        const ability = upgradeable[Math.floor(Math.random() * upgradeable.length)];
        ability.level++;
        ability.maxCharges = ability.data.maxCharges + Math.floor(ability.level / 2); // Extra charge every 2 levels
        
        return ability;
    }
    
    applyUpgrades() {
        const saveData = this.game.saveData;
        if (!saveData || !saveData.upgrades) return;
        
        for (const branch of Object.values(UPGRADES)) {
            for (const upgrade of branch.upgrades) {
                const level = saveData.upgrades[upgrade.name] || 0;
                if (level > 0 && upgrade.effect) {
                    for (const [key, value] of Object.entries(upgrade.effect)) {
                        // Multiplicative stats
                        if (key === 'speed') this.stats.speed *= (1 + value * level);
                        if (key === 'health') this.stats.maxHealth *= (1 + value * level);
                        if (key === 'damage') this.stats.damage *= (1 + value * level);
                        if (key === 'pickupRange') this.stats.pickupRange *= (1 + value * level);
                        if (key === 'xpGain') this.stats.xpMultiplier += value * level; // Additive multiplier
                        if (key === 'attackSpeed') this.stats.attackSpeed += value * level;
                        if (key === 'aoe') this.stats.area += value * level;
                        if (key === 'accel') this.stats.accelMultiplier += value * level;
                        
                        // Additive stats
                        if (key === 'regen') this.stats.healthRegen += value * level;
                        if (key === 'cooldown') this.stats.cooldownReduction += Math.abs(value) * level;
                        if (key === 'resistance') this.stats.resistance += value * level;
                        if (key === 'dropChance') this.stats.luck += value * level; // Luck multiplier
                        
                        // Boolean/Special stats
                        if (key === 'dash' && level > 0) this.stats.dash = true;
                        if (key === 'secondChance' && level > 0) this.stats.secondChance = true;
                        if (key === 'weaponSlots') this.stats.extraWeaponSlots += value * level;
                        if (key === 'startLevel') this.stats.startLevel = Math.max(this.stats.startLevel, value);
                        if (key === 'rerolls') this.stats.rerolls += value * level;
                    }
                }
            }
        }
        
        // Apply extra weapon slots
        this.maxWeapons += this.stats.extraWeaponSlots;
        
        // Apply physics modifiers
        this.acceleration *= this.stats.accelMultiplier;
        
        // Apply Luck to Crit Chance (1 Luck = +5% Crit)
        if (this.game.critSystem) {
            this.game.critSystem.bonusCritChance = (this.stats.luck - 1) * 0.05;
        }
    }
    
    // Apply a single artifact effect to player stats
    applyArtifactEffect(effect) {
        if (!effect || !effect.type) return;
        
        const value = effect.value;
        
        switch(effect.type) {
            // === STAT BONUSES ===
            case 'health_regen':
                this.stats.healthRegen += value;
                break;
                
            case 'damage_reduction':
            case 'projectile_resistance':
                this.stats.resistance += value;
                break;
                
            case 'xp_bonus':
                this.stats.xpMultiplier += value;
                break;
                
            case 'pickup_range':
                this.stats.pickupRange *= (1 + value);
                break;
                
            case 'crit_chance':
                if (this.game.critSystem) {
                    this.game.critSystem.bonusCritChance += value;
                }
                break;
                
            case 'damage_bonus':
            case 'beam_damage':
            case 'orbiting_damage':
            case 'area_damage':
                this.stats.damage *= (1 + value);
                break;
                
            case 'speed':
                this.stats.speed *= (1 + value);
                this.maxSpeed = this.stats.speed;
                break;
                
            case 'acceleration':
                this.acceleration *= (1 + value);
                break;
                
            case 'health_max':
                const oldMax = this.stats.maxHealth;
                this.stats.maxHealth *= (1 + value);
                // Also heal by the same proportion
                this.health += (this.stats.maxHealth - oldMax);
                break;
                
            case 'cooldown_reduction':
                this.stats.cooldownReduction += value;
                break;
                
            case 'rotation_speed':
                // Store for weapon systems to use
                this.stats.rotationSpeed = (this.stats.rotationSpeed || 1) + value;
                break;
                
            // === SPECIAL EFFECTS ===
            case 'poison_damage':
                // Store for weapon systems to apply
                this.stats.poisonDamage = (this.stats.poisonDamage || 0) + value;
                break;
                
            case 'tracking':
                // Enable homing projectiles
                this.stats.projectileTracking = true;
                break;
                
            case 'reveal_map':
            case 'enemy_reveal':
                // Enable minimap features
                this.stats.enemyRevealRange = value === true ? 500 : value;
                break;
                
            case 'innocence':
                // First hit immunity per encounter
                this.stats.firstHitImmunity = true;
                break;
                
            case 'intel':
                // Show enemy health bars
                this.stats.showEnemyHealth = true;
                break;
                
            case 'formation_bonus':
                // Drone weapon bonus
                this.stats.droneBonus = (this.stats.droneBonus || 1) + 0.15;
                break;
                
            default:
                console.log(`Unknown artifact effect type: ${effect.type}`);
        }
    }
    
    addWeapon(weaponId) {
        // Check if already have this weapon
        const existing = this.weapons.find(w => w.id === weaponId);
        if (existing) {
            // Level up existing weapon
            if (existing.level < WEAPONS[weaponId].maxLevel) {
                existing.level++;
                this.updateWeaponStats(existing);
                
                // Check for evolution when weapon reaches max level
                if (existing.level >= WEAPONS[weaponId].maxLevel) {
                    this.checkAndEvolveWeapon(existing);
                }
                return true;
            }
            return false; // Already maxed
        }
        
        // Add new weapon if space
        if (this.weapons.length < this.maxWeapons) {
            const weaponData = WEAPONS[weaponId];
            const weapon = {
                id: weaponId,
                data: weaponData,
                level: 1,
                cooldown: 0,
                // Calculated stats
                damage: weaponData.baseDamage,
                radius: weaponData.baseRadius || 0,
                projectiles: weaponData.baseProjectiles || 1,
                duration: weaponData.baseDuration || 0,
                range: weaponData.baseRange || 0,
                orbs: weaponData.baseOrbs || 0,
                chains: weaponData.baseChains || 0,
                drones: weaponData.baseDrones || 0,
                targets: weaponData.baseTargets || 1,
                cooldownTime: weaponData.baseCooldown,
                // Runtime state
                activeEffects: [],
                orbits: [],
                activeDrones: []
            };
            this.weapons.push(weapon);
            return true;
        }
        return false;
    }
    
    evolveWeapon(oldWeaponId, newWeaponId) {
        const index = this.weapons.findIndex(w => w.id === oldWeaponId);
        if (index === -1) return false;
        
        const weaponData = WEAPONS[newWeaponId];
        if (!weaponData) return false;
        
        // Create new evolved weapon
        const newWeapon = {
            id: newWeaponId,
            data: weaponData,
            level: 1,
            cooldown: 0,
            // Calculated stats (evolved weapons have high base stats)
            damage: weaponData.baseDamage,
            radius: weaponData.baseRadius || 0,
            projectiles: weaponData.baseProjectiles || 1,
            duration: weaponData.baseDuration || 0,
            range: weaponData.baseRange || 0,
            orbs: weaponData.baseOrbs || 0,
            chains: weaponData.baseChains || 0,
            drones: weaponData.baseDrones || 0,
            targets: weaponData.baseTargets || 1,
            cooldownTime: weaponData.baseCooldown,
            // Runtime state
            activeEffects: [],
            orbits: [],
            activeDrones: []
        };
        
        // Replace old weapon
        this.weapons[index] = newWeapon;
        
        // Visual effect
        this.game.particles.levelUp(this.x, this.y);
        this.game.screenFlash.add(weaponData.color, 0.5, 1.0);
        
        return true;
    }
    
    // Check if a maxed weapon can evolve (needs matching passive)
    checkAndEvolveWeapon(weapon) {
        if (typeof EVOLUTIONS === 'undefined') return false;
        
        const evolution = EVOLUTIONS[weapon.id];
        if (!evolution) return false;
        
        // Check if player has the required passive item
        const hasPassive = this.passiveItems.some(p => p.id === evolution.passive);
        if (!hasPassive) {
            // Show hint about evolution requirement
            const passiveName = PASSIVE_ITEMS?.[evolution.passive]?.name || evolution.passive;
            this.game.ui.showWarning(`${weapon.data.name} can evolve with ${passiveName}!`, 'info');
            return false;
        }
        
        // Evolve the weapon!
        const evolvedName = WEAPONS[evolution.evolved]?.name || evolution.evolved;
        this.evolveWeapon(weapon.id, evolution.evolved);
        this.game.screenFlash.add('#ffffff', 0.8, 1.2);
        this.game.screenShake(25);
        this.game.playSound?.('levelUp');
        this.game.ui.showWarning(`⚡ WEAPON EVOLVED: ${evolvedName}! ⚡`, 'success');
        
        // Spawn celebration XP
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const dist = Utils.random(40, 80);
            this.game.spawnPickup('xp', this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, 40);
        }
        
        return true;
    }

    addPassiveItem(passiveId) {
        // Get passive item data from effects.js
        const passiveData = PASSIVE_ITEMS[passiveId];
        if (!passiveData) {
            console.error(`Unknown passive item: ${passiveId}`);
            return false;
        }
        
        // Check if already have this passive
        const existing = this.passiveItems.find(p => p.id === passiveId);
        if (existing) {
            // Level up existing passive
            if (existing.level < passiveData.maxLevel) {
                existing.level++;
                this.recalculatePassiveBonuses();
                return true;
            }
            return false; // Already maxed
        }
        
        // Add new passive if space
        if (this.passiveItems.length < this.maxPassiveItems) {
            this.passiveItems.push({
                id: passiveId,
                data: passiveData,
                level: 1
            });
            this.recalculatePassiveBonuses();
            
            // Check if any maxed weapons can now evolve with this passive
            this.checkEvolutionsForPassive(passiveId);
            
            return true;
        }
        return false;
    }
    
    // Check if acquiring a passive enables any weapon evolutions
    checkEvolutionsForPassive(passiveId) {
        if (typeof EVOLUTIONS === 'undefined') return;
        
        for (const weapon of this.weapons) {
            if (weapon.level < weapon.data.maxLevel) continue;
            
            const evolution = EVOLUTIONS[weapon.id];
            if (!evolution || evolution.passive !== passiveId) continue;
            
            // This passive matches a maxed weapon!
            const evolvedName = WEAPONS[evolution.evolved]?.name || evolution.evolved;
            this.evolveWeapon(weapon.id, evolution.evolved);
            this.game.screenFlash.add('#ffffff', 0.8, 1.2);
            this.game.screenShake(25);
            this.game.playSound?.('levelUp');
            this.game.ui.showWarning(`⚡ WEAPON EVOLVED: ${evolvedName}! ⚡`, 'success');
            
            // Spawn celebration XP
            for (let i = 0; i < 15; i++) {
                const angle = (i / 15) * Math.PI * 2;
                const dist = Utils.random(40, 80);
                this.game.spawnPickup('xp', this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, 40);
            }
            break; // Only one evolution per passive pickup
        }
    }
    
    recalculatePassiveBonuses() {
        // Reset all bonuses
        for (let key in this.passiveBonuses) {
            this.passiveBonuses[key] = 0;
        }
        
        // Add up all passive bonuses
        for (const passive of this.passiveItems) {
            const data = passive.data;
            const level = passive.level;
            
            // Apply effect multiplied by level
            if (data.effect) {
                for (let stat in data.effect) {
                    if (this.passiveBonuses.hasOwnProperty(stat)) {
                        this.passiveBonuses[stat] += data.effect[stat] * level;
                    }
                }
            }
        }
        
        // Apply bonuses to stats
        this.applyPassiveBonuses();
    }
    
    applyPassiveBonuses() {
        // Recalculate base stats with passive bonuses
        const baseStats = { ...this.uapData.stats };
        
        // Apply percentage bonuses
        if (this.passiveBonuses.health > 0) {
            this.stats.maxHealth = baseStats.maxHealth * (1 + this.passiveBonuses.health);
        }
        if (this.passiveBonuses.speed > 0) {
            this.stats.speed = baseStats.speed * (1 + this.passiveBonuses.speed);
        }
        
        // Update crit system if exists
        if (this.game.critSystem) {
            this.game.critSystem.bonusChance = this.passiveBonuses.critChance || 0;
            this.game.critSystem.bonusDamage = this.passiveBonuses.critDamage || 0;
        }
        
        // Pickup range bonus applies in pickup collect logic
        // XP gain bonus applies in collectXP
        // Damage/cooldown/projectiles bonuses apply in weapon firing
    }
    
    // Get effective damage multiplier from passives
    getDamageMultiplier() {
        return 1 + (this.passiveBonuses.damage || 0);
    }
    
    // Get effective cooldown multiplier from passives
    getCooldownMultiplier() {
        return 1 + (this.passiveBonuses.cooldown || 0); // Negative cooldown = faster
    }
    
    // Get extra projectiles from passives
    getExtraProjectiles() {
        return Math.floor(this.passiveBonuses.projectiles || 0);
    }
    
    // Get pickup range multiplier
    getPickupRangeMultiplier() {
        return 1 + (this.passiveBonuses.pickupRange || 0);
    }
    
    // Get XP gain multiplier
    getXPMultiplier() {
        return 1 + (this.passiveBonuses.xpGain || 0);
    }
    
    // Get AoE multiplier
    getAoEMultiplier() {
        return 1 + (this.passiveBonuses.aoe || 0);
    }
    
    updateWeaponStats(weapon) {
        const data = weapon.data;
        const lvl = weapon.level - 1;
        const bonuses = data.levelBonuses;
        
        // Base stats + Level bonuses + Global stats
        weapon.damage = (data.baseDamage + (bonuses.damage || 0) * lvl) * this.stats.damage;
        weapon.radius = ((data.baseRadius || 0) + (bonuses.radius || 0) * lvl) * this.stats.area;
        weapon.projectiles = (data.baseProjectiles || 1) + (bonuses.projectiles || 0) * lvl;
        weapon.duration = (data.baseDuration || 0) + (bonuses.duration || 0) * lvl;
        weapon.range = ((data.baseRange || 0) + (bonuses.range || 0) * lvl) * this.stats.area; // Range also affected by area
        weapon.orbs = (data.baseOrbs || 0) + (bonuses.orbs || 0) * lvl;
        weapon.chains = (data.baseChains || 0) + (bonuses.chains || 0) * lvl;
        weapon.drones = (data.baseDrones || 0) + (bonuses.drones || 0) * lvl;
        weapon.targets = (data.baseTargets || 1) + (bonuses.targets || 0) * lvl;
        
        // Cooldown calculation (Attack Speed increases frequency, so reduces cooldown)
        const baseCooldown = Math.max(100, (data.baseCooldown || 1000) + (bonuses.cooldown || 0) * lvl);
        // Cooldown reduction from stats (capped at 80%)
        const reduction = Math.min(0.8, this.stats.cooldownReduction);
        // Attack speed multiplier (1.5 attack speed = 1/1.5 cooldown)
        const attackSpeedMult = Math.max(0.1, this.stats.attackSpeed);
        
        weapon.cooldownTime = baseCooldown * (1 - reduction) / attackSpeedMult;
    }
    
    update(dt, input) {
        // Handle invulnerability
        if (this.invulnerable) {
            this.invulnerableTime -= dt;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update active abilities
        this.updateAbilities(dt);
        
        // Health regeneration
        if (this.stats.healthRegen > 0) {
            this.health = Math.min(this.stats.maxHealth, this.health + this.stats.healthRegen * dt);
        }
        
        // Handle ability key presses (1-5)
        for (let i = 1; i <= 5; i++) {
            if (input['ability' + i]) {
                this.useAbility(i);
                input['ability' + i] = false; // Consume input
            }
        }
        
        // --- IMPROVED MOVEMENT SYSTEM ---
        
        // Handle boost
        const wantsToBoost = input.boost && this.boostEnergy > 0;
        
        // Handle Dash (Instant Shift)
        if (this.dashCooldown > 0) {
            this.dashCooldown -= dt;
        }
        
        if (this.stats.dash && input.dash && this.dashCooldown <= 0 && (input.left || input.right || input.up || input.down)) {
            // Perform Dash
            this.dashCooldown = this.dashCooldownTime;
            
            // Dash direction (based on input, not current velocity)
            let dashX = 0;
            let dashY = 0;
            if (input.left) dashX -= 1;
            if (input.right) dashX += 1;
            if (input.up) dashY -= 1;
            if (input.down) dashY += 1;
            
            // Normalize
            const len = Math.sqrt(dashX*dashX + dashY*dashY);
            if (len > 0) {
                dashX /= len;
                dashY /= len;
                
                // Teleport distance
                const dashDist = 250;
                
                // Spawn particles at start
                for (let i = 0; i < 10; i++) {
                    this.game.particles.spawn(this.x, this.y, '#00ffff', 5);
                }
                
                // Move
                this.x += dashX * dashDist;
                this.y += dashY * dashDist;
                
                // Set velocity to dash direction
                this.vx = dashX * this.maxSpeed * 2;
                this.vy = dashY * this.maxSpeed * 2;
                
                // Invulnerability
                this.invulnerable = true;
                this.invulnerableTime = 0.3;
                
                // Visual Effect: Dark Blue Screen Flash
                this.game.screenFlash.add('#000088', 0.2, 0.4);
                this.game.screenShake(5);
                
                // Spawn particles at end
                for (let i = 0; i < 10; i++) {
                    this.game.particles.spawn(this.x, this.y, '#00ffff', 5);
                }
            }
        }
        
        if (wantsToBoost && this.isMoving) {
            this.isBoosting = true;
            this.boostEnergy -= this.boostDrainRate * dt;
            this.boostCooldownTimer = this.boostRechargeDelay;
            
            if (this.boostEnergy <= 0) {
                this.boostEnergy = 0;
                this.isBoosting = false;
            }
            
            // Boost particles
            if (Math.random() > 0.5) {
                this.game.particles.trail(
                    this.x - this.vx * 0.02 + Utils.random(-8, 8),
                    this.y - this.vy * 0.02 + Utils.random(-8, 8),
                    '#00ffff'
                );
            }
        } else {
            this.isBoosting = false;
            
            // Recharge boost energy after delay
            if (this.boostCooldownTimer > 0) {
                this.boostCooldownTimer -= dt;
            } else {
                this.boostEnergy = Math.min(this.boostMaxEnergy, this.boostEnergy + this.boostRechargeRate * dt);
            }
        }
        
        // Recharge phase shift energy (always recharges)
        if (this.phaseEnergy < this.phaseMaxEnergy) {
            this.phaseEnergy = Math.min(this.phaseMaxEnergy, this.phaseEnergy + this.phaseRechargeRate * dt);
        }
        
        // Calculate effective max speed
        let speedMult = this.isBoosting ? this.boostMultiplier : 1;
        
        // CHRONO BURST power-up: 1.5x speed boost
        if (this.game.isPowerupActive('chronoBurst')) {
            speedMult *= POWERUPS.chronoBurst.speedBoost;
        }
        
        // ULTIMATE power-up effects (speed boost + invulnerability for certain ultimates)
        if (this.game.isPowerupActive('ultimate')) {
            const ultData = this.game.ultimateData;
            if (ultData?.speedBoost) {
                speedMult *= ultData.speedBoost;
            }
            if (ultData?.invulnerable) {
                this.invulnerable = true;
                this.invulnerableTime = 0.1; // Keep refreshing invulnerability
            }
        }
        
        this.maxSpeed = this.stats.speed * speedMult;
        
        // Get raw input
        let rawInputX = 0;
        let rawInputY = 0;
        
        if (input.left) rawInputX -= 1;
        if (input.right) rawInputX += 1;
        if (input.up) rawInputY -= 1;
        if (input.down) rawInputY += 1;
        
        // Smooth input (helps with keyboard jitter and diagonal movement)
        this.inputBuffer.x = Utils.lerp(this.inputBuffer.x, rawInputX, 1 - this.inputSmoothing);
        this.inputBuffer.y = Utils.lerp(this.inputBuffer.y, rawInputY, 1 - this.inputSmoothing);
        
        // Get smoothed input
        let inputX = this.inputBuffer.x;
        let inputY = this.inputBuffer.y;
        
        // Normalize diagonal movement (prevents faster diagonal speed)
        const inputMagnitude = Math.sqrt(inputX * inputX + inputY * inputY);
        if (inputMagnitude > 0.1) {
            // Clamp magnitude to 1 for consistent speed
            if (inputMagnitude > 1) {
                inputX /= inputMagnitude;
                inputY /= inputMagnitude;
            }
            this.isMoving = true;
            this.moveAngle = Math.atan2(inputY, inputX);
        } else {
            inputX = 0;
            inputY = 0;
            this.isMoving = false;
        }
        
        // Calculate target velocity based on input
        this.targetVx = inputX * this.maxSpeed;
        this.targetVy = inputY * this.maxSpeed;
        
        // Apply acceleration or deceleration
        if (this.isMoving) {
            // Accelerate toward target velocity
            const accel = this.acceleration * dt;
            
            // Smooth direction changes (allows tighter turns at lower speeds)
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const turnFactor = 1 + (1 - currentSpeed / this.maxSpeed) * 2; // Turn faster at low speeds
            
            this.vx = Utils.lerp(this.vx, this.targetVx, Math.min(1, accel / this.maxSpeed * this.turnSpeed * turnFactor));
            this.vy = Utils.lerp(this.vy, this.targetVy, Math.min(1, accel / this.maxSpeed * this.turnSpeed * turnFactor));
        } else {
            // Decelerate when no input
            const decel = this.deceleration * dt;
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            
            if (currentSpeed > 0.1) {
                const reduction = Math.min(decel, currentSpeed);
                const factor = (currentSpeed - reduction) / currentSpeed;
                this.vx *= factor;
                this.vy *= factor;
            } else {
                this.vx = 0;
                this.vy = 0;
            }
        }
        
        // Apply slight friction for natural feel
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Final speed clamp (safety)
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        // Update facing angle (smoothly follow velocity direction)
        if (speed > 20) {
            const targetAngle = Math.atan2(this.vy, this.vx);
            this.facingAngle = Utils.lerpAngle(this.facingAngle, targetAngle, dt * 8);
        }
        
        // Calculate tilt for banking effect
        const lateralVelocity = this.vx * Math.cos(this.facingAngle + Math.PI/2) + 
                                this.vy * Math.sin(this.facingAngle + Math.PI/2);
        this.tilt = Utils.lerp(this.tilt, Utils.clamp(lateralVelocity / this.maxSpeed * 0.3, -0.3, 0.3), dt * 10);
        
        // Apply velocity to position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // World bounds
        this.x = Utils.clamp(this.x, this.radius, GAME_CONFIG.WORLD_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_CONFIG.WORLD_HEIGHT - this.radius);
        
        // Update weapons
        this.updateWeapons(dt);
        
        // Visual effects
        this.glowPhase += dt * 3;
        
        // Trail particles
        if (speed > 50) {
            this.trailTimer += dt;
            if (this.trailTimer > 0.05) {
                this.trailTimer = 0;
                this.game.particles.trail(
                    this.x - (this.vx * 0.02),
                    this.y - (this.vy * 0.02),
                    this.uapData.icon === '💊' ? '#00ffcc' : '#ffffff'
                );
            }
        }
    }
    
    updateWeapons(dt) {
        // OVERDRIVE power-up: 3x attack speed
        const attackSpeedMult = this.game.isPowerupActive('overdrive') ? 
            POWERUPS.overdrive.attackSpeedMult : 1;
        
        for (const weapon of this.weapons) {
            weapon.cooldown -= dt * 1000 * attackSpeedMult;
            
            if (weapon.cooldown <= 0) {
                this.fireWeapon(weapon);
                const cdReduction = 1 - this.stats.cooldownReduction;
                weapon.cooldown = weapon.cooldownTime * cdReduction;
            }
            
            // Update active effects (zones, orbs, etc.)
            this.updateWeaponEffects(weapon, dt);
        }
    }
    
    fireWeapon(weapon) {
        const data = weapon.data;
        
        // OVERDRIVE power-up: 2x damage
        const damageMult = this.game.isPowerupActive('overdrive') ? 
            POWERUPS.overdrive.damageMult : 1;
        const damage = weapon.damage * this.stats.damage * damageMult;
        
        switch (data.type) {
            case 'aoe':
                this.fireAOE(weapon, damage);
                break;
            case 'projectile':
                this.fireProjectiles(weapon, damage);
                break;
            case 'beam':
                this.fireBeam(weapon, damage);
                break;
            case 'zone':
                this.createZone(weapon, damage);
                break;
            case 'orbit':
                this.updateOrbits(weapon, damage);
                break;
            case 'chain':
                this.fireChainLightning(weapon, damage);
                break;
            case 'minion':
                this.deployDrones(weapon, damage);
                break;
            case 'gravityWave':
                this.fireGravityWaves(weapon, damage);
                break;
        }
    }
    
    fireAOE(weapon, damage) {
        const radius = weapon.radius;
        
        // Visual effect
        this.game.particles.empWave(this.x, this.y, radius);
        this.game.playSound('plasma');
        
        // Damage enemies in radius
        for (const enemy of this.game.enemies) {
            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= radius + enemy.radius) {
                enemy.takeDamage(damage, this);
            }
        }
    }
    
    fireProjectiles(weapon, damage) {
        const count = weapon.projectiles;
        const speed = weapon.data.baseSpeed || 400;
        
        // Play sound (vary pitch for variety, lower volume)
        this.game.playSound('shoot', { volume: 0.35, pitchVariation: 0.2 });
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            this.game.spawnProjectile({
                x: this.x,
                y: this.y,
                angle,
                speed,
                damage,
                radius: 8,
                color: weapon.data.color,
                friendly: true,
                pierce: 0
            });
        }
    }
    
    fireGravityWaves(weapon, damage) {
        // Find nearby enemies to target
        const range = weapon.range || weapon.data.baseRange || 350;
        const targetCount = weapon.targets || weapon.data.baseTargets || 3;
        const enemies = this.game.enemyPool.getActive();
        
        // Sort by distance and get closest targets
        const targets = [];
        for (const enemy of enemies) {
            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist < range) {
                targets.push({ enemy, dist, type: 'enemy' });
            }
        }
        
        // Also check radar ships as potential targets
        if (this.game.radarSiteManager) {
            for (const ship of this.game.radarSiteManager.sites) {
                if (ship.destroyed) continue;
                const dist = Utils.distance(this.x, this.y, ship.x, ship.y);
                if (dist < range) {
                    targets.push({ ship, dist, type: 'ship' });
                }
            }
        }
        
        targets.sort((a, b) => a.dist - b.dist);
        
        // Fire gravity waves at targets
        const toHit = targets.slice(0, targetCount);
        for (const target of toHit) {
            if (target.type === 'ship') {
                // Hit naval ship
                const ship = target.ship;
                ship.takeDamage(damage);
                
                // Visual effect to ship center
                this.game.addGravityWaveEffect(this.x, this.y, ship.x, ship.y, weapon.data.color);
                this.game.particles.explosion(ship.x, ship.y, weapon.data.color, 8);
            } else {
                // Hit enemy
                const enemy = target.enemy;
                
                // Deal damage
                enemy.takeDamage(damage, this);
                
                // Pull effect - draw enemy toward player slightly
                const angle = Utils.angle(enemy.x, enemy.y, this.x, this.y);
                const pullForce = 40;
                enemy.knockbackX += Math.cos(angle) * pullForce;
                enemy.knockbackY += Math.sin(angle) * pullForce;
                
                // Visual: Gravity wave effect (spiral beam)
                this.game.addGravityWaveEffect(this.x, this.y, enemy.x, enemy.y, weapon.data.color);
                
                // Particle burst at target
                this.game.particles.explosion(enemy.x, enemy.y, weapon.data.color, 8);
            }
        }
        
        // If no targets, still show a pulse
        if (toHit.length === 0) {
            this.game.particles.ring(this.x, this.y, 30, weapon.data.color);
        }
    }
    
    fireBeam(weapon, damage) {
        // Find nearest enemy or radar ship
        let nearest = null;
        let nearestDist = weapon.range;
        let targetType = 'enemy';
        
        for (const enemy of this.game.enemies) {
            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
                targetType = 'enemy';
            }
        }
        
        // Also check radar ships
        if (this.game.radarSiteManager) {
            for (const ship of this.game.radarSiteManager.sites) {
                if (ship.destroyed) continue;
                const dist = Utils.distance(this.x, this.y, ship.x, ship.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = ship;
                    targetType = 'ship';
                }
            }
        }
        
        if (nearest) {
            if (targetType === 'ship') {
                nearest.takeDamage(damage);
                this.game.addBeamEffect(this.x, this.y, nearest.x, nearest.y, weapon.data.color);
            } else {
                nearest.takeDamage(damage, this);
                // Pull effect
                const angle = Utils.angle(nearest.x, nearest.y, this.x, this.y);
                nearest.x += Math.cos(angle) * 30;
                nearest.y += Math.sin(angle) * 30;
                
                // Visual
                this.game.addBeamEffect(this.x, this.y, nearest.x, nearest.y, weapon.data.color);
            }
        }
    }
    
    createZone(weapon, damage) {
        weapon.activeEffects.push({
            x: this.x,
            y: this.y,
            radius: weapon.radius,
            damage: damage / 10, // DPS
            duration: weapon.duration / 1000,
            color: weapon.data.color
        });
    }
    
    updateOrbits(weapon, damage) {
        // Ensure correct number of orbs
        while (weapon.orbits.length < weapon.orbs) {
            weapon.orbits.push({
                angle: weapon.orbits.length * (Math.PI * 2 / weapon.orbs),
                distance: 60
            });
        }
        while (weapon.orbits.length > weapon.orbs) {
            weapon.orbits.pop();
        }
    }
    
    fireChainLightning(weapon, damage) {
        // Find nearest enemy to start chain
        let current = null;
        let currentDist = 300;
        
        for (const enemy of this.game.enemies) {
            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (dist < currentDist) {
                currentDist = dist;
                current = enemy;
            }
        }
        
        if (!current) return;
        
        const hit = new Set();
        let chains = weapon.chains;
        let lastX = this.x;
        let lastY = this.y;
        
        while (current && chains > 0) {
            current.takeDamage(damage, this);
            hit.add(current);
            this.game.addBeamEffect(lastX, lastY, current.x, current.y, weapon.data.color);
            
            lastX = current.x;
            lastY = current.y;
            chains--;
            
            // Find next target
            let nextTarget = null;
            let nextDist = 150;
            for (const enemy of this.game.enemies) {
                if (hit.has(enemy)) continue;
                const dist = Utils.distance(lastX, lastY, enemy.x, enemy.y);
                if (dist < nextDist) {
                    nextDist = dist;
                    nextTarget = enemy;
                }
            }
            current = nextTarget;
        }
    }
    
    deployDrones(weapon, damage) {
        // Simplified drone system - spawn projectiles that orbit then attack
        for (let i = 0; i < weapon.drones; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            this.game.spawnDrone({
                x: this.x + Math.cos(angle) * 40,
                y: this.y + Math.sin(angle) * 40,
                damage,
                duration: 5,
                color: weapon.data.color
            });
        }
    }
    
    updateWeaponEffects(weapon, dt) {
        // Update zones
        for (let i = weapon.activeEffects.length - 1; i >= 0; i--) {
            const effect = weapon.activeEffects[i];
            effect.duration -= dt;
            
            // Damage enemies in zone
            for (const enemy of this.game.enemies) {
                const dist = Utils.distance(effect.x, effect.y, enemy.x, enemy.y);
                if (dist <= effect.radius + enemy.radius) {
                    enemy.takeDamage(effect.damage * dt, this);
                }
            }
            
            if (effect.duration <= 0) {
                weapon.activeEffects.splice(i, 1);
            }
        }
        
        // Update orbits
        for (const orb of weapon.orbits) {
            orb.angle += (weapon.data.baseSpeed || 3) * dt;
            
            const orbX = this.x + Math.cos(orb.angle) * orb.distance;
            const orbY = this.y + Math.sin(orb.angle) * orb.distance;
            
            // Check collision with enemies
            for (const enemy of this.game.enemies) {
                const dist = Utils.distance(orbX, orbY, enemy.x, enemy.y);
                if (dist <= 15 + enemy.radius) {
                    enemy.takeDamage(weapon.damage * this.stats.damage * dt * 10, this);
                }
            }
        }
    }
    
    takeDamage(amount, source = 'unknown') {
        if (this.invulnerable) return;
        
        // Check Quantum Shield power-up (complete invulnerability)
        if (this.game.isPowerupActive('shield')) return;
        
        // Check Phase Cloak (intangible)
        if (this.phased) return;
        
        // Track the source of damage for death messages
        this.lastDamageSource = source;
        
        // Apply resistance
        let reducedAmount = amount * (1 - Math.min(0.8, this.stats.resistance));
        
        // Check Shield Matrix
        reducedAmount = this.absorbDamageWithShield(reducedAmount);
        if (reducedAmount <= 0) {
            // All damage absorbed by shield
            this.game.particles.emit({
                x: this.x, y: this.y,
                count: 5, color: '#00aaff',
                speed: 100, life: 0.3, size: 4
            });
            return;
        }
        
        this.health -= reducedAmount;
        this.invulnerable = true;
        this.invulnerableTime = 0.5;
        
        // Track damage taken
        this.game.totalDamageTaken = (this.game.totalDamageTaken || 0) + reducedAmount;
        
        // Notify Reaper system (gives grace period)
        this.game.reaperSystem?.notifyDamage();
        
        this.game.particles.damage(this.x, this.y);
        this.game.screenShake(5);
        this.game.ui.flashDamage();
        this.game.playSound('hit');
        
        if (this.health <= 0) {
            // Second Chance check
            if (this.stats.secondChance) {
                this.health = this.stats.maxHealth * 0.5; // Revive with 50% HP
                this.stats.secondChance = false; // Consume it
                this.invulnerableTime = 3.0; // Long invulnerability
                this.game.screenShake(20);
                this.game.playSound('pickupPowerup');
                
                // Visual effect for revive
                for (let i = 0; i < 20; i++) {
                    this.game.particles.spawn(this.x, this.y, '#ffffff', 5);
                }
                
                // Push enemies away
                this.game.enemies.forEach(e => {
                    const d = Utils.distance(this.x, this.y, e.x, e.y);
                    if (d < 300) {
                        const a = Utils.angle(this.x, this.y, e.x, e.y);
                        e.x += Math.cos(a) * 200;
                        e.y += Math.sin(a) * 200;
                    }
                });
                
                return;
            }
            
            this.health = 0;
            this.game.gameOver(false);
        }
    }
    
    // Calculate XP required for a given level using S-curve
    // Early levels (1-10): Fast progression to hook players
    // Mid levels (11-30): Slower progression for core gameplay
    // Late levels (31+): Faster progression as reward for veterans
    calculateXpRequired(level) {
        const base = GAME_CONFIG.BASE_XP_REQUIRED;
        const growthRate = GAME_CONFIG.XP_GROWTH_RATE;
        
        // S-curve modifier based on level
        const midPoint = 20;  // Inflection point where curve changes
        const steepness = 0.12;  // How sharp the S-curve is
        
        // Sigmoid function: outputs 0-1 based on level position
        const sigmoid = 1 / (1 + Math.exp(-steepness * (level - midPoint)));
        
        // Map sigmoid to XP modifier:
        // - Early levels (sigmoid ~0): modifier ~0.7 (faster)
        // - Mid levels (sigmoid ~0.5): modifier ~1.0 (baseline)  
        // - Late levels (sigmoid ~1): modifier ~0.85 (somewhat faster)
        const modifier = 0.7 + sigmoid * 0.3 - (sigmoid > 0.5 ? (sigmoid - 0.5) * 0.3 : 0);
        
        // Apply base exponential growth with S-curve modifier
        return Math.floor(base * Math.pow(growthRate, level - 1) * modifier);
    }
    
    gainXP(amount) {
        // Apply XP multipliers from upgrades and passives
        let xpMult = this.stats.xpMultiplier;
        xpMult *= this.getXPMultiplier(); // Passive item bonus
        
        const actualXP = amount * xpMult;
        this.xp += actualXP;
        
        // Track total XP collected
        this.game.xpCollected = (this.game.xpCollected || 0) + actualXP;
        
        // Process level-ups immediately - no choice menu, just stat bonuses
        // Upgrades now come from pickup drops only!
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.processLevelUp();
        }
    }
    
    processLevelUp() {
        this.level++;
        // Recalculate XP requirement using S-curve for better pacing
        // Early levels are fast, mid-game slows, late-game speeds up again
        this.xpToLevel = this.calculateXpRequired(this.level);
        
        // Visual feedback
        this.game.particles.levelUp(this.x, this.y);
        this.game.screenShake(8);
        this.game.screenFlash.add('#ffffff', 0.2, 0.4);
        this.game.playSound('levelUp');
        
        // Level-up bonuses (small stat increases per level)
        this.stats.maxHealth += 5;  // +5 max HP per level
        this.health = Math.min(this.health + 10, this.stats.maxHealth); // Heal 10 HP
        this.stats.damage += 0.02;  // +2% damage per level
        
        // Show level-up notification
        this.game.ui.showWarning(`LEVEL ${this.level}!`, 'success');
        
        // Every 5 levels, restore an ability charge
        if (this.level % 5 === 0) {
            this.restoreAbilityCharges(1);
            this.game.ui.showWarning('ABILITY CHARGE RESTORED', 'info');
        }
    }
    
    // Legacy method - kept for compatibility
    levelUp() {
        this.processLevelUp();
    }
    
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Draw weapon effects first
        this.drawWeaponEffects(ctx, camera);
        
        // Invulnerability flash
        if (this.invulnerable && Math.floor(this.invulnerableTime * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Motion trail effect when moving fast
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed * 0.3) {
            const trailAlpha = Math.min(0.3, speed / this.maxSpeed * 0.3);
            ctx.globalAlpha = trailAlpha;
            for (let i = 1; i <= 3; i++) {
                const trailX = screenX - (this.vx * 0.01 * i);
                const trailY = screenY - (this.vy * 0.01 * i);
                this.drawUAPShape(ctx, trailX, trailY, this.facingAngle, this.tilt * 0.5);
            }
            ctx.globalAlpha = this.invulnerable && Math.floor(this.invulnerableTime * 10) % 2 === 0 ? 0.5 : 1;
        }
        
        // Glow effect
        const glowSize = 30 + Math.sin(this.glowPhase) * 5;
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
        gradient.addColorStop(0, 'rgba(0, 255, 204, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw UAP based on type with tilt
        this.drawUAP(ctx, screenX, screenY);
        
        // Speed indicator particles when boosting
        if (speed > this.maxSpeed * 0.7 && Math.random() > 0.7) {
            this.game.particles.trail(
                this.x - this.vx * 0.03 + Utils.random(-5, 5),
                this.y - this.vy * 0.03 + Utils.random(-5, 5),
                this.uapData.icon === '💊' ? '#00ffcc' : '#ffffff'
            );
        }
        
        ctx.globalAlpha = 1;
    }
    
    // Helper method to draw just the UAP shape (used for trails)
    drawUAPShape(ctx, x, y, angle, tilt) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(1 - Math.abs(tilt), 1); // Squash effect for banking
        
        // Use sprite for trails too (with transparency)
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            const size = 64;
            ctx.drawImage(this.sprite, -size/2, -size/2, size, size);
            ctx.restore();
            return;
        }
        
        // Fallback to procedural
        switch (this.uapType) {
            case 'ticTac':
            case 'tictac':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'triangle':
                ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
                ctx.beginPath();
                ctx.moveTo(0, -25);
                ctx.lineTo(22, 18);
                ctx.lineTo(-22, 18);
                ctx.closePath();
                ctx.fill();
                break;
            case 'orb':
                ctx.fillStyle = 'rgba(0, 255, 204, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'saucer':
                ctx.fillStyle = 'rgba(136, 136, 153, 0.5)';
                ctx.beginPath();
                ctx.ellipse(0, 0, 28, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'cigar':
                ctx.fillStyle = 'rgba(68, 68, 68, 0.5)';
                ctx.beginPath();
                ctx.ellipse(0, 0, 35, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }
    
    drawUAP(ctx, x, y) {
        ctx.save();
        
        // Check if ULTIMATE transformation is active
        if (this.game.isPowerupActive('ultimate')) {
            const ultId = this.game.ultimateData?.id;
            const ultState = this.game.powerups?.active?.ultimate;
            
            if (ultId === 'droplet') {
                this.drawDropletTransformation(ctx, x, y);
                ctx.restore();
                return;
            } else if (ultId === 'replicators' && ultState?.transformationTimer > 0) {
                // Only show replicator transformation during 3 second transform phase
                this.drawReplicatorsTransformation(ctx, x, y);
                ctx.restore();
                return;
            }
        }
        
        // Apply tilt transformation for banking effect
        ctx.translate(x, y);
        ctx.rotate(this.facingAngle);
        ctx.scale(1 - Math.abs(this.tilt) * 0.2, 1); // Subtle squash
        
        // Try to draw sprite first
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            // Draw sprite centered at origin (we already translated)
            const size = 64; // Sprite display size
            ctx.drawImage(this.sprite, -size/2, -size/2, size, size);
            ctx.restore();
            return;
        }
        
        // Fallback to procedural drawing if sprite not loaded
        ctx.translate(-x, -y);
        
        switch (this.uapType) {
            case 'ticTac':
            case 'tictac':
                // Tic Tac shape (pill/capsule)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(x, y, 25, 12, this.facingAngle, 0, Math.PI * 2);
                ctx.fill();
                
                // Subtle glow line
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(x, y, 20, 8, this.facingAngle, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'triangle':
                // Black triangle
                ctx.fillStyle = '#222222';
                ctx.beginPath();
                ctx.moveTo(x, y - 25);
                ctx.lineTo(x + 22, y + 18);
                ctx.lineTo(x - 22, y + 18);
                ctx.closePath();
                ctx.fill();
                
                // Corner lights
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(x, y - 20, 4, 0, Math.PI * 2);
                ctx.arc(x + 18, y + 14, 4, 0, Math.PI * 2);
                ctx.arc(x - 18, y + 14, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'orb':
                // Glowing orb
                const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, 18);
                orbGrad.addColorStop(0, '#ffffff');
                orbGrad.addColorStop(0.5, '#aaffff');
                orbGrad.addColorStop(1, '#00ffcc');
                ctx.fillStyle = orbGrad;
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'saucer':
                // Classic saucer
                ctx.fillStyle = '#888899';
                ctx.beginPath();
                ctx.ellipse(x, y + 5, 28, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Dome
                ctx.fillStyle = '#aabbcc';
                ctx.beginPath();
                ctx.ellipse(x, y - 2, 14, 12, 0, Math.PI, Math.PI * 2);
                ctx.fill();
                
                // Lights
                ctx.fillStyle = '#00ff00';
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(x + Math.cos(angle) * 22, y + 5 + Math.sin(angle) * 5, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'cigar':
                // Cigar/cylinder shape
                ctx.fillStyle = '#666677';
                ctx.beginPath();
                ctx.ellipse(x, y, 35, 12, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Windows
                ctx.fillStyle = '#ffff88';
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.arc(x + i * 12, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
        
        ctx.restore();
    }
    
    // Draw the Replicators transformation (Stargate)
    drawReplicatorsTransformation(ctx, x, y) {
        const replicatorsSprite = Player.ultimateSprites.replicators;
        
        // Metallic silver pulsing glow
        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 1;
        const glowSize = 45 * pulse;
        
        // Outer metallic glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, 'rgba(170, 170, 170, 0.7)');
        gradient.addColorStop(0.4, 'rgba(136, 136, 136, 0.4)');
        gradient.addColorStop(0.7, 'rgba(100, 100, 100, 0.2)');
        gradient.addColorStop(1, 'rgba(80, 80, 80, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.translate(x, y);
        ctx.rotate(this.facingAngle);
        
        // Draw sprite if loaded
        if (replicatorsSprite && replicatorsSprite.complete && replicatorsSprite.naturalWidth > 0) {
            const size = 72;
            ctx.drawImage(replicatorsSprite, -size/2, -size/2, size, size);
        } else {
            // Fallback procedural replicator if sprite not loaded
            ctx.fillStyle = '#888888';
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.002;
                const dist = 15 + Math.sin(Date.now() * 0.01 + i) * 5;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#aaaaaa';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Blue energy glow effect
        ctx.globalAlpha = 0.2 + Math.sin(Date.now() * 0.015) * 0.1;
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    // Draw the Droplet transformation (Three Body Problem easter egg)
    drawDropletTransformation(ctx, x, y) {
        const dropletSprite = Player.ultimateSprites.droplet;
        const ultimateData = typeof SCIFI_ULTIMATES !== 'undefined' ? SCIFI_ULTIMATES.droplet : null;
        
        // Chrome/mirror pulsing glow
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1;
        const glowSize = 50 * pulse;
        
        // Outer chrome glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, 'rgba(200, 200, 220, 0.4)');
        gradient.addColorStop(0.6, 'rgba(150, 150, 180, 0.2)');
        gradient.addColorStop(1, 'rgba(100, 100, 120, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Translate and rotate for sprite
        ctx.translate(x, y);
        
        // Sprite faces DOWN (fat bottom, tail top)
        // We want fat side to be FRONT (facing movement direction)
        // facingAngle points RIGHT at 0, so we need -90 degrees to point fat side forward
        const spriteRotation = this.facingAngle - Math.PI / 2;
        ctx.rotate(spriteRotation);
        
        // Draw sprite if loaded
        if (dropletSprite && dropletSprite.complete && dropletSprite.naturalWidth > 0) {
            const size = 80; // Slightly larger than normal UAP
            ctx.drawImage(dropletSprite, -size/2, -size/2, size, size);
        } else {
            // Fallback procedural droplet if sprite not loaded
            this.drawProceduralDroplet(ctx, pulse);
        }
        
        // Additional mirror reflection effect
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.1;
        const reflectGradient = ctx.createLinearGradient(-20, -30, 20, 30);
        reflectGradient.addColorStop(0, '#ffffff');
        reflectGradient.addColorStop(0.5, 'transparent');
        reflectGradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = reflectGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    // Procedural droplet rendering (fallback)
    drawProceduralDroplet(ctx, pulse) {
        const r = 30 * pulse;
        
        // Chrome/mirror gradient
        const chrome = ctx.createLinearGradient(-r, -r * 1.5, r, r);
        chrome.addColorStop(0, '#ffffff');
        chrome.addColorStop(0.2, '#e8e8e8');
        chrome.addColorStop(0.4, '#c0c0c0');
        chrome.addColorStop(0.6, '#d8d8d8');
        chrome.addColorStop(0.8, '#b0b0b0');
        chrome.addColorStop(1, '#ffffff');
        
        ctx.fillStyle = chrome;
        
        // Teardrop shape - fat side at bottom (which is now facing forward due to rotation)
        ctx.beginPath();
        // Start at the tail (top, pointing backward)
        ctx.moveTo(0, -r * 1.5);
        // Curve to fat bottom (now pointing forward)
        ctx.bezierCurveTo(r * 0.6, -r * 0.8, r * 0.9, r * 0.2, 0, r * 0.9);
        ctx.bezierCurveTo(-r * 0.9, r * 0.2, -r * 0.6, -r * 0.8, 0, -r * 1.5);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, r * 0.2, r * 0.2, r * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Edge shine
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, r * 0.3, r * 0.5, -0.5, 0.5);
        ctx.stroke();
    }
    
    drawWeaponEffects(ctx, camera) {
        // Draw zones
        for (const weapon of this.weapons) {
            for (const effect of weapon.activeEffects) {
                const screenX = effect.x - camera.x;
                const screenY = effect.y - camera.y;
                
                ctx.globalAlpha = 0.3;
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, effect.radius);
                gradient.addColorStop(0, effect.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, effect.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            
            // Draw orbits
            for (const orb of weapon.orbits) {
                const orbX = this.x + Math.cos(orb.angle) * orb.distance - camera.x;
                const orbY = this.y + Math.sin(orb.angle) * orb.distance - camera.y;
                
                ctx.fillStyle = weapon.data.color;
                ctx.beginPath();
                ctx.arc(orbX, orbY, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Glow
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(orbX, orbY, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }
}

// Static sprite cache - shared across all Player instances
Player.spriteCache = {};
Player.spritesLoaded = false;

// Ultimate transformation sprites
Player.ultimateSprites = {};

// Preload all player sprites
Player.preloadSprites = function() {
    const uapTypes = ['saucer', 'triangle', 'orb', 'cigar', 'tictac', 'adamski', 'jellyfish', 'cube', 'gimbal', 'gofast'];
    let loaded = 0;
    
    uapTypes.forEach(type => {
        const img = new Image();
        img.onload = () => {
            Player.spriteCache[type] = img;
            loaded++;
            if (loaded === uapTypes.length) {
                Player.spritesLoaded = true;
                console.log('All player sprites loaded');
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load sprite for ${type}, will use procedural drawing`);
            loaded++;
        };
        // Handle camelCase to lowercase filename mapping
        const filename = type.toLowerCase();
        img.src = `Assets/sprites/player/${filename}.png`;
    });
    
    // Load ultimate transformation sprites
    Player.loadUltimateSprites();
};

// Load sci-fi ultimate transformation sprites
Player.loadUltimateSprites = function() {
    // Droplet sprite
    const dropletImg = new Image();
    dropletImg.onload = () => {
        Player.ultimateSprites.droplet = dropletImg;
        console.log('Droplet ultimate sprite loaded');
    };
    dropletImg.onerror = () => {
        console.warn('Failed to load droplet sprite');
    };
    dropletImg.src = 'Assets/sprites/player/droplet.png';
    
    // Replicators sprite
    const replicatorsImg = new Image();
    replicatorsImg.onload = () => {
        Player.ultimateSprites.replicators = replicatorsImg;
        console.log('Replicators ultimate sprite loaded');
    };
    replicatorsImg.onerror = () => {
        console.warn('Failed to load replicators sprite');
    };
    replicatorsImg.src = 'Assets/sprites/player/replicators.png';
};

// Start preloading immediately
Player.preloadSprites();
