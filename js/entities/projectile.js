// =====================================================
// PROJECTILE ENTITY
// =====================================================

class Projectile {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.damage = 0;
        this.radius = 5;
        this.color = '#ffffff';
        this.friendly = true;
        this.active = false;
        this.pierce = 0;
        this.pierced = new Set();
        this.lifetime = 5;
    }
    
    init(config) {
        this.x = config.x;
        this.y = config.y;
        this.vx = Math.cos(config.angle) * config.speed;
        this.vy = Math.sin(config.angle) * config.speed;
        this.damage = config.damage;
        this.radius = config.radius || 5;
        this.color = config.color || '#ffffff';
        this.friendly = config.friendly !== false;
        this.active = true;
        this.pierce = config.pierce || 0;
        this.pierced.clear();
        this.lifetime = config.lifetime || 5;
    }
    
    update(dt, game) {
        if (!this.active) return;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
        
        // Check bounds
        if (this.x < 0 || this.x > GAME_CONFIG.WORLD_WIDTH ||
            this.y < 0 || this.y > GAME_CONFIG.WORLD_HEIGHT ||
            this.lifetime <= 0) {
            this.active = false;
            return;
        }
        
        // Check collisions
        if (this.friendly) {
            // Check radar site collisions (objectives)
            if (game.radarSiteManager && game.radarSiteManager.checkProjectileHit(this)) {
                if (this.pierce <= 0) {
                    this.active = false;
                    game.particles.sparks(this.x, this.y, this.color);
                    return;
                }
                this.pierce--;
            }
            
            // Check enemy collisions - only check enemies within range
            const checkRadius = this.radius + 60; // Max enemy radius ~50
            for (const enemy of game.enemies) {
                if (!enemy.active || this.pierced.has(enemy)) continue;
                
                // Quick bounding box check first (faster than distance calc)
                const dx = Math.abs(this.x - enemy.x);
                const dy = Math.abs(this.y - enemy.y);
                if (dx > checkRadius || dy > checkRadius) continue;
                
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.radius + enemy.radius) {
                    enemy.takeDamage(this.damage, { x: this.x, y: this.y });
                    this.pierced.add(enemy);
                    
                    if (this.pierce <= 0) {
                        this.active = false;
                        game.particles.sparks(this.x, this.y, this.color);
                        return;
                    }
                    this.pierce--;
                }
            }
        } else {
            // Check player collision
            const dist = Utils.distance(this.x, this.y, game.player.x, game.player.y);
            if (dist < this.radius + game.player.radius) {
                game.player.takeDamage(this.damage, 'enemyProjectile');
                this.active = false;
                return;
            }
        }
    }
    
    draw(ctx, camera) {
        if (!this.active) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Skip if off screen
        if (screenX < -20 || screenX > ctx.canvas.width + 20 ||
            screenY < -20 || screenY > ctx.canvas.height + 20) {
            return;
        }
        
        // Glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.friendly ? this.color : '#ff4444';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class ProjectilePool {
    constructor(maxProjectiles = GAME_CONFIG.MAX_PROJECTILES) {
        this.pool = [];
        this.active = [];
        
        for (let i = 0; i < maxProjectiles; i++) {
            this.pool.push(new Projectile());
        }
    }
    
    spawn(config) {
        let projectile = this.pool.pop();
        
        if (!projectile) {
            projectile = new Projectile();
        }
        
        projectile.init(config);
        this.active.push(projectile);
        return projectile;
    }
    
    update(dt, game) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.update(dt, game);
            
            if (!p.active) {
                this.active.splice(i, 1);
                p.reset();
                this.pool.push(p);
            }
        }
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
