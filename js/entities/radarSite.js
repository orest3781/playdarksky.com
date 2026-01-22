// =====================================================
// RADAR SHIP - Naval Vessel Objectives
// Enemy destroyers/frigates with radar and missiles
// =====================================================

class RadarShip {
    constructor(game, x, y, id) {
        this.game = game;
        this.id = id;
        this.x = x;
        this.y = y;
        
        // Ship properties
        this.health = RADAR_SITE_CONFIG.SHIP_HEALTH;
        this.maxHealth = RADAR_SITE_CONFIG.SHIP_HEALTH;
        this.radius = 50; // Large collision radius for the whole ship
        
        // Ship state
        this.active = true;
        this.destroyed = false;
        this.detectionRadius = RADAR_SITE_CONFIG.DETECTION_RADIUS;
        this.alertLevel = 0;
        this.hitFlash = 0;
        this.destroyedTime = 0;
        
        // Ship movement (slow patrol)
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 15; // Slow moving
        this.turnTimer = 0;
        this.turnInterval = 5 + Math.random() * 5;
        
        // Visual effects
        this.radarRotation = 0;
        this.pingTimer = 0;
        this.pingRadius = 0;
        this.wakeOffset = 0;
        
        // Missile system
        this.missileCooldown = 0;
        this.missiles = [];
    }
    
    update(dt, player) {
        if (this.destroyed) {
            this.destroyedTime += dt;
            // Update sinking animation
            return;
        }
        
        // Update hit flash
        if (this.hitFlash > 0) this.hitFlash -= dt * 3;
        
        // Ship movement - slow patrol
        this.turnTimer += dt;
        if (this.turnTimer >= this.turnInterval) {
            this.turnTimer = 0;
            this.turnInterval = 5 + Math.random() * 5;
            // Slight turn
            this.angle += (Math.random() - 0.5) * 0.5;
        }
        
        // Move ship
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        
        // Keep in world bounds with turning
        const margin = 300;
        if (this.x < margin) { this.angle = 0; this.x = margin; }
        if (this.x > GAME_CONFIG.WORLD_WIDTH - margin) { this.angle = Math.PI; this.x = GAME_CONFIG.WORLD_WIDTH - margin; }
        if (this.y < margin) { this.angle = Math.PI / 2; this.y = margin; }
        if (this.y > GAME_CONFIG.WORLD_HEIGHT - margin) { this.angle = -Math.PI / 2; this.y = GAME_CONFIG.WORLD_HEIGHT - margin; }
        
        // Calculate distance to player
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        const inRange = dist < this.detectionRadius;
        
        // Update alert level
        if (inRange) {
            this.alertLevel = Math.min(1, this.alertLevel + dt * 0.5);
        } else {
            this.alertLevel = Math.max(0, this.alertLevel - dt * 0.3);
        }
        
        // Radar rotation
        this.radarRotation += dt * 2;
        this.pingTimer += dt;
        if (this.pingTimer >= RADAR_SITE_CONFIG.PING_INTERVAL) {
            this.pingTimer = 0;
            this.pingRadius = 0;
        }
        this.pingRadius += dt * 300;
        
        // Wake animation
        this.wakeOffset += dt * 3;
        
        // Fire missiles at player
        this.missileCooldown -= dt;
        if (inRange && this.missileCooldown <= 0) {
            this.fireMissile(player);
            this.missileCooldown = RADAR_SITE_CONFIG.SAM_FIRE_RATE;
        }
        
        // Update missiles
        this.updateMissiles(dt, player);
    }
    
