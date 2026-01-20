// =====================================================
// PARTICLE SYSTEM
// =====================================================

class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.color = '#ffffff';
        this.alpha = 1;
        this.decay = 0;
        this.gravity = 0;
        this.friction = 1;
        this.type = 'circle';
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        this.size -= this.decay * dt;
        return this.life > 0 && this.size > 0;
    }
    
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        switch (this.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);
                break;
            case 'line':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size / 2;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX - this.vx * 0.05, screenY - this.vy * 0.05);
                ctx.stroke();
                break;
        }
        
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor(maxParticles = GAME_CONFIG.MAX_PARTICLES) {
        this.pool = new ObjectPool(
            () => new Particle(),
            (p) => p.reset(),
            maxParticles
        );
    }
    
    emit(config) {
        const count = config.count || 1;
        for (let i = 0; i < count; i++) {
            if (this.pool.getActiveCount() >= GAME_CONFIG.MAX_PARTICLES) break;
            
            const p = this.pool.get();
            p.x = config.x + (config.spreadX ? Utils.random(-config.spreadX, config.spreadX) : 0);
            p.y = config.y + (config.spreadY ? Utils.random(-config.spreadY, config.spreadY) : 0);
            
            const angle = config.angle !== undefined 
                ? config.angle + (config.angleSpread ? Utils.random(-config.angleSpread, config.angleSpread) : 0)
                : Utils.random(0, Math.PI * 2);
            const speed = config.speed 
                ? Utils.random(config.speed * 0.5, config.speed * 1.5)
                : Utils.random(50, 150);
            
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = config.life || Utils.random(0.3, 0.8);
            p.maxLife = p.life;
            p.size = config.size || Utils.random(3, 8);
            p.color = config.color || '#ffffff';
            p.decay = config.decay || 0;
            p.gravity = config.gravity || 0;
            p.friction = config.friction || 0.98;
            p.type = config.type || 'circle';
        }
    }
    
    update(dt) {
        const toRelease = [];
        for (const p of this.pool.active) {
            if (!p.update(dt)) {
                toRelease.push(p);
            }
        }
        toRelease.forEach(p => this.pool.release(p));
    }
    
    draw(ctx, camera) {
        for (const p of this.pool.active) {
            p.draw(ctx, camera);
        }
    }
    
    clear() {
        this.pool.releaseAll();
    }
    
    // Preset effects
    explosion(x, y, color = '#ff6644', count = 20) {
        this.emit({
            x, y, count,
            color,
            speed: 200,
            life: 0.5,
            size: 6,
            decay: 8,
            friction: 0.95
        });
    }
    
    sparks(x, y, color = '#ffcc00', count = 10) {
        this.emit({
            x, y, count,
            color,
            speed: 300,
            life: 0.3,
            size: 2,
            type: 'line',
            friction: 0.9
        });
    }
    
    xpPickup(x, y) {
        this.emit({
            x, y,
            count: 5,
            color: '#00ffcc',
            speed: 100,
            life: 0.4,
            size: 4,
            decay: 5
        });
    }
    
    damage(x, y, color = '#ff0000') {
        this.emit({
            x, y,
            count: 8,
            color,
            speed: 150,
            life: 0.3,
            size: 4,
            decay: 10
        });
    }
    
    empWave(x, y, radius) {
        const count = Math.floor(radius / 5);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            this.emit({
                x: x + Math.cos(angle) * radius * 0.8,
                y: y + Math.sin(angle) * radius * 0.8,
                count: 1,
                color: '#00ffcc',
                speed: 50,
                angle: angle,
                life: 0.3,
                size: 5,
                decay: 10
            });
        }
    }
    
    trail(x, y, color = '#00ffcc') {
        this.emit({
            x, y,
            count: 1,
            color,
            speed: 20,
            life: 0.2,
            size: 4,
            decay: 15,
            friction: 0.9
        });
    }
    
    levelUp(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            this.emit({
                x, y,
                count: 1,
                color: Utils.randomFrom(['#00ffcc', '#ffcc00', '#ff44ff']),
                speed: 300,
                angle,
                angleSpread: 0.1,
                life: 0.8,
                size: 6,
                decay: 5
            });
        }
    }
    
    ring(x, y, radius, color = '#ff4400') {
        const count = Math.floor(radius / 10);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            this.emit({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                count: 1,
                color,
                speed: 30,
                angle: angle + Math.PI / 2,
                life: 0.4,
                size: 6,
                decay: 8,
                friction: 0.95
            });
        }
    }
    
    spawn(x, y, color, size = 4) {
        this.emit({
            x, y,
            count: 1,
            color,
            speed: Utils.random(50, 150),
            life: Utils.random(0.3, 0.6),
            size,
            decay: 8
        });
    }
}
