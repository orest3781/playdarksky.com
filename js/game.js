// =====================================================
// MAIN GAME CLASS
// =====================================================

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');
        
        // Systems
        this.ui = new UI(this);
        this.particles = new ParticleSystem();
        this.weaponEffects = new WeaponEffects(this);
        this.sound = new SoundManager(); // Sound system
        
        // NEW: Advanced effect systems (Vampire Survivors style)
        this.damageNumbers = new DamageNumberSystem(this);
        this.comboSystem = new ComboSystem(this);
        this.critSystem = new CriticalHitSystem();
        this.chestSystem = new ChestSystem(this);
        this.xpMagnet = new XPMagnetEffect(this);
        this.screenFlash = new ScreenFlash();
        this.timeSlow = new TimeSlowEffect(this);
        this.rerollSystem = new RerollSystem(this);
        
        // MQ-9 Reaper anti-camping system
        this.reaperSystem = new ReaperMissileSystem(this);
        
        // Radar site objectives system
        this.radarSiteManager = new RadarSiteManager(this);
        this.sitesDestroyed = 0;
        
        // Object pools
        this.enemyPool = new EnemyPool(this);
        this.projectiles = new ProjectilePool();
        this.pickups = new PickupPool();
        
        // Save data
        this.saveData = SaveManager.load();
        
        // Achievement tracking system
        this.achievements = new AchievementTracker(this.saveData, this);
        
        // Game state
        this.running = false;
        this.paused = false;
        this.levelingUp = false;
        this.gameTime = 0;
        this.kills = 0;
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.eliteKills = 0;
        this.bossKills = 0;
        this.xpCollected = 0;
        this.pickupsCollected = 0;
        this.dps = 0;
        this.dpsTimer = 0;
        this.dpsAccumulator = 0;
        this.currency = 0; // In-run currency
        
        // Camera
        this.camera = { x: 0, y: 0 };
        this.screenShakeAmount = 0;
        
        // Reticle tracking (with lag to simulate live tracking)
        this.reticle = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            element: document.getElementById('flir-reticle'),
            lagFactor: 0.08, // Lower = more lag
            jitter: 0, // Simulated tracking jitter
            locked: false
        };
        
        // Input
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            boost: false,
            dash: false,
            // Power-up activation keys
            powerQ: false,
            powerE: false,
            powerF: false,
            powerR: false
        };
        
        // Power-up system state
        this.powerups = {
            // Inventory (picked up, ready to use) - Start empty, earn through gameplay
            inventory: {
                overdrive: 0,
                shield: 0,
                chronoBurst: 0,
                phaseShift: 0, // Energy-based, not inventory-based
                ultimate: 0   // Selected ultimate (R key)
            },
            // Active effects
            active: {
                overdrive: { active: false, timer: 0 },
                shield: { active: false, timer: 0 },
                chronoBurst: { active: false, timer: 0 },
                phaseShift: { active: false, timer: 0 },
                ultimate: { active: false, timer: 0, charges: 0 }
            }
        };
        
        // Gravity Bombs (active effects)
        this.gravityBombs = [];
        
        // Hazard Zones (bomber strikes, orbital strikes)
        this.hazardZones = [];
        
        // Time Warp state
        this.timeWarpActive = false;
        this.timeWarpSlow = 1;
        
        // Beam effects (for weapons)
        this.beamEffects = [];
        
        // Parallax layers
        this.parallaxLayers = this.createParallaxLayers();
        
        // Performance
        this.lastTime = 0;
        this.deltaTime = 0;
        this.timeScale = 1.0; // For dramatic slowdown effects
        
        // Initialize
        this.setupCanvas();
        this.setupInput();
        this.ui.updateMenuStats();
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.minimap.width = 180;
            this.minimap.height = 180;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }
    
    setupInput() {
        // Load keybindings from save
        const savedBindings = this.saveData?.settings?.keybindings;
        if (savedBindings) {
            loadKeybindings(savedBindings);
        }
        
        window.addEventListener('keydown', (e) => {
            // Prevent browser shortcuts when game screen is active
            const gameScreenActive = document.getElementById('game-screen')?.classList.contains('active') ||
                                    document.getElementById('gameover-screen')?.classList.contains('active');
            
            if (gameScreenActive && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (e.code !== 'F12' && e.code !== 'F5') {
                    e.preventDefault();
                }
            }
            
            const bindings = window.UFO?.currentKeybindings || DEFAULT_KEYBINDINGS;
            
            // Movement
            if (isKeyBound('moveUp', e.code)) this.input.up = true;
            if (isKeyBound('moveDown', e.code)) this.input.down = true;
            if (isKeyBound('moveLeft', e.code)) this.input.left = true;
            if (isKeyBound('moveRight', e.code)) this.input.right = true;
            
            // Phase Shift
            if (isKeyBound('phaseShift', e.code)) {
                this.input.boost = true;
                if (this.input.left || this.input.right || this.input.up || this.input.down) {
                    this.activatePowerup('phaseShift');
                }
            }
            
            // Dash
            if (isKeyBound('dash', e.code)) {
                this.input.dash = true;
            }
            
            // Power-up keys - 5-action system
            if (isKeyBound('powerOverdrive', e.code)) this.input.powerQ = true;
            if (isKeyBound('powerShield', e.code)) this.input.powerE = true;
            if (isKeyBound('powerChronoBurst', e.code)) this.input.powerF = true;
            if (isKeyBound('uapSpecial', e.code)) this.input.uapSpecial = true;
            
            // Pause/Cancel - ESC key
            if (isKeyBound('pause', e.code) && this.running) {
                // If quit confirmation is open, close it instead of toggling pause
                const quitOverlay = document.getElementById('quit-confirm-overlay');
                if (quitOverlay && !quitOverlay.classList.contains('hidden')) {
                    this.ui.hideQuitConfirmation();
                } else {
                    this.togglePause();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            // Movement
            if (isKeyBound('moveUp', e.code)) this.input.up = false;
            if (isKeyBound('moveDown', e.code)) this.input.down = false;
            if (isKeyBound('moveLeft', e.code)) this.input.left = false;
            if (isKeyBound('moveRight', e.code)) this.input.right = false;
            
            // Phase Shift
            if (isKeyBound('phaseShift', e.code)) {
                this.input.boost = false;
            }
            
            // Dash
            if (isKeyBound('dash', e.code)) {
                this.input.dash = false;
            }
        });
        
        // Touch controls for mobile
        this.setupTouchControls();
        
        // Gamepad/Controller support
        this.setupGamepad();
    }
    
    setupGamepad() {
        // Gamepad state
        this.gamepad = {
            connected: false,
            index: null,
            deadzone: 0.15,
            // Track button states for edge detection (press vs hold)
            prevButtons: new Array(17).fill(false)
        };
        
        // Listen for gamepad connections
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepad.connected = true;
            this.gamepad.index = e.gamepad.index;
            this.ui?.showWarning?.('🎮 CONTROLLER CONNECTED', 'success');
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
            this.gamepad.connected = false;
            this.gamepad.index = null;
        });
    }
    
    // Poll gamepad state (called every frame)
    updateGamepad() {
        if (!this.gamepad.connected) return;
        
        const gamepads = navigator.getGamepads();
        const gp = gamepads[this.gamepad.index];
        if (!gp) return;
        
        const deadzone = this.gamepad.deadzone;
        
        // Left stick for movement (axes 0, 1)
        const lx = gp.axes[0] || 0;
        const ly = gp.axes[1] || 0;
        
        // Apply deadzone and set movement input
        this.input.left = lx < -deadzone;
        this.input.right = lx > deadzone;
        this.input.up = ly < -deadzone;
        this.input.down = ly > deadzone;
        
        // Store analog values for smoother movement (optional future use)
        this.input.analogX = Math.abs(lx) > deadzone ? lx : 0;
        this.input.analogY = Math.abs(ly) > deadzone ? ly : 0;
        
        // Xbox Controller button mapping:
        // 0 = A, 1 = B, 2 = X, 3 = Y
        // 4 = LB, 5 = RB
        // 6 = LT, 7 = RT
        // 8 = Back/View, 9 = Start/Menu
        // 10 = Left Stick Click, 11 = Right Stick Click
        // 12 = D-Pad Up, 13 = D-Pad Down, 14 = D-Pad Left, 15 = D-Pad Right
        // 16 = Xbox button
        
        const buttons = gp.buttons;
        const prev = this.gamepad.prevButtons;
        
        // Helper to detect button press (just pressed this frame)
        const justPressed = (idx) => buttons[idx]?.pressed && !prev[idx];
        const isHeld = (idx) => buttons[idx]?.pressed;
        
        // A button (0) - Phase Shift / Boost
        this.input.boost = isHeld(0);
        if (isHeld(0) && (this.input.left || this.input.right || this.input.up || this.input.down)) {
            this.activatePowerup('phaseShift');
        }
        
        // B button (1) - Dash
        this.input.dash = isHeld(1);
        
        // X button (2) - Overdrive (Q)
        if (justPressed(2)) {
            this.activatePowerup('overdrive');
        }
        
        // Y button (3) - Shield (E)
        if (justPressed(3)) {
            this.activatePowerup('shield');
        }
        
        // RB (5) - UAP Special (R)
        if (justPressed(5)) {
            this.activateUAPSpecial();
        }
        
        // Start/Menu (9) - Pause/Cancel
        if (justPressed(9) && this.running) {
            const quitOverlay = document.getElementById('quit-confirm-overlay');
            if (quitOverlay && !quitOverlay.classList.contains('hidden')) {
                this.ui.hideQuitConfirmation();
            } else {
                this.togglePause();
            }
        }
        
        // D-Pad as alternative movement
        if (isHeld(12)) this.input.up = true;    // D-Up
        if (isHeld(13)) this.input.down = true;  // D-Down
        if (isHeld(14)) this.input.left = true;  // D-Left
        if (isHeld(15)) this.input.right = true; // D-Right
        
        // Triggers for future use (analog values)
        this.input.leftTrigger = buttons[6]?.value || 0;
        this.input.rightTrigger = buttons[7]?.value || 0;
        
        // Update previous button states for next frame
        for (let i = 0; i < buttons.length && i < prev.length; i++) {
            prev[i] = buttons[i]?.pressed || false;
        }
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touching = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touching = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!touching) return;
            
            const dx = e.touches[0].clientX - touchStartX;
            const dy = e.touches[0].clientY - touchStartY;
            const deadzone = 20;
            
            this.input.left = dx < -deadzone;
            this.input.right = dx > deadzone;
            this.input.up = dy < -deadzone;
            this.input.down = dy > deadzone;
            
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', () => {
            touching = false;
            this.input.left = false;
            this.input.right = false;
            this.input.up = false;
            this.input.down = false;
        });
        
        // Setup virtual joystick and action buttons for mobile
        this.setupVirtualControls();
    }
    
    setupVirtualControls() {
        // Check if mobile/touch device
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!isTouchDevice) return;
        
        // Create virtual controls container
        const controlsHTML = `
            <div id="virtual-controls" class="virtual-controls" aria-hidden="true">
                <div class="virtual-joystick-zone" id="joystick-zone">
                    <div class="virtual-joystick-base" id="joystick-base">
                        <div class="virtual-joystick-stick" id="joystick-stick"></div>
                    </div>
                </div>
                <div class="virtual-buttons">
                    <button class="virtual-btn dash-btn" id="vbtn-dash" aria-label="Dash">
                        <span>DASH</span>
                    </button>
                    <button class="virtual-btn phase-btn" id="vbtn-phase" aria-label="Phase Shift">
                        <span>SHIFT</span>
                    </button>
                    <div class="virtual-powerups">
                        <button class="virtual-btn powerup-btn" id="vbtn-q" aria-label="Overdrive">Q</button>
                        <button class="virtual-btn powerup-btn" id="vbtn-e" aria-label="Shield">E</button>
                        <button class="virtual-btn powerup-btn" id="vbtn-f" aria-label="Chrono">F</button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert into game screen
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen && !document.getElementById('virtual-controls')) {
            gameScreen.insertAdjacentHTML('beforeend', controlsHTML);
            this.initVirtualJoystick();
            this.initVirtualButtons();
        }
    }
    
    initVirtualJoystick() {
        const zone = document.getElementById('joystick-zone');
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        if (!zone || !base || !stick) return;
        
        let active = false;
        let startX = 0, startY = 0;
        const maxDist = 50; // Max joystick travel
        
        const handleStart = (e) => {
            e.preventDefault();
            active = true;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            base.style.opacity = '1';
        };
        
        const handleMove = (e) => {
            if (!active) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            let dx = touch.clientX - startX;
            let dy = touch.clientY - startY;
            
            // Clamp to max distance
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) {
                dx = (dx / dist) * maxDist;
                dy = (dy / dist) * maxDist;
            }
            
            // Move stick visual
            stick.style.transform = `translate(${dx}px, ${dy}px)`;
            
            // Update input based on normalized direction
            const deadzone = 0.2;
            const nx = dx / maxDist;
            const ny = dy / maxDist;
            
            this.input.left = nx < -deadzone;
            this.input.right = nx > deadzone;
            this.input.up = ny < -deadzone;
            this.input.down = ny > deadzone;
        };
        
        const handleEnd = () => {
            active = false;
            stick.style.transform = 'translate(0, 0)';
            base.style.opacity = '0.7';
            this.input.left = false;
            this.input.right = false;
            this.input.up = false;
            this.input.down = false;
        };
        
        zone.addEventListener('touchstart', handleStart, { passive: false });
        zone.addEventListener('touchmove', handleMove, { passive: false });
        zone.addEventListener('touchend', handleEnd);
        zone.addEventListener('touchcancel', handleEnd);
    }
    
    initVirtualButtons() {
        // Dash button
        const dashBtn = document.getElementById('vbtn-dash');
        if (dashBtn) {
            dashBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.input.dash = true;
                dashBtn.classList.add('active');
            });
            dashBtn.addEventListener('touchend', () => {
                this.input.dash = false;
                dashBtn.classList.remove('active');
            });
        }
        
        // Phase shift button
        const phaseBtn = document.getElementById('vbtn-phase');
        if (phaseBtn) {
            phaseBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.input.boost = true;
                this.activatePowerup('phaseShift');
                phaseBtn.classList.add('active');
            });
            phaseBtn.addEventListener('touchend', () => {
                this.input.boost = false;
                phaseBtn.classList.remove('active');
            });
        }
        
        // Power-up buttons
        const powerBtns = [
            { id: 'vbtn-q', input: 'powerQ' },
            { id: 'vbtn-e', input: 'powerE' },
            { id: 'vbtn-f', input: 'powerF' }
        ];
        
        powerBtns.forEach(({ id, input }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.input[input] = true;
                    btn.classList.add('active');
                });
                btn.addEventListener('touchend', () => {
                    this.input[input] = false;
                    btn.classList.remove('active');
                });
            }
        });
    }
    
    createParallaxLayers() {
        const layers = [];
        
        // Layer 0: Deep water light caustics (slowest, farthest)
        const caustics = [];
        for (let i = 0; i < 120; i++) {
            caustics.push({
                x: Math.random() * 3000,
                y: Math.random() * 3000,
                size: Math.random() * 40 + 20,
                brightness: Math.random() * 0.15 + 0.05,
                pulseSpeed: Math.random() * 1.5 + 0.5,
                angle: Math.random() * Math.PI * 2
            });
        }
        layers.push({ type: 'caustics', data: caustics, speed: 0.05 });
        
        // Layer 1: Deep water patches / darker areas
        const depths = [];
        for (let i = 0; i < 10; i++) {
            depths.push({
                x: Math.random() * 4000,
                y: Math.random() * 4000,
                radius: Math.random() * 400 + 200,
                color: ['#0a1520', '#081018', '#0c1825', '#061015'][Math.floor(Math.random() * 4)],
                opacity: Math.random() * 0.4 + 0.2
            });
        }
        layers.push({ type: 'nebula', data: depths, speed: 0.1 });
        
        // Layer 2: Medium depth water shimmer
        const shimmer = [];
        for (let i = 0; i < 80; i++) {
            shimmer.push({
                x: Math.random() * 3500,
                y: Math.random() * 3500,
                size: Math.random() * 3 + 1,
                brightness: Math.random() * 0.2 + 0.1,
                twinkleSpeed: Math.random() * 2 + 1,
                color: ['#4488aa', '#3377aa', '#5599bb', '#2266aa'][Math.floor(Math.random() * 4)]
            });
        }
        layers.push({ type: 'stars', data: shimmer, speed: 0.2 });
        
        // Layer 3: Cloud shadows on water
        const clouds = [];
        for (let i = 0; i < 15; i++) {
            clouds.push({
                x: Math.random() * 5000,
                y: Math.random() * 5000,
                width: Math.random() * 600 + 300,
                height: Math.random() * 200 + 100,
                opacity: Math.random() * 0.15 + 0.05,
                driftX: (Math.random() - 0.5) * 10,
                driftY: (Math.random() - 0.5) * 5
            });
        }
        layers.push({ type: 'clouds', data: clouds, speed: 0.4 });
        
        // Layer 4: Ocean surface waves
        const waves = [];
        for (let i = 0; i < 12; i++) {
            waves.push({
                y: i * 350,
                amplitude: Math.random() * 25 + 15,
                frequency: Math.random() * 0.015 + 0.01,
                speed: Math.random() * 30 + 20,
                opacity: 0.15 + (i * 0.02)
            });
        }
        layers.push({ type: 'waves', data: waves, speed: 0.7 });
        
        // Layer 5: Surface foam/whitecaps (faster, closer)
        const foam = [];
        for (let i = 0; i < 60; i++) {
            foam.push({
                x: Math.random() * 4500,
                y: Math.random() * 4500,
                size: Math.random() * 4 + 2,
                brightness: Math.random() * 0.4 + 0.3,
                twinkleSpeed: Math.random() * 4 + 2,
                color: '#ffffff',
                drift: Math.random() * 20 + 10
            });
        }
        layers.push({ type: 'foam', data: foam, speed: 0.85 });
        
        return layers;
    }
    
    startGame(difficulty = 'normal', modifiers = [], duration = 'normal', ultimate = 'droplet') {
        console.log('=== startGame() ENTRY ===');
        console.log('difficulty:', difficulty, 'modifiers:', modifiers, 'duration:', duration, 'ultimate:', ultimate);
        console.log('DIFFICULTY_TIERS available:', typeof DIFFICULTY_TIERS !== 'undefined');
        
        // Store selected ultimate for this run
        this.selectedUltimate = ultimate;
        this.ultimateData = ULTIMATES?.[ultimate] || ULTIMATES?.droplet;
        console.log('Selected Ultimate:', this.ultimateData?.name);
        
        // Store current difficulty
        this.currentDifficulty = difficulty;
        this.activeModifiers = modifiers;
        this.difficultyData = DIFFICULTY_TIERS?.[difficulty] || DIFFICULTY_TIERS?.normal || {
            modifiers: { enemyHealth: 1, enemyDamage: 1, enemySpeed: 1, spawnRate: 1, eliteChance: 1, bossHealth: 1 },
            rewards: { xpMultiplier: 1, currencyMultiplier: 1, lootQuality: 1, artifactDropChance: 0.02 }
        };
        
        console.log('difficultyData:', this.difficultyData);
        
        // Set run duration based on selection
        this.runDuration = GAME_CONFIG.RUN_DURATIONS?.[duration] || GAME_CONFIG.RUN_DURATION;
        
        // Apply modifier effects to difficultyData
        this.applyModifierEffects(modifiers);
        
        // Reset state
        this.gameTime = 0;
        this.kills = 0;
        this.totalDamageDealt = 0;
        this.totalDamageTaken = 0;
        this.eliteKills = 0;
        this.bossKills = 0;
        this.xpCollected = 0;
        this.pickupsCollected = 0;
        this.dps = 0;
        this.dpsTimer = 0;
        this.dpsAccumulator = 0;
        this.currency = 0;
        this.paused = false;
        this.levelingUp = false;
        
        // Clear pools
        this.enemyPool.clear();
        this.projectiles.clear();
        this.pickups.clear();
        this.particles.clear();
        this.weaponEffects.clear();
        this.beamEffects = [];
        
        // Create player - normalize UAP type to handle case mismatches in save data
        let uapType = this.saveData.selectedUAP || 'saucer';
        
        // If exact match not found, try case-insensitive lookup
        if (!UAP_TYPES[uapType]) {
            const lowerType = uapType.toLowerCase();
            const matchingKey = Object.keys(UAP_TYPES).find(k => k.toLowerCase() === lowerType);
            if (matchingKey) {
                console.log(`UAP type "${uapType}" normalized to "${matchingKey}"`);
                uapType = matchingKey;
                // Fix the save data for future
                this.saveData.selectedUAP = matchingKey;
                SaveManager.save(this.saveData);
            }
        }
        
        this.player = new Player(this, uapType);
        
        // Reset new systems
        this.damageNumbers.clear();
        this.comboSystem.combo = 0;
        this.comboSystem.reachedMilestones = [];
        this.chestSystem.clear();
        this.rerollSystem.reset();
        this.xpMagnet.active = false;
        this.timeSlow.active = false;
        this.reaperSystem.reset();
        
        // Reset and initialize radar sites
        this.radarSiteManager.clear();
        this.radarSiteManager.init();
        this.sitesDestroyed = 0;
        
        // Create spawner
        this.spawner = new Spawner(this);
        
        // Start game
        this.running = true;
        this.ui.showScreen('game');
        this.lastTime = performance.now();
        
        // Show tutorial for first-time players (or if not dismissed)
        const showTutorial = !this.saveData.settings?.tutorialDismissed && 
                            (this.saveData.totalRuns === 0 || this.saveData.totalRuns === undefined);
        if (showTutorial) {
            this.paused = true; // Pause until tutorial dismissed
            this.ui.showTutorial();
        }
        
        // Start sound and music
        this.sound?.resume();
        this.sound?.startMusic();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    // Apply run modifier effects to difficulty settings and track for game
    applyModifierEffects(modifiers) {
        if (!modifiers || modifiers.length === 0 || typeof RUN_MODIFIERS === 'undefined') return;
        
        for (const modId of modifiers) {
            const mod = RUN_MODIFIERS[modId];
            if (!mod) continue;
            
            // Apply stat effects
            if (mod.effects) {
                for (const [key, value] of Object.entries(mod.effects)) {
                    if (typeof value === 'number') {
                        // Multiplicative for existing keys
                        if (key === 'playerDamage') {
                            this.modifierDamageMultiplier = (this.modifierDamageMultiplier || 1) * value;
                        } else if (key === 'playerDamageTaken') {
                            this.modifierDamageTakenMultiplier = (this.modifierDamageTakenMultiplier || 1) * value;
                        } else if (key === 'playerSpeed') {
                            this.modifierSpeedMultiplier = (this.modifierSpeedMultiplier || 1) * value;
                        } else if (key === 'timeSpeed') {
                            this.modifierTimeSpeed = (this.modifierTimeSpeed || 1) * value;
                        } else if (this.difficultyData.modifiers[key] !== undefined) {
                            this.difficultyData.modifiers[key] *= value;
                        }
                    }
                }
            }
            
            // Apply reward bonuses
            if (mod.rewards) {
                for (const [key, value] of Object.entries(mod.rewards)) {
                    if (key === 'currencyBonus') {
                        this.difficultyData.rewards.currencyMultiplier = 
                            (this.difficultyData.rewards.currencyMultiplier || 1) * (1 + value);
                    } else if (this.difficultyData.rewards[key] !== undefined) {
                        this.difficultyData.rewards[key] += value;
                    }
                }
            }
        }
        
        // Log active modifiers
        const modNames = modifiers.map(id => RUN_MODIFIERS[id]?.name || id).join(', ');
        if (modNames) {
            console.log('Active modifiers:', modNames);
        }
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        try {
            // Calculate delta time with time scale for dramatic effects
            this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) * this.timeScale;
            this.lastTime = currentTime;
            
            if (!this.paused && !this.levelingUp) {
                this.update(this.deltaTime);
            }
            
            this.render();
        } catch (error) {
            // Error boundary - log and attempt recovery
            console.error('Game loop error:', error);
            
            // Try to continue if not critical
            if (this.running && !this.criticalError) {
                this.criticalError = (this.criticalError || 0) + 1;
                
                // Allow up to 3 errors before stopping
                if (this.criticalError >= 3) {
                    console.error('Too many errors, stopping game');
                    this.running = false;
                    this.ui?.showWarning?.('⚠️ GAME ERROR - Returning to menu', 'alert');
                    setTimeout(() => {
                        this.ui?.showScreen?.('menu');
                    }, 2000);
                    return;
                }
            }
        }
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update(dt) {
        // Reset error counter on successful update
        this.criticalError = 0;
        
        // Poll gamepad input
        this.updateGamepad();
        
        // Update game time
        this.gameTime += dt;
        
        // Update DPS calculation (every second)
        this.dpsTimer += dt;
        if (this.dpsTimer >= 1.0) {
            this.dps = this.dpsAccumulator / this.dpsTimer;
            this.dpsAccumulator = 0;
            this.dpsTimer = 0;
        }
        
        // Check win condition (use selected run duration)
        const targetDuration = this.runDuration || GAME_CONFIG.RUN_DURATION;
        if (this.gameTime >= targetDuration) {
            this.gameOver(true);
            return;
        }
        
        // Update player
        this.player.update(dt, this.input);
        
        // Update camera
        this.updateCamera();
        
        // Update spawner
        this.spawner.update(dt);
        
        // Update enemies
        this.enemyPool.update(dt, this.player);
        
        // Update projectiles
        this.projectiles.update(dt, this);
        
        // Update pickups
        this.pickups.update(dt, this.player, this);
        
        // Update particles
        this.particles.update(dt);
        
        // Update weapon effects
        this.weaponEffects.update(dt);
        
        // Update beam effects
        for (let i = this.beamEffects.length - 1; i >= 0; i--) {
            this.beamEffects[i].duration -= dt;
            if (this.beamEffects[i].duration <= 0) {
                this.beamEffects.splice(i, 1);
            }
        }
        
        // Update screen shake
        if (this.screenShakeAmount > 0) {
            this.screenShakeAmount *= 0.9;
            if (this.screenShakeAmount < 0.5) {
                this.screenShakeAmount = 0;
            }
        }
        
        // === NEW SYSTEMS UPDATES ===
        
        // Update damage numbers
        this.damageNumbers.update(dt);
        
        // Update combo system
        this.comboSystem.update(dt);
        
        // Update chest system (treasure drops)
        this.chestSystem.update(dt);
        
        // Update XP magnet effect
        this.xpMagnet.update(dt);
        
        // Update time slow effect
        this.timeSlow.update(dt);
        
        // Update screen flash
        this.screenFlash.update(dt);
        
        // Update gravity bombs
        this.updateGravityBombs(dt);
        
        // Update hazard zones (bombs, orbital strikes)
        this.updateHazardZones(dt);
        
        // Update power-ups
        this.updatePowerups(dt);
        
        // Update reticle tracking
        this.updateReticle(dt);
        
        // Update radar sites (objectives)
        this.radarSiteManager.update(dt);
        
        // Update Reaper anti-camping system
        this.reaperSystem.update(dt);
        
        // Update salvage upgrade overlay timer
        this.updateSalvageUpgrade(dt);
        
        // Update UI
        this.ui.updateHUD();
    }
    
    // =====================================================
    // POWER-UP SYSTEM - 5-Action System
    // SPACE=Dash, Q=Overdrive, E=Shield, F=ChronoBurst, R=UAP/Droplet
    // =====================================================

    updatePowerups(dt) {
        // Handle power-up key presses - 5-action system
        if (this.input.powerQ) {
            this.activatePowerup('overdrive');
            this.input.powerQ = false;
        }
        if (this.input.powerE) {
            this.activatePowerup('shield');
            this.input.powerE = false;
        }
        if (this.input.powerF) {
            this.activatePowerup('chronoBurst');
            this.input.powerF = false;
        }
        if (this.input.uapSpecial) {
            // R-key: First try to use ULTIMATE if we have one, otherwise UAP Special
            if (this.powerups.inventory.ultimate > 0) {
                this.activateUltimate();
            } else {
                this.activateUAPSpecial();
            }
            this.input.uapSpecial = false;
        }
        
        // Update UAP special ability cooldown
        if (this.player?.uapAbility?.cooldownTimer > 0) {
            this.player.uapAbility.cooldownTimer -= dt;
        }
        
        // Update active power-up timers
        for (const [id, state] of Object.entries(this.powerups.active)) {
            if (!state.active) continue;
            
            state.timer -= dt;
            
            // Apply ongoing effects
            this.applyPowerupEffects(id, dt);
            
            // Check if expired
            if (state.timer <= 0) {
                this.deactivatePowerup(id);
            }
            
            // Warning flash when about to expire
            if (state.timer <= 2.0 && state.timer > 0) {
                if (Math.floor(state.timer * 4) % 2 === 0) {
                    // Flash effect handled in draw
                }
            }
        }
    }
    
    activatePowerup(id) {
        const data = POWERUPS[id];
        
        // Handle energy-based powerups differently
        if (data.usesEnergy) {
            // Check if energy is full
            if (this.player.phaseEnergy < this.player.phaseMaxEnergy) {
                this.ui.showWarning('YOUR ENERGY IS LOW', 'alert');
                return false;
            }
            
            // Consume all energy
            this.player.phaseEnergy = 0;
            
            // Perform the dash immediately
            this.performPhaseShift();
            
            // Brief activation feedback
            this.screenFlash.add(data.color, 0.3, 0.2);
            return true;
        }
        
        // Check if we have this power-up in inventory
        if (this.powerups.inventory[id] <= 0) return false;
        
        // Check if already active
        if (this.powerups.active[id].active) return false;
        
        // Consume from inventory
        this.powerups.inventory[id]--;
        
        // Activate
        this.powerups.active[id].active = true;
        this.powerups.active[id].timer = data.duration;
        
        // Visual/audio feedback
        this.screenFlash.add(data.color, 0.4, 0.5);
        this.screenShake(15);
        this.ui.showWarning(`YOU ACTIVATE ${data.name}`, 'info');
        
        // Special activation effects
        if (id === 'chronoBurst') {
            // Freeze effect flash
            this.screenFlash.add('#aa66ff', 0.6, 0.3);
        } else if (id === 'overdrive') {
            // Fire effect
            this.particles.explosion(this.player.x, this.player.y, data.color, 40);
        } else if (id === 'shield') {
            // Shield bubble spawn
            this.particles.ring(this.player.x, this.player.y, 80, data.color);
        } else if (id === 'droplet') {
            // Droplet mode - epic silver flash
            this.screenFlash.add('#ffffff', 0.8, 0.4);
            this.screenFlash.add('#c0c0c0', 0.5, 0.3);
            this.screenShake(25);
            this.ui.showWarning('💧 YOU BECOME THE DROPLET', 'boss');
            // Explosion of silver particles
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2;
                const dist = 30 + Math.random() * 30;
                this.particles.spawn(
                    this.player.x + Math.cos(angle) * dist,
                    this.player.y + Math.sin(angle) * dist,
                    Math.random() > 0.5 ? '#ffffff' : '#c0c0c0',
                    8 + Math.random() * 6
                );
            }
        }
        
        return true;
    }
    
    performPhaseShift() {
        const data = POWERUPS.phaseShift;
        const input = this.input;
        
        // Calculate dash direction based on input
        let dashX = 0;
        let dashY = 0;
        if (input.left) dashX -= 1;
        if (input.right) dashX += 1;
        if (input.up) dashY -= 1;
        if (input.down) dashY += 1;
        
        // Normalize
        const len = Math.sqrt(dashX * dashX + dashY * dashY);
        if (len > 0) {
            dashX /= len;
            dashY /= len;
            
            // Spawn particles at start position (after-image effect)
            for (let i = 0; i < 15; i++) {
                this.particles.spawn(this.player.x, this.player.y, data.color, 6);
            }
            
            // Trail particles along dash path
            const dashDist = data.dashDistance;
            for (let i = 0; i < 8; i++) {
                const t = i / 8;
                this.particles.spawn(
                    this.player.x + dashX * dashDist * t,
                    this.player.y + dashY * dashDist * t,
                    data.glowColor, 4
                );
            }
            
            // Teleport player
            this.player.x += dashX * dashDist;
            this.player.y += dashY * dashDist;
            
            // Keep in bounds
            this.player.x = Utils.clamp(this.player.x, 50, GAME_CONFIG.WORLD_WIDTH - 50);
            this.player.y = Utils.clamp(this.player.y, 50, GAME_CONFIG.WORLD_HEIGHT - 50);
            
            // Set velocity to dash direction
            this.player.vx = dashX * this.player.maxSpeed * 2;
            this.player.vy = dashY * this.player.maxSpeed * 2;
            
            // Invulnerability
            this.player.invulnerable = true;
            this.player.invulnerableTime = data.invulnerableTime;
            
            // Spawn particles at end position
            for (let i = 0; i < 10; i++) {
                this.particles.spawn(this.player.x, this.player.y, '#ffffff', 5);
            }
            
            // Visual effects
            this.screenFlash.add('#004466', 0.3, 0.2);
            this.screenShake(8);
        }
    }
    
    deactivatePowerup(id) {
        // Handle ultimate specially
        if (id === 'ultimate') {
            this.powerups.active.ultimate.active = false;
            this.powerups.active.ultimate.timer = 0;
            
            // Reset special states
            if (this.player) {
                this.player.speedMult = 1;
                this.player.invulnerable = false;
                this.player.ultimateDamageBonus = 0;
                this.player.prescienceActive = false;
            }
            
            // Clear replicator drones if applicable
            if (this.replicatorDrones) {
                this.replicatorDrones = [];
            }
            
            // Apply vulnerability after (for droplet)
            const ultData = this.ultimateData;
            if (ultData?.vulnerableAfter) {
                this.player.vulnerableTimer = ultData.vulnerableAfter;
                this.ui.showWarning('⚠️ VULNERABLE!', 'danger');
            }
            
            this.ui.showWarning(`${ultData?.icon || '⭐'} ${ultData?.name || 'ULTIMATE'} ENDS`, 'alert');
            return;
        }
        
        const data = POWERUPS[id];
        if (!data) return;
        this.powerups.active[id].active = false;
        this.powerups.active[id].timer = 0;
        
        // Deactivation feedback
        this.ui.showWarning(`YOUR ${data.name} FADES`, 'alert');
    }
    
    // =====================================================
    // UAP SPECIAL ABILITY (R key)
    // Each ship has a unique active ability
    // =====================================================
    activateUAPSpecial() {
        if (!this.player) return;
        
        const uapData = UAP_TYPES[this.player.uapType];
        if (!uapData || !uapData.abilities?.active) {
            this.ui.showWarning('YOU HAVE NO SPECIAL ABILITY', 'alert');
            return false;
        }
        
        const ability = uapData.abilities.active;
        
        // Check cooldown
        if (!this.player.uapAbility) {
            this.player.uapAbility = { cooldownTimer: 0, active: false };
        }
        
        if (this.player.uapAbility.cooldownTimer > 0) {
            const remaining = Math.ceil(this.player.uapAbility.cooldownTimer);
            this.ui.showWarning(`YOUR ABILITY RECHARGING: ${remaining}s`, 'alert');
            return false;
        }
        
        // Activate ability based on UAP type
        this.executeUAPAbility(this.player.uapType, ability);
        
        // Start cooldown
        this.player.uapAbility.cooldownTimer = ability.cooldown || 60;
        
        // Feedback
        this.ui.showWarning(`YOU UNLEASH ${ability.name}`, 'success');
        this.playSound?.('powerup');
        
        return true;
    }
    
    executeUAPAbility(uapType, ability) {
        const player = this.player;
        
        switch(uapType) {
            case 'triangle':
                // Phase Shift - 2s invulnerability
                player.invulnerable = true;
                player.invulnerableTimer = ability.duration || 2;
                // Visual effect
                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2;
                    this.particles.spawn(
                        player.x + Math.cos(angle) * 30,
                        player.y + Math.sin(angle) * 30,
                        '#8800ff', 8
                    );
                }
                break;
                
            case 'orb':
                // Nova Burst - AoE damage
                const novaRadius = ability.radius || 200;
                const novaDamage = ability.damage || 50;
                for (const enemy of this.enemies) {
                    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                    if (dist < novaRadius) {
                        enemy.takeDamage(novaDamage, player);
                    }
                }
                // Big explosion effect
                for (let i = 0; i < 40; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * novaRadius;
                    this.particles.spawn(
                        player.x + Math.cos(angle) * dist,
                        player.y + Math.sin(angle) * dist,
                        '#ffff00', 6 + Math.random() * 6
                    );
                }
                break;
                
            case 'cigar':
                // Deploy Drones - spawn temporary helper orbs
                const droneCount = ability.droneCount || 3;
                player.deployedDrones = player.deployedDrones || [];
                for (let i = 0; i < droneCount; i++) {
                    const angle = (i / droneCount) * Math.PI * 2;
                    player.deployedDrones.push({
                        angle: angle,
                        duration: ability.droneDuration || 15,
                        damage: 20
                    });
                }
                break;
                
            case 'ticTac':
                // Instant Acceleration - brief speed boost + invuln
                player.speedBoostTimer = ability.duration || 3;
                player.speedBoostMult = 3.0;
                player.invulnerable = true;
                player.invulnerableTimer = 0.5;
                break;
                
            case 'adamski':
                // Healing Pulse - restore health
                const healAmount = ability.healAmount || 30;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                // Green healing particles
                for (let i = 0; i < 30; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    this.particles.spawn(
                        player.x + Math.cos(angle) * 20,
                        player.y + Math.sin(angle) * 20,
                        '#00ff88', 5
                    );
                }
                break;
                
            case 'jellyfish':
                // Chain Lightning - hits multiple enemies
                let targets = [...this.enemies].sort((a, b) => {
                    const distA = Math.hypot(a.x - player.x, a.y - player.y);
                    const distB = Math.hypot(b.x - player.x, b.y - player.y);
                    return distA - distB;
                }).slice(0, ability.chainCount || 5);
                
                for (const target of targets) {
                    target.takeDamage(ability.damage || 80, player);
                }
                break;
                
            case 'cube':
                // Gravity Well - pull enemies
                for (const enemy of this.enemies) {
                    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                    if (dist < (ability.radius || 300) && dist > 10) {
                        const force = (ability.pullForce || 500) / dist;
                        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                        enemy.vx += Math.cos(angle) * force;
                        enemy.vy += Math.sin(angle) * force;
                    }
                }
                break;
                
            case 'gimbal':
                // Lock-On Barrage - auto-targeting burst
                let nearbyEnemies = this.enemies.filter(e => 
                    Math.hypot(e.x - player.x, e.y - player.y) < 400
                ).slice(0, 8);
                
                for (const enemy of nearbyEnemies) {
                    // Spawn homing projectile
                    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                    this.projectiles.push(new Projectile(
                        player.x, player.y, angle,
                        { damage: 40, speed: 600, homing: true, homingTarget: enemy }
                    ));
                }
                break;
                
            case 'gofast':
                // Afterburner - massive temporary speed
                player.speedBoostTimer = 5;
                player.speedBoostMult = 4.0;
                // Leave fire trail
                player.fireTrailTimer = 5;
                break;
                
            default:
                // Default ability - small heal
                player.health = Math.min(player.maxHealth, player.health + 15);
                break;
        }
    }
    
    applyPowerupEffects(id, dt) {
        const data = POWERUPS[id];
        
        switch(id) {
            case 'overdrive':
                // Effects applied in weapon firing logic
                // Visual: Intense fire/energy particles
                if (Math.random() < 0.5) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 20 + Math.random() * 20;
                    this.particles.spawn(
                        this.player.x + Math.cos(angle) * dist,
                        this.player.y + Math.sin(angle) * dist,
                        Math.random() > 0.5 ? data.color : data.glowColor,
                        6 + Math.random() * 4
                    );
                }
                // Trailing fire behind player
                if (Math.random() < 0.4) {
                    const speed = Math.sqrt(this.player.vx ** 2 + this.player.vy ** 2);
                    if (speed > 50) {
                        this.particles.spawn(
                            this.player.x - this.player.vx * 0.05 + (Math.random() - 0.5) * 15,
                            this.player.y - this.player.vy * 0.05 + (Math.random() - 0.5) * 15,
                            '#ff4400', 8
                        );
                    }
                }
                break;
                
            case 'shield':
                // Damage reflection - hurt nearby enemies and heal player
                const enemies = this.enemyPool.getActive();
                let shieldHealAmount = 0;
                for (const enemy of enemies) {
                    const dx = enemy.x - this.player.x;
                    const dy = enemy.y - this.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < data.reflectRadius + enemy.radius) {
                        enemy.takeDamage(data.reflectDamage * dt, this);
                        // Heal player when shield damages enemies
                        shieldHealAmount += data.healOnHit * dt;
                        // Push enemy away
                        const pushForce = 200;
                        enemy.x += (dx / dist) * pushForce * dt;
                        enemy.y += (dy / dist) * pushForce * dt;
                        
                        // Spark effect on contact
                        if (Math.random() < 0.3) {
                            this.particles.explosion(
                                this.player.x + (dx / dist) * 55,
                                this.player.y + (dy / dist) * 55,
                                data.glowColor, 5
                            );
                        }
                    }
                }
                // Apply accumulated healing
                if (shieldHealAmount > 0 && this.player.health < this.player.maxHealth) {
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + shieldHealAmount);
                    // Healing visual effect (occasional)
                    if (Math.random() < 0.1) {
                        this.particles.emit({
                            x: this.player.x, y: this.player.y,
                            count: 3, color: '#66ffaa',
                            speed: 40, life: 0.5, size: 4
                        });
                    }
                }
                
                // Visual: Orbiting shield particles
                const time = performance.now() * 0.003;
                for (let i = 0; i < 3; i++) {
                    if (Math.random() < 0.15) {
                        const orbitAngle = time + (i * Math.PI * 2 / 3);
                        const orbitDist = 50 + Math.sin(time * 2) * 5;
                        this.particles.spawn(
                            this.player.x + Math.cos(orbitAngle) * orbitDist,
                            this.player.y + Math.sin(orbitAngle) * orbitDist,
                            data.glowColor, 5
                        );
                    }
                }
                break;
                
            case 'chronoBurst':
                // XP magnetism with visible pull lines
                const pickups = this.pickups.getActive();
                for (const pickup of pickups) {
                    if (pickup.type === 'xp') {
                        const dx = this.player.x - pickup.x;
                        const dy = this.player.y - pickup.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < data.xpMagnetRange && dist > 0) {
                            const force = 400 / Math.max(dist, 50);
                            pickup.vx = (dx / dist) * force * 5;
                            pickup.vy = (dy / dist) * force * 5;
                        }
                    }
                }
                
                // Visual: Time distortion rings
                if (Math.random() < 0.08) {
                    this.particles.ring(this.player.x, this.player.y, 80 + Math.random() * 40, data.glowColor);
                }
                
                // Floating time particles
                if (Math.random() < 0.25) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 50 + Math.random() * 150;
                    this.particles.spawn(
                        this.player.x + Math.cos(angle) * dist,
                        this.player.y + Math.sin(angle) * dist,
                        data.glowColor, 3 + Math.random() * 3
                    );
                }
                break;
                
            case 'ultimate':
                // Apply effects based on selected ultimate type
                this.applyUltimateEffects(dt);
                break;
        }
    }
    
    // =====================================================
    // ULTIMATE EFFECT HANDLERS
    // =====================================================
    applyUltimateEffects(dt) {
        if (!this.ultimateData) return;
        
        const data = this.ultimateData;
        const state = this.powerups.active.ultimate;
        
        switch(data.id) {
            case 'droplet':
                this.applyDropletEffect(data);
                break;
            case 'protomolecule':
                this.applyProtomoleculeEffect(data, dt);
                break;
            case 'prescience':
                this.applyPrescienceEffect(data, dt);
                break;
            case 'atField':
                this.applyATFieldEffect(data, dt);
                break;
            case 'improbability':
                this.applyImprobabilityEffect(data, dt);
                break;
            case 'replicators':
                this.updateReplicatorDrones(data, dt);
                break;
            case 'borg':
                this.applyBorgAdaptationEffect(data, dt);
                break;
        }
    }
    
    // DROPLET - Ram through everything (Three Body Problem)
    applyDropletEffect(data) {
        const ramRadius = data.ramRadius || 40;
        
        // Make player invulnerable and fast
        this.player.invulnerable = true;
        this.player.speedMult = data.speedBoost || 3.0;
        
        // Ram all enemies in path
        const activeEnemies = this.enemyPool.getActive();
        for (const enemy of activeEnemies) {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < ramRadius + enemy.radius) {
                enemy.takeDamage(data.ramDamage || 99999, this.player, true);
                
                const knockAngle = Math.atan2(dy, dx);
                enemy.knockbackX = Math.cos(knockAngle) * (data.knockbackForce || 800);
                enemy.knockbackY = Math.sin(knockAngle) * (data.knockbackForce || 800);
                
                this.particles.explosion(enemy.x, enemy.y, '#ffffff', 15);
                this.screenShakeAmount = Math.max(this.screenShakeAmount, 5);
            }
        }
        
        // Ram radar ships too
        if (this.radarSiteManager) {
            for (const ship of this.radarSiteManager.sites) {
                if (ship.destroyed) continue;
                const dist = Utils.distance(this.player.x, this.player.y, ship.x, ship.y);
                if (dist < ramRadius + ship.radius) {
                    ship.takeDamage(data.ramDamage || 99999);
                    this.screenShakeAmount = 15;
                }
            }
        }
        
        // Visual trail
        const speed = Math.sqrt(this.player.vx ** 2 + this.player.vy ** 2);
        if (speed > 50) {
            for (let i = 0; i < 3; i++) {
                this.particles.spawn(
                    this.player.x - this.player.vx * 0.03 + (Math.random() - 0.5) * 15,
                    this.player.y - this.player.vy * 0.03 + (Math.random() - 0.5) * 15,
                    Math.random() > 0.5 ? '#ffffff' : data.color,
                    6 + Math.random() * 4
                );
            }
        }
    }
    
    // PROTOMOLECULE - Infect enemies (The Expanse)
    applyProtomoleculeEffect(data, dt) {
        const state = this.powerups.active.ultimate;
        if (!state.infected) state.infected = [];
        
        // Infect nearby enemies
        const infectionRadius = data.infectionRadius || 150;
        const activeEnemies = this.enemyPool.getActive();
        
        for (const enemy of activeEnemies) {
            if (state.infected.includes(enemy) || state.infected.length >= (data.maxInfected || 5)) continue;
            
            const dist = Utils.distance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < infectionRadius && !enemy.infected) {
                // Infect!
                enemy.infected = true;
                enemy.infectedTimer = data.infectedDuration || 6;
                enemy.originalTarget = 'player';
                state.infected.push(enemy);
                
                // Visual feedback
                this.particles.explosion(enemy.x, enemy.y, data.color, 20);
                this.ui.showWarning('INFECTION SPREADS', 'info');
            }
        }
        
        // Update infected enemies - they attack other enemies!
        for (let i = state.infected.length - 1; i >= 0; i--) {
            const enemy = state.infected[i];
            if (!enemy || enemy.dead) {
                state.infected.splice(i, 1);
                continue;
            }
            
            enemy.infectedTimer -= dt;
            
            // Infected visual
            if (Math.random() < 0.1) {
                this.particles.spawn(enemy.x, enemy.y, data.color, 4);
            }
            
            // Make them target other enemies
            let closestEnemy = null;
            let closestDist = 200;
            for (const other of activeEnemies) {
                if (other === enemy || other.infected) continue;
                const d = Utils.distance(enemy.x, enemy.y, other.x, other.y);
                if (d < closestDist) {
                    closestDist = d;
                    closestEnemy = other;
                }
            }
            
            if (closestEnemy) {
                // Move toward enemy
                const angle = Math.atan2(closestEnemy.y - enemy.y, closestEnemy.x - enemy.x);
                enemy.vx = Math.cos(angle) * enemy.speed * 1.5;
                enemy.vy = Math.sin(angle) * enemy.speed * 1.5;
                
                // Deal damage on contact
                if (closestDist < enemy.radius + closestEnemy.radius) {
                    closestEnemy.takeDamage(enemy.damage * (data.infectedDamageMult || 0.5), enemy);
                }
            }
            
            // Explode when timer runs out
            if (enemy.infectedTimer <= 0) {
                const explosionRadius = data.explosionRadius || 80;
                const explosionDamage = data.explosionDamage || 200;
                
                // Damage nearby non-infected enemies
                for (const other of activeEnemies) {
                    if (other === enemy || other.infected) continue;
                    const d = Utils.distance(enemy.x, enemy.y, other.x, other.y);
                    if (d < explosionRadius) {
                        other.takeDamage(explosionDamage, this.player);
                    }
                }
                
                this.particles.explosion(enemy.x, enemy.y, data.color, 30);
                enemy.takeDamage(99999, this.player); // Kill the infected
                state.infected.splice(i, 1);
            }
        }
    }
    
    // PRESCIENCE - Auto-dodge, see spawns (Dune)
    applyPrescienceEffect(data, dt) {
        // Auto-dodge projectiles
        if (data.autoDodge) {
            // Check for incoming projectiles/threats and dodge
            // For now, just grant brief invulnerability when a projectile would hit
            this.player.prescienceActive = true;
        }
        
        // Damage bonus
        if (data.damageBonus) {
            this.player.ultimateDamageBonus = data.damageBonus;
        }
        
        // Golden eye visual
        if (Math.random() < 0.05) {
            this.particles.spawn(this.player.x, this.player.y, data.glowColor, 6);
        }
    }
    
    // AT FIELD - Reflect damage (Evangelion)
    applyATFieldEffect(data, dt) {
        const state = this.powerups.active.ultimate;
        
        // Deactivate if shield depleted
        if (state.shieldHP <= 0) {
            state.active = false;
            this.ui.showWarning('A.T. FIELD NEUTRALIZED', 'alert');
            return;
        }
        
        // Hexagon visual
        if (data.hexagonVisual && Math.random() < 0.15) {
            this.particles.ring(this.player.x, this.player.y, 60 + Math.random() * 20, data.color);
        }
    }
    
    // Called when player takes damage while AT Field is active
    onATFieldHit(damage, source) {
        const state = this.powerups.active.ultimate;
        const data = this.ultimateData;
        
        if (!state.active || data?.id !== 'atField') return false;
        
        // Absorb damage
        state.shieldHP -= damage;
        
        // Reflect damage back
        if (source && data.reflectMult) {
            const reflectedDamage = damage * data.reflectMult;
            source.takeDamage(reflectedDamage, this.player);
            this.particles.explosion(source.x, source.y, data.color, 10);
        }
        
        // Knockback
        if (source && data.knockbackOnHit) {
            const angle = Math.atan2(source.y - this.player.y, source.x - this.player.x);
            source.knockbackX = Math.cos(angle) * data.knockbackOnHit;
            source.knockbackY = Math.sin(angle) * data.knockbackOnHit;
        }
        
        // Visual feedback
        this.particles.ring(this.player.x, this.player.y, 50, data.color);
        
        return true; // Damage was absorbed
    }
    
    // IMPROBABILITY DRIVE - Random chaos (Hitchhiker's Guide)
    applyImprobabilityEffect(data, dt) {
        const state = this.powerups.active.ultimate;
        state.lastEffectTime = (state.lastEffectTime || 0) + dt;
        
        if (state.lastEffectTime >= (data.effectInterval || 0.5)) {
            state.lastEffectTime = 0;
            
            // Pick random effect
            const effects = data.effects || ['healPulse'];
            const effect = effects[Math.floor(Math.random() * effects.length)];
            
            switch(effect) {
                case 'enemyToPickup':
                    // Turn random enemy into XP
                    const enemies = this.enemyPool.getActive();
                    if (enemies.length > 0) {
                        const enemy = enemies[Math.floor(Math.random() * enemies.length)];
                        this.pickups.spawn(enemy.x, enemy.y, 'xp', enemy.xpValue * 3);
                        this.particles.explosion(enemy.x, enemy.y, data.color, 20);
                        enemy.takeDamage(99999, this.player);
                    }
                    break;
                    
                case 'teleportRandom':
                    // Blink to random safe spot
                    const oldX = this.player.x, oldY = this.player.y;
                    this.player.x = 200 + Math.random() * (GAME_CONFIG.WORLD_WIDTH - 400);
                    this.player.y = 200 + Math.random() * (GAME_CONFIG.WORLD_HEIGHT - 400);
                    this.particles.explosion(oldX, oldY, data.color, 15);
                    this.particles.explosion(this.player.x, this.player.y, data.color, 15);
                    break;
                    
                case 'weaponBurst':
                    // Fire all weapons at once
                    this.player.forceFireAllWeapons = true;
                    break;
                    
                case 'healPulse':
                    // Heal 10%
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.1);
                    this.particles.ring(this.player.x, this.player.y, 40, '#00ff00');
                    break;
                    
                case 'timeSkip':
                    // Brief invulnerability
                    this.player.invulnerable = true;
                    this.player.invulnerableTime = 0.5;
                    break;
            }
            
            // Glitchy visual
            this.screenFlash.add(data.color, 0.2, 0.1);
        }
    }
    
    // REPLICATOR SWARM - Drone summons (Stargate)
    spawnReplicatorDrones(data) {
        if (!this.replicatorDrones) this.replicatorDrones = [];
        
        const count = data.droneCount || 8;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            this.replicatorDrones.push({
                x: this.player.x + Math.cos(angle) * 50,
                y: this.player.y + Math.sin(angle) * 50,
                hp: data.droneHP || 30,
                damage: data.droneDamage || 25,
                speed: data.droneSpeed || 350,
                targetEnemy: null
            });
        }
    }
    
    updateReplicatorDrones(data, dt) {
        if (!this.replicatorDrones) return;
        
        const activeEnemies = this.enemyPool.getActive();
        
        for (let i = this.replicatorDrones.length - 1; i >= 0; i--) {
            const drone = this.replicatorDrones[i];
            
            // Find target
            if (!drone.targetEnemy || drone.targetEnemy.dead) {
                let closest = null, closestDist = 300;
                for (const enemy of activeEnemies) {
                    const d = Utils.distance(drone.x, drone.y, enemy.x, enemy.y);
                    if (d < closestDist) {
                        closestDist = d;
                        closest = enemy;
                    }
                }
                drone.targetEnemy = closest;
            }
            
            // Move toward target
            if (drone.targetEnemy) {
                const angle = Math.atan2(drone.targetEnemy.y - drone.y, drone.targetEnemy.x - drone.x);
                drone.x += Math.cos(angle) * drone.speed * dt;
                drone.y += Math.sin(angle) * drone.speed * dt;
                
                // Attack on contact
                const dist = Utils.distance(drone.x, drone.y, drone.targetEnemy.x, drone.targetEnemy.y);
                if (dist < 20) {
                    drone.targetEnemy.takeDamage(drone.damage, this.player);
                    this.particles.explosion(drone.x, drone.y, data.color, 5);
                    
                    // Check if killed for replication
                    if (drone.targetEnemy.dead && data.replicateOnKill && this.replicatorDrones.length < (data.maxDrones || 12)) {
                        this.replicatorDrones.push({
                            x: drone.targetEnemy.x,
                            y: drone.targetEnemy.y,
                            hp: data.droneHP || 30,
                            damage: data.droneDamage || 25,
                            speed: data.droneSpeed || 350,
                            targetEnemy: null
                        });
                    }
                    drone.targetEnemy = null;
                }
            } else {
                // Orbit player if no target
                const angle = Math.atan2(this.player.y - drone.y, this.player.x - drone.x);
                drone.x += Math.cos(angle + Math.PI/2) * drone.speed * 0.3 * dt;
                drone.y += Math.sin(angle + Math.PI/2) * drone.speed * 0.3 * dt;
            }
            
            // Visual
            if (Math.random() < 0.1) {
                this.particles.spawn(drone.x, drone.y, data.color, 3);
            }
        }
    }
    
    // FOLDSPACE JUMP - Teleport with damage (Dune/BSG)
    activateFoldspaceJump() {
        const data = this.ultimateData;
        const state = this.powerups.active.ultimate;
        
        if (state.charges <= 0) {
            state.active = false;
            return;
        }
        
        state.charges--;
        
        // Get target position (mouse/cursor or direction)
        const targetX = this.player.x + (this.input.right ? 200 : this.input.left ? -200 : 0);
        const targetY = this.player.y + (this.input.down ? 200 : this.input.up ? -200 : 0);
        
        // Damage at origin
        const activeEnemies = this.enemyPool.getActive();
        for (const enemy of activeEnemies) {
            const dist = Utils.distance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < (data.damageRadius || 100)) {
                enemy.takeDamage(data.damage || 200, this.player);
            }
        }
        this.particles.explosion(this.player.x, this.player.y, data.color, 25);
        
        // Teleport
        this.player.x = Utils.clamp(targetX, 50, GAME_CONFIG.WORLD_WIDTH - 50);
        this.player.y = Utils.clamp(targetY, 50, GAME_CONFIG.WORLD_HEIGHT - 50);
        
        // Damage at destination
        for (const enemy of activeEnemies) {
            const dist = Utils.distance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < (data.damageRadius || 100)) {
                enemy.takeDamage(data.damage || 200, this.player);
            }
        }
        this.particles.explosion(this.player.x, this.player.y, data.color, 25);
        
        // Brief invulnerability
        this.player.invulnerable = true;
        this.player.invulnerableTime = data.invulnerableTime || 0.5;
        
        this.screenFlash.add(data.color, 0.4, 0.2);
        this.screenShake(10);
        
        this.ui.showWarning(`FOLDSPACE: ${state.charges} JUMPS LEFT`, 'info');
        
        // Continue if charges remain
        if (state.charges > 0) {
            state.active = true;
        }
    }
    
    // BORG ADAPTATION - Become immune to last damage type (Star Trek)
    applyBorgAdaptationEffect(data, dt) {
        // Visual: Green grid occasionally
        if (Math.random() < 0.05) {
            this.particles.spawn(
                this.player.x + (Math.random() - 0.5) * 40,
                this.player.y + (Math.random() - 0.5) * 40,
                data.color, 4
            );
        }
        
        // Adaptation logic is handled in player damage code
        // this.player.borgAdaptedType tracks what they're immune to
    }
    
    // =====================================================
    // ULTIMATE ACTIVATION - Sci-Fi themed R-key powers
    // =====================================================
    activateUltimate() {
        if (!this.ultimateData) {
            console.warn('No ultimate data found');
            return false;
        }
        
        // Check if we have this power-up in inventory
        if (this.powerups.inventory.ultimate <= 0) return false;
        
        // Check if already active
        if (this.powerups.active.ultimate.active) return false;
        
        const data = this.ultimateData;
        
        // Consume from inventory
        this.powerups.inventory.ultimate--;
        
        // Handle instant-effect ultimates (like foldspace)
        if (data.id === 'foldspace') {
            this.powerups.active.ultimate.charges = data.charges || 3;
            this.activateFoldspaceJump();
            return true;
        }
        
        // Handle AT Field (HP-based, not time-based)
        if (data.id === 'atField') {
            this.powerups.active.ultimate.active = true;
            this.powerups.active.ultimate.shieldHP = data.shieldHP || 300;
            this.screenFlash.add(data.color, 0.5, 0.4);
            this.screenShake(15);
            this.ui.showWarning(`${data.icon} ${data.name} DEPLOYED`, 'boss');
            this.particles.ring(this.player.x, this.player.y, 100, data.color);
            return true;
        }
        
        // Activate timed ultimates
        this.powerups.active.ultimate.active = true;
        this.powerups.active.ultimate.timer = data.duration;
        
        // Special setup per ultimate type
        switch(data.id) {
            case 'protomolecule':
                this.powerups.active.ultimate.infected = [];
                break;
            case 'replicators':
                this.spawnReplicatorDrones(data);
                break;
            case 'improbability':
                this.powerups.active.ultimate.lastEffectTime = 0;
                break;
        }
        
        // Visual/audio feedback
        this.screenFlash.add(data.color, 0.6, 0.5);
        this.screenShake(20);
        this.ui.showWarning(`${data.icon} ${data.name} ACTIVATED`, 'boss');
        
        // Explosion of themed particles
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const dist = 30 + Math.random() * 40;
            this.particles.spawn(
                this.player.x + Math.cos(angle) * dist,
                this.player.y + Math.sin(angle) * dist,
                data.color, 6 + Math.random() * 6
            );
        }
        
        return true;
    }
    
    // Add power-up to inventory (called when picked up)
    collectPowerup(id) {
        // Handle ultimate pickup specially
        if (id === 'ultimate') {
            const ultData = this.ultimateData;
            const maxStack = 2; // Max 2 ultimates
            if (this.powerups.inventory.ultimate < maxStack) {
                this.powerups.inventory.ultimate++;
                this.ui.showWarning(`${ultData?.icon || '⭐'} ${ultData?.name || 'ULTIMATE'} ACQUIRED`, 'boss');
                this.screenFlash.add(ultData?.color || '#ffaa00', 0.4, 0.4);
                this.screenShake(10);
                return true;
            }
            return false;
        }
        
        const data = POWERUPS[id];
        if (!data) {
            console.warn(`collectPowerup: Unknown powerup id "${id}"`);
            return false;
        }
        
        const maxStack = 3; // Max of each type
        if (this.powerups.inventory[id] < maxStack) {
            this.powerups.inventory[id]++;
            this.ui.showWarning(`${data.icon} YOU ACQUIRE ${data.name}`, 'success');
            this.screenFlash.add(data.color, 0.2, 0.3);
            return true;
        }
        return false;
    }
    
    updateReticle(dt) {
        if (!this.reticle.element || !this.player) return;
        
        // Calculate player's screen position (center of screen + offset from camera target)
        const screenCenterX = this.canvas.width / 2;
        const screenCenterY = this.canvas.height / 2;
        
        // Player position relative to camera, adjusted for screen shake
        const playerScreenX = this.player.x - this.camera.x + (Math.random() - 0.5) * this.screenShakeAmount;
        const playerScreenY = this.player.y - this.camera.y + (Math.random() - 0.5) * this.screenShakeAmount;
        
        // Target is offset from center based on player velocity (predicting movement)
        const predictionFactor = 0.05;
        this.reticle.targetX = (playerScreenX - screenCenterX) + this.player.vx * predictionFactor;
        this.reticle.targetY = (playerScreenY - screenCenterY) + this.player.vy * predictionFactor;
        
        // Add tracking jitter when player is moving fast
        const speed = Math.sqrt(this.player.vx ** 2 + this.player.vy ** 2);
        const jitterAmount = Math.min(speed * 0.02, 8);
        this.reticle.jitter = Utils.lerp(this.reticle.jitter, jitterAmount, 0.1);
        
        // Apply lag to reticle position (smooth follow with deliberate delay)
        const lagFactor = this.player.isBoosting ? 0.05 : 0.08; // More lag when boosting
        this.reticle.x = Utils.lerp(this.reticle.x, this.reticle.targetX, lagFactor);
        this.reticle.y = Utils.lerp(this.reticle.y, this.reticle.targetY, lagFactor);
        
        // Add subtle tracking jitter
        const jitterX = (Math.random() - 0.5) * this.reticle.jitter;
        const jitterY = (Math.random() - 0.5) * this.reticle.jitter;
        
        // Check if reticle is "locked on" (close to target)
        const offsetDist = Math.sqrt(
            (this.reticle.x - this.reticle.targetX) ** 2 + 
            (this.reticle.y - this.reticle.targetY) ** 2
        );
        this.reticle.locked = offsetDist < 10;
        
        // Apply position to element
        const finalX = this.reticle.x + jitterX;
        const finalY = this.reticle.y + jitterY;
        
        this.reticle.element.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;
        
        // Visual feedback for lock state
        if (this.reticle.locked) {
            this.reticle.element.classList.add('locked');
            this.reticle.element.classList.remove('tracking');
        } else {
            this.reticle.element.classList.remove('locked');
            this.reticle.element.classList.add('tracking');
        }
    }
    
    updateCamera() {
        // Calculate target with look-ahead based on player velocity
        const lookAheadAmount = 0.15; // How much to look ahead
        const targetX = this.player.x + this.player.vx * lookAheadAmount - this.canvas.width / 2;
        const targetY = this.player.y + this.player.vy * lookAheadAmount - this.canvas.height / 2;
        
        // Smooth camera follow with variable speed based on distance
        const dx = targetX - this.camera.x;
        const dy = targetY - this.camera.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Faster catch-up when far, smoother when close
        const lerpSpeed = Utils.clamp(dist * 0.005, 0.05, 0.15);
        
        this.camera.x = Utils.lerp(this.camera.x, targetX, lerpSpeed);
        this.camera.y = Utils.lerp(this.camera.y, targetY, lerpSpeed);
        
        // Clamp to world bounds
        this.camera.x = Utils.clamp(this.camera.x, 0, GAME_CONFIG.WORLD_WIDTH - this.canvas.width);
        this.camera.y = Utils.clamp(this.camera.y, 0, GAME_CONFIG.WORLD_HEIGHT - this.canvas.height);
        
        // Apply screen shake
        if (this.screenShakeAmount > 0) {
            this.camera.x += Utils.random(-this.screenShakeAmount, this.screenShakeAmount);
            this.camera.y += Utils.random(-this.screenShakeAmount, this.screenShakeAmount);
        }
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background (ocean/grid)
        this.drawBackground(ctx);
        
        // Draw chests (treasure system)
        this.chestSystem.draw(ctx, this.camera);
        
        // Draw radar sites (objectives) - drawn early so other effects appear on top
        this.radarSiteManager.draw(ctx, this.camera);
        
        // Draw pickups
        this.pickups.draw(ctx, this.camera);
        
        // Draw weapon effects
        this.weaponEffects.draw(ctx, this.camera);
        
        // Draw beam effects
        this.drawBeamEffects(ctx);
        
        // Draw gravity bombs
        this.drawGravityBombs(ctx);
        
        // Draw hazard zones (warning circles, damage zones)
        this.drawHazardZones(ctx);
        
        // Draw enemies
        this.enemyPool.draw(ctx, this.camera);
        
        // Draw projectiles
        this.projectiles.draw(ctx, this.camera);
        
        // Draw active powerup effects (before player)
        this.drawActivePowerupEffects(ctx);
        
        // Draw player
        this.player.draw(ctx, this.camera);
        
        // Draw particles
        this.particles.draw(ctx, this.camera);
        
        // Draw XP magnet effect
        this.xpMagnet.draw(ctx, this.player, this.camera);
        
        // Draw damage numbers (floating above everything)
        this.damageNumbers.draw(ctx, this.camera);
        
        // Draw Reaper missile (if active)
        this.reaperSystem.draw(ctx, this.camera);
        
        // Draw combo display
        this.comboSystem.draw(ctx);
        
        // Draw time slow effect overlay
        this.timeSlow.draw(ctx);
        
        // Draw subsurface contact screen effects (vignette, scan lines)
        this.chestSystem.drawScreenEffects(ctx);
        
        // Draw screen flash
        this.screenFlash.draw(ctx);
        
        // Draw minimap
        this.drawMinimap();
        
        // Draw pickup direction indicators (arrows pointing to powerups off-screen)
        this.drawPickupIndicators(ctx);
    }
    
    drawPickupIndicators(ctx) {
        if (!this.player) return;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const edgeMargin = 60; // Distance from screen edge for arrows
        
        // Types of pickups to track (powerups, upgrades, health when low)
        const importantPickups = [];
        
        // Collect all active pickups
        const activePickups = this.pickups.getActive();
        for (const pickup of activePickups) {
            // Check if it's an important pickup type
            const isPowerup = pickup.type.startsWith('powerup');
            const isUpgrade = pickup.type === 'upgrade';
            const isHealth = pickup.type === 'health' && this.player.health < this.player.stats.maxHealth * 0.5;
            const isPowerCore = pickup.type === 'powerCore';
            
            if (isPowerup || isUpgrade || isHealth || isPowerCore) {
                // Check if off-screen
                const screenX = pickup.x - this.camera.x;
                const screenY = pickup.y - this.camera.y;
                
                const isOffScreen = screenX < 0 || screenX > this.canvas.width ||
                                   screenY < 0 || screenY > this.canvas.height;
                
                if (isOffScreen) {
                    // Calculate distance for prioritization
                    const dist = Utils.distance(this.player.x, this.player.y, pickup.x, pickup.y);
                    
                    // Determine color and priority based on type
                    let color, priority, icon;
                    if (pickup.type === 'powerup_ultimate') {
                        // Use selected ultimate's color/icon
                        const ultData = this.ultimateData;
                        color = ultData?.color || '#ffaa00';
                        priority = 1;
                        icon = ultData?.icon || '⭐';
                    } else if (isPowerup) {
                        const powerupId = pickup.type.replace('powerup_', '');
                        const pData = POWERUPS[powerupId];
                        color = pData?.color || '#ff6600';
                        priority = 2;
                        icon = pData?.icon || '⚡';
                    } else if (isUpgrade) {
                        color = '#ffd700';
                        priority = 3;
                        icon = '⬆';
                    } else if (isPowerCore) {
                        color = '#ff00ff';
                        priority = 4;
                        icon = '🔮';
                    } else if (isHealth) {
                        color = '#00ff88';
                        priority = 5;
                        icon = '❤';
                    }
                    
                    importantPickups.push({
                        x: pickup.x,
                        y: pickup.y,
                        screenX,
                        screenY,
                        dist,
                        color,
                        priority,
                        icon,
                        type: pickup.type
                    });
                }
            }
        }
        
        // Sort by priority then distance
        importantPickups.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.dist - b.dist;
        });
        
        // Limit to max 5 indicators to avoid clutter
        const maxIndicators = 5;
        const toShow = importantPickups.slice(0, maxIndicators);
        
        // Draw each indicator
        for (const pickup of toShow) {
            this.drawPickupArrow(ctx, pickup, centerX, centerY, edgeMargin);
        }
    }
    
    drawPickupArrow(ctx, pickup, centerX, centerY, edgeMargin) {
        // Calculate angle from screen center to pickup
        const angle = Math.atan2(pickup.screenY - centerY, pickup.screenX - centerX);
        
        // Calculate position on screen edge
        const halfWidth = this.canvas.width / 2 - edgeMargin;
        const halfHeight = this.canvas.height / 2 - edgeMargin;
        
        // Find intersection with screen edge
        let edgeX, edgeY;
        
        // Check which edge the line intersects
        const tanAngle = Math.tan(angle);
        
        // Try horizontal edges first
        if (Math.abs(Math.cos(angle)) > 0.001) {
            const xIntercept = Math.cos(angle) > 0 ? halfWidth : -halfWidth;
            const yIntercept = xIntercept * tanAngle;
            
            if (Math.abs(yIntercept) <= halfHeight) {
                edgeX = centerX + xIntercept;
                edgeY = centerY + yIntercept;
            }
        }
        
        // If not on horizontal edge, must be on vertical
        if (edgeX === undefined) {
            const yIntercept = Math.sin(angle) > 0 ? halfHeight : -halfHeight;
            const xIntercept = yIntercept / tanAngle;
            edgeX = centerX + xIntercept;
            edgeY = centerY + yIntercept;
        }
        
        // Clamp to screen bounds
        edgeX = Utils.clamp(edgeX, edgeMargin, this.canvas.width - edgeMargin);
        edgeY = Utils.clamp(edgeY, edgeMargin, this.canvas.height - edgeMargin);
        
        // Calculate distance for display
        const distToPickup = pickup.dist;
        const distText = distToPickup > 1000 ? `${(distToPickup / 1000).toFixed(1)}k` : Math.floor(distToPickup);
        
        // Pulsing effect
        const pulse = Math.sin(this.gameTime * 4) * 0.3 + 0.7;
        
        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(angle);
        
        // Draw arrow
        const arrowSize = 15 + pulse * 5;
        
        // Glow
        ctx.shadowColor = pickup.color;
        ctx.shadowBlur = 15;
        
        // Arrow shape
        ctx.fillStyle = pickup.color;
        ctx.globalAlpha = 0.8 + pulse * 0.2;
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize * 0.5, -arrowSize * 0.6);
        ctx.lineTo(-arrowSize * 0.3, 0);
        ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Inner lighter fill
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(arrowSize * 0.7, 0);
        ctx.lineTo(-arrowSize * 0.3, -arrowSize * 0.3);
        ctx.lineTo(-arrowSize * 0.2, 0);
        ctx.lineTo(-arrowSize * 0.3, arrowSize * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        
        // Draw icon and distance near arrow (not rotated)
        ctx.save();
        ctx.shadowColor = pickup.color;
        ctx.shadowBlur = 8;
        
        // Offset text position based on arrow direction
        const textOffsetX = Math.cos(angle) * -35;
        const textOffsetY = Math.sin(angle) * -35;
        
        // Icon
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = pickup.color;
        ctx.globalAlpha = 0.9;
        ctx.fillText(pickup.icon, edgeX + textOffsetX, edgeY + textOffsetY - 8);
        
        // Distance
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.fillText(distText + 'm', edgeX + textOffsetX, edgeY + textOffsetY + 8);
        
        ctx.restore();
    }
    
    drawBackground(ctx) {
        // Draw each parallax layer
        for (const layer of this.parallaxLayers) {
            const offsetX = this.camera.x * layer.speed;
            const offsetY = this.camera.y * layer.speed;
            
            switch (layer.type) {
                case 'stars':
                    this.drawStarLayer(ctx, layer.data, offsetX, offsetY);
                    break;
                case 'nebula':
                    this.drawNebulaLayer(ctx, layer.data, offsetX, offsetY);
                    break;
                case 'clouds':
                    this.drawCloudLayer(ctx, layer.data, offsetX, offsetY);
                    break;
                case 'waves':
                    this.drawWaveLayer(ctx, layer.data, offsetX, offsetY);
                    break;
                case 'caustics':
                    this.drawCausticsLayer(ctx, layer.data, offsetX, offsetY);
                    break;
                case 'foam':
                    this.drawFoamLayer(ctx, layer.data, offsetX, offsetY);
                    break;
            }
        }
        
        // Draw grid overlay for gameplay reference
        this.drawGrid(ctx);
    }
    
    drawCausticsLayer(ctx, caustics, offsetX, offsetY) {
        for (const c of caustics) {
            // Wrap for infinite scrolling
            let cx = (c.x - offsetX) % (this.canvas.width + 200);
            let cy = (c.y - offsetY) % (this.canvas.height + 200);
            if (cx < 0) cx += this.canvas.width + 200;
            if (cy < 0) cy += this.canvas.height + 200;
            cx -= 100;
            cy -= 100;
            
            // Pulsing light effect
            const pulse = Math.sin(this.gameTime * c.pulseSpeed + c.x * 0.01) * 0.5 + 0.5;
            const alpha = c.brightness * pulse;
            
            ctx.globalAlpha = alpha;
            
            // Draw caustic pattern (diamond/rhombus shape)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(c.angle + this.gameTime * 0.1);
            
            ctx.fillStyle = '#4499bb';
            ctx.beginPath();
            ctx.moveTo(0, -c.size);
            ctx.lineTo(c.size * 0.6, 0);
            ctx.lineTo(0, c.size);
            ctx.lineTo(-c.size * 0.6, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
    
    drawFoamLayer(ctx, foam, offsetX, offsetY) {
        for (const f of foam) {
            // Add gentle drift based on time
            const driftX = Math.sin(this.gameTime * 0.5 + f.y * 0.01) * f.drift;
            const driftY = Math.cos(this.gameTime * 0.3 + f.x * 0.01) * f.drift * 0.5;
            
            // Wrap for infinite scrolling
            let fx = (f.x + driftX - offsetX) % (this.canvas.width + 200);
            let fy = (f.y + driftY - offsetY) % (this.canvas.height + 200);
            if (fx < 0) fx += this.canvas.width + 200;
            if (fy < 0) fy += this.canvas.height + 200;
            fx -= 100;
            fy -= 100;
            
            // Fade in/out effect
            const fade = Math.sin(this.gameTime * f.twinkleSpeed + f.x) * 0.4 + 0.6;
            const alpha = f.brightness * fade;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = f.color;
            
            // Draw foam as irregular blob
            ctx.beginPath();
            ctx.ellipse(fx, fy, f.size * 1.5, f.size, this.gameTime * 0.2 + f.x, 0, Math.PI * 2);
            ctx.fill();
            
            // Small secondary foam
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.arc(fx + f.size, fy - f.size * 0.5, f.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    drawStarLayer(ctx, stars, offsetX, offsetY) {
        for (const star of stars) {
            // Wrap stars for infinite scrolling effect
            let sx = (star.x - offsetX) % (this.canvas.width + 200);
            let sy = (star.y - offsetY) % (this.canvas.height + 200);
            if (sx < 0) sx += this.canvas.width + 200;
            if (sy < 0) sy += this.canvas.height + 200;
            sx -= 100;
            sy -= 100;
            
            // Twinkle effect
            const twinkle = Math.sin(this.gameTime * star.twinkleSpeed + star.x) * 0.3 + 0.7;
            const alpha = star.brightness * twinkle;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = star.color || '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow for larger stars
            if (star.size > 2) {
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(sx, sy, star.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
    
    drawNebulaLayer(ctx, nebulas, offsetX, offsetY) {
        for (const nebula of nebulas) {
            let nx = nebula.x - offsetX;
            let ny = nebula.y - offsetY;
            
            // Wrap for seamless scrolling
            nx = ((nx % 4000) + 4000) % 4000 - 500;
            ny = ((ny % 4000) + 4000) % 4000 - 500;
            
            // Only draw if visible
            if (nx > -nebula.radius && nx < this.canvas.width + nebula.radius &&
                ny > -nebula.radius && ny < this.canvas.height + nebula.radius) {
                
                const gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, nebula.radius);
                gradient.addColorStop(0, nebula.color + Math.floor(nebula.opacity * 255).toString(16).padStart(2, '0'));
                gradient.addColorStop(0.5, nebula.color + Math.floor(nebula.opacity * 128).toString(16).padStart(2, '0'));
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(nx, ny, nebula.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawCloudLayer(ctx, clouds, offsetX, offsetY) {
        for (const cloud of clouds) {
            // Add drift animation
            let cx = cloud.x - offsetX + Math.sin(this.gameTime * 0.1) * cloud.driftX;
            let cy = cloud.y - offsetY + Math.cos(this.gameTime * 0.15) * cloud.driftY;
            
            // Wrap for seamless scrolling
            cx = ((cx % 5000) + 5000) % 5000 - 500;
            cy = ((cy % 5000) + 5000) % 5000 - 500;
            
            // Only draw if visible
            if (cx > -cloud.width && cx < this.canvas.width + cloud.width &&
                cy > -cloud.height && cy < this.canvas.height + cloud.height) {
                
                ctx.globalAlpha = cloud.opacity;
                ctx.fillStyle = '#1a3a4a';
                
                // Draw cloud as multiple overlapping ellipses
                ctx.beginPath();
                ctx.ellipse(cx, cy, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(cx + cloud.width * 0.3, cy - cloud.height * 0.2, cloud.width / 3, cloud.height / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(cx - cloud.width * 0.25, cy + cloud.height * 0.15, cloud.width / 4, cloud.height / 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
    
    drawWaveLayer(ctx, waves, offsetX, offsetY) {
        for (const wave of waves) {
            // Calculate wave position with parallax
            let wy = wave.y - offsetY * 0.7;
            wy = ((wy % (this.canvas.height + 400)) + this.canvas.height + 400) % (this.canvas.height + 400) - 200;
            
            ctx.globalAlpha = wave.opacity;
            ctx.fillStyle = 'rgba(0, 60, 100, 0.4)';
            
            ctx.beginPath();
            ctx.moveTo(-10, this.canvas.height + 10);
            ctx.lineTo(-10, wy);
            
            // Draw wave curve
            for (let x = 0; x <= this.canvas.width + 50; x += 20) {
                const waveY = wy + Math.sin((x + offsetX * 0.5 + this.gameTime * wave.speed) * wave.frequency) * wave.amplitude;
                ctx.lineTo(x, waveY);
            }
            
            ctx.lineTo(this.canvas.width + 10, this.canvas.height + 10);
            ctx.closePath();
            ctx.fill();
            
            // Wave crest highlight
            ctx.strokeStyle = 'rgba(100, 180, 220, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x <= this.canvas.width + 50; x += 20) {
                const waveY = wy + Math.sin((x + offsetX * 0.5 + this.gameTime * wave.speed) * wave.frequency) * wave.amplitude;
                if (x === 0) ctx.moveTo(x, waveY);
                else ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    
    drawGrid(ctx) {
        const gridSize = 100;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        
        ctx.strokeStyle = 'rgba(0, 150, 200, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = startX; x < this.camera.x + this.canvas.width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x - this.camera.x, 0);
            ctx.lineTo(x - this.camera.x, this.canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = startY; y < this.camera.y + this.canvas.height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y - this.camera.y);
            ctx.lineTo(this.canvas.width, y - this.camera.y);
            ctx.stroke();
        }
    }
    
    drawBeamEffects(ctx) {
        for (const beam of this.beamEffects) {
            const alpha = beam.duration / beam.maxDuration;
            const x1 = beam.x1 - this.camera.x;
            const y1 = beam.y1 - this.camera.y;
            const x2 = beam.x2 - this.camera.x;
            const y2 = beam.y2 - this.camera.y;
            
            if (beam.isGravityWave) {
                // Radio wave effect: concentric arcs emanating toward target
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                const time = performance.now() * 0.004;
                
                ctx.save();
                ctx.translate(x1, y1);
                ctx.rotate(angle);
                
                // Draw multiple radio wave arcs - narrower and traveling full distance
                const waveCount = 8;
                const waveSpacing = dist / 4; // Tighter spacing
                const arcSpread = Math.PI * 0.15; // Narrow arc (~27 degrees each side)
                
                for (let i = 0; i < waveCount; i++) {
                    // Animate waves moving outward - travel full distance to target
                    const waveOffset = (time * 200 + i * waveSpacing) % (dist + 50);
                    
                    // Fade in at start, stay strong through middle, fade at end
                    let waveAlpha;
                    if (waveOffset < 30) {
                        waveAlpha = alpha * (waveOffset / 30) * 0.9; // Fade in
                    } else if (waveOffset > dist - 30) {
                        waveAlpha = alpha * ((dist - waveOffset + 50) / 80) * 0.9; // Fade out near target
                    } else {
                        waveAlpha = alpha * 0.9; // Full strength in middle
                    }
                    
                    if (waveAlpha <= 0 || waveOffset > dist + 20) continue;
                    
                    // Wave radius from origin
                    const radius = waveOffset;
                    
                    // Draw narrow arc centered on the direction to target
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, -arcSpread, arcSpread);
                    
                    // Main wave line
                    ctx.strokeStyle = beam.color;
                    ctx.lineWidth = 2.5;
                    ctx.globalAlpha = waveAlpha;
                    ctx.stroke();
                    
                    // Inner glow
                    ctx.lineWidth = 5;
                    ctx.globalAlpha = waveAlpha * 0.5;
                    ctx.stroke();
                    
                    // Outer glow
                    ctx.lineWidth = 10;
                    ctx.globalAlpha = waveAlpha * 0.2;
                    ctx.stroke();
                }
                
                // Impact ripple at target
                const impactRadius = 15 + Math.sin(time * 10) * 4;
                ctx.globalAlpha = alpha * 0.6;
                ctx.beginPath();
                ctx.arc(dist, 0, impactRadius, 0, Math.PI * 2);
                ctx.strokeStyle = beam.color;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.globalAlpha = alpha * 0.25;
                ctx.beginPath();
                ctx.arc(dist, 0, impactRadius + 6, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
            } else {
                // Regular beam
                ctx.globalAlpha = alpha * 0.8;
                ctx.strokeStyle = beam.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Glow
                ctx.globalAlpha = alpha * 0.3;
                ctx.lineWidth = 10;
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }
    
    drawActivePowerupEffects(ctx) {
        const playerX = this.player.x - this.camera.x;
        const playerY = this.player.y - this.camera.y;
        const time = performance.now() * 0.001;
        
        // OVERDRIVE: Fiery aura
        if (this.isPowerupActive('overdrive')) {
            const data = POWERUPS.overdrive;
            const timerRatio = this.powerups.active.overdrive.timer / data.duration;
            
            // Pulsing fire ring
            ctx.save();
            const pulseSize = 45 + Math.sin(time * 8) * 8;
            const gradient = ctx.createRadialGradient(playerX, playerY, 10, playerX, playerY, pulseSize);
            gradient.addColorStop(0, 'rgba(255, 102, 0, 0)');
            gradient.addColorStop(0.5, `rgba(255, 102, 0, ${0.3 * timerRatio})`);
            gradient.addColorStop(0.8, `rgba(255, 170, 0, ${0.5 * timerRatio})`);
            gradient.addColorStop(1, 'rgba(255, 68, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(playerX, playerY, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Outer flame ring
            ctx.strokeStyle = data.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6 * timerRatio;
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2 + time * 3;
                const dist = 35 + Math.sin(angle * 4 + time * 10) * 8;
                const x = playerX + Math.cos(angle) * dist;
                const y = playerY + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
        
        // SHIELD: Hexagonal force field
        if (this.isPowerupActive('shield')) {
            const data = POWERUPS.shield;
            const timerRatio = this.powerups.active.shield.timer / data.duration;
            
            ctx.save();
            const shieldRadius = 55;
            const rotationSpeed = time * 0.5;
            
            // Outer hex shield
            ctx.strokeStyle = data.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7 * timerRatio;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + rotationSpeed;
                const x = playerX + Math.cos(angle) * shieldRadius;
                const y = playerY + Math.sin(angle) * shieldRadius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Inner hex (counter-rotating)
            ctx.globalAlpha = 0.4 * timerRatio;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - rotationSpeed * 1.5;
                const x = playerX + Math.cos(angle) * (shieldRadius - 10);
                const y = playerY + Math.sin(angle) * (shieldRadius - 10);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Shield glow
            const shieldGradient = ctx.createRadialGradient(playerX, playerY, 20, playerX, playerY, shieldRadius + 10);
            shieldGradient.addColorStop(0, 'rgba(0, 170, 255, 0)');
            shieldGradient.addColorStop(0.7, `rgba(0, 170, 255, ${0.15 * timerRatio})`);
            shieldGradient.addColorStop(1, 'rgba(0, 170, 255, 0)');
            ctx.fillStyle = shieldGradient;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(playerX, playerY, shieldRadius + 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // CHRONO BURST: Time distortion field
        if (this.isPowerupActive('chronoBurst')) {
            const data = POWERUPS.chronoBurst;
            const timerRatio = this.powerups.active.chronoBurst.timer / data.duration;
            
            ctx.save();
            
            // Expanding time rings
            const ringCount = 3;
            for (let r = 0; r < ringCount; r++) {
                const ringPhase = (time * 0.5 + r / ringCount) % 1;
                const ringRadius = 30 + ringPhase * 100;
                const ringAlpha = (1 - ringPhase) * 0.5 * timerRatio;
                
                ctx.strokeStyle = data.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = ringAlpha;
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.arc(playerX, playerY, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            
            // Central time vortex
            const vortexGradient = ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, 50);
            vortexGradient.addColorStop(0, `rgba(170, 102, 255, ${0.4 * timerRatio})`);
            vortexGradient.addColorStop(0.5, `rgba(221, 170, 255, ${0.2 * timerRatio})`);
            vortexGradient.addColorStop(1, 'rgba(170, 102, 255, 0)');
            ctx.fillStyle = vortexGradient;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(playerX, playerY, 50, 0, Math.PI * 2);
            ctx.fill();
            
            // Clock-like marks spinning
            ctx.strokeStyle = data.glowColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6 * timerRatio;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + time * 2;
                const innerR = 35;
                const outerR = 45;
                ctx.beginPath();
                ctx.moveTo(playerX + Math.cos(angle) * innerR, playerY + Math.sin(angle) * innerR);
                ctx.lineTo(playerX + Math.cos(angle) * outerR, playerY + Math.sin(angle) * outerR);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawMinimap() {
        const ctx = this.minimapCtx;
        const size = 180;
        const scale = size / GAME_CONFIG.WORLD_WIDTH;
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Clear with dark green tint
        ctx.fillStyle = 'rgba(0, 15, 8, 0.95)';
        ctx.fillRect(0, 0, size, size);
        
        // Draw concentric range rings
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.12)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, (size / 2) * (i / 3) * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw crosshair grid lines
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.1)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, 15);
        ctx.lineTo(centerX, size - 15);
        ctx.moveTo(15, centerY);
        ctx.lineTo(size - 15, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw enemies with threat coloring
        for (const enemy of this.enemyPool.getActive()) {
            const x = enemy.x * scale;
            const y = enemy.y * scale;
            
            // Distance from player determines size/brightness
            const dist = Math.sqrt(Math.pow(enemy.x - this.player.x, 2) + Math.pow(enemy.y - this.player.y, 2));
            const alpha = Math.max(0.5, 1 - dist / 2500);
            
            // Color by enemy type/tier
            let color, blipSize;
            if (enemy.isBoss) {
                color = `rgba(255, 50, 50, ${alpha})`; // Red for bosses
                blipSize = 5;
            } else if (enemy.isElite) {
                color = `rgba(255, 170, 50, ${alpha})`; // Orange for elites
                blipSize = 3.5;
            } else {
                color = `rgba(0, 255, 100, ${alpha})`; // Green for normal
                blipSize = 2;
            }
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, blipSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect for close/dangerous enemies
            if (dist < 400 || enemy.isBoss || enemy.isElite) {
                ctx.fillStyle = color.replace(alpha.toString(), (alpha * 0.3).toString());
                ctx.beginPath();
                ctx.arc(x, y, blipSize + 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw pickups (cyan blips with pulse)
        const pickupPulse = Math.sin(this.gameTime * 4) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 255, 255, ${pickupPulse * 0.8})`;
        for (const pickup of this.pickups.active) {
            const x = pickup.x * scale;
            const y = pickup.y * scale;
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw radar sites (objective markers)
        this.radarSiteManager.drawMinimap(ctx, scale);
        
        // Draw player with enhanced visibility
        const pulse = Math.sin(this.gameTime * 5) * 0.3 + 0.7;
        const px = this.player.x * scale;
        const py = this.player.y * scale;
        
        // Player outer glow
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.15})`;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Player mid glow
        ctx.fillStyle = `rgba(0, 255, 180, ${pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Player core
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Player heading indicator (small line showing direction)
        const heading = this.player.angle || 0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(
            px + Math.cos(heading) * 10,
            py + Math.sin(heading) * 10
        );
        ctx.stroke();
        
        // Draw camera view rectangle
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            this.camera.x * scale,
            this.camera.y * scale,
            this.canvas.width * scale,
            this.canvas.height * scale
        );
        
        // Animated radar sweep effect
        const sweepAngle = this.gameTime * 1.5;
        const gradient = ctx.createConicalGradient ? null : null; // Not supported, use arc
        
        // Sweep line
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(sweepAngle) * (size / 2 - 10),
            centerY + Math.sin(sweepAngle) * (size / 2 - 10)
        );
        ctx.stroke();
        
        // Sweep fade trail (draw a fading arc behind the sweep)
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.15)';
        ctx.lineWidth = size / 2 - 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (size / 4), sweepAngle - 0.5, sweepAngle, false);
        ctx.stroke();
        
        // Reset line width
        ctx.lineWidth = 1;
    }
    
    // Spawn helpers
    spawnEnemy(type, x, y) {
        const enemyData = ENEMY_TYPES[type];
        
        // Handle cluster spawning for drone swarms
        if (enemyData && enemyData.spawnsCluster) {
            const count = enemyData.clusterCount || 5;
            const spread = enemyData.clusterSpread || 50;
            const spawned = [];
            for (let i = 0; i < count; i++) {
                const offsetX = Utils.random(-spread, spread);
                const offsetY = Utils.random(-spread, spread);
                spawned.push(this.enemyPool.spawn(type, x + offsetX, y + offsetY));
            }
            return spawned[0]; // Return the first one
        }
        
        return this.enemyPool.spawn(type, x, y);
    }
    
    spawnProjectile(config) {
        return this.projectiles.spawn(config);
    }
    
    spawnPickup(type, x, y, value, extraData = null) {
        return this.pickups.spawn(type, x, y, value, extraData);
    }
    
    // Spawn an upgrade pickup - now triggers choice overlay instead of auto-applying
    spawnUpgradePickup(x, y) {
        // Just spawn the pickup - collection will trigger showUpgradeChoices
        this.spawnPickup('upgrade', x, y, 1, null);
        this.ui.showWarning('UPGRADE AVAILABLE!', 'success');
    }
    
    // =====================================================
    // SALVAGE UPGRADE SYSTEM - Choice overlay with reroll
    // =====================================================
    
    // Called when player collects an upgrade pickup
    showUpgradeChoices(pickupX, pickupY, timeRemaining) {
        // If already showing upgrade choices, ignore
        if (this.salvageUpgradeActive) return;
        
        // Generate initial choices
        const count = GAME_CONFIG.UPGRADE_CHOICES_COUNT || 3;
        this.salvageChoices = this.generateUpgradeChoices(count);
        
        if (!this.salvageChoices || this.salvageChoices.length === 0) {
            this.ui.showWarning('NO UPGRADES AVAILABLE', 'info');
            return;
        }
        
        // Initialize state
        this.salvageUpgradeActive = true;
        this.salvageRerollCount = 0;
        this.salvageTimeRemaining = timeRemaining || GAME_CONFIG.UPGRADE_PICKUP_TIMEOUT || 20;
        
        // Show overlay
        this.ui.showSalvageUpgradeOverlay(
            this.salvageChoices,
            this.salvageRerollCount,
            this.currency || 0,
            this.salvageTimeRemaining
        );
    }
    
    // Update salvage overlay timer each frame
    updateSalvageUpgrade(dt) {
        if (!this.salvageUpgradeActive) return;
        
        this.salvageTimeRemaining -= dt;
        this.ui.updateSalvageTimer(this.salvageTimeRemaining, this.currency || 0);
        
        // Time expired - auto-dismiss
        if (this.salvageTimeRemaining <= 0) {
            this.dismissSalvageUpgrade();
            this.ui.showWarning('UPGRADE EXPIRED', 'alert');
        }
    }
    
    // Reroll the current upgrade choices (costs salvage)
    rerollSalvageUpgrades() {
        if (!this.salvageUpgradeActive) return;
        
        const costs = GAME_CONFIG.SALVAGE_REROLL_COSTS || [10, 25, 50, 100];
        const maxRerolls = GAME_CONFIG.SALVAGE_REROLL_MAX || 4;
        
        // Check if can reroll
        if (this.salvageRerollCount >= maxRerolls) {
            this.ui.showWarning('MAX REROLLS REACHED', 'alert');
            return;
        }
        
        const cost = costs[Math.min(this.salvageRerollCount, costs.length - 1)];
        
        if ((this.currency || 0) < cost) {
            this.ui.showWarning('NOT ENOUGH SALVAGE', 'alert');
            return;
        }
        
        // Deduct salvage
        this.currency -= cost;
        this.salvageRerollCount++;
        
        // Generate new choices
        const count = GAME_CONFIG.UPGRADE_CHOICES_COUNT || 3;
        this.salvageChoices = this.generateUpgradeChoices(count);
        
        // Update overlay
        this.ui.showSalvageUpgradeOverlay(
            this.salvageChoices,
            this.salvageRerollCount,
            this.currency || 0,
            this.salvageTimeRemaining
        );
        
        // Sound/visual feedback
        this.playSound('click');
        this.screenShake(3);
    }
    
    // Select an upgrade from the choices
    selectSalvageUpgrade(index) {
        if (!this.salvageUpgradeActive || !this.salvageChoices) return;
        
        const choice = this.salvageChoices[index];
        if (!choice) return;
        
        // Apply the upgrade
        if (choice.isPassive) {
            this.player.addPassiveItem(choice.id);
        } else {
            this.player.addWeapon(choice.id);
        }
        
        // Visual feedback
        this.particles.explosion(this.player.x, this.player.y, '#ffd700', 40);
        this.screenFlash.add('#ffd700', 0.3, 0.5);
        this.screenShake(10);
        this.playSound('levelUp');
        
        // Get name for display
        const data = choice.isPassive ? PASSIVE_ITEMS[choice.id] : WEAPONS[choice.id];
        const name = data?.name || choice.id;
        const levelText = choice.currentLevel === 0 ? 'NEW' : `LV ${choice.currentLevel + 1}`;
        this.ui.showWarning(`${name} ${levelText}`, 'success');
        
        // Close overlay
        this.salvageUpgradeActive = false;
        this.salvageChoices = null;
        this.ui.hideSalvageUpgradeOverlay();
    }
    
    // Dismiss without selecting (ESC or timeout)
    dismissSalvageUpgrade() {
        if (!this.salvageUpgradeActive) return;
        
        this.salvageUpgradeActive = false;
        this.salvageChoices = null;
        this.ui.hideSalvageUpgradeOverlay();
    }
    
    // Generate multiple upgrade choices for the overlay
    generateUpgradeChoices(count = 3) {
        const allChoices = [];
        const availableWeapons = Object.keys(WEAPONS);
        
        // Add existing weapons that can be upgraded (higher priority)
        for (const weapon of this.player.weapons) {
            if (weapon.level < weapon.data.maxLevel) {
                allChoices.push({
                    id: weapon.id,
                    currentLevel: weapon.level,
                    isPassive: false,
                    priority: 2 // Higher priority for upgrades
                });
            }
        }
        
        // Add new weapons if player has slots
        if (this.player.weapons.length < this.player.maxWeapons) {
            const shuffled = [...availableWeapons].sort(() => Math.random() - 0.5);
            for (const weaponId of shuffled) {
                if (allChoices.find(c => c.id === weaponId)) continue;
                if (!this.player.weapons.find(w => w.id === weaponId)) {
                    allChoices.push({ 
                        id: weaponId, 
                        currentLevel: 0, 
                        isPassive: false,
                        priority: 1
                    });
                }
            }
        }
        
        // Add passive items (with some weighting)
        if (typeof PASSIVE_ITEMS !== 'undefined') {
            const passiveIds = Object.keys(PASSIVE_ITEMS).sort(() => Math.random() - 0.5);
            
            for (const passiveId of passiveIds) {
                const passiveData = PASSIVE_ITEMS[passiveId];
                const existingPassive = this.player.passiveItems?.find(p => p.id === passiveId);
                const currentLevel = existingPassive ? existingPassive.level : 0;
                
                if (currentLevel < passiveData.maxLevel) {
                    if (existingPassive || this.player.passiveItems.length < this.player.maxPassiveItems) {
                        allChoices.push({
                            id: passiveId,
                            currentLevel: currentLevel,
                            isPassive: true,
                            priority: existingPassive ? 2 : 1
                        });
                    }
                }
            }
        }
        
        // Shuffle and select top choices (weighted by priority)
        const shuffled = allChoices.sort((a, b) => {
            // Higher priority more likely to appear, but still random
            const aScore = a.priority + Math.random();
            const bScore = b.priority + Math.random();
            return bScore - aScore;
        });
        
        return shuffled.slice(0, count);
    }
    
    // Legacy method - kept for compatibility but now just returns null
    generateUpgradeChoice() {
        const choices = this.generateUpgradeChoices(1);
        return choices.length > 0 ? choices[0] : null;
    }
    
    spawnGravityBomb(x, y, radius, damage, duration, pullForce, color) {
        this.gravityBombs.push({
            x, y, radius, damage, duration, pullForce, color,
            timer: duration,
            phase: 0
        });
    }
    
    updateGravityBombs(dt) {
        for (let i = this.gravityBombs.length - 1; i >= 0; i--) {
            const bomb = this.gravityBombs[i];
            bomb.timer -= dt;
            bomb.phase += dt * 5;
            
            // Pull and damage enemies
            for (const enemy of this.enemies) {
                if (!enemy.active) continue;
                const dist = Utils.distance(bomb.x, bomb.y, enemy.x, enemy.y);
                if (dist < bomb.radius) {
                    // Pull toward center
                    const angle = Utils.angle(enemy.x, enemy.y, bomb.x, bomb.y);
                    const pullStrength = bomb.pullForce * (1 - dist / bomb.radius);
                    enemy.x += Math.cos(angle) * pullStrength * dt;
                    enemy.y += Math.sin(angle) * pullStrength * dt;
                    
                    // Damage
                    enemy.takeDamage(bomb.damage * dt, this.player);
                }
            }
            
            if (bomb.timer <= 0) {
                // Explosion on end
                this.particles.explosion(bomb.x, bomb.y, bomb.color, 30);
                this.screenShake(10);
                this.gravityBombs.splice(i, 1);
            }
        }
    }
    
    drawGravityBombs(ctx) {
        for (const bomb of this.gravityBombs) {
            const screenX = bomb.x - this.camera.x;
            const screenY = bomb.y - this.camera.y;
            
            // Outer pull ring
            ctx.save();
            ctx.strokeStyle = bomb.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + Math.sin(bomb.phase) * 0.2;
            
            // Multiple rotating rings
            for (let i = 0; i < 3; i++) {
                const r = bomb.radius * (0.4 + i * 0.3);
                ctx.beginPath();
                ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Center singularity
            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 50);
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.5, bomb.color + '88');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 50, 0, Math.PI * 2);
            ctx.fill();
            
            // Spiral effect
            ctx.beginPath();
            ctx.strokeStyle = bomb.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6;
            for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
                const r = (angle / (Math.PI * 4)) * bomb.radius * 0.8;
                const x = screenX + Math.cos(angle + bomb.phase) * r;
                const y = screenY + Math.sin(angle + bomb.phase) * r;
                if (angle === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // =====================================================
    // HAZARD ZONE SYSTEM (Bombs, Orbital Strikes)
    // =====================================================
    
    createHazardZone(config) {
        this.hazardZones.push({
            x: config.x,
            y: config.y,
            radius: config.radius || 80,
            damage: config.damage || 50,
            duration: config.duration || 2.0,
            warningTime: config.warningTime || 1.0,
            color: config.color || '#ff4400',
            timer: config.warningTime || 1.0,
            phase: 0,
            active: false
        });
    }
    
    updateHazardZones(dt) {
        for (let i = this.hazardZones.length - 1; i >= 0; i--) {
            const zone = this.hazardZones[i];
            zone.timer -= dt;
            zone.phase += dt * 8;
            
            if (zone.timer <= 0 && !zone.active) {
                // Warning phase done, activate damage
                zone.active = true;
                zone.timer = zone.duration;
                this.particles.explosion(zone.x, zone.y, zone.color, 20);
                this.screenShake(8);
                this.playSound('explosion', { volume: 0.6 });
            } else if (zone.active) {
                // Damage phase - hurt player if in range
                const dist = Utils.distance(zone.x, zone.y, this.player.x, this.player.y);
                if (dist < zone.radius) {
                    this.player.takeDamage(zone.damage * dt, 'hazard');
                }
                
                // Fire/smoke particles
                if (Math.random() < 0.3) {
                    this.particles.emit({
                        x: zone.x + Utils.random(-zone.radius * 0.5, zone.radius * 0.5),
                        y: zone.y + Utils.random(-zone.radius * 0.5, zone.radius * 0.5),
                        count: 1,
                        color: Utils.random() > 0.5 ? zone.color : '#ff8800',
                        speed: 60,
                        angle: -Math.PI / 2,
                        angleSpread: 0.5,
                        size: Utils.random(4, 10),
                        life: 0.5,
                        decay: 4,
                        gravity: -50
                    });
                }
            }
            
            // Remove when duration expires
            if (zone.active && zone.timer <= 0) {
                this.hazardZones.splice(i, 1);
            }
        }
    }
    
    drawHazardZones(ctx) {
        for (const zone of this.hazardZones) {
            const screenX = zone.x - this.camera.x;
            const screenY = zone.y - this.camera.y;
            
            ctx.save();
            
            if (!zone.active) {
                // Warning phase - pulsing circle
                const pulseScale = 1 + Math.sin(zone.phase) * 0.15;
                const alpha = 0.3 + Math.sin(zone.phase * 2) * 0.2;
                
                // Warning ring
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = alpha;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, zone.radius * pulseScale, 0, Math.PI * 2);
                ctx.stroke();
                
                // Fill with transparent warning
                ctx.fillStyle = zone.color;
                ctx.globalAlpha = alpha * 0.3;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, zone.radius * pulseScale, 0, Math.PI * 2);
                ctx.fill();
                
                // Warning icon
                ctx.globalAlpha = alpha + 0.3;
                ctx.fillStyle = zone.color;
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('⚠', screenX, screenY + 8);
            } else {
                // Active damage zone
                const fadeAlpha = Math.min(1, zone.timer / zone.duration);
                
                // Fire gradient
                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, zone.radius);
                gradient.addColorStop(0, zone.color + 'cc');
                gradient.addColorStop(0.5, zone.color + '66');
                gradient.addColorStop(1, 'transparent');
                
                ctx.globalAlpha = fadeAlpha * 0.6;
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, zone.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Outer ring
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = fadeAlpha;
                ctx.beginPath();
                ctx.arc(screenX, screenY, zone.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    spawnDrone(config) {
        this.weaponEffects.addDrone(config);
    }
    
    addBeamEffect(x1, y1, x2, y2, color) {
        this.beamEffects.push({
            x1, y1, x2, y2, color,
            duration: 0.1,
            maxDuration: 0.1
        });
    }
    
    addGravityWaveEffect(x1, y1, x2, y2, color) {
        // Gravity wave is a wavy/spiral beam effect
        this.beamEffects.push({
            x1, y1, x2, y2, color,
            duration: 0.25,
            maxDuration: 0.25,
            isGravityWave: true
        });
    }
    
    // Get enemies for targeting
    get enemies() {
        return this.enemyPool.getActive();
    }
    
    // Screen shake
    screenShake(amount) {
        if (this.saveData.settings?.screenShake !== false) {
            this.screenShakeAmount = Math.max(this.screenShakeAmount, amount);
        }
    }
    
    // Level up - no longer shows choices, upgrades come from pickups only
    // This method kept for compatibility but does nothing now
    showLevelUpChoices() {
        // Upgrades are now pickup-based only!
        // This method is deprecated.
    }
    
    resumeFromLevelUp() {
        this.levelingUp = false;
    }
    
    // Pause
    togglePause() {
        if (this.levelingUp) return;
        
        this.paused = !this.paused;
        this.playSound('pause');
        
        if (this.paused) {
            this.ui.showPauseMenu();
            // Mute audio when paused
            this.sound?.setMasterVolume(0);
        } else {
            this.ui.hidePauseMenu();
            // Restore audio when unpaused
            this.sound?.setMasterVolume(1);
        }
    }
    
    // Warning display
    showWarning(text, type = 'alert') {
        this.ui.showWarning(text, type);
        // Play appropriate warning sound based on type
        if (type === 'phase') {
            this.playSound('bossWarning');
        } else if (type === 'alert' || type === 'boss') {
            this.playSound('warning');
        } else if (type === 'success') {
            this.playSound('upgrade');
        }
    }
    
    // Epic phase transition effect
    triggerPhaseTransition(phaseIndex, phase) {
        // Phase-specific sounds
        const phaseSounds = ['alarm', 'phaseChange', 'bossWarning', 'bossWarning', 'bossWarning'];
        this.playSound(phaseSounds[phaseIndex] || 'phaseChange', { volume: 0.8 });
        
        // Screen effects
        this.screenShake(20 + phaseIndex * 5); // Bigger shake for later phases
        this.screenFlash.add(phase.color, 0.6, 0.4);
        this.screenFlash.add('#ffffff', 0.3, 0.2);
        
        // Brief slowdown for dramatic effect
        this.timeScale = 0.3;
        setTimeout(() => {
            if (this.running) this.timeScale = 1.0;
        }, 500);
        
        // Show the big phase announcement overlay
        this.ui.showPhaseAnnouncement(phaseIndex, phase);
    }
    
    // Game over
    gameOver(victory, failReason = null) {
        this.running = false;
        
        // Stop music and play appropriate sound
        this.sound?.stopMusic();
        this.playSound(victory ? 'victory' : 'death');
        
        // Calculate rewards - include in-run currency
        const baseCurrency = Math.floor(this.kills * 0.5);
        const timeBonus = Math.floor(this.gameTime / 10);
        const victoryBonus = victory ? 500 : 0;
        const inRunCurrency = this.currency || 0;
        const totalCurrency = baseCurrency + timeBonus + victoryBonus + inRunCurrency;
        
        // Update save data
        this.saveData.currency += totalCurrency;
        this.saveData.totalKills += this.kills;
        this.saveData.totalRuns++;
        
        if (this.gameTime > this.saveData.bestTime) {
            this.saveData.bestTime = this.gameTime;
        }
        
        // Check achievements with current run stats
        const runStats = {
            totalRuns: this.saveData.totalRuns,
            survivalTime: this.gameTime,
            level: this.player?.level || 1,
            totalKills: this.saveData.totalKills,
            kills: this.kills,
            eliteKills: this.eliteKills,
            bossKills: this.bossKills
        };
        
        const newAchievements = this.achievements.checkAll(runStats);
        
        // Sync achievement data back to saveData
        this.saveData.achievements = this.achievements.unlocked;
        this.saveData.achievementProgress = this.achievements.progress;
        
        SaveManager.save(this.saveData);
        
        // Determine failure reason if not provided
        if (!victory && !failReason) {
            failReason = this.determineFailReason();
        }
        
        // Show game over screen
        this.ui.showGameOver(victory, {
            time: this.gameTime,
            kills: this.kills,
            level: this.player.level,
            currency: totalCurrency,
            failReason: failReason,
            newAchievements: newAchievements
        });
    }
    
    // Determine what killed the player for informative game over
    determineFailReason() {
        // Check what was near the player when they died
        const player = this.player;
        
        // Enemy type lookup for collision deaths
        const enemyMessages = {
            // Phase 1 - Investigation
            'reconDrone': 'Detected and eliminated by recon drone',
            'scoutPlane': 'Shot down by scout plane',
            'patrolJet': 'Intercepted by patrol jet',
            'helicopter': 'Destroyed by helicopter gunfire',
            'cutter': 'Sunk by Coast Guard cutter',
            // Phase 2 - Engagement
            'fighterSquadron': 'Overwhelmed by fighter squadron',
            'attackHelicopter': 'Destroyed by attack helicopter',
            'missileFrigate': 'Hit by frigate missiles',
            'seahawk': 'Intercepted by Seahawk',
            'destroyer': 'Obliterated by destroyer',
            // Phase 3 - Escalation
            'raptor': 'Eliminated by F-22 Raptor',
            'aegisCruiser': 'Destroyed by Aegis cruiser',
            'submarine': 'Torpedoed by submarine',
            'experimentalCraft': 'Shot down by experimental craft',
            'droneSwarm': 'Overwhelmed by drone swarm',
            'railgunTank': 'Destroyed by railgun platform',
            'blackHawk': 'Intercepted by Silent Hawk',
            'orbitalStrike': 'Annihilated by orbital strike',
            // Phase 4 - Desperate Measures  
            'acePilot': 'Shot down by Cmdr. Fravor',
            'eliteSquadron': 'Overwhelmed by Top Gun Squadron',
            'nuclearSub': 'Terminated by Ohio Class submarine',
            // Phase 5 - Final Stand
            'nimitzCarrier': 'Destroyed by USS Nimitz carrier group',
            'fordCarrier': 'Eliminated by USS Gerald R. Ford',
            'globalHawk': 'Tracked and destroyed by Global Hawk'
        };
        
        // First check if we have a tracked damage source
        if (player.lastDamageSource) {
            // Check if the source is an enemy type
            if (enemyMessages[player.lastDamageSource]) {
                return enemyMessages[player.lastDamageSource];
            }
            
            // Check special sources
            const sourceMessages = {
                'radarMissile': 'Destroyed by naval defense missile',
                'enemyProjectile': 'Shot down by enemy fire',
                'collision': 'Hull breach from collision',
                'aoe': 'Caught in area bombardment'
            };
            if (sourceMessages[player.lastDamageSource]) {
                return sourceMessages[player.lastDamageSource];
            }
        }
        
        let closestEnemy = null;
        let closestDist = Infinity;
        
        // Safety check for enemies array
        if (this.enemies && Array.isArray(this.enemies)) {
            for (const enemy of this.enemies) {
                const dist = Utils.distance(player.x, player.y, enemy.x, enemy.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = enemy;
                }
            }
        }
        
        // Check for nearby projectiles (safety check for array)
        let projectileThreat = false;
        if (this.projectiles && Array.isArray(this.projectiles)) {
            for (const proj of this.projectiles) {
                if (proj.hostile) {
                    const dist = Utils.distance(player.x, player.y, proj.x, proj.y);
                    if (dist < 100) {
                        projectileThreat = true;
                        break;
                    }
                }
            }
        }
        
        // Generate contextual failure message from nearby enemy
        if (closestEnemy && closestDist < 150) {
            const enemyType = closestEnemy.type;
            const enemyDisplayName = closestEnemy.data?.name || enemyType;
            return enemyMessages[enemyType] || `Destroyed by ${enemyDisplayName}`;
        }
        
        if (projectileThreat) {
            const missileMessages = [
                'Hit by hostile missile',
                'Struck by anti-aircraft fire',
                'Destroyed by incoming ordnance',
                'Shot down by enemy fire'
            ];
            return missileMessages[Math.floor(Math.random() * missileMessages.length)];
        }
        
        // Generic messages based on game phase
        const phase = this.spawner ? this.spawner.getCurrentPhase() : 1;
        const phaseMessages = {
            0: 'Overwhelmed during initial investigation',
            1: 'Could not escape military engagement',
            2: 'Failed to survive the escalation',
            3: 'Destroyed during desperate measures',
            4: 'Eliminated in the final stand'
        };
        
        return phaseMessages[phase] || 'Hull integrity compromised';
    }
    
    // Play a sound effect (guaranteed safe - never throws)
    playSound(name, options = {}) {
        try {
            if (this.sound && typeof this.sound.play === 'function') {
                return this.sound.play(name, options);
            }
        } catch (e) {
            // Silently ignore sound errors - never crash for audio
            if (DEBUG_MODE) console.warn('Sound error:', name, e);
        }
        return null;
    }
    
    quitToMenu() {
        this.running = false;
        this.paused = false;
        this.sound?.stopMusic();
        this.ui.hidePauseMenu();
        this.ui.showScreen('menu');
        this.ui.updateMenuStats();
    }
}