    fireMissile(player) {
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        
        this.missiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * RADAR_SITE_CONFIG.MISSILE_SPEED,
            vy: Math.sin(angle) * RADAR_SITE_CONFIG.MISSILE_SPEED,
            angle: angle,
            speed: RADAR_SITE_CONFIG.MISSILE_SPEED,
            damage: RADAR_SITE_CONFIG.MISSILE_DAMAGE,
            radius: 8,
            lifetime: 5,
            tracking: true,
            trail: []
        });
        
        // Play missile launch sound with spatial positioning
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        const maxDist = this.detectionRadius;
        const volume = Math.max(0.2, 1 - (dist / maxDist) * 0.7);
        const pan = Math.max(-1, Math.min(1, (this.x - player.x) / 400));
        this.game.playSound?.('missileAlert', { volume, pan });
        
        // Launch particles
        this.game.particles.emit({
            x: this.x,
            y: this.y,
            count: 5,
            speed: 100,
            size: 4,
            color: '#ff4400',
            lifetime: 0.3
        });
    }
    
    updateMissiles(dt, player) {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            
            missile.lifetime -= dt;
            if (missile.lifetime <= 0) {
                this.missiles.splice(i, 1);
                continue;
            }
            
            // Tracking
            if (missile.tracking) {
                const targetAngle = Utils.angle(missile.x, missile.y, player.x, player.y);
                const angleDiff = Utils.normalizeAngle(targetAngle - missile.angle);
                const turnRate = 3 * dt;
                missile.angle += Utils.clamp(angleDiff, -turnRate, turnRate);
                missile.vx = Math.cos(missile.angle) * missile.speed;
                missile.vy = Math.sin(missile.angle) * missile.speed;
            }
            
            missile.x += missile.vx * dt;
            missile.y += missile.vy * dt;
            
            // Trail
            missile.trail.push({ x: missile.x, y: missile.y, alpha: 1 });
            if (missile.trail.length > 15) missile.trail.shift();
            
            // Player collision
            const dist = Utils.distance(missile.x, missile.y, player.x, player.y);
            if (dist < missile.radius + player.radius) {
                if (!this.game.isPowerupActive('shield')) {
                    player.takeDamage(missile.damage, 'radarMissile');
                }
                this.game.particles.explosion(missile.x, missile.y, '#ff4400');
                this.game.screenShakeAmount = 8;
                this.missiles.splice(i, 1);
                continue;
            }
            
            // Out of bounds
            if (missile.x < -100 || missile.x > GAME_CONFIG.WORLD_WIDTH + 100 ||
                missile.y < -100 || missile.y > GAME_CONFIG.WORLD_HEIGHT + 100) {
                this.missiles.splice(i, 1);
            }
        }
    }
    
    takeDamage(amount) {
        if (this.destroyed) return;
        
        console.log(`Ship ${this.id} taking ${amount} damage! Health: ${this.health} -> ${this.health - amount}`);
        
        this.health -= amount;
        this.hitFlash = 1;
        
        // Show damage number
        if (this.game.damageNumbers) {
            this.game.damageNumbers.spawn(this.x, this.y - 40, amount, { color: '#ff6600' });
        }
        
        // Sparks and smoke
        this.game.particles.emit({
            x: this.x + (Math.random() - 0.5) * 40,
            y: this.y + (Math.random() - 0.5) * 20,
            count: 6,
            speed: 120,
            size: 4,
            color: Math.random() > 0.5 ? '#ff6600' : '#888888',
            lifetime: 0.4
        });
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        this.destroyed = true;
        this.active = false;
        this.missiles = [];
        
        console.log(`Ship ${this.id} DESTROYED!`);
        
        // Epic explosion sequence
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (!this.game.running) return;
                const ox = (Math.random() - 0.5) * 60;
                const oy = (Math.random() - 0.5) * 30;
                this.game.particles.explosion(this.x + ox, this.y + oy, '#ff4400');
                this.game.particles.explosion(this.x + ox, this.y + oy, '#ffaa00');
            }, i * 150);
        }
        
        this.game.screenFlash.add('#ff8800', 0.5, 0.3);
        this.game.screenShakeAmount = 30;
        
        // Notification
        this.game.showWarning('🚢 YOU DESTROYED THEIR VESSEL', 'boss');
        
        // Track destruction
        this.game.sitesDestroyed = (this.game.sitesDestroyed || 0) + 1;
        
        // Rewards - XP burst
        for (let i = 0; i < 30; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const dist = Utils.random(20, 100);
            this.game.spawnPickup('xp', 
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist,
                8
            );
        }
        
        // Health drop
        this.game.spawnPickup('health', this.x, this.y - 20, 240);
        
        // Guaranteed powerup
        const powerupTypes = ['overdrive', 'shield', 'chronoBurst'];
        const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        this.game.spawnPickup('powerup', this.x, this.y + 20, 1, { powerupType: randomPowerup });
        
        // Currency
        this.game.currency += RADAR_SITE_CONFIG.DESTRUCTION_REWARD;
    }
    
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Skip if off screen
        if (screenX < -200 || screenX > ctx.canvas.width + 200 ||
            screenY < -200 || screenY > ctx.canvas.height + 200) {
            return;
        }
        
        // Draw detection radius when active
        if (!this.destroyed) {
            const pulseAlpha = 0.08 + Math.sin(this.game.gameTime * 2) * 0.03 * this.alertLevel;
            ctx.beginPath();
            ctx.arc(screenX, screenY, Math.max(0, this.detectionRadius || 0), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 100, 0, ${pulseAlpha})`;
            ctx.fill();
            
            // Radar ping
            const pingRad = Math.max(0, this.pingRadius || 0);
            if (pingRad < this.detectionRadius && pingRad > 0) {
                ctx.beginPath();
                ctx.arc(screenX, screenY, pingRad, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 255, 100, ${0.4 - this.pingRadius / this.detectionRadius * 0.4})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);
        
        if (this.destroyed) {
            this.drawSinkingShip(ctx);
        } else {
            this.drawShip(ctx);
        }
        
        ctx.restore();
        
        // Draw missiles (not rotated with ship)
        this.drawMissiles(ctx, camera);
        
        // Health bar
        if (!this.destroyed) {
            this.drawHealthBar(ctx, screenX, screenY);
        }
        
        // Hit flash
        if (this.hitFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.hitFlash * 0.4})`;
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, 60, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawShip(ctx) {
        // Wake/trail behind ship
        ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.lineTo(-80, -15 + Math.sin(this.wakeOffset) * 3);
        ctx.lineTo(-100, 0);
        ctx.lineTo(-80, 15 + Math.sin(this.wakeOffset + 1) * 3);
        ctx.closePath();
        ctx.fill();
        
        // Ship hull (destroyer shape)
        ctx.fillStyle = '#556677';
        ctx.beginPath();
        ctx.moveTo(50, 0);      // Bow
        ctx.lineTo(30, -15);
        ctx.lineTo(-40, -18);
        ctx.lineTo(-50, -12);
        ctx.lineTo(-50, 12);
        ctx.lineTo(-40, 18);
        ctx.lineTo(30, 15);
        ctx.closePath();
        ctx.fill();
        
        // Hull outline
        ctx.strokeStyle = '#778899';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Deck
        ctx.fillStyle = '#445566';
        ctx.fillRect(-35, -10, 60, 20);
        
        // Superstructure (bridge)
        ctx.fillStyle = '#667788';
        ctx.fillRect(-10, -12, 25, 24);
        
        // Bridge windows
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(-5, -8, 15, 4);
        
        // Radar mast
        ctx.fillStyle = '#889999';
        ctx.fillRect(0, -20, 4, 8);
        
        // Rotating radar dish
        ctx.save();
        ctx.translate(2, -22);
        ctx.rotate(this.radarRotation);
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(-12, -2, 24, 4);
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // SAM launcher (rear)
        ctx.fillStyle = '#555566';
        ctx.fillRect(-35, -8, 15, 16);
        
        // Missile tubes
        ctx.fillStyle = '#333344';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(-30 + (i % 2) * 8, -4 + Math.floor(i / 2) * 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Front gun turret
        ctx.fillStyle = '#556666';
        ctx.beginPath();
        ctx.arc(25, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(25, -2, 15, 4);
        
        // Warning lights when alert
        if (this.alertLevel > 0.3) {
            const blink = Math.sin(this.game.gameTime * 8) > 0;
            if (blink) {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(2, -24, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Glow
                ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(2, -24, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawSinkingShip(ctx) {
        const sinkProgress = Math.min(1, this.destroyedTime / 5);
        
        ctx.globalAlpha = 1 - sinkProgress * 0.7;
        
        // Tilted, sinking hull
        ctx.rotate(sinkProgress * 0.3);
        ctx.translate(0, sinkProgress * 30);
        
        // Damaged hull
        ctx.fillStyle = '#334455';
        ctx.beginPath();
        ctx.moveTo(50 - sinkProgress * 20, 0);
        ctx.lineTo(30, -15);
        ctx.lineTo(-40, -18);
        ctx.lineTo(-50, -12);
        ctx.lineTo(-50, 12);
        ctx.lineTo(-40, 18);
        ctx.lineTo(30, 15);
        ctx.closePath();
        ctx.fill();
        
        // Fire and smoke
        if (sinkProgress < 0.8) {
            const fireAlpha = (1 - sinkProgress) * 0.8;
            ctx.fillStyle = `rgba(255, 150, 50, ${fireAlpha})`;
            ctx.beginPath();
            ctx.arc(-5 + Math.sin(this.destroyedTime * 10) * 5, -15, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = `rgba(100, 100, 100, ${fireAlpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(0, -30 - this.destroyedTime * 10, 15 + sinkProgress * 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawMissiles(ctx, camera) {
        for (const missile of this.missiles) {
            const mx = missile.x - camera.x;
            const my = missile.y - camera.y;
            
            // Trail
            if (missile.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(missile.trail[0].x - camera.x, missile.trail[0].y - camera.y);
                for (let i = 1; i < missile.trail.length; i++) {
                    ctx.lineTo(missile.trail[i].x - camera.x, missile.trail[i].y - camera.y);
                }
                ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Missile
            ctx.save();
            ctx.translate(mx, my);
            ctx.rotate(missile.angle);
            
            ctx.fillStyle = '#888';
            ctx.fillRect(-10, -2, 16, 4);
            
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.moveTo(6, -2);
            ctx.lineTo(10, 0);
            ctx.lineTo(6, 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.arc(-10, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    drawHealthBar(ctx, x, y) {
        const barWidth = 60;
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - barWidth / 2, y - 50, barWidth, barHeight);
        
        // Health fill
        const healthColor = healthPercent > 0.5 ? '#00ff00' : 
                           healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(x - barWidth / 2, y - 50, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = healthColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth / 2, y - 50, barWidth, barHeight);
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DESTROYER', x, y - 55);
    }
    
    drawMinimap(ctx, scale) {
        const mx = this.x * scale;
        const my = this.y * scale;
        
        if (this.destroyed) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        
        // Detection radius
        const detectionRadiusScaled = Math.max(0, (this.detectionRadius || 0) * Math.abs(scale || 1));
        ctx.fillStyle = `rgba(255, 100, 0, ${0.1 + this.alertLevel * 0.1})`;
        ctx.beginPath();
        ctx.arc(mx, my, detectionRadiusScaled, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 + this.alertLevel * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Ship icon (triangle pointing in movement direction)
        const pulse = Math.sin(this.game.gameTime * 4) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 150, 0, ${pulse})`;
        
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Glow
        ctx.fillStyle = 'rgba(255, 150, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// =====================================================
// RADAR SHIP MANAGER
// =====================================================

class RadarSiteManager {
    constructor(game) {
        this.game = game;
        this.sites = [];
        this.initialized = false;
        this.lastPhase = -1;  // Track phase for additional spawns
        this.totalSpawned = 0;
    }
    
    init() {
        if (this.initialized) return;
        this.initialized = true;
        this.lastPhase = 0;
        
        // Spawn initial ships for phase 1
        this.spawnShipsForPhase(0);
    }
    
    // Spawn additional ships when entering a new phase
    spawnShipsForPhase(phase) {
        const shipsPerPhase = RADAR_SITE_CONFIG.SHIPS_PER_PHASE || [4, 2, 3, 3, 4];
        const shipCount = shipsPerPhase[Math.min(phase, shipsPerPhase.length - 1)];
        
        const worldWidth = GAME_CONFIG.WORLD_WIDTH;
        const worldHeight = GAME_CONFIG.WORLD_HEIGHT;
        const margin = 500;
        const minDistance = RADAR_SITE_CONFIG.MIN_SITE_DISTANCE;
        
        const positions = [];
        let attempts = 0;
        
        while (positions.length < shipCount && attempts < 150) {
            attempts++;
            
            const x = Utils.random(margin, worldWidth - margin);
            const y = Utils.random(margin, worldHeight - margin);
            
            // Not too close to player
            const distFromPlayer = Utils.distance(x, y, this.game.player.x, this.game.player.y);
            if (distFromPlayer < 600) continue;
            
            // Not too close to existing ships
            let valid = true;
            for (const site of this.sites) {
                if (Utils.distance(x, y, site.x, site.y) < minDistance) {
                    valid = false;
                    break;
                }
            }
            // Not too close to new positions being placed
            for (const pos of positions) {
                if (Utils.distance(x, y, pos.x, pos.y) < minDistance) {
                    valid = false;
                    break;
                }
            }
            
            if (valid) positions.push({ x, y });
        }
        
        for (let i = 0; i < positions.length; i++) {
            this.sites.push(new RadarShip(this.game, positions[i].x, positions[i].y, this.totalSpawned + i));
        }
        
        this.totalSpawned += positions.length;
        
        if (phase === 0) {
            console.log(`Spawned ${positions.length} enemy destroyers`);
        } else {
            console.log(`Phase ${phase + 1}: Deployed ${positions.length} additional destroyers (${this.getActiveSiteCount()} active)`);
        }
    }
    
    update(dt) {
        // Check for phase transition and spawn additional ships
        if (this.game.spawner) {
            const currentPhase = this.game.spawner.getCurrentPhase();
            if (currentPhase > this.lastPhase) {
                this.spawnShipsForPhase(currentPhase);
                this.lastPhase = currentPhase;
            }
        }
        
        for (const site of this.sites) {
            site.update(dt, this.game.player);
        }
    }
    
    draw(ctx, camera) {
        for (const site of this.sites) {
            site.draw(ctx, camera);
        }
    }
    
    drawMinimap(ctx, scale) {
        for (const site of this.sites) {
            site.drawMinimap(ctx, scale);
        }
    }
    
    getSpawnMultiplier() {
        let multiplier = 1.0;
        for (const site of this.sites) {
            if (site.destroyed) continue;
            const dist = Utils.distance(site.x, site.y, this.game.player.x, this.game.player.y);
            if (dist < site.detectionRadius) {
                multiplier = Math.max(multiplier, RADAR_SITE_CONFIG.DETECTION_SPAWN_MULTIPLIER);
            }
        }
        return multiplier;
    }
    
    // Called by projectiles and weapons to damage ships
    checkProjectileHit(projectile) {
        for (const site of this.sites) {
            if (site.destroyed) continue;
            
            const dist = Utils.distance(projectile.x, projectile.y, site.x, site.y);
            if (dist < site.radius + projectile.radius) {
                site.takeDamage(projectile.damage);
                return true;
            }
        }
        return false;
    }
    
    // Called by direct-damage weapons (gravity wave, beam, etc.)
    getNearestShip(x, y, range) {
        let nearest = null;
        let nearestDist = range;
        
        for (const site of this.sites) {
            if (site.destroyed) continue;
            const dist = Utils.distance(x, y, site.x, site.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = site;
            }
        }
        
        return nearest;
    }
    
    // Get all ships in range for multi-target weapons
    getShipsInRange(x, y, range) {
        const ships = [];
        for (const site of this.sites) {
            if (site.destroyed) continue;
            const dist = Utils.distance(x, y, site.x, site.y);
            if (dist < range) {
                ships.push({ ship: site, dist });
            }
        }
        return ships;
    }
    
    getActiveSiteCount() {
        return this.sites.filter(s => !s.destroyed).length;
    }
    
    clear() {
        this.sites = [];
        this.initialized = false;
        this.lastPhase = -1;
        this.totalSpawned = 0;
    }
}
