// =====================================================
// WEAPONS SYSTEM (Additional)
// =====================================================

// This file contains additional weapon-related functionality
// Most weapon logic is in player.js, but special effects go here

class WeaponEffects {
    constructor(game) {
        this.game = game;
        this.beams = [];
        this.zones = [];
        this.drones = [];
    }
    
    addBeam(x1, y1, x2, y2, color, duration = 0.1) {
        this.beams.push({
            x1, y1, x2, y2,
            color,
            duration,
            maxDuration: duration
        });
    }
    
    update(dt) {
        // Update beams
        for (let i = this.beams.length - 1; i >= 0; i--) {
            this.beams[i].duration -= dt;
            if (this.beams[i].duration <= 0) {
                this.beams.splice(i, 1);
            }
        }
        
        // Update drones
        for (let i = this.drones.length - 1; i >= 0; i--) {
            const drone = this.drones[i];
            drone.duration -= dt;
            
            if (drone.duration <= 0) {
                this.drones.splice(i, 1);
                continue;
            }
            
            // Find target
            let target = null;
            let targetDist = 200;
            
            for (const enemy of this.game.enemies) {
                if (!enemy.active) continue;
                const dist = Utils.distance(drone.x, drone.y, enemy.x, enemy.y);
                if (dist < targetDist) {
                    targetDist = dist;
                    target = enemy;
                }
            }
            
            if (target) {
                // Move toward target
                const angle = Utils.angle(drone.x, drone.y, target.x, target.y);
                drone.x += Math.cos(angle) * 300 * dt;
                drone.y += Math.sin(angle) * 300 * dt;
                
                // Attack if close
                if (targetDist < 20) {
                    target.takeDamage(drone.damage * dt * 10, { x: drone.x, y: drone.y });
                }
            } else {
                // Orbit player
                drone.orbitAngle += dt * 3;
                const targetX = this.game.player.x + Math.cos(drone.orbitAngle) * 50;
                const targetY = this.game.player.y + Math.sin(drone.orbitAngle) * 50;
                const angle = Utils.angle(drone.x, drone.y, targetX, targetY);
                drone.x += Math.cos(angle) * 200 * dt;
                drone.y += Math.sin(angle) * 200 * dt;
            }
        }
    }
    
    addDrone(config) {
        this.drones.push({
            x: config.x,
            y: config.y,
            damage: config.damage,
            duration: config.duration,
            color: config.color,
            orbitAngle: Utils.random(0, Math.PI * 2)
        });
    }
    
    draw(ctx, camera) {
        // Draw beams
        for (const beam of this.beams) {
            const alpha = beam.duration / beam.maxDuration;
            ctx.globalAlpha = alpha * 0.8;
            ctx.strokeStyle = beam.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(beam.x1 - camera.x, beam.y1 - camera.y);
            ctx.lineTo(beam.x2 - camera.x, beam.y2 - camera.y);
            ctx.stroke();
            
            // Glow
            ctx.globalAlpha = alpha * 0.3;
            ctx.lineWidth = 12;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Draw drones
        for (const drone of this.drones) {
            const screenX = drone.x - camera.x;
            const screenY = drone.y - camera.y;
            
            ctx.fillStyle = drone.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    clear() {
        this.beams = [];
        this.zones = [];
        this.drones = [];
    }
}

// Weapon evolution combinations
const WEAPON_EVOLUTIONS = {
    // Plasma Burst + Ion Trail = Solar Flare
    // Your trail becomes plasma explosions, stopping causes backblast
    'plasmaBurst+ionTrail': {
        name: 'Solar Flare',
        icon: '🌞',
        description: 'Your ion trail becomes a chain of plasma explosions. Stopping triggers a massive backblast!',
        color: '#ff8800'
    },
    
    // Abduction Ray + Probe Swarm = Mass Abduction  
    // Probes mark all enemies they touch, marks chain to nearby
    'abductionRay+probeSwarm': {
        name: 'Mass Abduction',
        icon: '🛸',
        description: 'Probes mark every enemy they pass. Marks spread to nearby enemies!',
        color: '#00ff88'
    },
    
    // Warp Projectiles + Crop Circle = Dimension Shatter
    // Projectiles leave crop circle damage zones where they phase
    'warpProjectiles+cropCircle': {
        name: 'Dimension Shatter',
        icon: '💫',
        description: 'Warp bolts tear reality, leaving expanding damage zones at each phase point!',
        color: '#aa00ff'
    },
    
    // Singularity Engine + Timeline Splice = Paradox Core
    // Black holes persist in your timeline echo, creating trap fields
    'singularityEngine+timelineSplice': {
        name: 'Paradox Core',
        icon: '♾️',
        description: 'Your time echo creates lingering singularities. Past and future collapse together!',
        color: '#0088ff'
    },
    
    // Chain Lightning + Radar Jammer = Neural Network
    // Lightning chains through confused enemies, confusion spreads
    'chainLightning+radarJammer': {
        name: 'Neural Network',
        icon: '🧠',
        description: 'Lightning spreads confusion. Confused enemies chain lightning to each other!',
        color: '#ffff00'
    },
    
    // MIB + Close Encounter = Shadow Protocol
    // MIB agents can abduct enemies instantly, you gain massive XP
    'menInBlack+closeEncounter': {
        name: 'Shadow Protocol',
        icon: '🕳️',
        description: 'MIB agents gain abduction powers. Erased enemies grant triple XP!',
        color: '#000000'
    },
    
    // Cattle Mutilator + Energy Orbit = Harvest Moon  
    // Orbs mark enemies, killing marked enemies heals and drops bonus XP
    'cattleMutilator+energyOrbit': {
        name: 'Harvest Moon',
        icon: '🌙',
        description: 'Orbiting energy marks enemies for harvest. Kills restore health and attract all XP!',
        color: '#ffcc00'
    }
};

// Check if player can evolve weapons
function checkWeaponEvolutions(player) {
    const maxedWeapons = player.weapons
        .filter(w => w.level >= w.data.maxLevel)
        .map(w => w.id);
    
    const available = [];
    
    for (const combo of Object.keys(WEAPON_EVOLUTIONS)) {
        const [w1, w2] = combo.split('+');
        if (maxedWeapons.includes(w1) && maxedWeapons.includes(w2)) {
            available.push({
                combo,
                evolution: WEAPON_EVOLUTIONS[combo],
                weapons: [w1, w2]
            });
        }
    }
    
    return available;
}
