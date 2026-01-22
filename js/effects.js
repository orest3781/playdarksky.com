// =====================================================
// ADVANCED GAME EFFECTS SYSTEM
// Inspired by Vampire Survivors, Brotato, HoloCure
// =====================================================

// Floating Damage Numbers System (Like Vampire Survivors)
class DamageNumberSystem {
    constructor(game) {
        this.game = game;
        this.numbers = [];
        this.maxNumbers = 50;  // Reduced from 100 to prevent clutter
        this.consolidationRadius = 50;  // Combine nearby damage
        this.consolidationTime = 0.15;  // Time window to combine
    }
    
    spawn(x, y, damage, options = {}) {
        // Don't show 0 or very small damage numbers
        const displayDamage = Math.floor(damage);
        if (displayDamage <= 0) return;
        
        const isCrit = options.crit || false;
        const isHeal = options.heal || false;
        const customColor = options.color || null;
        
        // Try to consolidate with nearby recent damage number
        if (!isCrit && !isHeal) {
            for (const num of this.numbers) {
                if (num.life > num.maxLife - this.consolidationTime && 
                    !num.crit && !num.heal &&
                    Math.abs(num.x - x) < this.consolidationRadius &&
                    Math.abs(num.y - y) < this.consolidationRadius) {
                    // Add to existing number instead of spawning new one
                    num.damage += displayDamage;
                    num.scale = Math.min(num.scale * 1.1, 2.5);  // Grow slightly
                    return;
                }
            }
        }
        
        if (this.numbers.length >= this.maxNumbers) {
            this.numbers.shift(); // Remove oldest
        }
        
        this.numbers.push({
            x: x + Utils.random(-10, 10),
            y: y,
            damage: displayDamage,
            vx: Utils.random(-40, 40),
            vy: -150 - Utils.random(0, 80),
            life: 1.0,  // Slightly shorter duration
            maxLife: 1.0,
            scale: isCrit ? 2.0 : 1.2,  // Slightly smaller base scale
            crit: isCrit,
            heal: isHeal,
            color: customColor || (isHeal ? '#00ff88' : (isCrit ? '#ff4444' : '#ffd700'))
        });
    }
    
    update(dt) {
        for (let i = this.numbers.length - 1; i >= 0; i--) {
            const num = this.numbers[i];
            num.x += num.vx * dt;
            num.y += num.vy * dt;
            num.vy += 200 * dt; // Gravity
            num.vx *= 0.98;
            num.life -= dt;
            
            if (num.life <= 0) {
                this.numbers.splice(i, 1);
            }
        }
    }
    
    draw(ctx, camera) {
        for (const num of this.numbers) {
            const screenX = num.x - camera.x;
            const screenY = num.y - camera.y;
            const alpha = Math.min(1, num.life * 2);
            const scale = num.scale * (1 + (1 - num.life / num.maxLife) * 0.4);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Cap font size to prevent huge numbers
            const fontSize = Math.min(Math.floor(18 * scale), 40);
            ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            
            // Thicker outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(num.damage, screenX, screenY);
            
            // Glow effect for crits
            if (num.crit) {
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                // Draw "CRIT!" above the number
                ctx.font = `bold ${Math.floor(fontSize * 0.6)}px 'Courier New', monospace`;
                ctx.fillStyle = '#ff4444';
                ctx.fillText('CRIT!', screenX, screenY - fontSize * 0.8);
                ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
            } else {
                // Gold glow for regular damage
                ctx.shadowColor = '#ffa500';
                ctx.shadowBlur = 8;
            }
            
            ctx.fillStyle = num.color;
            ctx.fillText(num.damage, screenX, screenY);
            
            ctx.restore();
        }
    }
    
    clear() {
        this.numbers = [];
    }
}

// Kill Streak / Combo System (Like Brotato/HoloCure)
class ComboSystem {
    constructor(game) {
        this.game = game;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
        this.comboTimeout = 2.0; // Seconds to maintain combo
        this.lastKillTime = 0;
        
        // Combo milestones for bonuses
        this.milestones = [10, 25, 50, 100, 200, 500, 1000];
        this.reachedMilestones = [];
        
        // Visual effects
        this.displayScale = 1;
        this.flashTime = 0;
    }
    
    addKill() {
        this.combo++;
        this.comboTimer = this.comboTimeout;
        this.displayScale = 1.5;
        this.flashTime = 0.1;
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // Check milestones
        for (const milestone of this.milestones) {
            if (this.combo >= milestone && !this.reachedMilestones.includes(milestone)) {
                this.reachedMilestones.push(milestone);
                this.onMilestone(milestone);
            }
        }
        
        // XP multiplier based on combo
        return this.getXPMultiplier();
    }
    
    getXPMultiplier() {
        // Reduced multipliers for better balance
        if (this.combo < 10) return 1.0;
        if (this.combo < 25) return 1.05;
        if (this.combo < 50) return 1.1;
        if (this.combo < 100) return 1.15;
        if (this.combo < 200) return 1.2;
        return 1.25; // Max 25% bonus, down from 75%
    }
    
    onMilestone(milestone) {
        // Screen flash and bonus
        this.game.screenShake(milestone / 20);
        this.game.ui.showWarning(`YOU'VE DOWNED ${milestone}!`, 'success');
        
        // Small bonus drops (reduced from massive XP bombs)
        if (milestone >= 100) {
            // Only spawn bonus pickups at high milestones
            const pickupCount = Math.min(3, Math.floor(milestone / 100));
            for (let i = 0; i < pickupCount; i++) {
                const angle = (i / pickupCount) * Math.PI * 2;
                const dist = 80;
                this.game.spawnPickup(
                    'xp',
                    this.game.player.x + Math.cos(angle) * dist,
                    this.game.player.y + Math.sin(angle) * dist,
                    3 // Small fixed XP value
                );
            }
        }
    }
    
    update(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.reachedMilestones = [];
            }
        }
        
        // Visual smoothing
        this.displayScale = Utils.lerp(this.displayScale, 1.0, dt * 10);
        if (this.flashTime > 0) this.flashTime -= dt;
    }
    
    draw(ctx) {
        if (this.combo < 5) return;
        
        const x = ctx.canvas.width / 2;
        const y = 100;
        
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.comboTimer);
        ctx.textAlign = 'center';
        
        // Combo number
        const fontSize = 24 * this.displayScale;
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        
        // Flash effect
        if (this.flashTime > 0) {
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 20;
        }
        
        // Color based on combo size
        let color = '#ffffff';
        if (this.combo >= 100) color = '#ff00ff';
        else if (this.combo >= 50) color = '#ffff00';
        else if (this.combo >= 25) color = '#ff8800';
        else if (this.combo >= 10) color = '#00ffcc';
        
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        ctx.strokeText(`${this.combo}x COMBO`, x, y);
        ctx.fillText(`${this.combo}x COMBO`, x, y);
        
        // XP bonus indicator
        const mult = this.getXPMultiplier();
        if (mult > 1) {
            ctx.font = '14px "Courier New", monospace';
            ctx.fillStyle = '#00ff88';
            ctx.fillText(`+${Math.floor((mult - 1) * 100)}% XP`, x, y + 20);
        }
        
        ctx.restore();
    }
}

// Critical Hit System
class CriticalHitSystem {
    constructor() {
        this.baseCritChance = 0.05; // 5% base
        this.baseCritMultiplier = 2.0;
        this.bonusCritChance = 0;
        this.bonusCritMultiplier = 0;
    }
    
    getCritChance() {
        return this.baseCritChance + this.bonusCritChance;
    }
    
    getCritMultiplier() {
        return this.baseCritMultiplier + this.bonusCritMultiplier;
    }
    
    rollCrit() {
        return Math.random() < this.getCritChance();
    }
    
    calculateDamage(baseDamage) {
        if (this.rollCrit()) {
            return {
                damage: baseDamage * this.getCritMultiplier(),
                isCrit: true
            };
        }
        return {
            damage: baseDamage,
            isCrit: false
        };
    }
}

// Treasure/Chest System - Nimitz-style Ocean Emergence
// USO cube rises from roiling water to deliver supplies
class ChestSystem {
    constructor(game) {
        this.game = game;
        this.chests = [];
        this.spawnTimer = 0;
        this.spawnInterval = 45;
        this.emergingUAPs = []; // UAPs rising from water
        this.waterDisturbances = []; // Roiling water effects
        this.sonarPings = []; // Expanding sonar rings
        this.subsurfaceGlow = null; // Screen effect during event
        
        // Load cube sprite for USO
        this.cubeSprite = new Image();
        this.cubeSprite.src = 'cube.png';
    }
    
