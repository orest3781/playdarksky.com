// =====================================================
// MAIN ENTRY POINT
// =====================================================

// Register classes to namespace (reduces global pollution while maintaining compatibility)
window.UFO = window.UFO || {};
window.UFO.Classes = {
    Game, UI, SoundManager, ParticleSystem, WeaponEffects,
    Player, Enemy, Projectile, Pickup,
    AchievementTracker, SaveManager
};

// =====================================================
// ANIMATED STARFIELD BACKGROUND
// =====================================================
class Starfield {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.numStars = 200;
        this.running = true;
        
        this.resize();
        this.createStars();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createStars() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    spawnShootingStar() {
        if (Math.random() < 0.002) { // Rare shooting stars
            this.shootingStars.push({
                x: Math.random() * this.canvas.width,
                y: 0,
                length: Math.random() * 80 + 40,
                speed: Math.random() * 8 + 6,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
                alpha: 1
            });
        }
    }
    
    update() {
        // Update stars - slow drift downward
        for (const star of this.stars) {
            star.y += star.speed;
            star.twinklePhase += star.twinkleSpeed;
            
            // Wrap around
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        }
        
        // Update shooting stars
        this.spawnShootingStar();
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const ss = this.shootingStars[i];
            ss.x += Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.alpha -= 0.01;
            
            if (ss.alpha <= 0 || ss.y > this.canvas.height || ss.x > this.canvas.width) {
                this.shootingStars.splice(i, 1);
            }
        }
    }
    
    draw() {
        // Clear with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0a0a12');
        gradient.addColorStop(0.5, '#0d1520');
        gradient.addColorStop(1, '#0a1018');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars with twinkling
        for (const star of this.stars) {
            const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase);
            const alpha = star.brightness * twinkle * 0.8 + 0.2;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fill();
            
            // Subtle glow for brighter stars
            if (star.size > 1.5 && alpha > 0.6) {
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.2})`;
                this.ctx.fill();
            }
        }
        
        // Draw shooting stars
        for (const ss of this.shootingStars) {
            const tailX = ss.x - Math.cos(ss.angle) * ss.length;
            const tailY = ss.y - Math.sin(ss.angle) * ss.length;
            
            const gradient = this.ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.alpha})`);
            
            this.ctx.beginPath();
            this.ctx.moveTo(tailX, tailY);
            this.ctx.lineTo(ss.x, ss.y);
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Bright head
            this.ctx.beginPath();
            this.ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${ss.alpha})`;
            this.ctx.fill();
        }
    }
    
    animate() {
        if (!this.running) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        this.running = false;
    }
}

// Initialize starfield
let starfield = null;
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('starfield-canvas');
    if (canvas) {
        starfield = new Starfield(canvas);
        window.UFO.starfield = starfield;
    }
});

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    if (DEBUG_MODE) console.log('DOM loaded, starting initialization...');
    
    // Show loading screen briefly
    const loadingScreen = document.getElementById('loading-screen');
    const loadingProgress = document.getElementById('loading-progress');
    
    if (!loadingScreen) {
        console.error('Loading screen not found!');
    }
    
    loadingScreen.classList.add('active');
    
    // Simulate loading (in a real game, you'd load assets here)
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            // Initialize game
            setTimeout(() => {
                try {
                    if (DEBUG_MODE) console.log('Creating Game instance...');
                    window.game = new Game();
                    window.UFO.game = window.game; // Also register to namespace
                    if (DEBUG_MODE) console.log('Game initialized successfully:', window.game);
                    
                    // Apply saved volume settings
                    const savedSettings = window.game.saveData?.settings || {};
                    if (window.game.sound) {
                        window.game.sound.setMasterVolume(savedSettings.masterVolume ?? 1);
                        window.game.sound.setSFXVolume(savedSettings.sfxVolume ?? 0.7);
                        window.game.sound.setMusicVolume(savedSettings.musicVolume ?? 0.5);
                    }
                } catch (e) {
                    console.error('Game initialization failed:', e);
                    if (DEBUG_MODE) console.error('Stack:', e.stack);
                }
                loadingScreen.classList.remove('active');
                document.getElementById('main-menu').classList.add('active');
                if (DEBUG_MODE) console.log('Main menu should now be visible');
            }, 300);
        }
        loadingProgress.style.width = progress + '%';
    }, 100);
});

// Prevent context menu on right click
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'CANVAS') {
        e.preventDefault();
    }
});

// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.game && window.game.running && !window.game.paused) {
        window.game.togglePause();
    }
});

// Debug helpers (only available in DEBUG_MODE)
if (DEBUG_MODE) {
    window.DEBUG = {
        // Give currency
        addCurrency: (amount = 1000) => {
            window.game.saveData.currency += amount;
            SaveManager.save(window.game.saveData);
            window.game.ui.updateMenuStats();
            console.log(`Added ${amount} currency. Total: ${window.game.saveData.currency}`);
        },
        
        // Unlock all UAPs
        unlockAll: () => {
            window.game.saveData.unlockedUAPs = Object.keys(UAP_TYPES);
            SaveManager.save(window.game.saveData);
            console.log('All UAPs unlocked!');
        },
        
        // Max all upgrades
        maxUpgrades: () => {
            for (const branch of Object.values(UPGRADES)) {
                for (const upgrade of branch.upgrades) {
                    window.game.saveData.upgrades[upgrade.name] = upgrade.maxLevel;
                }
            }
            SaveManager.save(window.game.saveData);
            console.log('All upgrades maxed!');
        },
        
        // Skip to time
        skipTo: (minutes) => {
            if (window.game.running) {
                window.game.gameTime = minutes * 60;
                console.log(`Skipped to ${minutes}:00`);
            }
        },
        
        // Spawn enemy
        spawn: (type, count = 1) => {
            if (window.game.running) {
                for (let i = 0; i < count; i++) {
                    const angle = Utils.random(0, Math.PI * 2);
                    const dist = 300;
                    window.game.spawnEnemy(
                        type,
                        window.game.player.x + Math.cos(angle) * dist,
                        window.game.player.y + Math.sin(angle) * dist
                    );
                }
                console.log(`Spawned ${count} ${type}`);
            }
        },
        
        // God mode
        godMode: () => {
            if (window.game.player) {
                window.game.player.invulnerable = true;
                window.game.player.invulnerableTime = 999999;
                console.log('God mode enabled!');
            }
        },
        
        // Reset save
        resetSave: () => {
            SaveManager.reset();
            window.game.saveData = SaveManager.load();
            window.game.ui.updateMenuStats();
            console.log('Save data reset!');
        },
        
        // Level up
        levelUp: () => {
            if (window.game.player) {
                window.game.player.gainXP(window.game.player.xpToLevel);
            }
        },
        
        // Add all weapons
        allWeapons: () => {
            if (window.game.player) {
                for (const weaponId of Object.keys(WEAPONS)) {
                    window.game.player.addWeapon(weaponId);
                }
                console.log('All weapons added!');
            }
        },
        
        // Give a droplet (easter egg ultimate)
        droplet: () => {
            if (window.game) {
                window.game.powerups.inventory.droplet++;
                console.log('💧 Droplet added! Press R to transform.');
                window.game.ui.showWarning('💧 YOU FOUND A DROPLET - Press R', 'success');
            }
        }
    };
    
    console.log('Dark Sky - Debug Mode');
    console.log('Commands: DEBUG.addCurrency(), DEBUG.unlockAll(), DEBUG.maxUpgrades(), DEBUG.skipTo(mins), DEBUG.spawn(type, count), DEBUG.godMode(), DEBUG.resetSave(), DEBUG.levelUp(), DEBUG.allWeapons(), DEBUG.droplet()');
}
