// =====================================================
// PICKUP ENTITY
// =====================================================

class Pickup {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.type = 'xp';
        this.value = 1;
        this.radius = 8;
        this.active = false;
        this.magnetized = false;
        this.lifetime = 60; // Seconds before despawn
        this.bobPhase = Math.random() * Math.PI * 2;
        this.canMagnetize = true; // Reset magnetize flag
        this.extraData = null;
    }
    
    init(type, x, y, value, extraData = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.value = value;
        this.active = true;
        this.magnetized = false;
        this.extraData = extraData; // For upgrade pickups (contains upgrade choice data)
        this.lifetime = 60;
        this.canMagnetize = true; // Default: can be magnetized
        
        // Upgrade pickups have shorter lifetime and don't magnetize!
        if (type === 'upgrade') {
            this.lifetime = GAME_CONFIG.UPGRADE_PICKUP_TIMEOUT || 20; // Seconds to pick up
            this.radius = 18;
            this.canMagnetize = false; // Must be manually collected
        } else {
            // Size based on value
            if (type === 'xp') {
                this.radius = Math.min(15, 6 + value);
            } else {
                this.radius = 10;
            }
        }
    }
    
    update(dt, player, game) {
        if (!this.active) return;
        
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }
        
        this.bobPhase += dt * 5;
        
        // Check if in magnet range
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        const magnetRange = player.stats.pickupRange + GAME_CONFIG.PICKUP_MAGNET_RANGE;
        
        // Also check for XP magnet powerup effect
        const magnetPowerupActive = game.xpMagnet && game.xpMagnet.active;
        const magnetPowerupRange = magnetPowerupActive ? game.xpMagnet.getRange() : 0;
        const effectiveRange = Math.max(magnetRange, magnetPowerupRange);
        
        if ((dist < effectiveRange || this.magnetized) && this.canMagnetize !== false) {
            this.magnetized = true;
            
            // Move toward player - much faster when magnet powerup active
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            let speed;
            if (magnetPowerupActive) {
                // Magnet powerup: Very fast pull that scales with distance
                // Minimum 1200 units/sec, or 3x the distance per second (reaches in ~0.33 sec)
                speed = Math.max(1200, dist * 3);
            } else {
                // Normal pickup attraction
                speed = GAME_CONFIG.PICKUP_MAGNET_SPEED * (1 + (1 - dist / effectiveRange));
            }
            this.x += Math.cos(angle) * speed * dt;
            this.y += Math.sin(angle) * speed * dt;
        }
        
        // Check collision with player
        if (dist < player.radius + this.radius) {
            this.collect(player, game);
        }
    }
    
    collect(player, game) {
        this.active = false;
        
        // Track pickups collected
        game.pickupsCollected = (game.pickupsCollected || 0) + 1;
        
        switch (this.type) {
            case 'xp':
                player.gainXP(this.value);
                game.particles.xpPickup(this.x, this.y);
                game.playSound('pickupXP', { volume: 0.3, pitchVariation: 0.3 });
                break;
                
            case 'health':
                player.health = Math.min(player.stats.maxHealth, player.health + this.value);
                game.particles.emit({
                    x: this.x,
                    y: this.y,
                    count: 8,
                    color: '#44ff44',
                    speed: 100,
                    life: 0.4,
                    size: 5
                });
                game.playSound('pickupHealth');
                // Show heal number
                if (game.damageNumbers) {
                    game.damageNumbers.spawn(player.x, player.y - 30, this.value, { heal: true });
                }
                break;
                
            case 'currency':
                // In-run currency that adds to post-game rewards
                game.currency = (game.currency || 0) + this.value;
                game.particles.emit({
                    x: this.x,
                    y: this.y,
                    count: 6,
                    color: '#ffcc00',
                    speed: 80,
                    life: 0.3,
                    size: 4
                });
                game.playSound('pickup', { volume: 0.4 });
                break;
                
            case 'magnet':
                // Activate XP magnet - collect all pickups!
                if (game.xpMagnet) {
                    game.xpMagnet.activate(5); // 5 seconds duration
                    // Immediately magnetize ALL active pickups
                    for (const pickup of game.pickups.getActive()) {
                        if (pickup.canMagnetize !== false) {
                            pickup.magnetized = true;
                        }
                    }
                    game.ui.showWarning('MAGNET ACTIVATED!', 'success');
                }
                game.screenShake(5);
                game.screenFlash.add('#ff00ff', 0.2, 0.3);
                game.playSound('pickupPowerup');
                game.particles.emit({
                    x: player.x,
                    y: player.y,
                    count: 30,
                    color: '#ff00ff',
                    speed: 300,
                    life: 0.6,
                    size: 8
                });
                break;
                
            case 'bomb':
                // Damage all enemies
                for (const enemy of game.enemies) {
                    if (enemy.active) {
                        enemy.takeDamage(50, player);
                    }
                }
                game.particles.explosion(player.x, player.y, '#ff8800', 50);
                game.screenShake(15);
                break;
                
            case 'nuke':
                // Clear ALL enemies on screen (rare drop)
                let nukeKills = 0;
                for (const enemy of game.enemies) {
                    if (enemy.active && !enemy.data.boss) {
                        enemy.takeDamage(99999, player);
                        nukeKills++;
                    }
                }
                game.screenFlash.add('#ffffff', 0.5, 0.8);
                game.screenShake(25);
                game.ui.showWarning(`TACTICAL STRIKE: ${nukeKills} NEUTRALIZED`, 'success');
                break;
                
            case 'abilityCharge':
                // Restore 1 charge to all abilities
                player.restoreAbilityCharges(1);
                game.particles.emit({
                    x: this.x, y: this.y,
                    count: 15, color: '#00ffff',
                    speed: 150, life: 0.5, size: 6
                });
                game.screenFlash.add('#00ffff', 0.15, 0.3);
                game.ui.showWarning('ABILITY CHARGES RESTORED', 'info');
                break;
                
            case 'powerCore':
                // +25% ability power for this run
                player.abilityPower += 0.25;
                game.particles.emit({
                    x: this.x, y: this.y,
                    count: 20, color: '#ff00ff',
                    speed: 180, life: 0.6, size: 8
                });
                game.screenFlash.add('#ff00ff', 0.2, 0.4);
                game.screenShake(8);
                game.ui.showWarning(`ABILITY POWER: ${Math.round(player.abilityPower * 100)}%`, 'info');
                break;
                
            case 'abilityFragment':
                // Upgrade a random ability
                const upgraded = player.upgradeRandomAbility();
                if (upgraded) {
                    game.particles.explosion(this.x, this.y, upgraded.data.color, 30);
                    game.screenFlash.add(upgraded.data.color, 0.3, 0.5);
                    game.screenShake(10);
                    game.ui.showWarning(`${upgraded.data.name} UPGRADED TO LV${upgraded.level}`, 'success');
                }
                break;
                
            // === POWER-UP PICKUPS (Q, E, F) ===
            case 'powerup_overdrive':
                game.collectPowerup('overdrive');
                game.particles.explosion(this.x, this.y, POWERUPS.overdrive.color, 25);
                break;
                
            case 'powerup_shield':
                game.collectPowerup('shield');
                game.particles.explosion(this.x, this.y, POWERUPS.shield.color, 25);
                break;
                
            case 'powerup_chronoBurst':
                game.collectPowerup('chronoBurst');
                game.particles.explosion(this.x, this.y, POWERUPS.chronoBurst.color, 25);
                break;
                
            case 'powerup_phaseShift':
                game.collectPowerup('phaseShift');
                game.particles.explosion(this.x, this.y, POWERUPS.phaseShift.color, 25);
                break;
                
            case 'powerup_ultimate':
                game.collectPowerup('ultimate');
                const ultColor = game.ultimateData?.color || '#ffaa00';
                game.particles.explosion(this.x, this.y, ultColor, 35);
                game.screenFlash.add('#ffffff', 0.5, 0.3);
                break;
            
            case 'ultimateFragment':
                // Ultimate fragment - adds to charge meter
                const fragmentValue = this.value || 1;
                game.collectUltimateFragment(fragmentValue);
                const fragColor = game.ultimateData?.color || '#ffaa00';
                // Particle trail toward player
                game.particles.emit({
                    x: this.x, y: this.y,
                    count: 5 + fragmentValue,
                    color: fragColor,
                    speed: 80,
                    life: 0.4,
                    size: 4 + fragmentValue
                });
                break;
                
            case 'powerup':
                // Generic powerup type - uses extraData to determine which powerup
                if (this.extraData && this.extraData.powerupType) {
                    game.collectPowerup(this.extraData.powerupType);
                    const pData = POWERUPS[this.extraData.powerupType];
                    if (pData) {
                        game.particles.explosion(this.x, this.y, pData.color, 30);
                    }
                }
                break;
                
            case 'upgrade':
                // Upgrade pickup - show choice overlay instead of auto-applying!
                // Generate 3 choices and let player pick (with reroll option)
                game.showUpgradeChoices(this.x, this.y, this.lifetime);
                // Visual feedback
                game.particles.explosion(this.x, this.y, '#ffd700', 25);
                game.screenFlash.add('#ffd700', 0.15, 0.3);
                game.playSound('pickupPowerup');
                break;
                
            case 'artifact':
                // Artifact pickup - rare collectible with lore and permanent effects
                if (this.extraData && this.extraData.artifactId) {
                    const artifactId = this.extraData.artifactId;
                    const artifact = ARTIFACTS?.[artifactId];
                    
                    if (artifact) {
                        // Ensure collections structure exists (handles older saves)
                        if (!game.saveData.collections) {
                            game.saveData.collections = {};
                        }
                        if (!game.saveData.collections.artifacts) {
                            game.saveData.collections.artifacts = [];
                        }
                        if (!game.saveData.collections.artifacts.includes(artifactId)) {
                            game.saveData.collections.artifacts.push(artifactId);
                            SaveManager.save(game.saveData);
                        }
                        
                        // Apply artifact effects (if implemented)
                        if (artifact.effects) {
                            for (const effect of artifact.effects) {
                                player.applyArtifactEffect(effect);
                            }
                        }
                        
                        // Spectacular visual feedback based on rarity
                        const rarityColors = {
                            legendary: '#ff8800',
                            epic: '#cc44ff',
                            rare: '#44ccff',
                            common: '#aaaaaa'
                        };
                        const color = rarityColors[artifact.rarity] || '#ffd700';
                        
                        game.particles.explosion(this.x, this.y, color, 50);
                        game.screenFlash.add(color, 0.4, 0.6);
                        game.screenShake(15);
                        game.playSound('pickupPowerup');
                        
                        // Show artifact name with rarity
                        const rarityText = artifact.rarity?.toUpperCase() || 'RARE';
                        game.ui.showWarning(`${rarityText} ARTIFACT: ${artifact.name}`, 'success');
                    }
                }
                break;
        }
    }
    
    draw(ctx, camera) {
        if (!this.active) return;
        
        // Safety check for NaN values
        if (!isFinite(this.x) || !isFinite(this.y) || 
            !isFinite(camera.x) || !isFinite(camera.y)) {
            return;
        }
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y + Math.sin(this.bobPhase) * 3;
        
        // Safety check for computed screen coordinates
        if (!isFinite(screenX) || !isFinite(screenY)) {
            return;
        }
        
        // Skip if off screen
        if (screenX < -50 || screenX > ctx.canvas.width + 50 ||
            screenY < -50 || screenY > ctx.canvas.height + 50) {
            return;
        }
        
        ctx.save();
        
        // Animation time
        const t = this.bobPhase;
        const pulse = Math.sin(t * 2) * 0.2 + 1;
        const fastPulse = Math.sin(t * 4) * 0.3 + 1;
        
        switch (this.type) {
            case 'xp':
                this.drawXPPickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'health':
                this.drawHealthPickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'currency':
                this.drawCurrencyPickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'magnet':
                this.drawMagnetPickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'bomb':
                this.drawBombPickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'nuke':
                this.drawNukePickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'abilityCharge':
                this.drawAbilityChargePickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'powerCore':
                this.drawPowerCorePickup(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'abilityFragment':
                this.drawAbilityFragmentPickup(ctx, screenX, screenY, t, pulse);
                break;
                
            // === POWER-UP PICKUPS ===
            case 'powerup_overdrive':
                this.drawPowerupPickup(ctx, screenX, screenY, POWERUPS.overdrive, '⚡');
                break;
                
            case 'powerup_shield':
                this.drawPowerupPickup(ctx, screenX, screenY, POWERUPS.shield, '🛡️');
                break;
                
            case 'powerup_chronoBurst':
                this.drawPowerupPickup(ctx, screenX, screenY, POWERUPS.chronoBurst, '⏱️');
                break;
                
            case 'powerup_phaseShift':
                this.drawPowerupPickup(ctx, screenX, screenY, POWERUPS.phaseShift, '💨');
                break;
                
            case 'powerup_ultimate':
                this.drawUltimatePickup(ctx, screenX, screenY);
                break;
            
            case 'ultimateFragment':
                this.drawUltimateFragment(ctx, screenX, screenY, t, pulse);
                break;
                
            case 'powerup':
                // Generic powerup rendering - uses extraData to get powerup info
                if (this.extraData && this.extraData.powerupType && POWERUPS[this.extraData.powerupType]) {
                    const pData = POWERUPS[this.extraData.powerupType];
                    this.drawPowerupPickup(ctx, screenX, screenY, pData, pData.icon);
                }
                break;
                
            case 'upgrade':
                this.drawUpgradePickup(ctx, screenX, screenY);
                break;
        }
        
        // Flashing when about to despawn (more urgent for upgrade pickups)
        const flashThreshold = this.type === 'upgrade' ? 8 : 5;
        if (this.lifetime < flashThreshold) {
            const flashSpeed = this.type === 'upgrade' ? 6 : 4;
            if (Math.floor(this.lifetime * flashSpeed) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }
        }
        
        ctx.restore();
    }
    
    drawPowerupPickup(ctx, x, y, data, icon) {
        const pulse = Math.sin(this.bobPhase * 2) * 0.2 + 1;
        const r = this.radius * 1.5 * pulse;
        
        // Outer glow ring
        ctx.strokeStyle = data.glowColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(this.bobPhase * 3) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 1.3);
        glow.addColorStop(0, data.glowColor);
        glow.addColorStop(0.5, data.color + '88');
        glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = data.color;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${r}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y);
        
        // Key hint
        ctx.fillStyle = data.glowColor;
        ctx.font = `bold ${r * 0.5}px 'Share Tech Mono', monospace`;
        ctx.fillText(data.key, x, y + r * 1.2);
    }
    
    drawUltimateFragment(ctx, x, y, t, pulse) {
        // Get ultimate data from game for theming
        const game = window.gameInstance || window.game;
        const ultData = game?.ultimateData || { color: '#ffaa00', glowColor: '#ffdd66', icon: '⭐' };
        
        // Scale based on value (bigger fragments = more charge)
        const valueScale = Math.min(1.5, 0.8 + (this.value || 1) * 0.1);
        // Safety: ensure r is valid and at least 1 to prevent gradient crashes
        const rawR = (this.radius || 10) * 0.8 * (pulse || 1) * valueScale;
        const r = (!isFinite(rawR) || rawR < 1) ? 8 : rawR;
        
        // Rotating sparkle effect
        const rotAngle = t * 2;
        
        // Outer glow (color matches selected ultimate)
        // Safety: outer radius must be > 0 to avoid canvas crash
        const glowRadius = Math.max(1, r * 2);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        glow.addColorStop(0, ultData.glowColor || ultData.color);
        glow.addColorStop(0.4, ultData.color + '88');
        glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner crystal/shard shape (rotating diamond)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotAngle);
        ctx.globalAlpha = 0.9;
        
        // Diamond shape
        ctx.fillStyle = ultData.color;
        ctx.beginPath();
        ctx.moveTo(0, -r);           // Top
        ctx.lineTo(r * 0.6, 0);      // Right
        ctx.lineTo(0, r);            // Bottom
        ctx.lineTo(-r * 0.6, 0);     // Left
        ctx.closePath();
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.6);
        ctx.lineTo(r * 0.3, 0);
        ctx.lineTo(0, r * 0.3);
        ctx.lineTo(-r * 0.3, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Sparkle particles around it
        ctx.globalAlpha = 0.8;
        const sparkleCount = 3 + Math.floor((this.value || 1) / 2);
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + t;
            const dist = r * 1.5 + Math.sin(t * 3 + i) * 5;
            const sx = x + Math.cos(angle) * dist;
            const sy = y + Math.sin(angle) * dist;
            const sparkleSize = 2 + Math.sin(t * 4 + i) * 1;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawUltimatePickup(ctx, x, y) {
        // Get ultimate data from game
        const game = window.gameInstance || window.game;
        const ultData = game?.ultimateData || ULTIMATES?.droplet || { color: '#ffaa00', icon: '⭐', name: 'ULTIMATE' };
        
        const pulse = Math.sin(this.bobPhase * 2) * 0.15 + 1;
        const r = this.radius * 1.8 * pulse;
        
        // Rotating effect
        const rotAngle = this.bobPhase * 0.5;
        
        // Outer colored glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
        glow.addColorStop(0, ultData.glowColor || ultData.color);
        glow.addColorStop(0.5, ultData.color);
        glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner orb
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotAngle);
        
        ctx.globalAlpha = 1;
        
        // Gradient based on ultimate color
        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, ultData.glowColor || ultData.color);
        grad.addColorStop(0.6, ultData.color);
        grad.addColorStop(1, '#ffffff');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `${r * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ultData.icon, x, y);
        
        // Key hint
        ctx.font = `bold ${r * 0.35}px 'Share Tech Mono', monospace`;
        ctx.fillText('R', x, y + r * 1.5);
    }
    
    drawUpgradePickup(ctx, x, y) {
        const pulse = Math.sin(this.bobPhase * 3) * 0.3 + 1;
        const r = this.radius * pulse;
        
        // Determine color based on upgrade type
        let color = '#ffd700'; // Gold default
        let icon = '⬆';
        let name = 'UPGRADE';
        
        if (this.extraData) {
            if (this.extraData.isPassive) {
                const data = PASSIVE_ITEMS[this.extraData.id];
                color = '#aa66ff'; // Purple for passives
                icon = data?.icon || '📦';
                name = data?.name || this.extraData.id;
            } else {
                const data = WEAPONS[this.extraData.id];
                color = data?.color || '#ffd700';
                icon = data?.icon || '🔫';
                name = data?.name || this.extraData.id;
            }
        }
        
        // Countdown ring showing time left
        const timePercent = this.lifetime / 15; // 15 second max
        ctx.strokeStyle = timePercent > 0.3 ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.8, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * timePercent));
        ctx.stroke();
        
        // Background ring
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Outer glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
        glow.addColorStop(0, color);
        glow.addColorStop(0.4, color + '88');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner hexagon
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `${r * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y);
        
        // Name label below
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(8, r * 0.5)}px 'Share Tech Mono', monospace`;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(name.toUpperCase(), x, y + r * 2.5);
        ctx.shadowBlur = 0;
        
        // "PICK UP!" text if running low on time
        if (this.lifetime < 8) {
            ctx.fillStyle = this.lifetime < 4 ? '#ff0000' : '#ffff00';
            ctx.font = `bold ${r * 0.6}px 'Share Tech Mono', monospace`;
            ctx.fillText('PICK UP!', x, y - r * 2.2);
        }
    }
    
    // ============================================
    // JAZZED UP PICKUP DRAW METHODS
    // ============================================
    
    drawXPPickup(ctx, x, y, t, pulse) {
        const r = this.radius;
        const valueMult = Math.min(2, 1 + this.value / 50); // Bigger for larger XP values
        
        // Outer rotating energy ring
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 2);
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + Math.sin(t * 3) * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.8 * valueMult, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
        
        // Particle trail effect (orbiting dots)
        for (let i = 0; i < 3; i++) {
            const angle = t * 3 + (i * Math.PI * 2 / 3);
            const orbitR = r * 1.3 * valueMult;
            const px = x + Math.cos(angle) * orbitR;
            const py = y + Math.sin(angle) * orbitR;
            ctx.fillStyle = `rgba(0, 255, 200, ${0.6 - i * 0.15})`;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5 * valueMult);
        glow.addColorStop(0, 'rgba(0, 255, 220, 0.8)');
        glow.addColorStop(0.4, 'rgba(0, 200, 180, 0.4)');
        glow.addColorStop(1, 'rgba(0, 255, 200, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.5 * valueMult, 0, Math.PI * 2);
        ctx.fill();
        
        // Crystal gem shape
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t) * 0.1);
        
        // Outer crystal
        const gradient = ctx.createLinearGradient(0, -r * valueMult, 0, r * valueMult);
        gradient.addColorStop(0, '#88ffee');
        gradient.addColorStop(0.5, '#00ffcc');
        gradient.addColorStop(1, '#00aa88');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -r * valueMult * pulse);
        ctx.lineTo(r * 0.7 * valueMult, 0);
        ctx.lineTo(0, r * valueMult * pulse);
        ctx.lineTo(-r * 0.7 * valueMult, 0);
        ctx.closePath();
        ctx.fill();
        
        // Inner shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.4 * valueMult);
        ctx.lineTo(r * 0.2 * valueMult, 0);
        ctx.lineTo(0, r * 0.2 * valueMult);
        ctx.lineTo(-r * 0.15 * valueMult, -r * 0.1 * valueMult);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Value indicator for big XP
        if (this.value >= 20) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(8, r * 0.6)}px 'Share Tech Mono'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.8;
            ctx.fillText(`+${this.value}`, x, y + r * 2);
        }
    }
    
    drawHealthPickup(ctx, x, y, t, pulse) {
        const r = this.radius;
        
        // Heartbeat effect
        const heartbeat = Math.sin(t * 8) > 0.7 ? 1.2 : 1;
        
        // EKG line ring around pickup
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2 + t;
            const waveOffset = Math.sin(i * 0.8 + t * 10) * 3;
            const px = x + Math.cos(angle) * (r * 2 + waveOffset);
            const py = y + Math.sin(angle) * (r * 2 + waveOffset);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Pulsing red glow
        const healthGlow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5 * heartbeat);
        healthGlow.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
        healthGlow.addColorStop(0.5, 'rgba(255, 50, 50, 0.3)');
        healthGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = healthGlow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5 * heartbeat, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw a heart shape instead of cross
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(heartbeat * pulse, heartbeat * pulse);
        
        const gradient = ctx.createLinearGradient(0, -r, 0, r);
        gradient.addColorStop(0, '#ff6666');
        gradient.addColorStop(0.5, '#ff2222');
        gradient.addColorStop(1, '#cc0000');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(0, r * 0.8);
        ctx.bezierCurveTo(-r * 1.2, r * 0.2, -r * 1.2, -r * 0.6, 0, -r * 0.2);
        ctx.bezierCurveTo(r * 1.2, -r * 0.6, r * 1.2, r * 0.2, 0, r * 0.8);
        ctx.fill();
        
        // Heart shine
        ctx.fillStyle = 'rgba(255, 200, 200, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.1, r * 0.2, r * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // + symbol floating above
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${r}px Arial`;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3;
        ctx.fillText('+', x, y - r * 2.2);
    }
    
    drawCurrencyPickup(ctx, x, y, t, pulse) {
        const r = this.radius;
        const coinRotation = Math.sin(t * 2) * 0.4; // Wobble
        
        // Sparkle particles
        for (let i = 0; i < 4; i++) {
            const sparkleT = (t + i * 1.5) % 3;
            if (sparkleT < 1.5) {
                const angle = (i / 4) * Math.PI * 2;
                const dist = r * 1.5 + sparkleT * 15;
                const sparkleAlpha = 1 - sparkleT / 1.5;
                ctx.fillStyle = `rgba(255, 220, 100, ${sparkleAlpha})`;
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Golden glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
        glow.addColorStop(0.5, 'rgba(255, 180, 0, 0.3)');
        glow.addColorStop(1, 'rgba(255, 150, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 3D rotating coin effect
        ctx.save();
        ctx.translate(x, y);
        
        // Coin shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 3, r * 0.9 * Math.abs(Math.cos(coinRotation)), r * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin face gradient (simulating 3D)
        const coinGrad = ctx.createLinearGradient(-r, -r, r, r);
        coinGrad.addColorStop(0, '#fff8dc');
        coinGrad.addColorStop(0.3, '#ffd700');
        coinGrad.addColorStop(0.6, '#ffb800');
        coinGrad.addColorStop(1, '#cc9900');
        
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * Math.abs(Math.cos(coinRotation)), r, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin edge (visible when rotated)
        if (Math.abs(Math.cos(coinRotation)) < 0.9) {
            ctx.fillStyle = '#b8860b';
            const edgeWidth = r * (1 - Math.abs(Math.cos(coinRotation))) * 0.3;
            ctx.fillRect(-edgeWidth, -r, edgeWidth * 2, r * 2);
        }
        
        // Dollar/star symbol
        if (Math.cos(coinRotation) > 0.3) {
            ctx.fillStyle = '#8b7500';
            ctx.font = `bold ${r * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = Math.cos(coinRotation);
            ctx.fillText('★', 0, 0);
        }
        
        ctx.restore();
        
        // Value text
        if (this.value > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = `bold ${r * 0.7}px 'Share Tech Mono'`;
            ctx.textAlign = 'center';
            ctx.globalAlpha = 0.9;
            ctx.fillText(`+${this.value}`, x, y + r * 2);
        }
    }
    
    drawMagnetPickup(ctx, x, y, t, pulse) {
        const r = this.radius;
        
        // Magnetic field lines (animated)
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
            const phase = t * 3 + i * Math.PI / 3;
            const fieldR = r * 1.5 + Math.sin(phase) * r * 0.8;
            ctx.globalAlpha = 0.3 + Math.sin(phase) * 0.2;
            ctx.beginPath();
            ctx.arc(x, y, fieldR, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Pulling particles toward center
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particlePhase = (t * 2 + i * 0.5) % 2;
            const dist = r * 3 * (1 - particlePhase / 2);
            const alpha = particlePhase < 1 ? particlePhase : 2 - particlePhase;
            ctx.fillStyle = `rgba(255, 100, 255, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 2 + alpha * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Central glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
        glow.addColorStop(0, 'rgba(255, 100, 255, 0.8)');
        glow.addColorStop(0.5, 'rgba(200, 0, 200, 0.4)');
        glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Horseshoe magnet shape
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t) * 0.1);
        
        // Magnet body
        const magGrad = ctx.createLinearGradient(-r, 0, r, 0);
        magGrad.addColorStop(0, '#ff0000');
        magGrad.addColorStop(0.4, '#ff4444');
        magGrad.addColorStop(0.6, '#4444ff');
        magGrad.addColorStop(1, '#0000ff');
        ctx.fillStyle = magGrad;
        
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, Math.PI, 0, false);
        ctx.lineTo(r * 0.9, r * 0.5);
        ctx.lineTo(r * 0.5, r * 0.5);
        ctx.lineTo(r * 0.5, 0);
        ctx.arc(0, 0, r * 0.5, 0, Math.PI, true);
        ctx.lineTo(-r * 0.5, r * 0.5);
        ctx.lineTo(-r * 0.9, r * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // Pole tips
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-r * 0.9, r * 0.3, r * 0.4, r * 0.4);
        ctx.fillRect(r * 0.5, r * 0.3, r * 0.4, r * 0.4);
        
        ctx.restore();
        
        // "MAGNET" label
        ctx.fillStyle = '#ff88ff';
        ctx.font = `bold ${r * 0.5}px 'Share Tech Mono'`;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;
        ctx.fillText('MAGNET', x, y + r * 2.2);
    }
    
    drawBombPickup(ctx, x, y, t, pulse) {
        const r = this.radius;
        
        // Warning rings expanding
        for (let i = 0; i < 3; i++) {
            const ringPhase = (t * 2 + i * 0.8) % 2.4;
            const ringR = r + ringPhase * 15;
            const alpha = 1 - ringPhase / 2.4;
            ctx.strokeStyle = `rgba(255, 150, 0, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, ringR, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Fiery glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
        glow.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        glow.addColorStop(0.4, 'rgba(255, 100, 0, 0.5)');
        glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bomb body
        ctx.save();
        ctx.translate(x, y);
        
        const bombGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        bombGrad.addColorStop(0, '#555555');
        bombGrad.addColorStop(0.5, '#333333');
        bombGrad.addColorStop(1, '#111111');
        ctx.fillStyle = bombGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuse holder
        ctx.fillStyle = '#666666';
        ctx.fillRect(-r * 0.15, -r * 1.1, r * 0.3, r * 0.3);
        
        // Fuse (animated spark)
        ctx.strokeStyle = '#aa8866';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.1);
        ctx.quadraticCurveTo(r * 0.3, -r * 1.4, 0, -r * 1.6);
        ctx.stroke();
        
        // Spark at fuse tip
        const sparkSize = 3 + Math.sin(t * 15) * 2;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, -r * 1.6, sparkSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(0, -r * 1.6, sparkSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Skull icon
        ctx.fillStyle = '#888888';
        ctx.font = `${r}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💀', 0, r * 0.1);
        
        ctx.restore();
    }
    
    drawNukePickup(ctx, x, y, t, pulse) {
        const r = this.radius * 1.5;
        
        // Radiation warning rings
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 0.5);
        
        for (let i = 0; i < 3; i++) {
            const ringPhase = (t + i * 1.2) % 3.6;
            const alpha = 1 - ringPhase / 3.6;
            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha * 0.4})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, r + ringPhase * 25, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
        
        // Toxic green glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        glow.addColorStop(0, 'rgba(150, 255, 0, 0.9)');
        glow.addColorStop(0.3, 'rgba(100, 200, 0, 0.5)');
        glow.addColorStop(0.7, 'rgba(50, 150, 0, 0.2)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Radiation symbol background
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        
        // Yellow warning triangle
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        // Radiation trefoil
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 0.3);
        ctx.fillStyle = '#000000';
        
        // Center circle
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Three blades
        for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.25);
            ctx.arc(0, 0, r * 0.7, -Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4, false);
            ctx.arc(0, 0, r * 0.25, -Math.PI / 2 + 0.6, -Math.PI / 2 - 0.6, true);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
        
        // "NUKE" text
        ctx.fillStyle = '#ff0000';
        ctx.font = `bold ${r * 0.5}px 'Share Tech Mono'`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText('☢ NUKE', x, y + r * 1.8);
        ctx.shadowBlur = 0;
    }
    
    drawAbilityChargePickup(ctx, x, y, t, pulse) {
        const r = this.radius;
        
        // Electric arcs
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 4; i++) {
            const angle = t * 4 + i * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            const arcLen = r * 2;
            let cx = x, cy = y;
            for (let j = 0; j < 5; j++) {
                const nextX = cx + Math.cos(angle) * (arcLen / 5) + (Math.random() - 0.5) * 8;
                const nextY = cy + Math.sin(angle) * (arcLen / 5) + (Math.random() - 0.5) * 8;
                ctx.lineTo(nextX, nextY);
                cx = nextX;
                cy = nextY;
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Pulsing energy core
        const coreGlow = ctx.createRadialGradient(x, y, 0, x, y, r * 2 * pulse);
        coreGlow.addColorStop(0, 'rgba(150, 255, 255, 0.9)');
        coreGlow.addColorStop(0.3, 'rgba(0, 255, 255, 0.6)');
        coreGlow.addColorStop(0.7, 'rgba(0, 200, 255, 0.2)');
        coreGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Battery shape
        ctx.save();
        ctx.translate(x, y);
        
        const battGrad = ctx.createLinearGradient(0, -r, 0, r);
        battGrad.addColorStop(0, '#00ffff');
        battGrad.addColorStop(0.5, '#0088aa');
        battGrad.addColorStop(1, '#004466');
        ctx.fillStyle = battGrad;
        
        // Battery body
        ctx.fillRect(-r * 0.6, -r * 0.8, r * 1.2, r * 1.6);
        
        // Battery top
        ctx.fillStyle = '#00aaaa';
        ctx.fillRect(-r * 0.3, -r, r * 0.6, r * 0.25);
        
        // Charge level (animated)
        const chargeLevel = (Math.sin(t * 3) + 1) / 2;
        ctx.fillStyle = `rgba(150, 255, 255, ${0.5 + chargeLevel * 0.5})`;
        ctx.fillRect(-r * 0.45, -r * 0.6 + (1 - chargeLevel) * r * 1.2, r * 0.9, chargeLevel * r * 1.2);
        
        // Lightning bolt
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${r * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
        
        ctx.restore();
        
        // Label
        ctx.fillStyle = '#00ffff';
        ctx.font = `bold ${r * 0.5}px 'Share Tech Mono'`;
        ctx.textAlign = 'center';
        ctx.fillText('CHARGE', x, y + r * 1.8);
    }
    
    drawPowerCorePickup(ctx, x, y, t, pulse) {
        const r = this.radius * 1.2;
        
        // Orbiting energy particles
        for (let i = 0; i < 6; i++) {
            const angle = t * 2 + i * Math.PI / 3;
            const orbitR = r * 2;
            const px = x + Math.cos(angle) * orbitR * Math.sin(t + i);
            const py = y + Math.sin(angle) * orbitR * Math.cos(t + i);
            
            ctx.fillStyle = `rgba(255, 100, 255, ${0.7 - i * 0.1})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Outer energy field
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t);
        
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            const len = r * 1.8;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
        }
        ctx.stroke();
        ctx.restore();
        
        // Powerful glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        glow.addColorStop(0, 'rgba(255, 150, 255, 0.9)');
        glow.addColorStop(0.2, 'rgba(255, 0, 255, 0.7)');
        glow.addColorStop(0.5, 'rgba(150, 0, 200, 0.3)');
        glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating octagonal core
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 1.5);
        
        const coreGrad = ctx.createLinearGradient(-r, -r, r, r);
        coreGrad.addColorStop(0, '#ff88ff');
        coreGrad.addColorStop(0.5, '#ff00ff');
        coreGrad.addColorStop(1, '#880088');
        ctx.fillStyle = coreGrad;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            const px = Math.cos(angle) * r * pulse;
            const py = Math.sin(angle) * r * pulse;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // +25% text
        ctx.fillStyle = '#ff88ff';
        ctx.font = `bold ${r * 0.5}px 'Share Tech Mono'`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 5;
        ctx.fillText('+25% PWR', x, y + r * 2.2);
        ctx.shadowBlur = 0;
    }
    
    drawAbilityFragmentPickup(ctx, x, y, t, pulse) {
        const r = this.radius * 1.3;
        
        // Golden sparkles
        for (let i = 0; i < 12; i++) {
            const sparkT = (t * 1.5 + i * 0.3) % 2;
            const angle = (i / 12) * Math.PI * 2;
            const dist = r + sparkT * 30;
            const size = 2 * (1 - sparkT / 2);
            const alpha = 1 - sparkT / 2;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Starburst rays
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 0.5);
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * r * 0.8, Math.sin(angle) * r * 0.8);
            ctx.lineTo(Math.cos(angle) * r * 2.5, Math.sin(angle) * r * 2.5);
            ctx.stroke();
        }
        ctx.restore();
        
        // Golden glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        glow.addColorStop(0, 'rgba(255, 230, 150, 1)');
        glow.addColorStop(0.3, 'rgba(255, 200, 0, 0.7)');
        glow.addColorStop(0.6, 'rgba(255, 150, 0, 0.3)');
        glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Star shape
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t);
        
        const starGrad = ctx.createLinearGradient(-r, -r, r, r);
        starGrad.addColorStop(0, '#fffacd');
        starGrad.addColorStop(0.5, '#ffd700');
        starGrad.addColorStop(1, '#daa520');
        ctx.fillStyle = starGrad;
        
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = i * Math.PI / 5 - Math.PI / 2;
            const starR = i % 2 === 0 ? r * pulse : r * 0.5;
            const px = Math.cos(angle) * starR;
            const py = Math.sin(angle) * starR;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // "UPGRADE" label
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${r * 0.45}px 'Share Tech Mono'`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText('★ FRAGMENT', x, y + r * 2.3);
        ctx.shadowBlur = 0;
    }
}

class PickupPool {
    constructor(maxPickups = 500) {
        this.pool = [];
        this.active = [];
        
        for (let i = 0; i < maxPickups; i++) {
            this.pool.push(new Pickup());
        }
    }
    
    spawn(type, x, y, value, extraData = null) {
        let pickup = this.pool.pop();
        
        if (!pickup) {
            pickup = new Pickup();
        }
        
        pickup.init(type, x, y, value, extraData);
        this.active.push(pickup);
        return pickup;
    }
    
    update(dt, player, game) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.update(dt, player, game);
            
            if (!p.active) {
                this.active.splice(i, 1);
                p.reset();
                this.pool.push(p);
            }
        }
    }
    
    getActive() {
        return this.active;
    }
    
    draw(ctx, camera) {
        for (const p of this.active) {
            p.draw(ctx, camera);
        }
    }
    
    clear() {
        while (this.active.length > 0) {
            const p = this.active.pop();
            p.reset();
            this.pool.push(p);
        }
    }
}