    update(dt) {
        this.spawnTimer += dt;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.initiateEmergence();
        }
        
        // Update sonar pings
        for (let i = this.sonarPings.length - 1; i >= 0; i--) {
            const ping = this.sonarPings[i];
            ping.timer += dt;
            ping.radius += ping.speed * dt;
            ping.alpha = Math.max(0, 1 - ping.timer / ping.lifetime);
            
            if (ping.timer >= ping.lifetime) {
                this.sonarPings.splice(i, 1);
            }
        }
        
        // Update subsurface glow effect
        if (this.subsurfaceGlow) {
            this.subsurfaceGlow.timer += dt;
            if (this.subsurfaceGlow.timer >= this.subsurfaceGlow.duration) {
                this.subsurfaceGlow = null;
            }
        }
        
        // Update water disturbances (pre-emergence)
        for (let i = this.waterDisturbances.length - 1; i >= 0; i--) {
            const dist = this.waterDisturbances[i];
            dist.timer += dt;
            dist.intensity = Math.min(1, dist.timer / 1.5); // Builds up over 1.5s
            dist.bubbleTimer += dt;
            dist.glowPulse = (dist.glowPulse || 0) + dt * 3;
            
            // Spawn sonar pings periodically during detection
            if (!dist.lastPingTime) dist.lastPingTime = 0;
            if (dist.timer - dist.lastPingTime > 0.5 && dist.timer < 2.0) {
                dist.lastPingTime = dist.timer;
                this.sonarPings.push({
                    x: dist.x,
                    y: dist.y,
                    radius: 20,
                    speed: 150,
                    timer: 0,
                    lifetime: 1.2,
                    alpha: 1,
                    color: dist.tier === 'legendary' ? '#ffaa00' : 
                           dist.tier === 'epic' ? '#aa44ff' : '#00ffcc'
                });
                // Play sonar ping sound
                this.game.playSound?.('sonarPing');
            }
            
            // Spawn bubbles periodically with more variety
            if (dist.bubbleTimer > 0.08) {
                dist.bubbleTimer = 0;
                const burstCount = Math.floor(1 + dist.intensity * 2);
                for (let b = 0; b < burstCount; b++) {
                    dist.bubbles.push({
                        x: dist.x + Utils.random(-50, 50) * dist.intensity,
                        y: dist.y + Utils.random(-40, 40),
                        size: Utils.random(2, 10),
                        speed: Utils.random(50, 120),
                        life: 1.0,
                        wobble: Utils.random(0, Math.PI * 2),
                        wobbleSpeed: Utils.random(5, 10)
                    });
                }
            }
            
            // Update existing bubbles with wobble
            for (let j = dist.bubbles.length - 1; j >= 0; j--) {
                const bubble = dist.bubbles[j];
                bubble.y -= bubble.speed * dt;
                bubble.wobble += bubble.wobbleSpeed * dt;
                bubble.x += Math.sin(bubble.wobble) * 0.5;
                bubble.life -= dt * 0.8;
                if (bubble.life <= 0) {
                    dist.bubbles.splice(j, 1);
                }
            }
            
            // After 2 seconds, spawn the UAP
            if (dist.timer >= 2.0 && !dist.spawned) {
                dist.spawned = true;
                this.spawnEmergingUAP(dist);
            }
            
            // Remove after UAP has emerged
            if (dist.timer > 4.0) {
                this.waterDisturbances.splice(i, 1);
            }
        }
        
        // Update emerging UAPs (rising animation)
        for (let i = this.emergingUAPs.length - 1; i >= 0; i--) {
            const uap = this.emergingUAPs[i];
            uap.timer += dt;
            uap.wobble += dt * 6;
            uap.beamPulse = (uap.beamPulse || 0) + dt * 4;
            
            // Rise from water over 1.5 seconds
            const riseProgress = Math.min(1, uap.timer / 1.5);
            uap.altitude = uap.maxAltitude * this.easeOutBack(riseProgress);
            uap.rotation += dt * 2;
            
            // After fully risen, hover briefly then drop supplies and leave
            if (uap.timer > 2.0 && !uap.dropped) {
                uap.dropped = true;
                this.dropSupplies(uap);
            }
            
            // UAP departs after dropping (rises up and fades)
            if (uap.timer > 2.5) {
                uap.departAltitude = (uap.timer - 2.5) * 300;
                uap.alpha = Math.max(0, 1 - (uap.timer - 2.5) / 1.5);
            }
            
            // Remove when fully departed
            if (uap.timer > 4.0) {
                this.emergingUAPs.splice(i, 1);
            }
        }
        
