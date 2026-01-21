// =====================================================
// ENEMY ENTITY
// =====================================================

class Enemy {
    constructor(game, type, x, y) {
        this.game = game;
        this.type = type;
        this.data = ENEMY_TYPES[type];
        
        // Position
        this.x = x;
        this.y = y;
        
        // Get phase modifiers for balanced scaling
        const phaseIndex = this.getCurrentPhase();
        const phase = PHASES[phaseIndex] || PHASES[0];
        const phaseMods = {
            health: phase.enemyHealthMod || 1.0,
            damage: phase.enemyDamageMod || 1.0,
            speed: phase.enemySpeedMod || 1.0,
            xp: phase.xpMod || 1.0
        };
        
        // Gradual time scaling (5% per minute, capped at 50% bonus for both HP and damage)
        const minutesPlayed = game.gameTime / 60;
        const timeScale = 1 + Math.min(minutesPlayed * 0.05, 0.5);
        
        // Apply combined scaling (damage also capped at 50% like HP)
        this.maxHealth = Math.floor(this.data.health * phaseMods.health * timeScale);
        this.health = this.maxHealth;
        this.speed = this.data.speed * phaseMods.speed;
        const damageScale = 1 + Math.min(minutesPlayed * 0.05, 0.5); // Cap damage scaling at 50% too
        this.damage = Math.floor(this.data.damage * phaseMods.damage * damageScale);
        this.xpValue = Math.ceil(this.data.xp * phaseMods.xp);
        this.radius = this.data.size;
        
        // Elite/Boss bonus
        if (this.data.elite) {
            this.maxHealth *= 1.5;
            this.health = this.maxHealth;
            this.xpValue *= 2;
        }
        if (this.data.boss) {
            this.xpValue *= 3;
        }
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
        
        // State
        this.active = true;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.stunTime = 0;
        this.slowAmount = 1;
        this.slowTime = 0;
        
        // Shooting enemies
        this.shootCooldown = 0;
        this.shootRate = this.data.shootRate || 2000; // ms between shots
        
        // Visual
        this.hitFlash = 0;
        this.rotation = 0;
        
        // Behavior specific
        this.behaviorTimer = 0;
        this.orbitAngle = Utils.random(0, Math.PI * 2);
        this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
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
    
    update(dt, player) {
        if (!this.active) return;
        
        // Apply Time Warp slow effect from player ability
        let effectiveDt = dt;
        if (this.game.timeWarpActive) {
            effectiveDt *= this.game.timeWarpSlow;
        }
        
        // CHRONO BURST - Complete freeze!
        if (this.game.isPowerupActive('chronoBurst')) {
            effectiveDt = 0; // Completely frozen
            // Still show hit flash
            if (this.hitFlash > 0) this.hitFlash -= dt;
            return; // Skip all updates
        }
        
        // Update timers
        if (this.hitFlash > 0) this.hitFlash -= dt; // Visual timers use real time
        if (this.stunTime > 0) {
            this.stunTime -= effectiveDt;
            return;
        }
        if (this.slowTime > 0) {
            this.slowTime -= effectiveDt;
        } else {
            this.slowAmount = 1;
        }
        
        // Apply knockback
        this.x += this.knockbackX * effectiveDt;
        this.y += this.knockbackY * effectiveDt;
        this.knockbackX *= 0.9;
        this.knockbackY *= 0.9;
        
        // Behavior-based movement (uses effectiveDt for time warp)
        this.updateBehavior(effectiveDt, player);
        
        // === PARTICLE EFFECTS ===
        // Engine trails for aircraft (random chance to emit)
        if (this.isAircraft() && Math.random() < 0.15) {
            this.emitEngineTrail();
        }
        // Ship wake effects for naval units
        if (this.isShip() && Math.random() < 0.1) {
            this.emitShipWake();
        }
        
        // World bounds
        this.x = Utils.clamp(this.x, this.radius, GAME_CONFIG.WORLD_WIDTH - this.radius);
        this.y = Utils.clamp(this.y, this.radius, GAME_CONFIG.WORLD_HEIGHT - this.radius);
        
        // Shooting enemies
        if (this.data.shoots) {
            this.shootCooldown -= dt * 1000;
            if (this.shootCooldown <= 0) {
                this.shoot(player);
                this.shootCooldown = this.shootRate;
            }
        }
        
        // Check collision with player
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        if (dist < this.radius + player.radius) {
            player.takeDamage(this.damage * dt * 2, this.type);
        }
    }
    
    updateBehavior(dt, player) {
        const behavior = this.data.behavior;
        const effectiveSpeed = this.speed * this.slowAmount;
        
        switch (behavior) {
            case 'chase':
                this.chasePlayer(dt, player, effectiveSpeed);
                break;
            case 'orbit':
                this.orbitPlayer(dt, player, effectiveSpeed);
                break;
            case 'swarm':
                this.swarmBehavior(dt, player, effectiveSpeed);
                break;
            case 'strafe':
                this.strafeBehavior(dt, player, effectiveSpeed);
                break;
            case 'stationary':
                // Don't move, just rotate to face player
                this.rotation = Utils.angle(this.x, this.y, player.x, player.y);
                break;
            case 'slow':
                this.chasePlayer(dt, player, effectiveSpeed * 0.5);
                break;
            case 'bombing':
                this.bombingRun(dt, player, effectiveSpeed);
                break;
            case 'mimic':
                this.mimicPlayer(dt, player, effectiveSpeed);
                break;
            case 'pursuit':
                this.aggressivePursuit(dt, player, effectiveSpeed);
                break;
            case 'boss':
                this.bossBehavior(dt, player, effectiveSpeed);
                break;
            case 'bossDrones':
                this.bossDronesBehavior(dt, player, effectiveSpeed);
                break;
            case 'hazard':
                this.hazardBehavior(dt, player);
                break;
            default:
                this.chasePlayer(dt, player, effectiveSpeed);
        }
    }
    
    chasePlayer(dt, player, speed) {
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation = angle;
    }
    
    orbitPlayer(dt, player, speed) {
        this.orbitAngle += dt * (speed / 100);
        const orbitDist = 200;
        const targetX = player.x + Math.cos(this.orbitAngle) * orbitDist;
        const targetY = player.y + Math.sin(this.orbitAngle) * orbitDist;
        
        const angle = Utils.angle(this.x, this.y, targetX, targetY);
        this.x += Math.cos(angle) * speed * dt;
        this.y += Math.sin(angle) * speed * dt;
        this.rotation = Utils.angle(this.x, this.y, player.x, player.y);
        
        // Seahawk deploys sonar buoys while orbiting
        if (this.data.deploysSonar) {
            if (!this.sonarTimer) this.sonarTimer = 0;
            this.sonarTimer += dt * 1000;
            const sonarRate = this.data.sonarRate || 3000;
            if (this.sonarTimer >= sonarRate) {
                this.sonarTimer = 0;
                this.deploySonarBuoy();
            }
        }
    }
    
    deploySonarBuoy() {
        // Creates a small hazard zone that detects and slows player
        this.game.createHazardZone({
            x: this.x,
            y: this.y,
            radius: 60,
            damage: 10, // Light damage
            duration: 3.0,
            warningTime: 0.5,
            color: '#00aaff'
        });
        this.game.playSound('sonarPing', { volume: 0.4 });
    }
    
    swarmBehavior(dt, player, speed) {
        // Chase with slight offset based on instance
        const offset = (this.x * 0.01 + this.y * 0.01) % (Math.PI * 2);
        const angle = Utils.angle(this.x, this.y, player.x, player.y) + Math.sin(this.game.gameTime * 3 + offset) * 0.5;
        this.x += Math.cos(angle) * speed * dt;
        this.y += Math.sin(angle) * speed * dt;
        this.rotation = angle;
    }
    
    strafeBehavior(dt, player, speed) {
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        
        // Change strafe direction periodically
        this.behaviorTimer += dt;
        if (this.behaviorTimer > 2) {
            this.behaviorTimer = 0;
            this.strafeDirection *= -1;
        }
        
        if (dist > 300) {
            // Approach
            this.x += Math.cos(angle) * speed * dt;
            this.y += Math.sin(angle) * speed * dt;
        } else if (dist < 150) {
            // Back off
            this.x -= Math.cos(angle) * speed * 0.5 * dt;
            this.y -= Math.sin(angle) * speed * 0.5 * dt;
        } else {
            // Strafe
            const strafeAngle = angle + Math.PI / 2 * this.strafeDirection;
            this.x += Math.cos(strafeAngle) * speed * dt;
            this.y += Math.sin(strafeAngle) * speed * dt;
        }
        this.rotation = angle;
    }
    
    bombingRun(dt, player, speed) {
        // Move in a line, drop damage zones
        this.behaviorTimer += dt;
        
        // Initialize bomb timer
        if (!this.bombTimer) this.bombTimer = 0;
        
        if (this.behaviorTimer < 3) {
            // Choose target position
            if (!this.bombTarget) {
                const angle = Utils.random(0, Math.PI * 2);
                this.bombTarget = {
                    x: player.x + Math.cos(angle) * 500,
                    y: player.y + Math.sin(angle) * 500
                };
            }
            
            const angle = Utils.angle(this.x, this.y, this.bombTarget.x, this.bombTarget.y);
            this.x += Math.cos(angle) * speed * dt;
            this.y += Math.sin(angle) * speed * dt;
            this.rotation = angle;
            
            // Drop bombs if this enemy has the dropsBombs flag
            if (this.data.dropsBombs) {
                this.bombTimer += dt * 1000;
                const bombRate = this.data.bombRate || 2000;
                if (this.bombTimer >= bombRate) {
                    this.bombTimer = 0;
                    this.dropBomb(player);
                }
            }
        } else {
            this.behaviorTimer = 0;
            this.bombTarget = null;
        }
    }
    
    dropBomb(player) {
        // Create a bomb hazard zone
        const bombDamage = this.data.bombDamage || 60;
        const bombRadius = this.data.bombRadius || 80;
        
        // Spawn visual warning first
        this.game.particles.emit({
            x: this.x,
            y: this.y,
            count: 8,
            color: '#ff4400',
            speed: 100,
            angle: Math.PI / 2,
            angleSpread: 0.3,
            size: 4,
            life: 0.5,
            decay: 4
        });
        
        // Create hazard zone that damages player
        this.game.createHazardZone({
            x: this.x,
            y: this.y,
            radius: bombRadius,
            damage: bombDamage,
            duration: 1.5,
            warningTime: 0.8,
            color: '#ff4400'
        });
        
        this.game.playSound('launch', { volume: 0.4, pitchVariation: 0.2 });
    }
    
    mimicPlayer(dt, player, speed) {
        // Try to mirror player movements
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        
        if (dist > 100) {
            // Mirror position relative to some point
            const mirrorX = player.x - (player.vx || 0) * 0.1;
            const mirrorY = player.y - (player.vy || 0) * 0.1;
            const mirrorAngle = Utils.angle(this.x, this.y, mirrorX, mirrorY);
            this.x += Math.cos(mirrorAngle) * speed * dt;
            this.y += Math.sin(mirrorAngle) * speed * dt;
        }
        this.rotation = angle;
    }
    
    aggressivePursuit(dt, player, speed) {
        // Fast, aggressive chase with prediction
        const predictX = player.x + (player.vx || 0) * 0.5;
        const predictY = player.y + (player.vy || 0) * 0.5;
        const angle = Utils.angle(this.x, this.y, predictX, predictY);
        
        this.x += Math.cos(angle) * speed * 1.2 * dt;
        this.y += Math.sin(angle) * speed * 1.2 * dt;
        this.rotation = angle;
    }
    
    bossBehavior(dt, player, speed) {
        // Slow movement, spawns minions
        this.chasePlayer(dt, player, speed);
        
        this.behaviorTimer += dt;
        const spawnRate = this.data.squadronSpawnRate ? this.data.squadronSpawnRate / 1000 : 5;
        if (this.behaviorTimer > spawnRate) {
            this.behaviorTimer = 0;
            // Nimitz spawns elite squadrons, others spawn fighters
            const minionType = this.data.launchesSquadrons ? 'eliteSquadron' : 'fighterSquadron';
            const count = this.data.launchesSquadrons ? 2 : 3;
            for (let i = 0; i < count; i++) {
                const angle = Utils.random(0, Math.PI * 2);
                this.game.spawnEnemy(minionType, 
                    this.x + Math.cos(angle) * 50,
                    this.y + Math.sin(angle) * 50
                );
            }
            this.game.playSound('launch', { volume: 0.5 });
        }
    }
    
    bossDronesBehavior(dt, player, speed) {
        // Ford Carrier - launches drone swarms instead of fighters
        this.chasePlayer(dt, player, speed * 0.7);
        
        this.behaviorTimer += dt;
        const spawnRate = this.data.droneSpawnRate ? this.data.droneSpawnRate / 1000 : 4;
        if (this.behaviorTimer > spawnRate) {
            this.behaviorTimer = 0;
            // Spawn drone swarm clusters
            const clusterCount = 4;
            for (let i = 0; i < clusterCount; i++) {
                const angle = Utils.random(0, Math.PI * 2);
                const dist = Utils.random(40, 80);
                this.game.spawnEnemy('droneSwarm', 
                    this.x + Math.cos(angle) * dist,
                    this.y + Math.sin(angle) * dist
                );
            }
            this.game.playSound('droneBuzz', { volume: 0.4 });
        }
    }
    
    hazardBehavior(dt, player) {
        // Orbital Strike - warning phase, then damage zone
        if (!this.warningStarted) {
            this.warningStarted = true;
            this.warningTimer = this.data.warningTime || 2.0;
            this.strikeActive = false;
            this.strikeDuration = 1.5;
            // Lock position to current location
            this.strikeX = this.x;
            this.strikeY = this.y;
            this.game.playSound('alarm', { volume: 0.6 });
        }
        
        if (this.warningTimer > 0) {
            // Warning phase - don't move, pulse warning
            this.warningTimer -= dt;
            this.x = this.strikeX;
            this.y = this.strikeY;
        } else if (!this.strikeActive) {
            // Activate the strike
            this.strikeActive = true;
            this.game.screenShake(15);
            this.game.screenFlash.add('#ff8800', 0.4, 0.3);
            this.game.playSound('explosionBig', { volume: 0.8 });
        } else {
            // Strike active - damage player if in range
            this.strikeDuration -= dt;
            const strikeRadius = this.data.strikeRadius || 120;
            const dist = Utils.distance(this.x, this.y, player.x, player.y);
            if (dist < strikeRadius) {
                player.takeDamage(this.damage * dt * 3, this.type);
            }
            
            if (this.strikeDuration <= 0) {
                this.active = false; // Despawn after strike
            }
        }
    }

    shoot(player) {
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        this.game.spawnProjectile({
            x: this.x,
            y: this.y,
            angle,
            speed: 300,
            damage: this.damage * 0.5,
            radius: 6,
            color: '#ff4444',
            friendly: false
        });
    }
    
    takeDamage(amount, source, isCrit = false) {
        this.health -= amount;
        this.hitFlash = 0.1;
        
        // Show damage number (Vampire Survivors style)
        if (this.game.damageNumbers) {
            this.game.damageNumbers.spawn(this.x, this.y - this.radius, amount, { crit: isCrit });
        }
        
        // Track total damage and DPS
        this.game.totalDamageDealt = (this.game.totalDamageDealt || 0) + amount;
        this.game.dpsAccumulator = (this.game.dpsAccumulator || 0) + amount;
        
        // Knockback
        if (source) {
            const angle = Utils.angle(source.x, source.y, this.x, this.y);
            const knockbackForce = isCrit ? 300 : 200;
            this.knockbackX = Math.cos(angle) * knockbackForce;
            this.knockbackY = Math.sin(angle) * knockbackForce;
        }
        
        // Small particles on hit
        this.game.particles.damage(this.x, this.y, this.data.color);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    applySlow(amount, duration) {
        this.slowAmount = Math.min(this.slowAmount, amount);
        this.slowTime = Math.max(this.slowTime, duration);
    }
    
    die() {
        this.active = false;
        
        // === COMBO SYSTEM ===
        let xpMultiplier = 1.0;
        if (this.game.comboSystem) {
            xpMultiplier = this.game.comboSystem.addKill();
        }
        
        // Spawn XP pickup with combo multiplier
        const xpValue = Math.floor(this.xpValue * xpMultiplier);
        this.game.spawnPickup('xp', this.x, this.y, xpValue);
        
        // === IMPROVED DROP SYSTEM ===
        const luck = this.game.player.stats.luck || 1;
        
        // Health drop (5% base, higher for elites/bosses)
        const healthDropChance = (this.data.boss ? 0.5 : (this.data.elite ? 0.2 : 0.05)) * luck;
        if (Math.random() < healthDropChance) {
            this.game.spawnPickup('health', this.x, this.y, this.data.boss ? 400 : (this.data.elite ? 200 : 80));
        }
        
        // Currency drop (new!)
        const currencyDropChance = (this.data.boss ? 1.0 : (this.data.elite ? 0.5 : 0.15)) * luck;
        if (Math.random() < currencyDropChance) {
            const currencyValue = this.data.boss ? 50 : (this.data.elite ? 15 : 3);
            this.game.spawnPickup('currency', this.x + Utils.random(-15, 15), this.y + Utils.random(-15, 15), currencyValue);
        }
        
        // XP magnet chance (rare powerup)
        if (Math.random() < 0.01 * luck) {
            this.game.spawnPickup('magnet', this.x, this.y, 1);
        }
        
        // === ABILITY POWER-UP DROPS ===
        // Ability Charge (restores ability uses) - 2% from elites, 5% from bosses
        const abilityChargeChance = (this.data.boss ? 0.5 : (this.data.elite ? 0.08 : 0.005)) * luck;
        if (Math.random() < abilityChargeChance) {
            this.game.spawnPickup('abilityCharge', this.x + Utils.random(-20, 20), this.y + Utils.random(-20, 20), 1);
        }
        
        // Power Core (+25% ability power) - very rare, mainly from bosses
        const powerCoreChance = (this.data.boss ? 0.8 : (this.data.elite ? 0.02 : 0)) * luck;
        if (Math.random() < powerCoreChance) {
            this.game.spawnPickup('powerCore', this.x, this.y, 1);
        }
        
        // Ability Fragment (upgrades random ability) - boss only
        if (this.data.boss && Math.random() < 0.5 * luck) {
            this.game.spawnPickup('abilityFragment', this.x + Utils.random(-30, 30), this.y + Utils.random(-30, 30), 1);
        }
        
        // === WEAPON/PASSIVE UPGRADE DROPS ===
        // These must be picked up quickly! 15 second timer.
        // Drop rate: 0.3% normal, 8% elite, 100% boss (guaranteed)
        const upgradeDropChance = (this.data.boss ? 1.0 : (this.data.elite ? 0.08 : 0.003)) * luck;
        if (Math.random() < upgradeDropChance) {
            this.game.spawnUpgradePickup(
                this.x + Utils.random(-40, 40), 
                this.y + Utils.random(-40, 40)
            );
        }
        
        // === TEMPORARY POWER-UP DROPS (Q, E, F) ===
        // These are the fun temporary buffs!
        for (const [id, data] of Object.entries(POWERUPS)) {
            // Skip 'ultimate' in POWERUPS - it now uses fragment system
            if (id === 'ultimate') continue;
            
            let dropChance = data.dropChance * luck;
            if (this.data.elite) dropChance = data.eliteDropChance * luck;
            if (this.data.boss) dropChance = data.bossDropChance * luck;
            
            if (Math.random() < dropChance) {
                this.game.spawnPickup(`powerup_${id}`, 
                    this.x + Utils.random(-25, 25), 
                    this.y + Utils.random(-25, 25), 
                    1
                );
            }
        }
        
        // === ULTIMATE FRAGMENT DROPS ===
        // Fragments charge your ultimate ability - collect enough to earn a charge!
        // Drop rate: 20% normal, 60% elite, 100% boss (guaranteed)
        // Value: 1-2 from normal, 3-5 from elite, 10-15 from boss
        const fragmentDropChance = (this.data.boss ? 1.0 : (this.data.elite ? 0.6 : 0.2)) * luck;
        if (Math.random() < fragmentDropChance) {
            const fragmentValue = this.data.boss ? Utils.random(10, 15) : 
                                  (this.data.elite ? Utils.random(3, 5) : Utils.random(1, 2));
            this.game.spawnPickup('ultimateFragment', 
                this.x + Utils.random(-20, 20), 
                this.y + Utils.random(-20, 20), 
                Math.floor(fragmentValue)
            );
        }
        
        // === ARTIFACT DROPS (Codex collectibles) ===
        // Artifacts are rare Diablo-style items that grant permanent bonuses
        const difficultyData = this.game.difficultyData || { rewards: { artifactDropChance: 0.02 } };
        let artifactChance = difficultyData.rewards.artifactDropChance * luck;
        if (this.data.elite) artifactChance *= 3;
        if (this.data.boss) artifactChance *= 10;
        
        if (Math.random() < artifactChance && typeof ARTIFACTS !== 'undefined') {
            const availableArtifacts = Object.keys(ARTIFACTS);
            const collectedArtifacts = this.game.saveData?.collections?.artifacts || [];
            const uncollected = availableArtifacts.filter(id => !collectedArtifacts.includes(id));
            
            // Prefer uncollected artifacts
            const pool = uncollected.length > 0 ? uncollected : availableArtifacts;
            const artifactId = pool[Math.floor(Math.random() * pool.length)];
            
            this.game.spawnPickup('artifact', 
                this.x + Utils.random(-30, 30), 
                this.y + Utils.random(-30, 30), 
                1,
                { artifactId }
            );
        }
        
        // Death effect - reduced particle counts for performance
        const particleCount = this.data.boss ? 30 : (this.data.elite ? 15 : 8);
        this.game.particles.explosion(this.x, this.y, this.data.color, particleCount);
        
        // Screen shake on kill (bigger for elites/bosses)
        if (this.data.boss) {
            this.game.screenShake(20);
            this.game.screenFlash.add('#ffffff', 0.3, 0.5);
            this.game.ui.showWarning('BOSS NEUTRALIZED', 'success');
            this.game.bossKills = (this.game.bossKills || 0) + 1;
            this.game.playSound('explosionBig', { volume: 0.7 });
        } else if (this.data.elite) {
            this.game.screenShake(8);
            this.game.screenFlash.add('#ffcc00', 0.15, 0.3);
            this.game.eliteKills = (this.game.eliteKills || 0) + 1;
            this.game.playSound('explosion', { volume: 0.5 });
        } else {
            // Small screen shake for regular kills (adds juice!)
            this.game.screenShake(1);
            this.game.playSound('explosionSmall', { volume: 0.25, pitchVariation: 0.3 });
        }
        
        // Increment kill count
        this.game.kills++;
    }
    
    draw(ctx, camera) {
        if (!this.active) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Skip if off screen
        if (screenX < -this.radius * 2 || screenX > ctx.canvas.width + this.radius * 2 ||
            screenY < -this.radius * 2 || screenY > ctx.canvas.height + this.radius * 2) {
            return;
        }
        
        const healthPercent = this.health / this.maxHealth;
        
        // === STEALTH SYSTEM ===
        // Stealth enemies fade in as player gets closer
        let stealthAlpha = 1.0;
        if (this.data.stealthRange) {
            const distToPlayer = Utils.distance(this.x, this.y, this.game.player.x, this.game.player.y);
            if (distToPlayer > this.data.stealthRange) {
                stealthAlpha = 0.1; // Almost invisible when far
            } else {
                // Fade in as player gets closer
                const fadeStart = this.data.stealthRange * 1.5;
                const t = Math.max(0, Math.min(1, (fadeStart - distToPlayer) / fadeStart));
                stealthAlpha = 0.1 + t * 0.9;
            }
        }
        
        // === ELITE GLOW EFFECT ===
        if ((this.data.elite || this.data.boss) && stealthAlpha > 0.5) {
            const glowIntensity = 0.3 + Math.sin(this.game.gameTime * 4) * 0.2;
            const glowColor = this.data.boss ? 'rgba(255, 50, 50, ' : 'rgba(255, 200, 50, ';
            const glowSize = this.data.boss ? 25 : 15;
            
            ctx.save();
            ctx.shadowColor = glowColor + glowIntensity + ')';
            ctx.shadowBlur = glowSize;
            ctx.fillStyle = glowColor + (glowIntensity * 0.5) + ')';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.radius + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        // Apply stealth alpha
        ctx.globalAlpha = stealthAlpha;
        
        // Hit flash effect
        const isFlashing = this.hitFlash > 0;
        
        // Draw realistic vehicle based on type
        this.drawVehicle(ctx, isFlashing);
        
        ctx.restore();
        
        // === DAMAGE SMOKE EFFECT ===
        if (healthPercent < 0.25 && Math.random() < 0.3) {
            this.emitDamageSmoke();
        }
        
        // Health bar for elites/bosses
        if (this.data.elite || this.data.boss) {
            const barWidth = this.radius * 2.5;
            const barHeight = 6;
            const barY = screenY - this.radius - 15;
            
            // Background
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(screenX - barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2);
            
            // Health bar
            const barColor = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
            ctx.fillStyle = '#333333';
            ctx.fillRect(screenX - barWidth/2, barY, barWidth, barHeight);
            ctx.fillStyle = barColor;
            ctx.fillRect(screenX - barWidth/2, barY, barWidth * healthPercent, barHeight);
            
            // Elite/Boss indicator icon
            ctx.fillStyle = this.data.boss ? '#ff4444' : '#ffcc00';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.data.boss ? '💀' : '⭐', screenX, barY - 8);
            
            // Name plate for bosses
            if (this.data.boss) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(this.data.name, screenX, barY - 20);
            }
        }
    }
    
    // === PARTICLE EFFECT METHODS ===
    
    emitDamageSmoke() {
        if (!this.game.particles) return;
        this.game.particles.emit({
            x: this.x + Utils.random(-this.radius * 0.5, this.radius * 0.5),
            y: this.y + Utils.random(-this.radius * 0.5, this.radius * 0.5),
            count: 1,
            color: Utils.random() > 0.5 ? '#333333' : '#555555',
            speed: 30,
            angle: -Math.PI / 2 + Utils.random(-0.5, 0.5),
            angleSpread: 0.3,
            size: Utils.random(4, 8),
            life: 0.6,
            decay: 3,
            gravity: -20
        });
    }
    
    emitEngineTrail() {
        if (!this.game.particles) return;
        const exhaustAngle = this.rotation + Math.PI; // Behind the vehicle
        this.game.particles.emit({
            x: this.x + Math.cos(exhaustAngle) * this.radius * 0.8,
            y: this.y + Math.sin(exhaustAngle) * this.radius * 0.8,
            count: 1,
            color: Utils.random() > 0.7 ? '#ff8844' : '#ffcc66',
            speed: 50,
            angle: exhaustAngle,
            angleSpread: 0.2,
            size: Utils.random(3, 6),
            life: 0.3,
            decay: 8
        });
    }
    
    emitShipWake() {
        if (!this.game.particles) return;
        const wakeAngle = this.rotation + Math.PI;
        this.game.particles.emit({
            x: this.x + Math.cos(wakeAngle) * this.radius,
            y: this.y + Math.sin(wakeAngle) * this.radius,
            count: 2,
            color: 'rgba(150, 200, 255, 0.5)',
            speed: 20,
            angle: wakeAngle,
            angleSpread: 0.8,
            size: Utils.random(2, 5),
            life: 0.8,
            decay: 2
        });
    }
    
    // Helper to determine if this enemy is an aircraft
    isAircraft() {
        const aircraftTypes = [
            'reconDrone', 'scoutPlane', 'patrolJet', 'helicopter', 'fighterSquadron',
            'attackHelicopter', 'seahawk', 'raptor', 'f35', 'b2Bomber', 'experimentalCraft',
            'droneSwarm', 'blackHawk', 'acePilot', 'eliteSquadron', 'globalHawk'
        ];
        return aircraftTypes.includes(this.type);
    }
    
    // Helper to determine if this enemy is a ship
    isShip() {
        const shipTypes = [
            'cutter', 'missileFrigate', 'destroyer', 'aegisCruiser', 
            'submarine', 'nuclearSub', 'nimitzCarrier', 'fordCarrier'
        ];
        return shipTypes.includes(this.type);
    }
    
    drawVehicle(ctx, isFlashing) {
        const r = this.radius;
        const flashColor = '#ffffff';
        
        switch (this.type) {
            case 'reconDrone':
                this.drawReconDrone(ctx, r, isFlashing, flashColor);
                break;
            case 'patrolJet':
            case 'fighterSquadron':
                this.drawFA18(ctx, r, isFlashing, flashColor);
                break;
            case 'helicopter':
                this.drawHelicopter(ctx, r, isFlashing, flashColor, 'search');
                break;
            case 'seahawk':
                this.drawHelicopter(ctx, r, isFlashing, flashColor, 'seahawk');
                break;
            case 'cutter':
                this.drawShip(ctx, r, isFlashing, flashColor, 'cutter');
                break;
            case 'missileFrigate':
                this.drawShip(ctx, r, isFlashing, flashColor, 'frigate');
                break;
            case 'raptor':
                this.drawF22(ctx, r, isFlashing, flashColor);
                break;
            case 'aegisCruiser':
                this.drawShip(ctx, r, isFlashing, flashColor, 'cruiser');
                break;
            case 'b2Bomber':
                this.drawB2(ctx, r, isFlashing, flashColor);
                break;
            case 'experimentalCraft':
                this.drawExperimental(ctx, r, isFlashing, flashColor);
                break;
            case 'droneSwarm':
                this.drawSmallDrone(ctx, r, isFlashing, flashColor);
                break;
            case 'orbitalStrike':
                this.drawOrbitalWarning(ctx, r, isFlashing, flashColor);
                break;
            case 'nimitzCarrier':
                this.drawAircraftCarrier(ctx, r, isFlashing, flashColor);
                break;
            case 'aceПилот':
                this.drawAceFA18(ctx, r, isFlashing, flashColor);
                break;
            default:
                this.drawGenericEnemy(ctx, r, isFlashing, flashColor);
        }
    }
    
    // =====================================================
    // REALISTIC VEHICLE DRAWINGS
    // =====================================================
    
    drawReconDrone(ctx, r, flash, fc) {
        // Quadcopter style drone
        const bodyColor = flash ? fc : '#555555';
        const armColor = flash ? fc : '#333333';
        
        // Arms
        ctx.strokeStyle = armColor;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            ctx.stroke();
            
            // Rotors
            ctx.fillStyle = flash ? fc : 'rgba(100, 100, 100, 0.6)';
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Camera lens
        ctx.fillStyle = flash ? fc : '#00aaff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFA18(ctx, r, flash, fc) {
        // F/A-18 Hornet - Top-down view
        const bodyColor = flash ? fc : '#4a5568';
        const cockpitColor = flash ? fc : '#1a365d';
        const detailColor = flash ? fc : '#2d3748';
        
        ctx.save();
        
        // Main fuselage
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(r * 1.2, 0);                    // Nose
        ctx.lineTo(r * 0.3, r * 0.15);             // Nose to body
        ctx.lineTo(-r * 0.2, r * 0.2);             // Body
        ctx.lineTo(-r * 0.8, r * 0.15);            // Tail section
        ctx.lineTo(-r * 1.0, r * 0.25);            // Tail
        ctx.lineTo(-r * 1.0, -r * 0.25);           // Other tail
        ctx.lineTo(-r * 0.8, -r * 0.15);
        ctx.lineTo(-r * 0.2, -r * 0.2);
        ctx.lineTo(r * 0.3, -r * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.fillStyle = detailColor;
        ctx.beginPath();
        ctx.moveTo(r * 0.1, r * 0.2);
        ctx.lineTo(-r * 0.4, r * 0.9);            // Wing tip
        ctx.lineTo(-r * 0.7, r * 0.8);            // Wing trailing edge
        ctx.lineTo(-r * 0.5, r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(r * 0.1, -r * 0.2);
        ctx.lineTo(-r * 0.4, -r * 0.9);
        ctx.lineTo(-r * 0.7, -r * 0.8);
        ctx.lineTo(-r * 0.5, -r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Horizontal stabilizers
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, r * 0.15);
        ctx.lineTo(-r * 1.0, r * 0.5);
        ctx.lineTo(-r * 1.0, r * 0.3);
        ctx.lineTo(-r * 0.85, r * 0.15);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.15);
        ctx.lineTo(-r * 1.0, -r * 0.5);
        ctx.lineTo(-r * 1.0, -r * 0.3);
        ctx.lineTo(-r * 0.85, -r * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Vertical stabilizers (twin tails)
        ctx.fillStyle = flash ? fc : '#374151';
        ctx.fillRect(-r * 0.95, r * 0.1, r * 0.15, r * 0.05);
        ctx.fillRect(-r * 0.95, -r * 0.15, r * 0.15, r * 0.05);
        
        // Cockpit
        ctx.fillStyle = cockpitColor;
        ctx.beginPath();
        ctx.ellipse(r * 0.5, 0, r * 0.35, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit glass reflection
        ctx.fillStyle = flash ? fc : 'rgba(100, 200, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(r * 0.55, -r * 0.02, r * 0.15, r * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Engine intakes
        ctx.fillStyle = flash ? fc : '#1a202c';
        ctx.fillRect(r * 0.1, r * 0.12, r * 0.15, r * 0.08);
        ctx.fillRect(r * 0.1, -r * 0.2, r * 0.15, r * 0.08);
        
        // Engine exhaust glow
        if (!flash) {
            ctx.fillStyle = 'rgba(255, 150, 50, 0.6)';
            ctx.beginPath();
            ctx.ellipse(-r * 1.05, r * 0.08, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
            ctx.ellipse(-r * 1.05, -r * 0.08, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawHelicopter(ctx, r, flash, fc, type) {
        const isSeahawk = type === 'seahawk';
        const bodyColor = flash ? fc : (isSeahawk ? '#3d4a5a' : '#3d4a3d');
        const rotorColor = flash ? fc : 'rgba(80, 80, 80, 0.5)';
        
        ctx.save();
        
        // Main rotor disc
        ctx.strokeStyle = rotorColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
        ctx.stroke();
        
        // Rotor blades
        ctx.strokeStyle = flash ? fc : '#444444';
        ctx.lineWidth = 4;
        const rotorAngle = (this.game.gameTime * 15) % (Math.PI * 2);
        for (let i = 0; i < (isSeahawk ? 4 : 2); i++) {
            const angle = rotorAngle + (i * Math.PI / (isSeahawk ? 2 : 1));
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * -r * 1.1, Math.sin(angle) * -r * 1.1);
            ctx.lineTo(Math.cos(angle) * r * 1.1, Math.sin(angle) * r * 1.1);
            ctx.stroke();
        }
        
        // Fuselage
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(r * 0.8, 0);                    // Nose
        ctx.quadraticCurveTo(r * 0.6, r * 0.25, r * 0.2, r * 0.3);
        ctx.lineTo(-r * 0.3, r * 0.25);
        ctx.lineTo(-r * 0.8, r * 0.1);
        ctx.lineTo(-r * 0.8, -r * 0.1);
        ctx.lineTo(-r * 0.3, -r * 0.25);
        ctx.lineTo(r * 0.2, -r * 0.3);
        ctx.quadraticCurveTo(r * 0.6, -r * 0.25, r * 0.8, 0);
        ctx.fill();
        
        // Tail boom
        ctx.fillStyle = flash ? fc : '#2a3a3a';
        ctx.fillRect(-r * 0.8, -r * 0.08, r * 0.5, r * 0.16);
        
        // Tail rotor
        ctx.fillStyle = rotorColor;
        ctx.beginPath();
        ctx.arc(-r * 1.1, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit windows
        ctx.fillStyle = flash ? fc : 'rgba(50, 100, 150, 0.8)';
        ctx.beginPath();
        if (isSeahawk) {
            // Seahawk tandem cockpit
            ctx.ellipse(r * 0.5, 0, r * 0.2, r * 0.12, 0, 0, Math.PI * 2);
            ctx.ellipse(r * 0.15, 0, r * 0.18, r * 0.15, 0, 0, Math.PI * 2);
        } else {
            // Standard helicopter cockpit
            ctx.ellipse(r * 0.4, 0, r * 0.3, r * 0.2, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        
        if (isSeahawk) {
            // Seahawk side gun pod
            ctx.fillStyle = flash ? fc : '#222222';
            ctx.fillRect(r * 0.6, -r * 0.05, r * 0.2, r * 0.1);
            
            // Weapon pylons (torpedoes/missiles)
            ctx.fillStyle = flash ? fc : '#333333';
            ctx.fillRect(-r * 0.1, r * 0.3, r * 0.25, r * 0.06);
            ctx.fillRect(-r * 0.1, -r * 0.36, r * 0.25, r * 0.06);
            
            // Anti-ship missiles / torpedoes
            ctx.fillStyle = flash ? fc : '#4a5a6a';
            for (let i = 0; i < 2; i++) {
                ctx.fillRect(r * 0.0 + i * r * 0.12, r * 0.35, r * 0.08, r * 0.18);
                ctx.fillRect(r * 0.0 + i * r * 0.12, -r * 0.53, r * 0.08, r * 0.18);
            }
        }
        
        ctx.restore();
    }
    
    drawShip(ctx, r, flash, fc, type) {
        const isCruiser = type === 'cruiser';
        const isFrigate = type === 'frigate';
        const hullColor = flash ? fc : (isCruiser ? '#4a5568' : (isFrigate ? '#556677' : '#e2e8f0'));
        const deckColor = flash ? fc : '#2d3748';
        
        ctx.save();
        
        // Hull
        ctx.fillStyle = hullColor;
        ctx.beginPath();
        ctx.moveTo(r * 1.2, 0);                    // Bow
        ctx.quadraticCurveTo(r * 0.9, r * 0.3, r * 0.5, r * 0.4);
        ctx.lineTo(-r * 0.8, r * 0.35);
        ctx.lineTo(-r * 1.0, r * 0.2);             // Stern
        ctx.lineTo(-r * 1.0, -r * 0.2);
        ctx.lineTo(-r * 0.8, -r * 0.35);
        ctx.lineTo(r * 0.5, -r * 0.4);
        ctx.quadraticCurveTo(r * 0.9, -r * 0.3, r * 1.2, 0);
        ctx.fill();
        
        // Deck details
        ctx.fillStyle = deckColor;
        ctx.fillRect(-r * 0.6, -r * 0.2, r * 1.0, r * 0.4);
        
        if (isCruiser) {
            // Aegis superstructure
            ctx.fillStyle = flash ? fc : '#374151';
            ctx.fillRect(-r * 0.3, -r * 0.25, r * 0.5, r * 0.5);
            
            // Aegis radar panels (SPY-1)
            ctx.fillStyle = flash ? fc : '#1a202c';
            ctx.fillRect(-r * 0.25, -r * 0.3, r * 0.2, r * 0.15);
            ctx.fillRect(-r * 0.25, r * 0.15, r * 0.2, r * 0.15);
            
            // VLS cells
            ctx.fillStyle = flash ? fc : '#2d3748';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(r * 0.3 + i * r * 0.1, -r * 0.15, r * 0.08, r * 0.3);
            }
            
            // Gun turret
            ctx.fillStyle = flash ? fc : '#4a5568';
            ctx.beginPath();
            ctx.arc(r * 0.8, 0, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(r * 0.8, -r * 0.03, r * 0.25, r * 0.06);
        } else if (isFrigate) {
            // Missile Frigate details
            ctx.fillStyle = flash ? fc : '#445566';
            ctx.fillRect(-r * 0.2, -r * 0.2, r * 0.4, r * 0.4);
            
            // VLS missile cells (forward)
            ctx.fillStyle = flash ? fc : '#334455';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(r * 0.4 + i * r * 0.12, -r * 0.12, r * 0.1, r * 0.24);
            }
            
            // Missile launcher (aft)
            ctx.fillStyle = flash ? fc : '#3d4d5d';
            ctx.beginPath();
            ctx.arc(-r * 0.5, 0, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            // Radar mast
            ctx.fillStyle = flash ? fc : '#2d3d4d';
            ctx.fillRect(-r * 0.05, -r * 0.35, r * 0.1, r * 0.2);
            ctx.beginPath();
            ctx.arc(0, -r * 0.4, r * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            // Gun turret (bow)
            ctx.fillStyle = flash ? fc : '#4a5a6a';
            ctx.beginPath();
            ctx.arc(r * 0.85, 0, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(r * 0.85, -r * 0.025, r * 0.2, r * 0.05);
        } else {
            // Coast Guard cutter details
            ctx.fillStyle = flash ? fc : '#c53030';  // Red stripe
            ctx.fillRect(r * 0.2, -r * 0.42, r * 0.5, r * 0.04);
            ctx.fillRect(r * 0.2, r * 0.38, r * 0.5, r * 0.04);
            
            // Bridge
            ctx.fillStyle = flash ? fc : '#2d3748';
            ctx.fillRect(-r * 0.2, -r * 0.2, r * 0.35, r * 0.4);
            
            // Mast
            ctx.fillStyle = flash ? fc : '#1a202c';
            ctx.fillRect(-r * 0.1, -r * 0.05, r * 0.05, r * 0.1);
        }
        
        // Wake effect
        if (!flash) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(-r * 1.0, 0);
            ctx.lineTo(-r * 1.5, r * 0.3);
            ctx.lineTo(-r * 1.3, 0);
            ctx.lineTo(-r * 1.5, -r * 0.3);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawSAMLauncher(ctx, r, flash, fc) {
        const baseColor = flash ? fc : '#5d4e37';
        const launcherColor = flash ? fc : '#3d3d3d';
        
        ctx.save();
        
        // Truck base
        ctx.fillStyle = baseColor;
        ctx.fillRect(-r * 0.8, -r * 0.4, r * 1.6, r * 0.8);
        
        // Wheels
        ctx.fillStyle = flash ? fc : '#1a1a1a';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-r * 0.5 + i * r * 0.5, r * 0.45, r * 0.15, 0, Math.PI * 2);
            ctx.arc(-r * 0.5 + i * r * 0.5, -r * 0.45, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Launcher rail
        ctx.fillStyle = launcherColor;
        ctx.save();
        ctx.rotate(-0.3);
        ctx.fillRect(-r * 0.3, -r * 0.15, r * 1.2, r * 0.3);
        
        // Missiles
        ctx.fillStyle = flash ? fc : '#f5f5f5';
        ctx.fillRect(r * 0.3, -r * 0.1, r * 0.5, r * 0.08);
        ctx.fillRect(r * 0.3, r * 0.02, r * 0.5, r * 0.08);
        
        // Missile tips
        ctx.fillStyle = flash ? fc : '#cc0000';
        ctx.beginPath();
        ctx.moveTo(r * 0.8, -r * 0.1);
        ctx.lineTo(r * 0.95, -r * 0.06);
        ctx.lineTo(r * 0.8, -r * 0.02);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.8, r * 0.02);
        ctx.lineTo(r * 0.95, r * 0.06);
        ctx.lineTo(r * 0.8, r * 0.1);
        ctx.fill();
        
        ctx.restore();
        
        // Cab
        ctx.fillStyle = flash ? fc : '#4a5568';
        ctx.fillRect(-r * 0.9, -r * 0.3, r * 0.3, r * 0.6);
        
        // Windshield
        ctx.fillStyle = flash ? fc : 'rgba(100, 150, 200, 0.6)';
        ctx.fillRect(-r * 0.88, -r * 0.2, r * 0.15, r * 0.4);
        
        ctx.restore();
    }
    
    drawF22(ctx, r, flash, fc) {
        // F-22 Raptor - Stealth fighter
        const bodyColor = flash ? fc : '#2d3748';
        const detailColor = flash ? fc : '#1a202c';
        
        ctx.save();
        
        // Main body (angular stealth shape)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(r * 1.3, 0);                    // Nose
        ctx.lineTo(r * 0.4, r * 0.15);
        ctx.lineTo(-r * 0.2, r * 0.2);
        ctx.lineTo(-r * 0.9, r * 0.15);
        ctx.lineTo(-r * 1.1, r * 0.2);
        ctx.lineTo(-r * 1.1, -r * 0.2);
        ctx.lineTo(-r * 0.9, -r * 0.15);
        ctx.lineTo(-r * 0.2, -r * 0.2);
        ctx.lineTo(r * 0.4, -r * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Wings (diamond shaped)
        ctx.fillStyle = detailColor;
        ctx.beginPath();
        ctx.moveTo(r * 0.2, r * 0.2);
        ctx.lineTo(-r * 0.1, r * 1.0);
        ctx.lineTo(-r * 0.6, r * 0.9);
        ctx.lineTo(-r * 0.5, r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(r * 0.2, -r * 0.2);
        ctx.lineTo(-r * 0.1, -r * 1.0);
        ctx.lineTo(-r * 0.6, -r * 0.9);
        ctx.lineTo(-r * 0.5, -r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Vertical stabilizers (canted)
        ctx.fillStyle = bodyColor;
        ctx.save();
        ctx.translate(-r * 0.85, r * 0.12);
        ctx.rotate(0.4);
        ctx.fillRect(-r * 0.1, 0, r * 0.2, r * 0.25);
        ctx.restore();
        
        ctx.save();
        ctx.translate(-r * 0.85, -r * 0.12);
        ctx.rotate(-0.4);
        ctx.fillRect(-r * 0.1, -r * 0.25, r * 0.2, r * 0.25);
        ctx.restore();
        
        // Cockpit
        ctx.fillStyle = flash ? fc : 'rgba(50, 80, 120, 0.8)';
        ctx.beginPath();
        ctx.ellipse(r * 0.5, 0, r * 0.4, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Internal weapon bays (subtle lines)
        ctx.strokeStyle = flash ? fc : '#374151';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r * 0.1, r * 0.18);
        ctx.lineTo(-r * 0.4, r * 0.18);
        ctx.moveTo(r * 0.1, -r * 0.18);
        ctx.lineTo(-r * 0.4, -r * 0.18);
        ctx.stroke();
        
        // Engine glow
        if (!flash) {
            ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(-r * 1.15, r * 0.07, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
            ctx.ellipse(-r * 1.15, -r * 0.07, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawB2(ctx, r, flash, fc) {
        // B-2 Spirit - Flying wing bomber
        const bodyColor = flash ? fc : '#1a1a1a';
        
        ctx.save();
        
        // Main flying wing shape
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(r * 0.8, 0);                    // Nose
        ctx.lineTo(r * 0.3, r * 0.2);
        ctx.lineTo(-r * 0.5, r * 1.3);             // Wing tip
        ctx.lineTo(-r * 0.9, r * 1.1);             // Trailing edge
        ctx.lineTo(-r * 0.6, r * 0.3);
        ctx.lineTo(-r * 0.8, r * 0.15);
        ctx.lineTo(-r * 0.8, -r * 0.15);
        ctx.lineTo(-r * 0.6, -r * 0.3);
        ctx.lineTo(-r * 0.9, -r * 1.1);
        ctx.lineTo(-r * 0.5, -r * 1.3);
        ctx.lineTo(r * 0.3, -r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit windows
        ctx.fillStyle = flash ? fc : 'rgba(30, 50, 80, 0.8)';
        ctx.beginPath();
        ctx.moveTo(r * 0.5, 0);
        ctx.lineTo(r * 0.2, r * 0.1);
        ctx.lineTo(r * 0.1, r * 0.08);
        ctx.lineTo(r * 0.1, -r * 0.08);
        ctx.lineTo(r * 0.2, -r * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Engine intakes (subtle)
        ctx.fillStyle = flash ? fc : '#0d0d0d';
        ctx.fillRect(-r * 0.3, r * 0.15, r * 0.15, r * 0.08);
        ctx.fillRect(-r * 0.3, -r * 0.23, r * 0.15, r * 0.08);
        
        // Panel lines
        ctx.strokeStyle = flash ? fc : '#2d2d2d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r * 0.3, r * 0.2);
        ctx.lineTo(-r * 0.2, r * 0.6);
        ctx.moveTo(r * 0.3, -r * 0.2);
        ctx.lineTo(-r * 0.2, -r * 0.6);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawExperimental(ctx, r, flash, fc) {
        // Experimental craft - mysterious angular shape
        const bodyColor = flash ? fc : '#4a1a6b';
        const glowColor = flash ? fc : '#9945ff';
        
        ctx.save();
        
        // Glow effect
        if (!flash) {
            const gradient = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.2);
            gradient.addColorStop(0, 'rgba(153, 69, 255, 0.3)');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Diamond body
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(0, r * 0.7);
        ctx.lineTo(-r * 0.8, 0);
        ctx.lineTo(0, -r * 0.7);
        ctx.closePath();
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = 0.5 + Math.sin(this.game.gameTime * 5) * 0.3;
        ctx.beginPath();
        ctx.moveTo(r * 0.5, 0);
        ctx.lineTo(0, r * 0.35);
        ctx.lineTo(-r * 0.4, 0);
        ctx.lineTo(0, -r * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
    
    drawSmallDrone(ctx, r, flash, fc) {
        // Small swarm drone
        ctx.fillStyle = flash ? fc : '#666666';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotor blur
        ctx.strokeStyle = flash ? fc : 'rgba(100, 100, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // LED light
        ctx.fillStyle = flash ? fc : '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawOrbitalWarning(ctx, r, flash, fc) {
        // Orbital strike visual - different phases
        const strikeRadius = this.data.strikeRadius || 120;
        const radiusScale = strikeRadius / 25; // r is base size, scale to actual strike radius
        
        if (!this.strikeActive) {
            // Warning phase - pulsing danger zone
            const alpha = 0.3 + Math.sin(this.game.gameTime * 10) * 0.3;
            const pulseScale = 1 + Math.sin(this.game.gameTime * 5) * 0.1;
            
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(0, 0, r * radiusScale * pulseScale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ff4400';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, r * radiusScale * pulseScale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Crosshairs
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-r * radiusScale, 0);
            ctx.lineTo(r * radiusScale, 0);
            ctx.moveTo(0, -r * radiusScale);
            ctx.lineTo(0, r * radiusScale);
            ctx.stroke();
            
            // Warning text
            ctx.fillStyle = '#ff4400';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ STRIKE INCOMING', 0, -r * radiusScale - 10);
        } else {
            // Active strike - intense fire effect
            const alpha = 0.6 + Math.sin(this.game.gameTime * 15) * 0.2;
            
            // Outer ring
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, r * radiusScale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner fire gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * radiusScale);
            gradient.addColorStop(0, `rgba(255, 200, 0, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.6})`);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, r * radiusScale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawAircraftCarrier(ctx, r, flash, fc) {
        // USS Nimitz Aircraft Carrier
        const hullColor = flash ? fc : '#4a5568';
        const deckColor = flash ? fc : '#2d3748';
        const detailColor = flash ? fc : '#1a202c';
        
        ctx.save();
        
        // Hull
        ctx.fillStyle = hullColor;
        ctx.beginPath();
        ctx.moveTo(r * 1.1, 0);
        ctx.quadraticCurveTo(r * 0.95, r * 0.25, r * 0.7, r * 0.35);
        ctx.lineTo(-r * 0.9, r * 0.3);
        ctx.lineTo(-r * 1.0, r * 0.15);
        ctx.lineTo(-r * 1.0, -r * 0.15);
        ctx.lineTo(-r * 0.9, -r * 0.3);
        ctx.lineTo(r * 0.7, -r * 0.35);
        ctx.quadraticCurveTo(r * 0.95, -r * 0.25, r * 1.1, 0);
        ctx.fill();
        
        // Flight deck
        ctx.fillStyle = deckColor;
        ctx.fillRect(-r * 0.85, -r * 0.28, r * 1.7, r * 0.56);
        
        // Runway markings
        ctx.strokeStyle = flash ? fc : '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([r * 0.1, r * 0.05]);
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, 0);
        ctx.lineTo(r * 0.7, 0);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Angled deck lines
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, r * 0.25);
        ctx.lineTo(r * 0.5, -r * 0.15);
        ctx.moveTo(-r * 0.3, r * 0.2);
        ctx.lineTo(r * 0.4, -r * 0.15);
        ctx.stroke();
        
        // Island superstructure
        ctx.fillStyle = detailColor;
        ctx.fillRect(r * 0.1, -r * 0.4, r * 0.35, r * 0.25);
        
        // Radar arrays
        ctx.fillStyle = flash ? fc : '#374151';
        ctx.fillRect(r * 0.2, -r * 0.55, r * 0.15, r * 0.15);
        
        // Aircraft on deck
        if (!flash) {
            ctx.fillStyle = '#5a6a7a';
            // Parked aircraft
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(-r * 0.5 + i * r * 0.3, r * 0.15);
                ctx.scale(0.12, 0.12);
                this.drawFA18Mini(ctx);
                ctx.restore();
            }
        }
        
        // Catapult tracks
        ctx.strokeStyle = flash ? fc : '#6b7280';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, -r * 0.1);
        ctx.lineTo(r * 0.8, -r * 0.1);
        ctx.moveTo(-r * 0.2, r * 0.1);
        ctx.lineTo(r * 0.8, r * 0.1);
        ctx.stroke();
        
        // Wake
        if (!flash) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(-r * 1.0, 0);
            ctx.lineTo(-r * 1.4, r * 0.25);
            ctx.lineTo(-r * 1.2, 0);
            ctx.lineTo(-r * 1.4, -r * 0.25);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawFA18Mini(ctx) {
        // Mini F/A-18 for carrier deck
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, -12);
        ctx.lineTo(-15, 12);
        ctx.closePath();
        ctx.fill();
    }
    
    drawAceFA18(ctx, r, flash, fc) {
        // Commander Fravor's F/A-18 - Gold/elite variant
        const bodyColor = flash ? fc : '#b8860b';
        const detailColor = flash ? fc : '#8b6914';
        
        ctx.save();
        
        // Draw base F/A-18 shape but golden
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(r * 1.2, 0);
        ctx.lineTo(r * 0.3, r * 0.15);
        ctx.lineTo(-r * 0.2, r * 0.2);
        ctx.lineTo(-r * 0.8, r * 0.15);
        ctx.lineTo(-r * 1.0, r * 0.25);
        ctx.lineTo(-r * 1.0, -r * 0.25);
        ctx.lineTo(-r * 0.8, -r * 0.15);
        ctx.lineTo(-r * 0.2, -r * 0.2);
        ctx.lineTo(r * 0.3, -r * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Wings
        ctx.fillStyle = detailColor;
        ctx.beginPath();
        ctx.moveTo(r * 0.1, r * 0.2);
        ctx.lineTo(-r * 0.4, r * 0.9);
        ctx.lineTo(-r * 0.7, r * 0.8);
        ctx.lineTo(-r * 0.5, r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(r * 0.1, -r * 0.2);
        ctx.lineTo(-r * 0.4, -r * 0.9);
        ctx.lineTo(-r * 0.7, -r * 0.8);
        ctx.lineTo(-r * 0.5, -r * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Elite glow
        if (!flash) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Cockpit
        ctx.fillStyle = flash ? fc : '#1a365d';
        ctx.beginPath();
        ctx.ellipse(r * 0.5, 0, r * 0.35, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Afterburners
        if (!flash) {
            ctx.fillStyle = 'rgba(255, 200, 50, 0.8)';
            ctx.beginPath();
            ctx.ellipse(-r * 1.1, r * 0.08, r * 0.12, r * 0.06, 0, 0, Math.PI * 2);
            ctx.ellipse(-r * 1.1, -r * 0.08, r * 0.12, r * 0.06, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawGenericEnemy(ctx, r, flash, fc) {
        // Fallback for any undefined enemy types
        ctx.fillStyle = flash ? fc : this.data.color;
        
        switch (this.data.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(r, 0);
                ctx.lineTo(-r * 0.7, -r * 0.6);
                ctx.lineTo(-r * 0.7, r * 0.6);
                ctx.closePath();
                ctx.fill();
                break;
            case 'rect':
                ctx.fillRect(-r, -r * 0.5, r * 2, r);
                break;
            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(0, -r);
                ctx.lineTo(r * 0.7, 0);
                ctx.lineTo(0, r);
                ctx.lineTo(-r * 0.7, 0);
                ctx.closePath();
                ctx.fill();
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
        }
    }
}

// Enemy pool for performance
class EnemyPool {
    constructor(game) {
        this.game = game;
        this.enemies = [];
    }
    
    spawn(type, x, y) {
        // Find inactive enemy or create new one
        let enemy = this.enemies.find(e => !e.active && e.type === type);
        
        if (!enemy) {
            enemy = new Enemy(this.game, type, x, y);
            this.enemies.push(enemy);
        } else {
            // Reset enemy
            enemy.x = x;
            enemy.y = y;
            enemy.active = true;
            enemy.health = enemy.maxHealth;
            enemy.knockbackX = 0;
            enemy.knockbackY = 0;
            enemy.stunTime = 0;
            enemy.slowAmount = 1;
            enemy.slowTime = 0;
            enemy.behaviorTimer = 0;
        }
        
        return enemy;
    }
    
    getActive() {
        return this.enemies.filter(e => e.active);
    }
    
    update(dt, player) {
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(dt, player);
            }
        }
    }
    
    draw(ctx, camera) {
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.draw(ctx, camera);
            }
        }
    }
    
    clear() {
        for (const enemy of this.enemies) {
            enemy.active = false;
        }
    }
}