        // Update supply caches
        for (let i = this.chests.length - 1; i >= 0; i--) {
            const chest = this.chests[i];
            chest.bobPhase += dt * 3;
            chest.pulsePhase += dt * 4;
            chest.glowPhase += dt * 2;
            chest.lifetime += dt;
            
            if (chest.lifetime > 60) {
                this.chests.splice(i, 1);
                continue;
            }
            
            const dist = Utils.distance(chest.x, chest.y, this.game.player.x, this.game.player.y);
            if (dist < 60) {
                this.openChest(chest);
                this.chests.splice(i, 1);
            }
        }
    }
    
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    initiateEmergence() {
        const angle = Utils.random(0, Math.PI * 2);
        const dist = Utils.random(350, 500);
        const x = Utils.clamp(
            this.game.player.x + Math.cos(angle) * dist,
            150, GAME_CONFIG.WORLD_WIDTH - 150
        );
        const y = Utils.clamp(
            this.game.player.y + Math.sin(angle) * dist,
            150, GAME_CONFIG.WORLD_HEIGHT - 150
        );
        
        let tier = 'common';
        const time = this.game.gameTime;
        if (time > 18 * 60) tier = 'legendary';
        else if (time > 12 * 60) tier = 'epic';
        else if (time > 7 * 60) tier = 'rare';
        else if (time > 3 * 60) tier = 'uncommon';
        
        // Start water disturbance
        this.waterDisturbances.push({
            x, y, tier,
            timer: 0,
            intensity: 0,
            bubbleTimer: 0,
            bubbles: [],
            spawned: false,
            glowPulse: 0,
            lastPingTime: 0
        });
        
        // Initial sonar ping burst (3 pings in quick succession)
        const tierColor = tier === 'legendary' ? '#ffaa00' : 
                         tier === 'epic' ? '#aa44ff' : 
                         tier === 'rare' ? '#4488ff' : '#00ffcc';
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.sonarPings.push({
                    x, y,
                    radius: 10,
                    speed: 200 - i * 30,
                    timer: 0,
                    lifetime: 1.5,
                    alpha: 1,
                    color: tierColor
                });
            }, i * 150);
        }
        
        // Start screen effect
        this.subsurfaceGlow = {
            timer: 0,
            duration: 4.0,
            x, y,
            tier,
            color: tierColor
        };
        
        // Screen tint flash
        this.game.screenFlash?.add(tierColor, 0.15, 0.5);
        
        this.game.ui.showWarning('SUBSURFACE CONTACT DETECTED', 'info');
        
        // Play voice clip
        if (this.game.sound) {
            this.game.sound.playVoice('subsurfaceContact', 0.2);
        }
    }
    
    spawnEmergingUAP(disturbance) {
        const tierColors = {
            common: '#aaaaaa',
            uncommon: '#44ff44',
            rare: '#4488ff',
            epic: '#aa44ff',
            legendary: '#ffaa00'
        };
        const color = tierColors[disturbance.tier] || '#66aacc';
        
        this.emergingUAPs.push({
            x: disturbance.x,
            y: disturbance.y,
            tier: disturbance.tier,
            timer: 0,
            altitude: 0,
            maxAltitude: 80,
            departAltitude: 0,
            rotation: 0,
            wobble: 0,
            beamPulse: 0,
            alpha: 1,
            dropped: false
        });
        
        // === DRAMATIC SPLASH EFFECTS ===
        
        // Main water burst
        this.game.particles.explosion(disturbance.x, disturbance.y, '#88ccee', 40);
        this.game.particles.explosion(disturbance.x, disturbance.y, '#aaddff', 25);
        
        // Colored spray based on tier
        this.game.particles.explosion(disturbance.x, disturbance.y, color, 20);
        
        // Water droplets shooting outward
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.game.particles.emit({
                x: disturbance.x + Math.cos(angle) * 15,
                y: disturbance.y + Math.sin(angle) * 15,
                count: 4, color: '#88ccee',
                speed: 150 + Math.random() * 80, life: 0.7, size: 4,
                angle: angle, spread: 0.25
            });
        }
        
        // Rising mist/spray
        this.game.particles.emit({
            x: disturbance.x, y: disturbance.y,
            count: 15, color: '#aaddff',
            speed: 80, life: 1.0, size: 6,
            angle: -Math.PI/2, spread: 0.5
        });
        
        // Light burst from below
        this.game.particles.emit({
            x: disturbance.x, y: disturbance.y,
            count: 8, color: color,
            speed: 100, life: 0.5, size: 8,
            angle: -Math.PI/2, spread: 0.3
        });
        
        // Screen effects
        this.game.screenShake(10);
        this.game.screenFlash?.add('#ffffff', 0.25, 0.15);
        this.game.screenFlash?.add(color, 0.15, 0.3);
        
        // Add a secondary sonar ping burst at emergence
        this.sonarPings.push({
            x: disturbance.x, y: disturbance.y,
            radius: 20,
            speed: 250,
            timer: 0,
            lifetime: 1.2,
            alpha: 1,
            color: color
        });
    }
    
    dropSupplies(uap) {
        // Create supply cache
        this.chests.push({
            x: uap.x,
            y: uap.y,
            tier: uap.tier,
            bobPhase: 0,
            pulsePhase: 0,
            glowPhase: 0,
            lifetime: 0
        });
        
        // Drop effect
        this.game.particles.emit({
            x: uap.x, y: uap.y,
            count: 15, color: '#aaddff',
            speed: 60, life: 0.5, size: 4
        });
        this.game.ui.showWarning(`${uap.tier.toUpperCase()} SUPPLY CACHE DEPLOYED`, 'success');
    }
    
    spawnChest() {
        this.initiateEmergence();
    }
    
    openChest(chest) {
        const tierEffects = {
            common: { particles: 25, shake: 5, flash: 0.2 },
            uncommon: { particles: 35, shake: 8, flash: 0.3 },
            rare: { particles: 45, shake: 12, flash: 0.4 },
            epic: { particles: 60, shake: 15, flash: 0.5 },
            legendary: { particles: 80, shake: 20, flash: 0.7 }
        };
        const effect = tierEffects[chest.tier];
        const tierColors = {
            common: '#aaaaaa',
            uncommon: '#44ff44',
            rare: '#4488ff',
            epic: '#aa44ff',
            legendary: '#ffaa00'
        };
        const color = tierColors[chest.tier];
        
        this.game.particles.explosion(chest.x, chest.y, color, effect.particles);
        this.game.particles.explosion(chest.x, chest.y, '#ffffff', effect.particles / 2);
        this.game.screenShake(effect.shake);
        this.game.screenFlash.add(color, effect.flash, 0.3);
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.game.particles.emit({
                x: chest.x + Math.cos(angle) * 20,
                y: chest.y + Math.sin(angle) * 20,
                count: 3, color: color,
                speed: 150, life: 0.5, size: 6,
                angle: angle, spread: 0.3
            });
        }
        
        // Evolution check
        let evolved = false;
        if (typeof EVOLUTIONS !== 'undefined') {
            const player = this.game.player;
            
            for (const weapon of player.weapons) {
                if (weapon.level < weapon.data.maxLevel) continue;
                const evolution = EVOLUTIONS[weapon.id];
                if (!evolution) continue;
                
                const hasPassive = player.passiveItems.some(p => p.id === evolution.passive);
                if (hasPassive) {
                    player.evolveWeapon(weapon.id, evolution.evolved);
                    this.game.screenFlash.add('#ffffff', 0.8, 1.2);
                    this.game.screenShake(25);
                    this.game.ui.showWarning(`⚡ WEAPON EVOLVED: ${WEAPONS[evolution.evolved].name}! ⚡`, 'success');
                    
                    for (let i = 0; i < 25; i++) {
                        const angle = (i / 25) * Math.PI * 2;
                        const dist = Utils.random(50, 120);
                        this.game.spawnPickup('xp', chest.x + Math.cos(angle) * dist, chest.y + Math.sin(angle) * dist, 60);
                    }
                    evolved = true;
                    break;
                }
            }
        }
        
        const rewards = {
            common: { xp: 80, currency: 15, healthChance: 0.35, powerupChance: 0.1, upgradeChance: 0.15 },
            uncommon: { xp: 150, currency: 35, healthChance: 0.45, powerupChance: 0.2, upgradeChance: 0.25 },
            rare: { xp: 300, currency: 70, healthChance: 0.55, powerupChance: 0.35, upgradeChance: 0.4 },
            epic: { xp: 500, currency: 120, healthChance: 0.7, powerupChance: 0.5, upgradeChance: 0.6 },
            legendary: { xp: 1000, currency: 250, healthChance: 0.9, powerupChance: 0.75, upgradeChance: 0.85 }
        };
        
        const reward = rewards[chest.tier];
        
        const xpCount = Math.floor(reward.xp / 15);
        for (let i = 0; i < xpCount; i++) {
            const angle = (i / xpCount) * Math.PI * 2 + Math.random() * 0.5;
            const dist = Utils.random(30, 80);
            setTimeout(() => {
                this.game.spawnPickup('xp', chest.x + Math.cos(angle) * dist, chest.y + Math.sin(angle) * dist, 15);
            }, i * 20);
        }
        
        const currencyCount = Math.ceil(reward.currency / 20);
        for (let i = 0; i < currencyCount; i++) {
            setTimeout(() => {
                this.game.spawnPickup('currency', chest.x + Utils.random(-40, 40), chest.y + Utils.random(-40, 40), Math.ceil(reward.currency / currencyCount));
            }, 100 + i * 30);
        }
        
        if (Math.random() < reward.healthChance) {
            setTimeout(() => {
                this.game.spawnPickup('health', chest.x + Utils.random(-30, 30), chest.y + Utils.random(-30, 30), 240);
            }, 200);
        }
        
        if (Math.random() < reward.powerupChance) {
            const powerupTypes = ['powerup_overdrive', 'powerup_shield', 'powerup_chronoBurst', 'powerup_phaseShift'];
            const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            setTimeout(() => {
                this.game.spawnPickup(type, chest.x + Utils.random(-35, 35), chest.y + Utils.random(-35, 35), 1);
            }, 300);
        }
        
        if (Math.random() < reward.upgradeChance && !evolved) {
            setTimeout(() => {
                const upgradeData = this.generateUpgradeChoice();
                if (upgradeData) {
                    this.game.spawnUpgradePickup(chest.x, chest.y, upgradeData);
                }
            }, 400);
        }
    }
    
    generateUpgradeChoice() {
        const player = this.game.player;
        
        const upgradableWeapons = player.weapons.filter(w => w.level < w.data.maxLevel);
        if (upgradableWeapons.length > 0 && Math.random() < 0.6) {
            const weapon = upgradableWeapons[Math.floor(Math.random() * upgradableWeapons.length)];
            return {
                type: 'weapon',
                id: weapon.id,
                name: weapon.data.name,
                description: `Upgrade to Level ${weapon.level + 1}`,
                icon: weapon.data.icon || '🔫',
                rarity: weapon.level >= 4 ? 'epic' : (weapon.level >= 2 ? 'rare' : 'common')
            };
        }
        
        const upgradablePassives = player.passiveItems.filter(p => p.level < (PASSIVE_ITEMS[p.id]?.maxLevel || 5));
        if (upgradablePassives.length > 0 && Math.random() < 0.5) {
            const passive = upgradablePassives[Math.floor(Math.random() * upgradablePassives.length)];
            const passiveData = PASSIVE_ITEMS[passive.id];
            return {
                type: 'passive',
                id: passive.id,
                name: passiveData.name,
                description: `Upgrade to Level ${passive.level + 1}`,
                icon: passiveData.icon || '📦',
                rarity: passive.level >= 3 ? 'rare' : 'common'
            };
        }
        
        if (player.weapons.length < player.maxWeapons) {
            const availableWeapons = Object.entries(WEAPONS).filter(([id, data]) => 
                !data.evolved && !player.weapons.some(w => w.id === id)
            );
            if (availableWeapons.length > 0) {
                const [id, data] = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
                return {
                    type: 'newWeapon',
                    id: id,
                    name: data.name,
                    description: data.description,
                    icon: data.icon || '🔫',
                    rarity: 'rare'
                };
            }
        }
        
        if (player.passiveItems.length < player.maxPassives) {
            const availablePassives = Object.entries(PASSIVE_ITEMS).filter(([id]) =>
                !player.passiveItems.some(p => p.id === id)
            );
            if (availablePassives.length > 0) {
                const [id, data] = availablePassives[Math.floor(Math.random() * availablePassives.length)];
                return {
                    type: 'newPassive',
                    id: id,
                    name: data.name,
                    description: data.description,
                    icon: data.icon || '📦',
                    rarity: 'common'
                };
            }
        }
        
        return null;
    }
    
    draw(ctx, camera) {
        // Draw sonar pings first (behind everything)
        for (const ping of this.sonarPings) {
            this.drawSonarPing(ctx, camera, ping);
        }
        
        // Draw water disturbances (roiling water)
        for (const dist of this.waterDisturbances) {
            this.drawWaterDisturbance(ctx, camera, dist);
        }
        
        // Draw emerging UAPs
        for (const uap of this.emergingUAPs) {
            this.drawEmergingUAP(ctx, camera, uap);
        }
        
        // Draw supply caches
        for (const chest of this.chests) {
            this.drawSupplyCache(ctx, camera, chest);
        }
    }
    
    // Draw screen overlay effects (called from game's main draw after everything)
    drawScreenEffects(ctx) {
        if (!this.subsurfaceGlow) return;
        
        const glow = this.subsurfaceGlow;
        const progress = glow.timer / glow.duration;
        
        // Vignette effect - darkens edges with color tint
        const vignetteAlpha = Math.sin(progress * Math.PI) * 0.3;
        if (vignetteAlpha > 0.01) {
            const gradient = ctx.createRadialGradient(
                ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.3,
                ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.8
            );
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, `rgba(0, 40, 60, ${vignetteAlpha * 0.3})`);
            gradient.addColorStop(1, `rgba(0, 20, 40, ${vignetteAlpha})`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        
        // Subtle scan line effect during event
        if (progress < 0.8) {
            const scanAlpha = 0.03 * (1 - progress);
            ctx.fillStyle = `rgba(0, 255, 200, ${scanAlpha})`;
            const scanY = (performance.now() * 0.5) % ctx.canvas.height;
            ctx.fillRect(0, scanY, ctx.canvas.width, 2);
            ctx.fillRect(0, (scanY + ctx.canvas.height / 3) % ctx.canvas.height, ctx.canvas.width, 1);
            ctx.fillRect(0, (scanY + ctx.canvas.height * 2 / 3) % ctx.canvas.height, ctx.canvas.width, 1);
        }
    }
    
    drawSonarPing(ctx, camera, ping) {
        const screenX = ping.x - camera.x;
        const screenY = ping.y - camera.y;
        
        // Skip if way off screen
        if (screenX < -ping.radius - 50 || screenX > ctx.canvas.width + ping.radius + 50 ||
            screenY < -ping.radius - 50 || screenY > ctx.canvas.height + ping.radius + 50) return;
        
        ctx.save();
        
        // Main sonar ring
        const alpha = ping.alpha * 0.8;
        ctx.beginPath();
        ctx.arc(screenX, screenY, ping.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ping.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '');
        
        // Convert hex to rgba for the stroke
        const r = parseInt(ping.color.slice(1, 3), 16);
        const g = parseInt(ping.color.slice(3, 5), 16);
        const b = parseInt(ping.color.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 3 + ping.alpha * 2;
        ctx.stroke();
        
        // Secondary thinner ring
        ctx.beginPath();
        ctx.arc(screenX, screenY, ping.radius * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Glow effect
        const glowGradient = ctx.createRadialGradient(
            screenX, screenY, ping.radius - 10,
            screenX, screenY, ping.radius + 20
        );
        glowGradient.addColorStop(0, 'transparent');
        glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, ping.radius + 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawWaterDisturbance(ctx, camera, dist) {
        const screenX = dist.x - camera.x;
        const screenY = dist.y - camera.y;
        
        if (screenX < -150 || screenX > ctx.canvas.width + 150 ||
            screenY < -150 || screenY > ctx.canvas.height + 150) return;
        
        const time = performance.now() * 0.003;
        const intensity = dist.intensity;
        
        const tierColors = {
            common: { r: 100, g: 180, b: 220, hex: '#64b4dc' },
            uncommon: { r: 68, g: 255, b: 68, hex: '#44ff44' },
            rare: { r: 68, g: 136, b: 255, hex: '#4488ff' },
            epic: { r: 170, g: 68, b: 255, hex: '#aa44ff' },
            legendary: { r: 255, g: 170, b: 0, hex: '#ffaa00' }
        };
        const tierColor = tierColors[dist.tier] || tierColors.common;
        
        ctx.save();
        
        // === BIOLUMINESCENT UNDERWATER GLOW ===
        const glowPulse = 0.6 + Math.sin(dist.glowPulse) * 0.4;
        const glowRadius = 80 + intensity * 60 + Math.sin(time * 2) * 20;
        
        // Deep glow (larger, more diffuse)
        const deepGlow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius * 1.5);
        deepGlow.addColorStop(0, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${0.3 * intensity * glowPulse})`);
        deepGlow.addColorStop(0.4, `rgba(${tierColor.r * 0.5}, ${tierColor.g * 0.5}, ${tierColor.b * 0.7}, ${0.15 * intensity * glowPulse})`);
        deepGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = deepGlow;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Core glow (brighter center)
        const coreGlow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius * 0.6);
        coreGlow.addColorStop(0, `rgba(${Math.min(255, tierColor.r + 100)}, ${Math.min(255, tierColor.g + 100)}, ${Math.min(255, tierColor.b + 100)}, ${0.5 * intensity * glowPulse})`);
        coreGlow.addColorStop(0.5, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${0.25 * intensity * glowPulse})`);
        coreGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // === ROILING WATER SURFACE ===
        // Concentric ripples
        for (let ring = 0; ring < 5; ring++) {
            const ringPhase = time * 3 + ring * 0.5;
            const ringRadius = 25 + ring * 18 + Math.sin(ringPhase) * 12 * intensity;
            const ringAlpha = (0.5 - ring * 0.08) * intensity;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${ringAlpha})`;
            ctx.lineWidth = 2.5 - ring * 0.4;
            ctx.stroke();
        }
        
        // Foam/white water at center
        const foamRadius = 30 + Math.sin(time * 5) * 10 * intensity;
        const foamGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, foamRadius);
        foamGradient.addColorStop(0, `rgba(220, 240, 255, ${0.6 * intensity})`);
        foamGradient.addColorStop(0.4, `rgba(${tierColor.r + 50}, ${tierColor.g + 50}, ${tierColor.b + 30}, ${0.35 * intensity})`);
        foamGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = foamGradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, foamRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // === CHURNING WAVES ===
        for (let i = 0; i < 10; i++) {
            const waveAngle = (i / 10) * Math.PI * 2 + time * 1.5;
            const waveRadius = 40 + Math.sin(time * 4 + i * 0.7) * 18 * intensity;
            const wx = screenX + Math.cos(waveAngle) * waveRadius;
            const wy = screenY + Math.sin(waveAngle) * waveRadius * 0.5; // Elliptical for perspective
            const waveSize = 4 + Math.sin(time * 6 + i) * 2 + intensity * 3;
            
            ctx.beginPath();
            ctx.arc(wx, wy, waveSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${tierColor.r + 80}, ${tierColor.g + 80}, ${tierColor.b + 50}, ${0.5 * intensity})`;
            ctx.fill();
        }
        
        // === BUBBLES ===
        for (const bubble of dist.bubbles) {
            const bx = bubble.x - camera.x;
            const by = bubble.y - camera.y;
            const bubbleSize = bubble.size * bubble.life;
            
            // Bubble body
            ctx.beginPath();
            ctx.arc(bx, by, bubbleSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${tierColor.r + 100}, ${tierColor.g + 100}, ${tierColor.b + 50}, ${bubble.life * 0.5})`;
            ctx.fill();
            
            // Bubble highlight
            ctx.beginPath();
            ctx.arc(bx - bubbleSize * 0.3, by - bubbleSize * 0.3, bubbleSize * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${bubble.life * 0.7})`;
            ctx.fill();
            
            // Bubble rim
            ctx.beginPath();
            ctx.arc(bx, by, bubbleSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.life * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // === LIGHT RAYS FROM BELOW ===
        if (intensity > 0.3) {
            ctx.globalCompositeOperation = 'lighter';
            for (let ray = 0; ray < 6; ray++) {
                const rayAngle = (ray / 6) * Math.PI * 2 + time * 0.3;
                const rayLength = 60 + intensity * 50 + Math.sin(time * 2 + ray) * 20;
                const rayWidth = 8 + intensity * 10;
                
                const rayX = screenX + Math.cos(rayAngle) * 15;
                const rayY = screenY + Math.sin(rayAngle) * 10;
                const rayEndX = screenX + Math.cos(rayAngle) * rayLength;
                const rayEndY = screenY + Math.sin(rayAngle) * rayLength * 0.4;
                
                const rayGradient = ctx.createLinearGradient(rayX, rayY, rayEndX, rayEndY);
                rayGradient.addColorStop(0, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${0.3 * intensity})`);
                rayGradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.moveTo(rayX, rayY);
                ctx.lineTo(rayEndX - rayWidth/2, rayEndY);
                ctx.lineTo(rayEndX + rayWidth/2, rayEndY);
                ctx.closePath();
                ctx.fillStyle = rayGradient;
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.restore();
    }
    
    drawEmergingUAP(ctx, camera, uap) {
        // Safety checks for invalid values
        if (!uap || !camera || 
            !isFinite(uap.x) || !isFinite(uap.y) || 
            !isFinite(camera.x) || !isFinite(camera.y) ||
            !isFinite(uap.altitude) || !isFinite(uap.departAltitude)) {
            return;
        }
        
        const screenX = uap.x - camera.x + Math.sin(uap.wobble || 0) * 3;
        const screenY = uap.y - camera.y - (uap.altitude || 0) - (uap.departAltitude || 0);
        const waterSurfaceY = uap.y - camera.y;
        
        // Additional safety check for computed values
        if (!isFinite(screenX) || !isFinite(screenY) || !isFinite(waterSurfaceY)) {
            return;
        }
        
        if (screenX < -100 || screenX > ctx.canvas.width + 100 ||
            screenY < -200 || screenY > ctx.canvas.height + 100) return;
        
        const tierColors = {
            common: { r: 170, g: 170, b: 170, hex: '#aaaaaa' },
            uncommon: { r: 68, g: 255, b: 68, hex: '#44ff44' },
            rare: { r: 68, g: 136, b: 255, hex: '#4488ff' },
            epic: { r: 170, g: 68, b: 255, hex: '#aa44ff' },
            legendary: { r: 255, g: 170, b: 0, hex: '#ffaa00' }
        };
        const tierColor = tierColors[uap.tier] || tierColors.common;
        const color = tierColor.hex;
        
        ctx.save();
        
        // === LIGHT BEAM FROM USO ===
        if (uap.timer > 0.5 && uap.timer < 2.5 && uap.departAltitude === 0) {
            const beamProgress = uap.timer < 1.5 ? (uap.timer - 0.5) : Math.max(0, 1 - (uap.timer - 2.0) * 2);
            const beamPulse = 0.7 + Math.sin(uap.beamPulse) * 0.3;
            const beamAlpha = beamProgress * beamPulse * 0.6;
            
            if (beamAlpha > 0.05) {
                // Beam cone
                const beamTopWidth = 30;
                const beamBottomWidth = 70 + Math.sin(uap.beamPulse * 2) * 10;
                const beamLength = uap.altitude + 30;
                
                ctx.beginPath();
                ctx.moveTo(screenX - beamTopWidth/2, screenY + 25);
                ctx.lineTo(screenX + beamTopWidth/2, screenY + 25);
                ctx.lineTo(screenX + beamBottomWidth/2, screenY + beamLength);
                ctx.lineTo(screenX - beamBottomWidth/2, screenY + beamLength);
                ctx.closePath();
                
                const beamGradient = ctx.createLinearGradient(screenX, screenY + 25, screenX, screenY + beamLength);
                beamGradient.addColorStop(0, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${beamAlpha})`);
                beamGradient.addColorStop(0.3, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${beamAlpha * 0.6})`);
                beamGradient.addColorStop(1, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, 0)`);
                ctx.fillStyle = beamGradient;
                ctx.fill();
                
                // Beam particles
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 8; i++) {
                    const particleY = screenY + 30 + (beamLength - 30) * ((performance.now() * 0.001 + i * 0.125) % 1);
                    const particleX = screenX + (Math.random() - 0.5) * beamBottomWidth * 0.5;
                    const particleSize = 2 + Math.random() * 3;
                    
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${tierColor.r + 50}, ${tierColor.g + 50}, ${tierColor.b + 50}, ${beamAlpha * 0.5})`;
                    ctx.fill();
                }
                ctx.globalCompositeOperation = 'source-over';
                
                // Ground illumination
                const groundGlow = ctx.createRadialGradient(
                    screenX, waterSurfaceY, 0,
                    screenX, waterSurfaceY, beamBottomWidth * 1.2
                );
                groundGlow.addColorStop(0, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${beamAlpha * 0.4})`);
                groundGlow.addColorStop(0.5, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${beamAlpha * 0.15})`);
                groundGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = groundGlow;
                ctx.beginPath();
                ctx.ellipse(screenX, waterSurfaceY, beamBottomWidth * 1.2, beamBottomWidth * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // === USO CUBE GLOW ===
        ctx.globalAlpha = uap.alpha;
        ctx.translate(screenX, screenY);
        
        // Outer glow (larger, color-tinted)
        const outerGlowRadius = 80 + Math.sin(performance.now() * 0.003) * 10;
        const outerGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, outerGlowRadius);
        outerGlow.addColorStop(0, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, 0.5)`);
        outerGlow.addColorStop(0.4, `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, 0.2)`);
        outerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, outerGlowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        const innerGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 50);
        innerGlow.addColorStop(0, `rgba(255, 255, 255, 0.7)`);
        innerGlow.addColorStop(0.5, color + '55');
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the cube sprite with rotation
        if (this.cubeSprite && this.cubeSprite.complete) {
            ctx.save();
            ctx.rotate(uap.rotation);
            
            // Cube size (scale based on sprite)
            const cubeSize = 64;
            
            // Tier color tint overlay
            ctx.shadowColor = color;
            ctx.shadowBlur = 20;
            
            // Draw the cube
            ctx.drawImage(this.cubeSprite, -cubeSize/2, -cubeSize/2, cubeSize, cubeSize);
            
            // Color overlay for tier
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = color + '33';
            ctx.fillRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);
            ctx.globalCompositeOperation = 'source-over';
            
            ctx.restore();
        } else {
            // Fallback: draw a simple cube shape if image not loaded
            ctx.rotate(uap.rotation);
            ctx.beginPath();
            ctx.rect(-25, -25, 50, 50);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Pulsing ring around cube
        const ringRadius = 45 + Math.sin(performance.now() * 0.005) * 5;
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${0.4 + Math.sin(performance.now() * 0.008) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Second outer ring
        const outerRingRadius = 55 + Math.sin(performance.now() * 0.004 + 1) * 8;
        ctx.beginPath();
        ctx.arc(0, 0, outerRingRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${tierColor.r}, ${tierColor.g}, ${tierColor.b}, ${0.2 + Math.sin(performance.now() * 0.006) * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
        
        // === WATER EFFECTS ===
        ctx.save();
        ctx.globalAlpha = uap.alpha;
        
        // Water dripping effect while rising
        if (uap.timer < 2.0) {
            for (let i = 0; i < 5; i++) {
                const dropX = screenX + (Math.sin(performance.now() * 0.01 + i * 2) * 30);
                const dropY = screenY + 35 + i * 8 + Math.sin(performance.now() * 0.005 + i) * 5;
                const dropSize = (2 + Math.random() * 2) * (1 - uap.timer * 0.4);
                
                ctx.beginPath();
                ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(150, 200, 230, ${0.6 - uap.timer * 0.25})`;
                ctx.fill();
            }
        }
        
        // Shadow on water surface
        if (uap.departAltitude === 0) {
            const shadowScale = 1 - (uap.altitude / 150);
            ctx.beginPath();
            ctx.ellipse(uap.x - camera.x, waterSurfaceY, 45 * shadowScale, 16 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 50, 80, ${0.4 * shadowScale * uap.alpha})`;
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawSupplyCache(ctx, camera, chest) {
        const screenX = chest.x - camera.x;
        const screenY = chest.y - camera.y + Math.sin(chest.bobPhase) * 4;
        
        if (screenX < -60 || screenX > ctx.canvas.width + 60 ||
            screenY < -60 || screenY > ctx.canvas.height + 60) return;
        
        const tierColors = {
            common: '#aaaaaa',
            uncommon: '#44ff44',
            rare: '#4488ff',
            epic: '#aa44ff',
            legendary: '#ffaa00'
        };
        const color = tierColors[chest.tier];
        const isFlashing = chest.lifetime > 50 && Math.sin(chest.lifetime * 10) > 0;
        
        // Alien glow effect
        const glowRadius = 45 + Math.sin(chest.glowPhase) * 8;
        const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius);
        glowGradient.addColorStop(0, color + '55');
        glowGradient.addColorStop(0.5, color + '22');
        glowGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Rotating energy rings
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(chest.pulsePhase * 0.8);
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 0.4);
        ctx.arc(0, 0, 35, Math.PI * 0.6, Math.PI);
        ctx.arc(0, 0, 35, Math.PI * 1.2, Math.PI * 1.6);
        ctx.arc(0, 0, 35, Math.PI * 1.8, Math.PI * 2);
        ctx.strokeStyle = color + 'aa';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        // Supply cache orb
        if (!isFlashing) {
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // Outer shell
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            const orbGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, 18);
            orbGradient.addColorStop(0, '#ffffff');
            orbGradient.addColorStop(0.3, color);
            orbGradient.addColorStop(1, '#333333');
            ctx.fillStyle = orbGradient;
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Inner glow
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
            innerGlow.addColorStop(0, '#ffffff');
            innerGlow.addColorStop(0.5, color);
            innerGlow.addColorStop(1, color + '44');
            ctx.fillStyle = innerGlow;
            ctx.fill();
            
            // Symbol based on tier
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const symbols = { common: '◆', uncommon: '◈', rare: '❖', epic: '✦', legendary: '★' };
            ctx.fillText(symbols[chest.tier], 0, 0);
            
            ctx.restore();
        }
        
        // Tier label
        ctx.save();
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(screenX - 30, screenY + 28, 60, 14);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - 30, screenY + 28, 60, 14);
        ctx.fillStyle = color;
        ctx.fillText(chest.tier.toUpperCase(), screenX, screenY + 36);
        ctx.restore();
        
        // Despawn warning
        if (chest.lifetime > 45) {
            ctx.save();
            ctx.font = 'bold 11px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = isFlashing ? '#ff4444' : '#ffaa00';
            ctx.fillText(`${Math.ceil(60 - chest.lifetime)}s`, screenX, screenY - 35);
            ctx.restore();
        }
    }
    
    clear() {
        this.chests = [];
        this.emergingUAPs = [];
        this.waterDisturbances = [];
        this.spawnTimer = 0;
    }
}

// XP Magnet Effect (Enhanced pickup attraction)
class XPMagnetEffect {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.duration = 0;
    }
    
    activate(duration = 5) {
        this.active = true;
        this.duration = duration;
        
        // Immediately pulse to show activation
        if (this.game && this.game.screenFlash) {
            this.game.screenFlash.add('#00ffcc', 0.15, 0.2);
        }
    }
    
    update(dt) {
        if (this.active) {
            this.duration -= dt;
            if (this.duration <= 0) {
                this.active = false;
            }
        }
    }
    
    getRange() {
        // Return massive range to attract ALL pickups in the entire world
        return this.active ? 10000 : 0;
    }
    
    draw(ctx, player, camera) {
        if (!this.active) return;
        
        // Draw magnetic pulse effect
        const screenX = player.x - camera.x;
        const screenY = player.y - camera.y;
        const pulse = (1 - this.duration % 1) * 300;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 200, ${1 - pulse / 300})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Screen Flash Effect
class ScreenFlash {
    constructor() {
        this.flashes = [];
    }
    
    add(color, duration = 0.1, intensity = 0.3) {
        this.flashes.push({
            color,
            duration,
            maxDuration: duration,
            intensity
        });
    }
    
    update(dt) {
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            this.flashes[i].duration -= dt;
            if (this.flashes[i].duration <= 0) {
                this.flashes.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        for (const flash of this.flashes) {
            const alpha = (flash.duration / flash.maxDuration) * flash.intensity;
            ctx.fillStyle = flash.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.globalAlpha = 1;
        }
    }
}

// Passive Item System (Like Vampire Survivors passive items)
const PASSIVE_ITEMS = {
    // Offensive
    spinach: {
        name: 'Enhanced Core',
        icon: '⚡',
        description: '+10% damage. (Synergy: Plasma Burst)',
        maxLevel: 5,
        effect: { damage: 0.1 },
        rarity: 'common'
    },
    emptyTome: {
        name: 'Rapid Systems',
        icon: '📖',
        description: '-8% cooldowns. (Synergy: EMP Pulse)',
        maxLevel: 5,
        effect: { cooldown: -0.08 },
        rarity: 'common'
    },
    duplicator: {
        name: 'Quantum Split',
        icon: '🔀',
        description: '+1 projectile. (Synergy: Drone Swarm)',
        maxLevel: 2,
        effect: { projectiles: 1 },
        rarity: 'rare'
    },
    
    // Defensive
    armor: {
        name: 'Hull Plating',
        icon: '🛡️',
        description: '+10% max health',
        maxLevel: 5,
        effect: { health: 0.1 },
        rarity: 'common'
    },
    wings: {
        name: 'Propulsion+',
        icon: '🚀',
        description: '+10% speed. (Synergy: Energy Orbit)',
        maxLevel: 5,
        effect: { speed: 0.1 },
        rarity: 'common'
    },
    clover: {
        name: 'Luck Module',
        icon: '🍀',
        description: '+5% crit chance',
        maxLevel: 5,
        effect: { critChance: 0.05 },
        rarity: 'uncommon'
    },
    
    // Utility
    magnet: {
        name: 'Tractor Array',
        icon: '🧲',
        description: '+25% pickup range. (Synergy: Gravity Well)',
        maxLevel: 5,
        effect: { pickupRange: 0.25 },
        rarity: 'common'
    },
    crown: {
        name: 'XP Amplifier',
        icon: '👑',
        description: '+10% XP gain',
        maxLevel: 5,
        effect: { xpGain: 0.1 },
        rarity: 'uncommon'
    },
    
    // Special
    skull: {
        name: 'Critical Core',
        icon: '💀',
        description: '+25% crit damage',
        maxLevel: 3,
        effect: { critDamage: 0.25 },
        rarity: 'rare'
    },
    candelabrador: {
        name: 'Area Expansion',
        icon: '🕯️',
        description: '+10% AoE. (Synergy: Chain Lightning)',
        maxLevel: 5,
        effect: { aoe: 0.1 },
        rarity: 'uncommon'
    }
};

// Level Up Reroll System (Like many roguelikes)
class RerollSystem {
    constructor(game) {
        this.game = game;
        this.rerollsAvailable = 2;
        this.rerollCost = 0; // First rerolls are free
        this.maxRerolls = 5;
    }
    
    canReroll() {
        return this.rerollsAvailable > 0;
    }
    
    useReroll() {
        if (this.canReroll()) {
            this.rerollsAvailable--;
            return true;
        }
        return false;
    }
    
    addReroll(count = 1) {
        this.rerollsAvailable = Math.min(this.maxRerolls, this.rerollsAvailable + count);
    }
    
    reset() {
        this.rerollsAvailable = this.game.player ? this.game.player.stats.rerolls : 0;
    }
}

// Elite Enemy Visual Effects
class EliteEffects {
    static drawEliteGlow(ctx, x, y, radius, time) {
        const pulse = Math.sin(time * 3) * 0.2 + 0.8;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 2);
        gradient.addColorStop(0, `rgba(255, 200, 0, ${0.3 * pulse})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating particles
        for (let i = 0; i < 4; i++) {
            const angle = time * 2 + (i * Math.PI / 2);
            const px = x + Math.cos(angle) * radius * 1.5;
            const py = y + Math.sin(angle) * radius * 1.5;
            
            ctx.fillStyle = `rgba(255, 200, 0, ${0.6 * pulse})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    static drawBossGlow(ctx, x, y, radius, time) {
        const pulse = Math.sin(time * 2) * 0.3 + 0.7;
        
        // Multiple layered glows
        for (let i = 0; i < 3; i++) {
            const r = radius * (1.5 + i * 0.5);
            const alpha = (0.3 - i * 0.1) * pulse;
            
            const gradient = ctx.createRadialGradient(x, y, radius, x, y, r);
            gradient.addColorStop(0, `rgba(255, 50, 50, ${alpha})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Time Slow Effect (For powerful abilities)
class TimeSlowEffect {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.duration = 0;
        this.slowFactor = 0.3;
    }
    
    activate(duration = 3, slowFactor = 0.3) {
        this.active = true;
        this.duration = duration;
        this.slowFactor = slowFactor;
    }
    
    update(dt) {
        if (this.active) {
            this.duration -= dt;
            if (this.duration <= 0) {
                this.active = false;
            }
        }
    }
    
    getTimeScale() {
        return this.active ? this.slowFactor : 1.0;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        // Vignette effect during time slow
        const gradient = ctx.createRadialGradient(
            ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
            ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width * 0.7
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 100, 150, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

// =====================================================
// MQ-9 REAPER MISSILE SYSTEM
// Anti-camping mechanic - fires missiles at stationary players
// =====================================================
class ReaperMissileSystem {
    constructor(game) {
        this.game = game;
        
        // Player movement tracking
        this.lastPlayerPos = { x: 0, y: 0 };
        this.stationaryTime = 0;
        this.checkInterval = 0.3; // Check every 0.3s (faster detection)
        this.checkTimer = 0;
        this.movementThreshold = 40; // Pixels - must move this much to reset
        
        // Timing parameters (in seconds) - AGGRESSIVE
        this.graceTime = 0.8;       // Quick grace period
        this.warningTime = 1.2;     // Short warning before missile fires
        this.flightTime = 0.8;      // Fast missile
        this.cooldownTime = 5.0;    // Shorter cooldown between missiles
        
        // Phase scaling (later phases = even more aggressive)
        this.phaseScaling = {
            0: { warningMod: 1.0, cooldownMod: 1.0, damageMod: 1.0 },
            1: { warningMod: 0.95, cooldownMod: 0.95, damageMod: 1.05 },
            2: { warningMod: 0.85, cooldownMod: 0.85, damageMod: 1.15 },
            3: { warningMod: 0.75, cooldownMod: 0.75, damageMod: 1.25 },
            4: { warningMod: 0.65, cooldownMod: 0.6, damageMod: 1.35 }
        };
        
        // State
        this.state = 'idle'; // idle, grace, warning, firing, cooldown
        this.stateTimer = 0;
        this.cooldownTimer = 0;
        
        // Active missile
        this.missile = null;
        this.targetLockPos = null;
        
        // Damage settings
        this.baseDamage = 0.30; // 30% of max HP
        this.splashRadius = 100;
        this.knockbackForce = 400;
        
        // Visual elements
        this.targetingCircle = null;
        this.warningElement = null;
        
        // Audio cues
        this.warningPlayed = false;
        this.lockPlayed = false;
        
        // Grace period after taking damage (shorter = more aggressive)
        this.damageGraceTime = 1.0;
        this.damageGraceTimer = 0;
        
        this.createUI();
    }
    
    createUI() {
        // Create targeting circle element
        this.targetingCircle = document.createElement('div');
        this.targetingCircle.id = 'reaper-targeting-circle';
        this.targetingCircle.className = 'reaper-target hidden';
        this.targetingCircle.innerHTML = `
            <div class="reaper-target-ring ring-outer"></div>
            <div class="reaper-target-ring ring-inner"></div>
            <div class="reaper-target-crosshair"></div>
        `;
        
        // Create warning text element
        this.warningElement = document.createElement('div');
        this.warningElement.id = 'reaper-warning';
        this.warningElement.className = 'reaper-warning hidden';
        this.warningElement.innerHTML = `
            <span class="warning-icon">⚠</span>
            <span class="warning-text">TARGET STATIONARY</span>
        `;
        
        // Append to game screen
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.appendChild(this.targetingCircle);
            gameScreen.appendChild(this.warningElement);
        }
    }
    
    // Called when player takes damage from any source
    notifyDamage() {
        this.damageGraceTimer = this.damageGraceTime;
        // If we were warning, reset
        if (this.state === 'grace' || this.state === 'warning') {
            this.resetState();
        }
    }
    
    getPhaseModifiers() {
        const phase = this.game.spawner ? this.game.spawner.getCurrentPhase() : 0;
        return this.phaseScaling[Math.min(phase, 4)];
    }
    
    update(dt) {
        // Don't update during pause/levelup
        if (this.game.paused || this.game.levelingUp) return;
        
        // Update damage grace timer
        if (this.damageGraceTimer > 0) {
            this.damageGraceTimer -= dt;
        }
        
        // Update cooldown
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt;
        }
        
        // Update active missile
        if (this.missile) {
            this.updateMissile(dt);
            return; // Don't check stationary while missile is active
        }
        
        // Movement check on interval
        this.checkTimer += dt;
        if (this.checkTimer >= this.checkInterval) {
            this.checkTimer = 0;
            this.checkPlayerMovement();
        }
        
        // State machine
        switch (this.state) {
            case 'idle':
                // Check if player has been stationary long enough
                if (this.stationaryTime >= this.graceTime && 
                    this.cooldownTimer <= 0 && 
                    this.damageGraceTimer <= 0) {
                    this.enterWarningState();
                }
                break;
                
            case 'warning':
                this.stateTimer += dt;
                this.updateWarningVisuals();
                
                const mods = this.getPhaseModifiers();
                const adjustedWarningTime = this.warningTime * mods.warningMod;
                
                if (this.stateTimer >= adjustedWarningTime) {
                    this.fireMissile();
                }
                break;
                
            case 'cooldown':
                // Just waiting
                break;
        }
        
        // Update reticle state
        this.updateReticleState();
    }
    
    checkPlayerMovement() {
        if (!this.game.player) return;
        
        const player = this.game.player;
        const dx = player.x - this.lastPlayerPos.x;
        const dy = player.y - this.lastPlayerPos.y;
        const distMoved = Math.sqrt(dx * dx + dy * dy);
        
        if (distMoved >= this.movementThreshold) {
            // Player moved enough - reset stationary timer
            this.stationaryTime = 0;
            this.lastPlayerPos = { x: player.x, y: player.y };
            
            // If we were in warning state, cancel it
            if (this.state === 'warning') {
                this.resetState();
            }
        } else {
            // Player hasn't moved enough
            this.stationaryTime += this.checkInterval;
        }
    }
    
    enterWarningState() {
        this.state = 'warning';
        this.stateTimer = 0;
        this.warningPlayed = false;
        this.lockPlayed = false;
        
        // Lock target position at warning start
        this.targetLockPos = {
            x: this.game.player.x,
            y: this.game.player.y
        };
        
        // Show warning UI
        this.showWarning();
        
        // Play warning sound
        this.game.playSound('warning');
    }
    
    updateWarningVisuals() {
        const mods = this.getPhaseModifiers();
        const adjustedWarningTime = this.warningTime * mods.warningMod;
        const progress = this.stateTimer / adjustedWarningTime;
        
        // Update targeting circle position and urgency
        if (this.targetLockPos) {
            const screenX = this.targetLockPos.x - this.game.camera.x;
            const screenY = this.targetLockPos.y - this.game.camera.y;
            
            this.targetingCircle.style.left = `${screenX}px`;
            this.targetingCircle.style.top = `${screenY}px`;
            
            // Increase urgency as progress increases
            if (progress > 0.7) {
                this.targetingCircle.classList.add('critical');
                if (!this.lockPlayed) {
                    this.game.playSound('missileAlert');
                    this.lockPlayed = true;
                }
            } else if (progress > 0.3) {
                this.targetingCircle.classList.add('urgent');
            }
            
            // Shrink rings as targeting completes
            const scale = 1.5 - (progress * 0.5);
            this.targetingCircle.style.setProperty('--target-scale', scale);
        }
        
        // Update warning text urgency
        if (progress > 0.7) {
            this.warningElement.classList.add('critical');
            this.warningElement.querySelector('.warning-text').textContent = 'MISSILE INCOMING!';
        } else if (progress > 0.5) {
            this.warningElement.classList.add('urgent');
            this.warningElement.querySelector('.warning-text').textContent = 'MOVE NOW!';
        }
    }
    
    fireMissile() {
        this.state = 'firing';
        this.hideWarning();
        
        // Calculate missile spawn position (from top of screen)
        const targetX = this.targetLockPos.x;
        const targetY = this.targetLockPos.y;
        
        // Spawn above screen
        const spawnX = targetX + Utils.random(-50, 50);
        const spawnY = this.game.camera.y - 100;
        
        // Calculate velocity to reach target in flightTime
        const dx = targetX - spawnX;
        const dy = targetY - spawnY;
        
        this.missile = {
            x: spawnX,
            y: spawnY,
            targetX: targetX,
            targetY: targetY,
            vx: dx / this.flightTime,
            vy: dy / this.flightTime,
            flightTimer: this.flightTime,
            trail: [],
            rotation: Math.atan2(dy, dx)
        };
        
        // Show targeting circle at impact point
        this.showTargetingCircle(targetX, targetY, true);
        
        // Play missile launch sound
        this.game.playSound('missile');
        
        // UI warning
        this.game.ui?.showWarning?.('⚠ HELLFIRE INBOUND', 'alert');
    }
    
    updateMissile(dt) {
        if (!this.missile) return;
        
        const m = this.missile;
        
        // Update position
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.flightTimer -= dt;
        
        // Add trail particles
        if (Math.random() < 0.8) {
            m.trail.push({
                x: m.x,
                y: m.y,
                life: 0.5,
                size: Utils.random(3, 6)
            });
        }
        
        // Update trail
        for (let i = m.trail.length - 1; i >= 0; i--) {
            m.trail[i].life -= dt;
            if (m.trail[i].life <= 0) {
                m.trail.splice(i, 1);
            }
        }
        
        // Update targeting circle position
        const screenX = m.targetX - this.game.camera.x;
        const screenY = m.targetY - this.game.camera.y;
        this.targetingCircle.style.left = `${screenX}px`;
        this.targetingCircle.style.top = `${screenY}px`;
        
        // Check for impact
        if (m.flightTimer <= 0) {
            this.missileImpact();
        }
    }
    
    missileImpact() {
        if (!this.missile) return;
        
        const impactX = this.missile.targetX;
        const impactY = this.missile.targetY;
        
        // Visual effects
        this.game.screenShake(15);
        this.game.particles.explosion(impactX, impactY, '#ff6600', 30);
        this.game.particles.explosion(impactX, impactY, '#ffaa00', 20);
        
        // Screen flash
        this.game.screenFlash?.activate?.('#ff4400', 0.3);
        
        // Play explosion sound
        this.game.playSound('explosion');
        
        // Check player damage
        const player = this.game.player;
        if (player) {
            const dist = Utils.distance(impactX, impactY, player.x, player.y);
            
            if (dist < this.splashRadius) {
                // Calculate damage falloff
                const falloff = 1 - (dist / this.splashRadius) * 0.5;
                const mods = this.getPhaseModifiers();
                const damage = player.stats.maxHealth * this.baseDamage * falloff * mods.damageMod;
                
                // Apply damage
                player.takeDamage(damage, 'reaperMissile');
                
                // Knockback away from impact
                const angle = Utils.angle(impactX, impactY, player.x, player.y);
                const knockback = this.knockbackForce * falloff;
                player.vx += Math.cos(angle) * knockback;
                player.vy += Math.sin(angle) * knockback;
            }
        }
        
        // Damage nearby enemies too (for fairness/fun)
        for (const enemy of this.game.enemies) {
            if (!enemy.active) continue;
            const dist = Utils.distance(impactX, impactY, enemy.x, enemy.y);
            if (dist < this.splashRadius * 1.5) {
                const falloff = 1 - (dist / (this.splashRadius * 1.5)) * 0.7;
                enemy.takeDamage(100 * falloff, this);
            }
        }
        
        // Cleanup and start cooldown
        this.missile = null;
        this.targetLockPos = null;
        this.hideTargetingCircle();
        
        const mods = this.getPhaseModifiers();
        this.cooldownTimer = this.cooldownTime * mods.cooldownMod;
        this.state = 'cooldown';
        this.stationaryTime = 0;
    }
    
    resetState() {
        this.state = 'idle';
        this.stateTimer = 0;
        this.hideWarning();
        this.hideTargetingCircle();
        this.targetLockPos = null;
        this.warningPlayed = false;
        this.lockPlayed = false;
    }
    
    updateReticleState() {
        const reticle = this.game.reticle?.element;
        if (!reticle) return;
        
        // Remove all reaper states first
        reticle.classList.remove('reaper-warning', 'reaper-critical', 'reaper-lock');
        
        if (this.state === 'warning') {
            const mods = this.getPhaseModifiers();
            const adjustedWarningTime = this.warningTime * mods.warningMod;
            const progress = this.stateTimer / adjustedWarningTime;
            
            if (progress > 0.7) {
                reticle.classList.add('reaper-critical');
            } else if (progress > 0.3) {
                reticle.classList.add('reaper-warning');
            }
        } else if (this.missile) {
            reticle.classList.add('reaper-lock');
        }
    }
    
    showWarning() {
        this.warningElement?.classList.remove('hidden', 'urgent', 'critical');
        this.warningElement.querySelector('.warning-text').textContent = 'TARGET STATIONARY';
    }
    
    hideWarning() {
        this.warningElement?.classList.add('hidden');
        this.warningElement?.classList.remove('urgent', 'critical');
    }
    
    showTargetingCircle(x, y, impactMode = false) {
        const screenX = x - this.game.camera.x;
        const screenY = y - this.game.camera.y;
        
        this.targetingCircle.style.left = `${screenX}px`;
        this.targetingCircle.style.top = `${screenY}px`;
        this.targetingCircle.classList.remove('hidden', 'urgent', 'critical');
        
        if (impactMode) {
            this.targetingCircle.classList.add('impact-mode');
        }
    }
    
    hideTargetingCircle() {
        this.targetingCircle?.classList.add('hidden');
        this.targetingCircle?.classList.remove('urgent', 'critical', 'impact-mode');
    }
    
    draw(ctx, camera) {
        // Draw missile if active
        if (this.missile) {
            const m = this.missile;
            const screenX = m.x - camera.x;
            const screenY = m.y - camera.y;
            
            // Draw trail
            ctx.save();
            for (const t of m.trail) {
                const tx = t.x - camera.x;
                const ty = t.y - camera.y;
                const alpha = t.life / 0.5;
                
                ctx.globalAlpha = alpha * 0.6;
                ctx.fillStyle = '#ff8800';
                ctx.beginPath();
                ctx.arc(tx, ty, t.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Smoke
                ctx.fillStyle = '#666666';
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(tx + Utils.random(-5, 5), ty + Utils.random(-5, 5), t.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
            
            // Draw missile body
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(m.rotation);
            
            // Missile shape (top-down view)
            ctx.fillStyle = '#444444';
            ctx.beginPath();
            ctx.moveTo(15, 0);      // Nose
            ctx.lineTo(-10, -6);    // Left wing
            ctx.lineTo(-8, 0);      // Body
            ctx.lineTo(-10, 6);     // Right wing
            ctx.closePath();
            ctx.fill();
            
            // Thruster glow
            ctx.fillStyle = '#ff4400';
            ctx.globalAlpha = 0.8 + Math.random() * 0.2;
            ctx.beginPath();
            ctx.arc(-10, 0, 4 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
            // Draw impact radius indicator
            const targetScreenX = m.targetX - camera.x;
            const targetScreenY = m.targetY - camera.y;
            
            ctx.save();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(targetScreenX, targetScreenY, this.splashRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    // Reset for new game
    reset() {
        this.stationaryTime = 0;
        this.checkTimer = 0;
        this.state = 'idle';
        this.stateTimer = 0;
        this.cooldownTimer = 0;
        this.missile = null;
        this.targetLockPos = null;
        this.damageGraceTimer = 0;
        this.hideWarning();
        this.hideTargetingCircle();
        
        if (this.game.player) {
            this.lastPlayerPos = {
                x: this.game.player.x,
                y: this.game.player.y
            };
        }
    }
}
