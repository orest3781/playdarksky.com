// =====================================================
// UI MANAGER
// =====================================================

class UI {
    constructor(game) {
        this.game = game;
        
        // Cache DOM elements
        this.elements = {
            // Screens
            mainMenu: document.getElementById('main-menu'),
            hangarScreen: document.getElementById('hangar-screen'),
            upgradesScreen: document.getElementById('upgrades-screen'),
            codexScreen: document.getElementById('codex-screen'),
            recordsScreen: document.getElementById('records-screen'),
            settingsScreen: document.getElementById('settings-screen'),
            gameScreen: document.getElementById('game-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            loadingScreen: document.getElementById('loading-screen'),
            
            // FLIR HUD Elements
            flirCoords: document.getElementById('flir-coords'),
            flirAlt: document.getElementById('flir-alt'),
            flirHeading: document.getElementById('flir-heading'),
            flirBearing: document.getElementById('flir-bearing'),
            flirMode: document.getElementById('flir-mode'),
            flirZoom: document.getElementById('flir-zoom'),
            flirTrack: document.getElementById('track-count'),
            flirTime: document.getElementById('flir-time'),
            flirPhase: document.getElementById('flir-phase'),
            flirWeapons: document.getElementById('flir-weapons'),
            flirLevel: document.getElementById('flir-level'),
            flirXp: document.getElementById('flir-xp-display'),
            flirRange: document.getElementById('flir-range'),
            flirClosure: document.getElementById('flir-closure'),
            flirNeutralized: document.getElementById('neutralized-count'),
            flirClassification: document.getElementById('flir-classification'),
            flirHealthFill: document.getElementById('flir-health-fill'),
            flirHealthValue: document.getElementById('flir-health-value'),
            flirBoostFill: document.getElementById('flir-boost-fill'),
            flirBoostValue: document.getElementById('flir-boost-value'),
            weaponSlots: document.getElementById('weapon-slots'),
            
            // NEW Dashboard elements
            dashHealthFill: document.getElementById('dash-health-fill'),
            dashHealthValue: document.getElementById('dash-health-value'),
            dashEnergyFill: document.getElementById('dash-energy-fill'),
            dashEnergyValue: document.getElementById('dash-energy-value'),
            dashLevel: document.getElementById('dash-level'),
            dashXpFill: document.getElementById('dash-xp-fill'),
            dashXpPercent: document.getElementById('dash-xp-percent'),
            dashKills: document.getElementById('dash-kills'),
            dashGold: document.getElementById('dash-gold'),
            dashShips: document.getElementById('dash-ships'),
            
            // Overlays
            pauseMenu: document.getElementById('pause-menu'),
            levelupContainer: document.getElementById('levelup-container'),
            upgradeChoices: document.getElementById('upgrade-choices'),
            
            // Menu stats
            menuCurrency: document.getElementById('menu-currency'),
            menuBestTime: document.getElementById('menu-best-time'),
            menuTotalRuns: document.getElementById('menu-total-runs'),
            menuTotalKills: document.getElementById('menu-total-kills'),
            upgradeCurrency: document.getElementById('upgrade-currency'),
            
            // Sound toggle
            soundToggle: document.getElementById('sound-toggle'),
            soundIcon: document.getElementById('sound-icon'),
            
            // Game over
            goTitle: document.getElementById('gameover-title'),
            goReason: document.getElementById('gameover-reason'),
            goTime: document.getElementById('go-time'),
            goKills: document.getElementById('go-kills'),
            goLevel: document.getElementById('go-level'),
            goCurrency: document.getElementById('go-currency')
        };
        
        // FLIR simulation data
        this.flirData = {
            baseLat: 32.6850,    // Nimitz encounter coordinates
            baseLon: -117.1400,
            baseAlt: 24500,
            lastHeading: 0,
            closestEnemy: null,
            closestDist: Infinity
        };
        
        this.setupEventListeners();
        
        // Carousel state
        this.uapList = [];
        this.carouselIndex = 0;
        this.carouselInitialized = false;
        
        // Initialize Supabase and populate leaderboard
        this.initSupabase();
    }
    
    async initSupabase() {
        // Initialize Supabase service
        if (window.supabaseService) {
            await window.supabaseService.init();
            this.updateAuthUI();
        }
        // Populate leaderboard (from cloud if available, local fallback)
        this.populateLeaderboard();
    }
    
    setupEventListeners() {
        if (DEBUG_MODE) console.log('Setting up event listeners...');
        
        // Main menu buttons
        const btnPlay = document.getElementById('btn-play');
        const btnHangar = document.getElementById('btn-hangar');
        const btnUpgrades = document.getElementById('btn-upgrades');
        const btnRecords = document.getElementById('btn-records');
        const btnSettings = document.getElementById('btn-settings');
        const btnResume = document.getElementById('btn-resume');
        const btnQuit = document.getElementById('btn-quit');
        const btnRetry = document.getElementById('btn-retry');
        const btnMenu = document.getElementById('btn-menu');
        const btnSelectUap = document.getElementById('btn-select-uap');
        
        if (DEBUG_MODE) console.log('Button elements found:', {
            play: !!btnPlay,
            hangar: !!btnHangar,
            upgrades: !!btnUpgrades,
            records: !!btnRecords,
            settings: !!btnSettings,
            resume: !!btnResume,
            quit: !!btnQuit,
            retry: !!btnRetry,
            menu: !!btnMenu,
            selectUap: !!btnSelectUap
        });
        
        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                if (DEBUG_MODE) console.log('START MISSION clicked! this.game:', this.game);
                this.game.playSound?.('select');
                this.showDifficultyModal();
            });
        } else if (DEBUG_MODE) {
            console.error('btn-play not found!');
        }
        
        // Difficulty modal buttons
        const btnStartMission = document.getElementById('btn-start-mission');
        const btnCancelDifficulty = document.getElementById('btn-cancel-difficulty');
        
        if (btnStartMission) {
            btnStartMission.addEventListener('click', () => {
                console.log('LAUNCH clicked! selectedDifficulty:', this.selectedDifficulty);
                this.game.playSound?.('select');
                this.hideDifficultyModal();
                console.log('Calling startGame with:', this.selectedDifficulty, this.selectedModifiers, this.selectedDuration, this.selectedUltimate);
                this.game.startGame(this.selectedDifficulty || 'normal', this.selectedModifiers || [], this.selectedDuration || 'normal', this.selectedUltimate || 'droplet');
            });
        } else {
            console.error('btn-start-mission not found!');
        }
        
        if (btnCancelDifficulty) {
            btnCancelDifficulty.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.hideDifficultyModal();
            });
        }
        
        if (btnHangar) {
            btnHangar.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showScreen('hangar');
                this.populateHangar();
            });
        }
        
        if (btnUpgrades) {
            btnUpgrades.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showScreen('upgrades');
                this.populateUpgrades();
            });
        }
        
        const btnCodex = document.getElementById('btn-codex');
        if (btnCodex) {
            btnCodex.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showScreen('codex');
                this.populateCodex();
            });
        }
        
        if (btnRecords) {
            btnRecords.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showScreen('records');
                this.populateRecords();
            });
        }
        
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showScreen('settings');
                this.populateSettings();
                this.populateRecords(); // Also populate records tab
            });
        }
        
        // Sound toggle in main menu
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.toggleMasterSound();
            });
            // Initialize sound toggle state
            this.updateSoundToggleState();
        }
        
        // =====================================================
        // AUTH UI HANDLERS
        // =====================================================
        this.setupAuthUI();
        
        // Options tabs (Settings, Records, How to Play)
        document.querySelectorAll('.options-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.game.playSound?.('click');
                const tabId = tab.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.options-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                document.querySelectorAll('.options-tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`tab-${tabId}`)?.classList.add('active');
            });
        });
        
        // How to Play button - removed, now part of OPTIONS
        
        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showScreen('menu');
            });
        });
        
        // Pause menu
        if (btnResume) {
            btnResume.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.game.togglePause();
            });
        }
        
        if (btnQuit) {
            btnQuit.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showQuitConfirmation();
            });
        }
        
        // Game over buttons
        if (btnRetry) {
            btnRetry.addEventListener('click', () => {
                this.game.playSound?.('select');
                this.game.startGame();
            });
        }
        
        if (btnMenu) {
            btnMenu.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.showScreen('menu');
                this.updateMenuStats();
            });
        }
        
        // UAP selection (Deploy button in hangar)
        if (btnSelectUap) {
            btnSelectUap.addEventListener('click', () => {
                // Get currently selected UAP from the active ship card
                const selected = document.querySelector('.ship-card.active');
                if (selected && selected.dataset.uapId) {
                    const uapId = selected.dataset.uapId;
                    this.game.saveData.selectedUAP = uapId;
                    SaveManager.save(this.game.saveData);
                    this.game.playSound?.('select');
                    this.showScreen('menu');
                }
            });
        }
    }
    
    // =====================================================
    // AUTHENTICATION UI
    // =====================================================
    setupAuthUI() {
        const loginBtn = document.getElementById('btn-login');
        const logoutBtn = document.getElementById('btn-logout');
        const closeLoginBtn = document.getElementById('btn-close-login');
        const loginModal = document.getElementById('login-modal');
        
        // Open login modal
        loginBtn?.addEventListener('click', () => {
            this.game.playSound?.('click');
            loginModal?.classList.remove('hidden');
        });
        
        // Open login modal from Records tab
        document.querySelectorAll('.btn-show-login').forEach(btn => {
            btn.addEventListener('click', () => {
                this.game.playSound?.('click');
                loginModal?.classList.remove('hidden');
            });
        });
        
        // Close login modal
        closeLoginBtn?.addEventListener('click', () => {
            this.game.playSound?.('click');
            loginModal?.classList.add('hidden');
            document.getElementById('auth-error')?.classList.add('hidden');
        });
        
        // Click outside to close
        loginModal?.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.add('hidden');
                document.getElementById('auth-error')?.classList.add('hidden');
            }
        });
        
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.game.playSound?.('click');
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabId = tab.dataset.tab;
                document.getElementById('signin-form')?.classList.toggle('hidden', tabId !== 'signin');
                document.getElementById('signup-form')?.classList.toggle('hidden', tabId !== 'signup');
                document.getElementById('auth-error')?.classList.add('hidden');
            });
        });
        
        // Sign in submit
        document.getElementById('btn-signin-submit')?.addEventListener('click', async () => {
            const email = document.getElementById('signin-email')?.value;
            const password = document.getElementById('signin-password')?.value;
            
            if (!email || !password) {
                this.showAuthError('Please enter email and password');
                return;
            }
            
            const { error } = await window.supabaseService?.signIn(email, password);
            if (error) {
                this.showAuthError(error.message);
            } else {
                loginModal?.classList.add('hidden');
                this.game.playSound?.('select');
                this.updateAuthUI();
                this.populateLeaderboard();
            }
        });
        
        // Sign up submit
        document.getElementById('btn-signup-submit')?.addEventListener('click', async () => {
            const name = document.getElementById('signup-name')?.value;
            const email = document.getElementById('signup-email')?.value;
            const password = document.getElementById('signup-password')?.value;
            
            if (!email || !password) {
                this.showAuthError('Please enter email and password');
                return;
            }
            
            if (password.length < 6) {
                this.showAuthError('Password must be at least 6 characters');
                return;
            }
            
            const { error } = await window.supabaseService?.signUp(email, password, name);
            if (error) {
                this.showAuthError(error.message);
            } else {
                this.showAuthError('Check your email to confirm your account!', 'success');
                this.game.playSound?.('select');
            }
        });
        
        // Logout
        logoutBtn?.addEventListener('click', async () => {
            this.game.playSound?.('click');
            await window.supabaseService?.signOut();
            this.updateAuthUI();
            this.populateLeaderboard();
        });
        
        // Listen for auth state changes
        window.addEventListener('authStateChanged', () => {
            this.updateAuthUI();
            this.populateLeaderboard();
        });
    }
    
    showAuthError(message, type = 'error') {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            if (type === 'success') {
                errorEl.style.borderColor = 'rgba(0, 255, 100, 0.4)';
                errorEl.style.color = '#00ff66';
                errorEl.style.background = 'rgba(0, 255, 100, 0.1)';
            } else {
                errorEl.style.borderColor = 'rgba(255, 50, 50, 0.4)';
                errorEl.style.color = '#ff6666';
                errorEl.style.background = 'rgba(255, 50, 50, 0.1)';
            }
        }
    }
    
    updateAuthUI() {
        const loggedOut = document.getElementById('user-logged-out');
        const loggedIn = document.getElementById('user-logged-in');
        const displayName = document.getElementById('user-display-name');
        
        const user = window.supabaseService?.getUser();
        
        if (user) {
            loggedOut?.classList.add('hidden');
            loggedIn?.classList.remove('hidden');
            if (displayName) {
                displayName.textContent = window.supabaseService.getDisplayName();
            }
        } else {
            loggedOut?.classList.remove('hidden');
            loggedIn?.classList.add('hidden');
        }
    }

    showScreen(screen) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        // Toggle overlays visibility (for browsers without :has() support)
        const fogOverlay = document.getElementById('fog-overlay');
        const scanlinesOverlay = document.getElementById('scanlines-overlay');
        const minimapContainer = document.getElementById('minimap-container');
        const isMenuScreen = screen === 'menu';
        const isGameScreen = screen === 'game';
        
        if (fogOverlay) fogOverlay.style.opacity = isMenuScreen ? '1' : '0';
        if (scanlinesOverlay) scanlinesOverlay.style.opacity = isMenuScreen ? '1' : '0';
        
        // Show/hide radar only during gameplay
        if (minimapContainer) {
            minimapContainer.style.display = isGameScreen ? 'block' : 'none';
        }
        
        // Show requested screen
        switch (screen) {
            case 'menu':
                this.elements.mainMenu.classList.add('active');
                this.populateLeaderboard(); // Update leaderboard when returning to menu
                break;
            case 'hangar':
                this.elements.hangarScreen.classList.add('active');
                break;
            case 'upgrades':
                this.elements.upgradesScreen.classList.add('active');
                break;
            case 'records':
                this.elements.recordsScreen.classList.add('active');
                break;
            case 'settings':
                this.elements.settingsScreen.classList.add('active');
                break;
            case 'codex':
                this.elements.codexScreen.classList.add('active');
                break;
            case 'game':
                this.elements.gameScreen.classList.add('active');
                break;
            case 'gameover':
                this.elements.gameoverScreen.classList.add('active');
                break;
            case 'loading':
                this.elements.loadingScreen.classList.add('active');
                break;
        }
    }
    
    // =====================================================
    // DIFFICULTY SELECTION MODAL - Streamlined Version
    // =====================================================
    showDifficultyModal() {
        const modal = document.getElementById('difficulty-modal');
        const grid = document.getElementById('difficulty-grid');
        const startBtn = document.getElementById('btn-start-mission');
        const modifiersGrid = document.getElementById('modifiers-grid');
        const durationOptions = document.getElementById('duration-options');
        
        if (!modal || !grid) {
            console.error('Difficulty modal elements not found');
            return;
        }
        
        // Default selections
        this.selectedDifficulty = 'normal';
        this.selectedModifiers = [];
        this.selectedDuration = 'short';
        
        // Ultimate selection setup
        this.setupUltimateSelector();
        
        if (startBtn) {
            startBtn.disabled = false;
        }
        
        // Set up duration pills
        if (durationOptions) {
            const durationBtns = durationOptions.querySelectorAll('.duration-pill');
            durationBtns.forEach(btn => {
                btn.classList.remove('selected');
                if (btn.dataset.duration === this.selectedDuration) {
                    btn.classList.add('selected');
                }
                btn.onclick = () => {
                    durationBtns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.selectedDuration = btn.dataset.duration;
                    this.game.playSound?.('click');
                };
            });
        }
        
        // Build difficulty cards (horizontal)
        const data = this.game.saveData;
        const tiers = typeof DIFFICULTY_TIERS !== 'undefined' ? DIFFICULTY_TIERS : {};
        
        let html = '';
        for (const [id, diff] of Object.entries(tiers)) {
            const isUnlocked = this.isDifficultyUnlocked(id, data);
            const isSelected = (id === 'normal' && isUnlocked);
            const iconContent = id === 'apocalypse' ? '☢' : '';
            const rewardMult = diff.rewards?.currencyMultiplier || 1;
            const multText = rewardMult > 1 ? `${rewardMult}x` : '';
            
            html += `
                <div class="diff-card ${isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''}" 
                     data-difficulty="${id}" 
                     style="--diff-color: ${diff.color}">
                    <div class="diff-card-icon">${iconContent}</div>
                    <div class="diff-card-name">${diff.name}</div>
                    ${multText ? `<div class="diff-card-mult">${multText}</div>` : ''}
                    ${!isUnlocked ? `<span class="diff-card-lock">🔒</span>` : ''}
                </div>
            `;
        }
        grid.innerHTML = html;
        
        // Add click handlers for difficulty
        grid.querySelectorAll('.diff-card').forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('locked')) {
                    this.game.playSound?.('error');
                    return;
                }
                
                this.game.playSound?.('click');
                this.selectedDifficulty = card.dataset.difficulty;
                
                grid.querySelectorAll('.diff-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
        
        // Build modifier chips
        if (modifiersGrid && typeof RUN_MODIFIERS !== 'undefined') {
            this.populateModifierChips(modifiersGrid, data);
        }
        
        // Update counter
        this.updateModifierCount();
        
        // Show modal
        modal.classList.remove('hidden');
    }
    
    populateModifierChips(grid, data) {
        let html = '';
        
        for (const [id, mod] of Object.entries(RUN_MODIFIERS)) {
            const isUnlocked = this.isModifierUnlocked(mod, data);
            const bonusText = mod.rewards?.currencyBonus 
                ? `+${Math.round(mod.rewards.currencyBonus * 100)}%` 
                : '';
            
            html += `
                <div class="mod-chip ${isUnlocked ? '' : 'locked'}" 
                     data-modifier="${id}"
                     data-description="${mod.description.replace(/"/g, '&quot;')}"
                     title="${mod.description}">
                    <span class="mod-chip-icon">${mod.icon}</span>
                    <span class="mod-chip-name">${mod.name}</span>
                    ${bonusText ? `<span class="mod-chip-bonus">${bonusText}</span>` : ''}
                </div>
            `;
        }
        
        grid.innerHTML = html;
        
        // Create tooltip
        let tooltip = document.querySelector('.modifier-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'modifier-tooltip';
            document.body.appendChild(tooltip);
        }
        
        // Add handlers
        grid.querySelectorAll('.mod-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (chip.classList.contains('locked')) {
                    this.game.playSound?.('error');
                    return;
                }
                
                const modId = chip.dataset.modifier;
                const idx = this.selectedModifiers.indexOf(modId);
                
                if (idx >= 0) {
                    this.selectedModifiers.splice(idx, 1);
                    chip.classList.remove('selected');
                    this.game.playSound?.('click');
                } else {
                    if (this.selectedModifiers.length >= 3) {
                        this.showWarning('Maximum 3 modifiers', 'warning');
                        this.game.playSound?.('error');
                        return;
                    }
                    this.selectedModifiers.push(modId);
                    chip.classList.add('selected');
                    this.game.playSound?.('select');
                }
                
                this.updateModifierCount();
            });
            
            // Hover tooltip
            chip.addEventListener('mouseenter', (e) => {
                const modId = chip.dataset.modifier;
                const mod = RUN_MODIFIERS[modId];
                if (!mod) return;
                
                let effectsHtml = '';
                if (mod.effects) {
                    for (const [key, val] of Object.entries(mod.effects)) {
                        const label = this.formatEffectLabel(key);
                        const isDebuff = key.includes('Taken') || (key.includes('Speed') && val < 1) || val > 1.2;
                        const valStr = val < 1 ? `-${Math.round((1-val)*100)}%` : `+${Math.round((val-1)*100)}%`;
                        effectsHtml += `<div class="modifier-tooltip-effect ${isDebuff ? 'debuff' : 'buff'}">
                            <span>${label}</span><span>${valStr}</span>
                        </div>`;
                    }
                }
                
                tooltip.innerHTML = `
                    <div class="modifier-tooltip-name">${mod.name}</div>
                    <div class="modifier-tooltip-desc">${mod.description}</div>
                    ${effectsHtml ? `<div class="modifier-tooltip-effects">${effectsHtml}</div>` : ''}
                `;
                
                const rect = chip.getBoundingClientRect();
                tooltip.style.left = `${rect.left}px`;
                tooltip.style.top = `${rect.bottom + 8}px`;
                
                requestAnimationFrame(() => {
                    const ttRect = tooltip.getBoundingClientRect();
                    if (ttRect.right > window.innerWidth - 10) {
                        tooltip.style.left = `${window.innerWidth - ttRect.width - 10}px`;
                    }
                    if (ttRect.bottom > window.innerHeight - 10) {
                        tooltip.style.top = `${rect.top - ttRect.height - 8}px`;
                    }
                });
                
                tooltip.classList.add('visible');
            });
            
            chip.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });
    }
    
    updateModifierCount() {
        const counter = document.getElementById('modifier-count');
        if (counter) {
            counter.textContent = this.selectedModifiers?.length || 0;
        }
    }
    
    // Legacy method redirects
    setupMissionTabs() { }
    updateModifierBadge() { this.updateModifierCount(); }
    populateModifiersGrid(grid, data) { this.populateModifierChips(grid, data); }
    
    formatEffectLabel(key) {
        const labels = {
            playerDamage: 'Your Damage',
            playerDamageTaken: 'Damage Taken',
            playerSpeed: 'Move Speed',
            timeScale: 'Game Speed',
            xpDropRate: 'XP Drops',
            spawnRate: 'Spawn Rate',
            enemyHealth: 'Enemy Health',
            pickupRadius: 'Pickup Radius',
            enemyAggro: 'Enemy Aggro',
            critChance: 'Crit Chance',
            baseDamage: 'Base Damage',
            evolutionRequirement: 'Evolution Req',
            weaponDamage: 'Weapon Damage'
        };
        return labels[key] || key;
    }
    
    isModifierUnlocked(mod, data) {
        if (!mod.unlockRequirement) return true;
        
        const req = mod.unlockRequirement;
        const stats = data.stats || {};
        
        switch (req.type) {
            case 'runs_completed':
                return (stats.runsCompleted || 0) >= req.value;
            case 'level_reached':
                return (stats.highestLevel || 0) >= req.value;
            case 'kills':
                return (stats.totalKills || 0) >= req.value;
            default:
                return true;
        }
    }
    
    getModifierColor(category) {
        const colors = {
            risk: '#ff6600',
            challenge: '#ff3366',
            fun: '#00ff88',
            special: '#aa66ff'
        };
        return colors[category] || '#888888';
    }
    
    hideDifficultyModal() {
        const modal = document.getElementById('difficulty-modal');
        if (modal) modal.classList.add('hidden');
    }
    
    // =====================================================
    // ULTIMATE SELECTION - Sci-Fi themed R-key power-ups
    // =====================================================
    setupUltimateSelector() {
        // Get ultimate list
        this.ultimateList = typeof ULTIMATES !== 'undefined' ? Object.keys(ULTIMATES) : ['droplet'];
        
        // Load saved selection or default
        this.selectedUltimate = this.game.saveData?.selectedUltimate || DEFAULT_ULTIMATE || 'droplet';
        this.ultimateIndex = this.ultimateList.indexOf(this.selectedUltimate);
        if (this.ultimateIndex < 0) this.ultimateIndex = 0;
        
        // Get UI elements
        const prevBtn = document.getElementById('ultimate-prev');
        const nextBtn = document.getElementById('ultimate-next');
        
        // Set up navigation (only once)
        if (prevBtn && !prevBtn._ultimateHandler) {
            prevBtn._ultimateHandler = true;
            prevBtn.addEventListener('click', () => this.cycleUltimate(-1));
        }
        if (nextBtn && !nextBtn._ultimateHandler) {
            nextBtn._ultimateHandler = true;
            nextBtn.addEventListener('click', () => this.cycleUltimate(1));
        }
        
        // Display current selection
        this.updateUltimateDisplay();
    }
    
    cycleUltimate(direction) {
        this.ultimateIndex += direction;
        
        // Wrap around
        if (this.ultimateIndex < 0) this.ultimateIndex = this.ultimateList.length - 1;
        if (this.ultimateIndex >= this.ultimateList.length) this.ultimateIndex = 0;
        
        this.selectedUltimate = this.ultimateList[this.ultimateIndex];
        
        // Save selection
        this.game.saveData.selectedUltimate = this.selectedUltimate;
        SaveManager.save(this.game.saveData);
        
        this.game.playSound?.('click');
        this.updateUltimateDisplay();
    }
    
    updateUltimateDisplay() {
        const ultimate = ULTIMATES?.[this.selectedUltimate];
        if (!ultimate) return;
        
        const iconEl = document.getElementById('ultimate-icon');
        const nameEl = document.getElementById('ultimate-name');
        const sourceEl = document.getElementById('ultimate-source');
        const descEl = document.getElementById('ultimate-desc');
        const displayEl = document.querySelector('.ultimate-display');
        
        if (iconEl) iconEl.textContent = ultimate.icon;
        if (nameEl) nameEl.textContent = ultimate.name;
        if (sourceEl) sourceEl.textContent = ultimate.source;
        if (descEl) descEl.textContent = ultimate.description;
        
        // Update color scheme
        if (displayEl) {
            displayEl.style.borderColor = ultimate.color;
            displayEl.style.boxShadow = `0 0 15px ${ultimate.color}40, inset 0 0 20px ${ultimate.color}20`;
        }
        if (iconEl) {
            iconEl.style.color = ultimate.color;
        }
    }
    
    // Get the currently selected ultimate data
    getSelectedUltimate() {
        return ULTIMATES?.[this.selectedUltimate] || ULTIMATES?.droplet;
    }
    
    isDifficultyUnlocked(diffId, data) {
        const diff = DIFFICULTY_TIERS?.[diffId];
        if (!diff) return false;
        
        // Normal is always unlocked
        if (!diff.unlockRequirement) return true;
        
        const req = diff.unlockRequirement;
        const stats = data.stats || {};
        const collections = data.collections || {};
        
        switch (req.type) {
            case 'collection_percent':
                // Requires X% of codex collection
                // For now, simplified - always unlocked if they have played enough
                return (stats.runsCompleted || 0) >= 5;
                
            case 'level_reached':
                return (stats.highestLevel || 0) >= req.value;
                
            case 'codex_complete':
                // Requires full codex - check if they have many items
                const totalCollected = Object.values(collections).reduce((sum, arr) => sum + (arr?.length || 0), 0);
                return totalCollected >= 50;
                
            default:
                return true;
        }
    }
    
    getDifficultyUnlockText(diff) {
        if (!diff.unlockRequirement) return '';
        
        const req = diff.unlockRequirement;
        switch (req.type) {
            case 'collection_percent':
                return `Complete 5 runs`;
            case 'level_reached':
                return `Reach level ${req.value}`;
            case 'codex_complete':
                return 'Complete the codex';
            default:
                return 'Locked';
        }
    }
    
    showDifficultyDetails(diffId) {
        const details = document.getElementById('difficulty-details');
        const tiers = typeof DIFFICULTY_TIERS !== 'undefined' ? DIFFICULTY_TIERS : {};
        const diff = tiers[diffId];
        
        if (!details || !diff) {
            if (details) details.innerHTML = '<p class="difficulty-hint">Select difficulty</p>';
            return;
        }
        
        const mods = diff.modifiers;
        const rewards = diff.rewards;
        
        // Format multiplier display
        const formatMult = (val) => val === 1 ? '100%' : `${(val * 100).toFixed(0)}%`;
        const formatReward = (val) => val === 1 ? '1x' : `${val}x`;
        
        // Clean grouped format
        details.innerHTML = `
            <div class="details-group">
                <div class="details-group-title">Difficulty</div>
                <div class="stat-row">
                    <span class="stat-label">ENEMIES</span>
                    <span class="stat-value ${mods.enemyHealth > 1 ? 'debuff' : 'neutral'}">${formatMult(mods.enemyHealth)} HP</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">DAMAGE</span>
                    <span class="stat-value ${mods.enemyDamage > 1 ? 'debuff' : 'neutral'}">${formatMult(mods.enemyDamage)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">SPAWNS</span>
                    <span class="stat-value ${mods.spawnRate > 1 ? 'debuff' : 'neutral'}">${formatMult(mods.spawnRate)}</span>
                </div>
            </div>
            <div class="details-group">
                <div class="details-group-title">Rewards</div>
                <div class="stat-row">
                    <span class="stat-label">XP</span>
                    <span class="stat-value ${rewards.xpMultiplier > 1 ? 'buff' : 'neutral'}">${formatReward(rewards.xpMultiplier)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">CURRENCY</span>
                    <span class="stat-value ${rewards.currencyMultiplier > 1 ? 'buff' : 'neutral'}">${formatReward(rewards.currencyMultiplier)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">LOOT</span>
                    <span class="stat-value ${rewards.lootQuality > 1 ? 'buff' : 'neutral'}">${formatReward(rewards.lootQuality)}</span>
                </div>
            </div>
        `;
    }
    
    updateMenuStats() {
        const data = this.game.saveData;
        const stats = data.stats || {};
        
        if (this.elements.menuCurrency) {
            this.elements.menuCurrency.textContent = Utils.formatNumber(data.currency);
        }
        if (this.elements.menuBestTime) {
            this.elements.menuBestTime.textContent = data.bestTime > 0 ? Utils.formatTime(data.bestTime) : '--:--';
        }
        if (this.elements.menuTotalRuns) {
            this.elements.menuTotalRuns.textContent = Utils.formatNumber(stats.runsAttempted || 0);
        }
        if (this.elements.menuTotalKills) {
            this.elements.menuTotalKills.textContent = Utils.formatNumber(stats.totalKills || 0);
        }
    }
    
    toggleMasterSound() {
        const settings = this.game.saveData?.settings || {};
        const isMuted = settings.masterVolume === 0;
        
        // Ensure settings object exists
        if (!this.game.saveData.settings) {
            this.game.saveData.settings = {};
        }
        
        if (isMuted) {
            // Unmute - restore to previous volume or default
            const previousVolume = this.previousMasterVolume || 1;
            this.game.saveData.settings.masterVolume = previousVolume;
            if (this.game.sound) {
                this.game.sound.setMasterVolume(previousVolume);
            }
        } else {
            // Mute - save current volume and set to 0
            this.previousMasterVolume = settings.masterVolume || 1;
            this.game.saveData.settings.masterVolume = 0;
            if (this.game.sound) {
                this.game.sound.setMasterVolume(0);
            }
        }
        
        // Save to localStorage
        SaveManager.save(this.game.saveData);
        
        // Play click sound (if unmuting)
        if (isMuted) {
            this.game.playSound?.('click');
        }
        
        this.updateSoundToggleState();
    }
    
    updateSoundToggleState() {
        const settings = this.game.saveData?.settings || {};
        const isMuted = settings.masterVolume === 0;
        const soundToggle = document.getElementById('sound-toggle');
        const soundIcon = document.getElementById('sound-icon');
        
        if (soundToggle) {
            soundToggle.classList.toggle('muted', isMuted);
        }
        if (soundIcon) {
            soundIcon.textContent = isMuted ? '🔇' : '🔊';
        }
    }
    
    updateHUD() {
        if (!this.game.player || !this.game.spawner) return;
        
        const player = this.game.player;
        const gameTime = this.game.gameTime || 0;
        
        // Safety check for FLIR elements
        if (!this.elements.flirTime) return;
        
        // === FLIR Time Display (with milliseconds) ===
        const hours = Math.floor(gameTime / 3600);
        const mins = Math.floor((gameTime % 3600) / 60);
        const secs = Math.floor(gameTime % 60);
        const ms = Math.floor((gameTime % 1) * 100);
        this.elements.flirTime.textContent = 
            `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        
        // === GPS Coordinates (simulated based on player position) ===
        const worldScale = 0.0001; // Scale world coords to lat/lon change
        const lat = this.flirData.baseLat + (player.y - 2000) * worldScale * 0.5;
        const lon = this.flirData.baseLon + (player.x - 2000) * worldScale;
        if (this.elements.flirCoords) this.elements.flirCoords.textContent = this.formatGPS(lat, lon);
        
        // === Altitude (varies with boost) ===
        const altVariance = player.isBoosting ? 2000 : 500;
        const alt = this.flirData.baseAlt + Math.sin(gameTime * 0.5) * altVariance;
        if (this.elements.flirAlt) this.elements.flirAlt.textContent = `ALT: ${Math.floor(alt).toLocaleString()} FT`;
        
        // === Heading (based on player movement direction) ===
        let heading = 0;
        if (player.vx !== 0 || player.vy !== 0) {
            heading = (Math.atan2(player.vy, player.vx) * 180 / Math.PI + 90 + 360) % 360;
            this.flirData.lastHeading = heading;
        } else {
            heading = this.flirData.lastHeading;
        }
        if (this.elements.flirHeading) this.elements.flirHeading.textContent = `HDG: ${Math.floor(heading).toString().padStart(3, '0')}°`;
        
        // === Find closest enemy for bearing/range ===
        this.findClosestEnemy(player);
        
        if (this.flirData.closestEnemy && this.flirData.closestDist < 800) {
            const enemy = this.flirData.closestEnemy;
            const bearing = (Math.atan2(enemy.y - player.y, enemy.x - player.x) * 180 / Math.PI + 90 + 360) % 360;
            if (this.elements.flirBearing) this.elements.flirBearing.textContent = `BRG: ${Math.floor(bearing).toString().padStart(3, '0')}°`;
            if (this.elements.flirRange) this.elements.flirRange.textContent = `RNG: ${Math.floor(this.flirData.closestDist)} M`;
            
            // Closure rate - based on how fast enemy is approaching
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Calculate relative velocity toward player
            const enemyVelToward = enemy.vx ? -(enemy.vx * dx + enemy.vy * dy) / dist : enemy.speed || 100;
            const closure = Math.max(0, Math.floor(enemyVelToward * 0.5)); // Scale to knots-ish
            if (this.elements.flirClosure) this.elements.flirClosure.textContent = `CLOS: ${closure} KTS`;
        } else {
            if (this.elements.flirBearing) this.elements.flirBearing.textContent = `BRG: ---°`;
            if (this.elements.flirRange) this.elements.flirRange.textContent = `RNG: ---- M`;
            if (this.elements.flirClosure) this.elements.flirClosure.textContent = `CLOS: --- KTS`;
        }
        
        // === Track count (active enemies) ===
        const activeEnemies = this.game.enemyPool ? this.game.enemyPool.getActive().length : 0;
        if (this.elements.flirTrack) this.elements.flirTrack.textContent = activeEnemies.toString().padStart(2, '0');
        
        // === Phase indicator (from hunted UFO perspective) ===
        const phase = this.game.spawner.getCurrentPhase();
        const phaseNames = ['DETECTED', 'ENGAGED', 'REINFORCED', 'SCRAMBLE', 'CONTAINMENT'];
        if (this.elements.flirPhase) {
            this.elements.flirPhase.textContent = `${phaseNames[phase]}`;
            this.elements.flirPhase.style.color = PHASES[phase].color;
            this.elements.flirPhase.style.textShadow = `0 0 8px ${PHASES[phase].color}`;
        }
        
        // === Next Phase countdown ===
        this.updatePhaseWarning(gameTime, phase, phaseNames);
        
        // === Weapons status ===
        const weaponCount = player.weapons.length;
        if (this.elements.flirWeapons) this.elements.flirWeapons.textContent = weaponCount > 0 ? `SYS: ${weaponCount} ACTIVE` : `SYS: NOMINAL`;
        
        // === Level and XP ===
        if (this.elements.flirLevel) this.elements.flirLevel.textContent = `PWR LVL: ${player.level.toString().padStart(2, '0')}`;
        if (this.elements.flirXp) this.elements.flirXp.textContent = `XP: ${Math.floor(player.xp).toString().padStart(3, '0')}/${player.xpToLevel}`;
        
        // === Neutralized count ===
        if (this.elements.flirNeutralized) this.elements.flirNeutralized.textContent = this.game.kills.toString().padStart(4, '0');
        
        // === Radar Sites Remaining ===
        const sitesEl = document.getElementById('sites-remaining');
        if (sitesEl && this.game.radarSiteManager) {
            const totalSites = this.game.radarSiteManager.sites.length;
            const activeSites = this.game.radarSiteManager.getActiveSiteCount();
            sitesEl.textContent = `${totalSites - activeSites}/${totalSites}`;
            // Change color based on progress
            const parent = sitesEl.parentElement;
            if (parent) {
                if (activeSites === 0) {
                    parent.style.color = '#00ff00';
                } else if (activeSites < totalSites / 2) {
                    parent.style.color = '#ffcc00';
                } else {
                    parent.style.color = '#ff8800';
                }
            }
        }
        
        // === Classification based on UAP type ===
        const classMap = {
            'tictac': 'UAP/TT',
            'ticTac': 'UAP/TT',
            'triangle': 'UAP/TR',
            'sphere': 'UAP/SP',
            'orb': 'UAP/OR',
            'saucer': 'UAP/SC',
            'cigar': 'UAP/CG',
            'adamski': 'UAP/AD',
            'jellyfish': 'UAP/JF',
            'cube': 'UAP/CB',
            'gimbal': 'UAP/GB',
            'goFast': 'UAP/GF'
        };
        if (this.elements.flirClassification) this.elements.flirClassification.textContent = `CLASS: ${classMap[player.uapType] || 'UAP/UK'}`;
        
        // === Health bar ===
        const healthPercent = (player.health / player.stats.maxHealth) * 100;
        if (this.elements.flirHealthFill) {
            this.elements.flirHealthFill.style.height = `${healthPercent}%`;
            // Health color changes based on level
            if (healthPercent < 25) {
                this.elements.flirHealthFill.style.background = '#ff0000';
                this.elements.flirHealthFill.style.boxShadow = '0 0 8px #ff0000';
            } else if (healthPercent < 50) {
                this.elements.flirHealthFill.style.background = '#ffaa00';
                this.elements.flirHealthFill.style.boxShadow = '0 0 8px #ffaa00';
            } else {
                this.elements.flirHealthFill.style.background = '#00ff00';
                this.elements.flirHealthFill.style.boxShadow = '0 0 8px #00ff00';
            }
        }
        if (this.elements.flirHealthValue) this.elements.flirHealthValue.textContent = Math.ceil(player.health);
        
        // === NEW BOTTOM HUD Health Bar ===
        const bottomHealthFill = document.getElementById('bottom-health-fill');
        const bottomHealthValue = document.getElementById('bottom-health-value');
        const healthBar = document.querySelector('.bar-hp') || document.querySelector('.hud-bar.health') || document.querySelector('.health-bar');
        const criticalVignette = document.getElementById('health-critical-vignette');
        
        if (bottomHealthFill) {
            bottomHealthFill.style.width = `${healthPercent}%`;
        }
        if (bottomHealthValue) {
            bottomHealthValue.textContent = `${Math.ceil(player.health)}/${Math.ceil(player.stats.maxHealth)}`;
        }
        
        // === NEW Dashboard Health Bar ===
        if (this.elements.dashHealthFill) {
            this.elements.dashHealthFill.style.width = `${healthPercent}%`;
        }
        if (this.elements.dashHealthValue) {
            this.elements.dashHealthValue.textContent = Math.ceil(player.health);
        }
        // Dashboard health bar container for critical states
        const dashHealthBar = document.querySelector('.wing-left .health-bar');
        if (dashHealthBar) {
            const isCritical = healthPercent < 25;
            const isLow = healthPercent >= 25 && healthPercent < 50;
            dashHealthBar.classList.toggle('critical', isCritical);
            dashHealthBar.classList.toggle('low', isLow);
        }
        
        if (healthBar) {
            // Three states: normal (>50%), low (25-50%), critical (<25%)
            const isCritical = healthPercent < 25;
            const isLow = healthPercent >= 25 && healthPercent < 50;
            healthBar.classList.toggle('critical', isCritical);
            healthBar.classList.toggle('low', isLow);
            
            // Critical screen vignette effect
            if (criticalVignette) {
                criticalVignette.classList.toggle('active', isCritical);
            }
        }
        
        // === Boost bar (legacy FLIR side panel) ===
        const boostPercent = (player.boostEnergy / player.boostMaxEnergy) * 100;
        if (this.elements.flirBoostFill) {
            this.elements.flirBoostFill.style.height = `${boostPercent}%`;
            // Boost visual feedback
            if (player.isBoosting) {
                this.elements.flirBoostFill.style.background = '#00ffff';
                this.elements.flirBoostFill.style.boxShadow = '0 0 12px #00ffff';
            } else {
                this.elements.flirBoostFill.style.background = '#00ccff';
                this.elements.flirBoostFill.style.boxShadow = '0 0 8px #00ccff';
            }
        }
        if (this.elements.flirBoostValue) this.elements.flirBoostValue.textContent = Math.ceil(player.boostEnergy);
        
        // === NEW Dashboard Energy Bar ===
        if (this.elements.dashEnergyFill) {
            this.elements.dashEnergyFill.style.width = `${boostPercent}%`;
        }
        if (this.elements.dashEnergyValue) {
            this.elements.dashEnergyValue.textContent = Math.ceil(player.boostEnergy);
        }
        
        // === NEW BOTTOM HUD XP Bar ===
        const xpPercent = (player.xp / player.xpToLevel) * 100;
        const bottomXpFill = document.getElementById('bottom-xp-fill');
        const bottomXpLevel = document.getElementById('bottom-xp-level');
        const bottomXpValue = document.getElementById('bottom-xp-value');
        if (bottomXpFill) {
            bottomXpFill.style.width = `${xpPercent}%`;
        }
        if (bottomXpLevel) {
            bottomXpLevel.textContent = player.level;
        }
        if (bottomXpValue) {
            bottomXpValue.textContent = `${Math.floor(xpPercent)}%`;
        }
        
        // === NEW Dashboard XP Bar ===
        if (this.elements.dashLevel) {
            this.elements.dashLevel.textContent = `LV ${player.level}`;
        }
        if (this.elements.dashXpFill) {
            this.elements.dashXpFill.style.width = `${xpPercent}%`;
        }
        if (this.elements.dashXpPercent) {
            this.elements.dashXpPercent.textContent = `${Math.floor(xpPercent)}%`;
        }
        
        // === Gold/Currency display ===
        const goldEl = document.getElementById('stat-gold');
        if (goldEl) {
            goldEl.textContent = Utils.formatNumber(this.game.currency || 0);
        }
        
        // === NEW Dashboard Stats ===
        if (this.elements.dashKills) {
            this.elements.dashKills.textContent = Utils.formatNumber(this.game.kills || 0);
        }
        if (this.elements.dashGold) {
            this.elements.dashGold.textContent = Utils.formatNumber(this.game.currency || 0);
        }
        if (this.elements.dashShips && this.game.radarSiteManager) {
            const totalSites = this.game.radarSiteManager.sites.length;
            const activeSites = this.game.radarSiteManager.getActiveSiteCount();
            this.elements.dashShips.textContent = `${totalSites - activeSites}/${totalSites}`;
        }
        
        // === Update Low Health Warning ===
        this.updateLowHealthWarning(healthPercent / 100);
        
        // Weapons
        this.updateWeaponSlots();
        
        // Abilities (1-5 keys)
        this.updateAbilityBar();
        
        // Power-ups (Q, E, F keys)
        this.updatePowerupBar();
        
        // Real-time stats panel
        this.updateStatsPanel();
        
        // Active drops tracker
        this.updateDropsTracker();
    }
    
    // Milestone thresholds for each stat (points awarded per threshold: 5, 10, 15, 20, 25 pts)
    milestones = {
        dps: [100, 300, 600, 1000, 2000],
        damage: [5000, 25000, 100000, 500000, 2000000],
        kills: [50, 150, 400, 800, 1500],
        elite: [5, 15, 35, 60, 100],
        boss: [1, 3, 6, 10, 15],
        xp: [1000, 5000, 20000, 80000, 250000]
    };
    
    // Per-stat ranks
    rankLabels = ['-', 'D', 'C', 'B', 'A', 'S', 'SS'];
    rankClasses = ['', 'rank-d', 'rank-c', 'rank-b', 'rank-a', 'rank-s', 'rank-ss'];
    
    // UFO/Alien themed pilot rank system
    pilotRanks = [
        { name: 'OBSERVER', badge: '👁️', minPts: 0, class: 'rank-observer', icon: '○' },
        { name: 'TRACKER', badge: '🔍', minPts: 40, class: 'rank-tracker', icon: '◎' },
        { name: 'HUNTER', badge: '🎯', minPts: 100, class: 'rank-hunter', icon: '◉' },
        { name: 'INTERCEPTOR', badge: '⚡', minPts: 180, class: 'rank-interceptor', icon: '◈' },
        { name: 'ELIMINATOR', badge: '💀', minPts: 280, class: 'rank-eliminator', icon: '◆' },
        { name: 'SPECIALIST', badge: '🔬', minPts: 400, class: 'rank-specialist', icon: '★' },
        { name: 'AGENT', badge: '🕵️', minPts: 550, class: 'rank-agent', icon: '✦' },
        { name: 'DIRECTOR', badge: '📡', minPts: 720, class: 'rank-director', icon: '✧' },
        { name: 'COMMANDER', badge: '🛸', minPts: 920, class: 'rank-commander', icon: '❖' },
        { name: 'UFOLOGIST', badge: '👽', minPts: 1150, class: 'rank-ufologist', icon: '✪' },
        { name: 'LEGEND', badge: '🌟', minPts: 1400, class: 'rank-legend', icon: '✵' }
    ];
    
    // Phase warning tracking
    lastPhase = -1;
    phaseWarningShown = false;
    
    updatePhaseWarning(gameTime, currentPhase, phaseNames) {
        const nextPhaseEl = document.getElementById('flir-next-phase');
        const warningEl = document.getElementById('phase-warning');
        const warningNameEl = document.getElementById('phase-warning-name');
        const warningCountdownEl = document.getElementById('phase-warning-countdown');
        const warningFillEl = document.getElementById('phase-warning-fill');
        
        // Check for phase transition
        if (this.lastPhase !== -1 && this.lastPhase !== currentPhase) {
            this.triggerPhaseTransition(phaseNames[currentPhase]);
            this.phaseWarningShown = false;
        }
        this.lastPhase = currentPhase;
        
        // Find next phase
        const nextPhaseIndex = currentPhase + 1;
        
        // No next phase (final phase)
        if (nextPhaseIndex >= PHASES.length) {
            if (nextPhaseEl) {
                nextPhaseEl.textContent = '◆ FINAL PHASE ◆';
                nextPhaseEl.className = 'flir-data flir-next-phase final';
            }
            if (warningEl) warningEl.classList.add('hidden');
            return;
        }
        
        const nextPhase = PHASES[nextPhaseIndex];
        const timeToNext = nextPhase.startTime - gameTime;
        
        // Format countdown
        const mins = Math.floor(timeToNext / 60);
        const secs = Math.floor(timeToNext % 60);
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        // Update bottom-left next phase text
        if (nextPhaseEl) {
            nextPhaseEl.textContent = `WARNING: ${phaseNames[nextPhaseIndex]} IN ${timeStr}`;
            
            // Add urgency classes
            if (timeToNext <= 10) {
                nextPhaseEl.className = 'flir-data flir-next-phase imminent';
            } else if (timeToNext <= 30) {
                nextPhaseEl.className = 'flir-data flir-next-phase warning';
            } else {
                nextPhaseEl.className = 'flir-data flir-next-phase';
            }
        }
        
        // 30-second warning banner DISABLED - the epic phase announcement is enough
        // Keep the warning element hidden
        if (warningEl) {
            warningEl.classList.add('hidden');
        }
    }
    
    triggerPhaseTransition(phaseName) {
        // Create flash effect
        const flash = document.createElement('div');
        flash.className = 'phase-transition-flash';
        document.body.appendChild(flash);
        
        // Remove after animation
        setTimeout(() => {
            flash.remove();
        }, 800);
        
        if (DEBUG_MODE) console.log(`Phase transition to: ${phaseName}`);
    }
    
    // Epic full-screen phase announcement
    showPhaseAnnouncement(phaseIndex, phase) {
        // Remove any existing announcement
        const existing = document.querySelector('.phase-announcement-overlay');
        if (existing) existing.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'phase-announcement-overlay';
        
        // Phase number
        const phaseNum = document.createElement('div');
        phaseNum.className = 'phase-announcement-number';
        phaseNum.textContent = `PHASE ${phaseIndex + 1}`;
        phaseNum.style.color = phase.color;
        
        // Phase name (big text)
        const phaseName = document.createElement('div');
        phaseName.className = 'phase-announcement-name';
        phaseName.textContent = phase.name;
        phaseName.style.color = phase.color;
        phaseName.style.textShadow = `0 0 30px ${phase.color}, 0 0 60px ${phase.color}`;
        
        // Subtitle
        const subtitle = document.createElement('div');
        subtitle.className = 'phase-announcement-subtitle';
        subtitle.textContent = phase.subtitle || '';
        
        // Threat level indicator (from UFO's perspective - how dangerous is the response)
        const threat = document.createElement('div');
        threat.className = 'phase-announcement-threat';
        const threatLevels = ['LOW', 'MODERATE', 'HIGH', 'SEVERE', 'MAXIMUM'];
        threat.textContent = `RESPONSE LEVEL: ${threatLevels[phaseIndex]}`;
        threat.style.color = phase.color;
        
        // Assemble
        overlay.appendChild(phaseNum);
        overlay.appendChild(phaseName);
        overlay.appendChild(subtitle);
        overlay.appendChild(threat);
        
        document.body.appendChild(overlay);
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
        // Remove after 2.5 seconds
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.remove();
            }, 500);
        }, 2500);
    }
    
    updateStatsPanel() {
        // DPS
        const dps = Math.floor(this.game.dps || 0);
        const dpsRank = this.updateStatMetric('dps', dps);
        const dpsEl = document.getElementById('stat-dps');
        if (dpsEl) dpsEl.classList.toggle('active', dps > 0);
        
        // Total Damage Dealt
        const damage = Math.floor(this.game.totalDamageDealt || 0);
        const damageRank = this.updateStatMetric('damage', damage);
        
        // Kills
        const kills = this.game.kills || 0;
        const killsRank = this.updateStatMetric('kills', kills);
        
        // Elite Kills
        const elite = this.game.eliteKills || 0;
        const eliteRank = this.updateStatMetric('elite', elite);
        
        // Boss Kills
        const boss = this.game.bossKills || 0;
        const bossRank = this.updateStatMetric('boss', boss);
        
        // XP Collected
        const xp = Math.floor(this.game.xpCollected || 0);
        const xpRank = this.updateStatMetric('xp', xp);
        
        // Calculate pilot points from all stat ranks (0-6 each, weighted)
        const statRanks = { dps: dpsRank, damage: damageRank, kills: killsRank, elite: eliteRank, boss: bossRank, xp: xpRank };
        const weights = { dps: 1.0, damage: 1.2, kills: 1.5, elite: 2.0, boss: 3.0, xp: 0.8 };
        
        let pilotPoints = 0;
        for (const [stat, rank] of Object.entries(statRanks)) {
            // Each rank tier gives escalating points: D=10, C=25, B=45, A=70, S=100, SS=135
            const tierPoints = [0, 10, 25, 45, 70, 100, 135];
            pilotPoints += tierPoints[rank] * weights[stat];
        }
        pilotPoints = Math.floor(pilotPoints);
        
        // Update pilot rank display
        this.updatePilotRank(pilotPoints);
    }
    
    updateStatMetric(statId, value) {
        const thresholds = this.milestones[statId];
        if (!thresholds) return 0;
        
        // Update value display
        const valueEl = document.getElementById(`stat-${statId === 'damage' ? 'damage-dealt' : (statId === 'elite' ? 'elite-kills' : (statId === 'boss' ? 'boss-kills' : (statId === 'xp' ? 'xp-collected' : statId)))}`);
        if (valueEl) {
            valueEl.textContent = this.formatNumber(value);
        }
        
        // Calculate rank (0 = none, 1 = D, 2 = C, 3 = B, 4 = A, 5 = S, 6 = SS)
        let rank = 0;
        for (let i = 0; i < thresholds.length; i++) {
            if (value >= thresholds[i]) {
                rank = i + 1;
            }
        }
        // SS rank if exceeded all thresholds by 50%
        if (rank === 5 && value >= thresholds[4] * 1.5) {
            rank = 6;
        }
        
        // Update rank badge
        const rankEl = document.getElementById(`rank-${statId}`);
        if (rankEl) {
            rankEl.textContent = this.rankLabels[rank];
            this.rankClasses.forEach(cls => {
                if (cls) rankEl.classList.remove(cls);
            });
            if (this.rankClasses[rank]) {
                rankEl.classList.add(this.rankClasses[rank]);
            }
        }
        
        return rank;
    }
    
    updatePilotRank(points) {
        // Find current pilot rank
        let currentRankIndex = 0;
        for (let i = this.pilotRanks.length - 1; i >= 0; i--) {
            if (points >= this.pilotRanks[i].minPts) {
                currentRankIndex = i;
                break;
            }
        }
        
        const currentRank = this.pilotRanks[currentRankIndex];
        const nextRank = this.pilotRanks[currentRankIndex + 1];
        
        // Calculate progress to next rank
        let progress = 100;
        let progressText = `${points} PTS (MAX)`;
        
        if (nextRank) {
            const rangeStart = currentRank.minPts;
            const rangeEnd = nextRank.minPts;
            progress = ((points - rangeStart) / (rangeEnd - rangeStart)) * 100;
            progress = Math.min(100, Math.max(0, progress));
            progressText = `${points} / ${rangeEnd} PTS`;
        }
        
        // Update badge
        const badgeEl = document.getElementById('pilot-rank-badge');
        if (badgeEl) {
            badgeEl.textContent = currentRank.badge;
            // Remove all rank classes
            this.pilotRanks.forEach(r => badgeEl.classList.remove(r.class));
            badgeEl.classList.add(currentRank.class);
        }
        
        // Update name
        const nameEl = document.getElementById('pilot-rank-name');
        if (nameEl) {
            nameEl.textContent = currentRank.name;
            nameEl.className = 'pilot-rank-name ' + currentRank.class;
        }
        
        // Update progress bar
        const fillEl = document.getElementById('pilot-rank-fill');
        if (fillEl) {
            fillEl.style.width = `${progress}%`;
        }
        
        // Update progress text
        const progressEl = document.getElementById('pilot-rank-progress');
        if (progressEl) {
            progressText = nextRank ? `${points} / ${nextRank.minPts} → ${nextRank.name}` : `${points} PTS ✵ MAXED`;
            progressEl.textContent = progressText;
        }
        
        // Update milestone ladder
        this.updateMilestoneLadder(currentRankIndex, points);
    }
    
    updateMilestoneLadder(currentIndex, points) {
        const ladderEl = document.getElementById('milestone-ladder');
        if (!ladderEl) return;
        
        // Show a window of ranks around current
        const windowSize = 5;
        const startIdx = Math.max(0, currentIndex - 1);
        const endIdx = Math.min(this.pilotRanks.length - 1, startIdx + windowSize - 1);
        
        let html = '';
        for (let i = endIdx; i >= startIdx; i--) {
            const rank = this.pilotRanks[i];
            const isActive = i === currentIndex;
            const isAchieved = i < currentIndex;
            const isFuture = i > currentIndex;
            
            let statusClass = 'milestone-future';
            if (isActive) statusClass = 'milestone-active';
            else if (isAchieved) statusClass = 'milestone-achieved';
            
            html += `
                <div class="milestone-step ${statusClass} ${rank.class}">
                    <div class="milestone-icon">${rank.badge}</div>
                    <div class="milestone-info">
                        <span class="milestone-name">${rank.name}</span>
                        <span class="milestone-pts">${rank.minPts} PTS</span>
                    </div>
                    <div class="milestone-status">${isAchieved ? '✓' : (isActive ? '▶' : rank.icon)}</div>
                </div>
            `;
        }
        
        ladderEl.innerHTML = html;
    }
    
    updateDropsTracker() {
        // Use new unified active-drops element, fallback to legacy drops-list
        const activeDropsEl = document.getElementById('active-drops');
        const dropsList = document.getElementById('drops-list');
        if (!activeDropsEl && !dropsList) return;
        if (!this.game.pickups) return;
        
        const player = this.game.player;
        if (!player) return;
        
        // Get all important pickups
        const activePickups = this.game.pickups.getActive();
        const importantDrops = [];
        
        for (const pickup of activePickups) {
            // Filter for important pickup types
            const isPowerup = pickup.type.startsWith('powerup');
            const isUpgrade = pickup.type === 'upgrade';
            const isAbilityCharge = pickup.type === 'abilityCharge';
            const isPowerCore = pickup.type === 'powerCore';
            const isAbilityFragment = pickup.type === 'abilityFragment';
            const isMagnet = pickup.type === 'magnet';
            const isNuke = pickup.type === 'nuke';
            const isBomb = pickup.type === 'bomb';
            
            if (isPowerup || isUpgrade || isAbilityCharge || isPowerCore || isAbilityFragment || isMagnet || isNuke || isBomb) {
                const dist = Utils.distance(player.x, player.y, pickup.x, pickup.y);
                
                // Get display info based on type
                let name, icon, color;
                if (pickup.type === 'powerup_ultimate') {
                    const ultData = this.game.ultimateData;
                    name = ultData?.name || 'ULTIMATE';
                    icon = ultData?.icon || '⭐';
                    color = ultData?.color || '#ffaa00';
                } else if (pickup.type === 'powerup_overdrive') {
                    name = 'OVERDRIVE';
                    icon = '⚡';
                    color = '#ff6600';
                } else if (pickup.type === 'powerup_shield') {
                    name = 'SHIELD';
                    icon = '🛡️';
                    color = '#00ccff';
                } else if (pickup.type === 'powerup_chronoBurst') {
                    name = 'CHRONO';
                    icon = '⏱️';
                    color = '#aa66ff';
                } else if (pickup.type === 'powerup_phaseShift') {
                    name = 'PHASE';
                    icon = '💨';
                    color = '#ff00ff';
                } else if (isPowerup && pickup.extraData?.powerupType) {
                    const pData = POWERUPS[pickup.extraData.powerupType];
                    name = pData?.name || 'POWERUP';
                    icon = pData?.icon || '⚡';
                    color = pData?.color || '#ff6600';
                } else if (isUpgrade) {
                    if (pickup.extraData?.isPassive) {
                        const data = PASSIVE_ITEMS[pickup.extraData.id];
                        name = data?.name || 'PASSIVE';
                        icon = data?.icon || '📦';
                        color = '#aa66ff';
                    } else {
                        const data = WEAPONS[pickup.extraData?.id];
                        name = data?.name || 'WEAPON';
                        icon = data?.icon || '🔫';
                        color = data?.color || '#ffd700';
                    }
                } else if (isAbilityCharge) {
                    name = 'CHARGE';
                    icon = '🔋';
                    color = '#00ffff';
                } else if (isPowerCore) {
                    name = 'POWER CORE';
                    icon = '💜';
                    color = '#ff00ff';
                } else if (isAbilityFragment) {
                    name = 'FRAGMENT';
                    icon = '⭐';
                    color = '#ffd700';
                } else if (isMagnet) {
                    name = 'MAGNET';
                    icon = '🧲';
                    color = '#ff44ff';
                } else if (isNuke) {
                    name = 'NUKE';
                    icon = '☢️';
                    color = '#00ff00';
                } else if (isBomb) {
                    name = 'BOMB';
                    icon = '💣';
                    color = '#ff8800';
                } else {
                    continue;
                }
                
                importantDrops.push({
                    type: pickup.type,
                    name,
                    icon,
                    color,
                    dist,
                    x: pickup.x,
                    y: pickup.y,
                    lifetime: pickup.lifetime,
                    maxLifetime: pickup.type === 'upgrade' ? 15 : 60
                });
            }
        }
        
        // Sort by urgency (lower lifetime first), then by distance
        importantDrops.sort((a, b) => {
            // Upgrades have priority due to short timer
            if (a.type === 'upgrade' && b.type !== 'upgrade') return -1;
            if (b.type === 'upgrade' && a.type !== 'upgrade') return 1;
            // Then by remaining time
            if (a.lifetime !== b.lifetime) return a.lifetime - b.lifetime;
            // Then by distance
            return a.dist - b.dist;
        });
        
        // Limit to 5 entries for unified bar (more compact)
        const toShow = importantDrops.slice(0, 5);
        
        // Clear if empty
        if (toShow.length === 0) {
            if (activeDropsEl) activeDropsEl.innerHTML = '';
            if (dropsList) dropsList.innerHTML = '';
            return;
        }
        
        // Build compact HTML for unified bar
        let html = '';
        for (const drop of toShow) {
            const timeLeft = Math.max(0, drop.lifetime);
            const timePercent = timeLeft / drop.maxLifetime;
            
            // Determine urgency class
            let itemClass = '';
            if (timePercent < 0.2) {
                itemClass = 'urgent';
            } else if (timePercent < 0.4) {
                itemClass = 'warning';
            }
            
            // Format time compactly
            const timeText = timeLeft >= 60 
                ? `${Math.floor(timeLeft / 60)}:${String(Math.floor(timeLeft % 60)).padStart(2, '0')}` 
                : `${Math.ceil(timeLeft)}s`;
            
            // Calculate direction arrow
            const dx = drop.x - player.x;
            const dy = drop.y - player.y;
            const angle = Math.atan2(dy, dx);
            const arrowChar = this.getDirectionArrow(angle);
            
            html += `
                <div class="drop-item ${itemClass}" style="--drop-color: ${drop.color}">
                    <span class="drop-arrow">${arrowChar}</span>
                    <span class="drop-icon">${drop.icon}</span>
                    <span class="drop-name">${drop.name}</span>
                    <span class="drop-timer">${timeText}</span>
                </div>
            `;
        }
        
        // Update both elements (unified bar primary, legacy fallback)
        if (activeDropsEl) activeDropsEl.innerHTML = html;
        if (dropsList) dropsList.innerHTML = html;
    }
    
    getDirectionArrow(angle) {
        // Convert angle to 8-direction arrow
        // angle is in radians, 0 = right, PI/2 = down, PI = left, -PI/2 = up
        const deg = angle * 180 / Math.PI;
        const normalized = ((deg % 360) + 360) % 360;
        
        if (normalized >= 337.5 || normalized < 22.5) return '→';
        if (normalized >= 22.5 && normalized < 67.5) return '↘';
        if (normalized >= 67.5 && normalized < 112.5) return '↓';
        if (normalized >= 112.5 && normalized < 157.5) return '↙';
        if (normalized >= 157.5 && normalized < 202.5) return '←';
        if (normalized >= 202.5 && normalized < 247.5) return '↖';
        if (normalized >= 247.5 && normalized < 292.5) return '↑';
        if (normalized >= 292.5 && normalized < 337.5) return '↗';
        return '→';
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    // Abbreviate long ability/powerup names for HUD display
    abbreviateName(name) {
        const abbreviations = {
            'PLASMA NODE': 'PLASMA',
            'PHASE CLOAK': 'CLOAK',
            'GRAVITY BEAM': 'G-BEAM',
            'SHIELD MATRIX': 'MATRIX',
            'TIME WARP': 'T-WARP',
            'OVERDRIVE': 'OVRDRV',
            'QUANTUM SHIELD': 'Q-SHLD',
            'CHRONO BURST': 'CHRONO',
            'PHASE SHIFT': 'PHASE',
            'DROPLET': 'DRPLT'
        };
        return abbreviations[name.toUpperCase()] || name.substring(0, 8);
    }
    
    // Get short power-up label for HUD
    getPowerupShortName(name) {
        const shorts = {
            'OVERDRIVE': 'ATTACK',
            'QUANTUM SHIELD': 'SHIELD',
            'PHASE SHIFT': 'DASH',
            'CHRONO BURST': 'TIME'
        };
        return shorts[name] || name;
    }
    
    // =====================================================
    // 5-ACTION BAR
    // SPACE=Dash, Q=Overdrive, E=Shield, F=ChronoBurst, R=UAP/Droplet
    // =====================================================
    updateActionBar() {
        const actionBar = document.getElementById('action-bar');
        if (!actionBar || !this.game.powerups) return;
        
        const player = this.game.player;
        const uapData = UAP_TYPES[player?.uapType];
        const uapAbility = uapData?.abilities?.active;
        
        // Build structure once
        if (!actionBar.dataset.built) {
            actionBar.dataset.built = 'true';
            
            // Define the 5 actions
            const actions = [
                { 
                    id: 'phaseShift', 
                    key: 'SPACE', 
                    icon: '💨', 
                    name: 'DASH',
                    color: '#ff00ff',
                    type: 'energy'
                },
                { 
                    id: 'overdrive', 
                    key: 'Q', 
                    icon: '⚡', 
                    name: 'ATTACK',
                    color: '#ff6600',
                    type: 'pickup'
                },
                { 
                    id: 'shield', 
                    key: 'E', 
                    icon: '🛡️', 
                    name: 'SHIELD',
                    color: '#00ccff',
                    type: 'pickup'
                },
                { 
                    id: 'chronoBurst', 
                    key: 'F', 
                    icon: '⏱️', 
                    name: 'TIME',
                    color: '#ffff00',
                    type: 'pickup'
                },
                { 
                    id: 'uapSpecial', 
                    key: 'R', 
                    icon: uapAbility?.icon || '✦',
                    name: uapAbility?.name?.substring(0, 8) || 'SPECIAL',
                    color: uapData?.color || '#ffaa00',
                    type: 'cooldown'
                }
            ];
            
            let html = '';
            for (const action of actions) {
                html += `
                    <div class="action-slot" data-action="${action.id}" data-type="${action.type}" style="--action-color: ${action.color}">
                        <div class="action-key">${action.key}</div>
                        <div class="action-icon">${action.icon}</div>
                        <div class="action-fill"></div>
                        <div class="action-count"></div>
                        <div class="action-name">${action.name}</div>
                    </div>
                `;
            }
            actionBar.innerHTML = html;
            
            // Add click handlers
            actionBar.querySelectorAll('.action-slot').forEach(slot => {
                slot.addEventListener('click', () => {
                    const id = slot.dataset.action;
                    if (id === 'uapSpecial') {
                        this.game.activateUAPSpecial();
                    } else {
                        this.game.activatePowerup(id);
                    }
                });
            });
        }
        
        // Update dynamic state
        const powerups = this.game.powerups;
        
        // SPACE - Dash (energy-based)
        const dashSlot = actionBar.querySelector('[data-action="phaseShift"]');
        if (dashSlot && player) {
            const fill = dashSlot.querySelector('.action-fill');
            const energyPercent = (player.phaseEnergy / player.phaseMaxEnergy) * 100;
            fill.style.height = `${energyPercent}%`;
            dashSlot.classList.toggle('ready', player.phaseEnergy >= 33);
            dashSlot.classList.toggle('empty', player.phaseEnergy < 33);
        }
        
        // Q - Overdrive (pickup)
        const overdriveSlot = actionBar.querySelector('[data-action="overdrive"]');
        if (overdriveSlot) {
            this.updatePickupSlot(overdriveSlot, 'overdrive', powerups);
        }
        
        // E - Shield (pickup)
        const shieldSlot = actionBar.querySelector('[data-action="shield"]');
        if (shieldSlot) {
            this.updatePickupSlot(shieldSlot, 'shield', powerups);
        }
        
        // F - Chrono Burst (pickup)
        const chronoSlot = actionBar.querySelector('[data-action="chronoBurst"]');
        if (chronoSlot) {
            this.updatePickupSlot(chronoSlot, 'chronoBurst', powerups);
        }
        
        // R - UAP Special (cooldown) OR Ultimate if charged
        const specialSlot = actionBar.querySelector('[data-action="uapSpecial"]');
        if (specialSlot && player) {
            const fill = specialSlot.querySelector('.action-fill');
            const countEl = specialSlot.querySelector('.action-count');
            const iconEl = specialSlot.querySelector('.action-icon');
            
            // Get ultimate data and charge info
            const ultData = this.game.ultimateData;
            const ultimateCount = powerups.inventory.ultimate || 0;
            const ultCharge = this.game.ultimateCharge || { current: 0, required: 50, chargePercent: 0 };
            
            if (ultimateCount > 0) {
                // Ultimate is CHARGED and ready to use!
                fill.style.height = '100%';
                fill.style.background = `linear-gradient(to top, ${ultData?.color || '#ffaa00'}, ${ultData?.glowColor || '#ffffff'})`;
                countEl.textContent = ultimateCount > 1 ? '×' + ultimateCount : '';
                if (iconEl) iconEl.textContent = ultData?.icon || '⭐';
                specialSlot.classList.remove('cooldown', 'charging');
                specialSlot.classList.add('ready', 'legendary');
                specialSlot.title = `${ultData?.name || 'ULTIMATE'} - Press R to activate!`;
                specialSlot.style.setProperty('--action-color', ultData?.color || '#ffaa00');
            } else if (ultCharge.current > 0 || ultCharge.chargePercent > 0) {
                // Ultimate is CHARGING - show progress
                const percent = ultCharge.chargePercent || (ultCharge.current / ultCharge.required) * 100;
                fill.style.height = `${percent}%`;
                fill.style.background = `linear-gradient(to top, ${ultData?.color || '#ffaa00'}88, ${ultData?.color || '#ffaa00'})`;
                countEl.textContent = Math.floor(percent) + '%';
                if (iconEl) iconEl.textContent = ultData?.icon || '⭐';
                specialSlot.classList.remove('cooldown', 'ready', 'legendary');
                specialSlot.classList.add('charging');
                specialSlot.title = `${ultData?.name || 'ULTIMATE'} - Collect fragments to charge (${Math.floor(percent)}%)`;
                specialSlot.style.setProperty('--action-color', ultData?.color || '#ffaa00');
            } else {
                // Ultimate empty - show UAP special as fallback
                const cooldown = player.uapAbility?.cooldownTimer || 0;
                const maxCooldown = uapAbility?.cooldown || 60;
                
                // Reset style
                fill.style.background = '';
                if (iconEl) iconEl.textContent = uapAbility?.icon || '🔮';
                specialSlot.classList.remove('legendary', 'charging');
                specialSlot.title = uapAbility?.name || 'UAP Special';
                specialSlot.style.setProperty('--action-color', uapData?.color || '#ffaa00');
                
                if (cooldown > 0) {
                    const percent = ((maxCooldown - cooldown) / maxCooldown) * 100;
                    fill.style.height = `${percent}%`;
                    countEl.textContent = Math.ceil(cooldown) + 's';
                    specialSlot.classList.add('cooldown');
                    specialSlot.classList.remove('ready');
                } else {
                    fill.style.height = '100%';
                    countEl.textContent = '';
                    specialSlot.classList.remove('cooldown');
                    specialSlot.classList.add('ready');
                }
            }
        }
    }
    
    updatePickupSlot(slot, powerupId, powerups) {
        const fill = slot.querySelector('.action-fill');
        const countEl = slot.querySelector('.action-count');
        const data = POWERUPS[powerupId];
        
        const count = powerups.inventory[powerupId] || 0;
        const activeData = powerups.active[powerupId];
        const isActive = activeData && activeData.timer > 0;
        
        if (isActive) {
            // Show remaining duration
            const percent = (activeData.timer / data.duration) * 100;
            fill.style.height = `${percent}%`;
            countEl.textContent = Math.ceil(activeData.timer) + 's';
            slot.classList.add('active');
            slot.classList.remove('ready', 'empty');
        } else if (count > 0) {
            fill.style.height = '100%';
            countEl.textContent = '×' + count;
            slot.classList.add('ready');
            slot.classList.remove('active', 'empty');
        } else {
            fill.style.height = '0%';
            countEl.textContent = '';
            slot.classList.add('empty');
            slot.classList.remove('ready', 'active');
        }
    }
    
    // Legacy function - redirect to new system
    updatePowerupBar() {
        this.updateActionBar();
    }
    
    // Legacy function - no longer needed
    updateAbilityBar() {
        // Abilities removed - using simplified 4-action system
    }
    
    formatGPS(lat, lon) {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        lat = Math.abs(lat);
        lon = Math.abs(lon);
        
        const latDeg = Math.floor(lat);
        const latMin = Math.floor((lat - latDeg) * 60);
        const latSec = Math.floor(((lat - latDeg) * 60 - latMin) * 60);
        
        const lonDeg = Math.floor(lon);
        const lonMin = Math.floor((lon - lonDeg) * 60);
        const lonSec = Math.floor(((lon - lonDeg) * 60 - lonMin) * 60);
        
        return `${latDir} ${latDeg}°${latMin.toString().padStart(2, '0')}'${latSec.toString().padStart(2, '0')}" ${lonDir} ${lonDeg}°${lonMin.toString().padStart(2, '0')}'${lonSec.toString().padStart(2, '0')}"`;
    }
    
    findClosestEnemy(player) {
        this.flirData.closestDist = Infinity;
        this.flirData.closestEnemy = null;
        
        if (!this.game.enemyPool) return;
        
        const enemies = this.game.enemyPool.getActive();
        for (const enemy of enemies) {
            const dist = Math.sqrt(
                Math.pow(enemy.x - player.x, 2) + 
                Math.pow(enemy.y - player.y, 2)
            );
            if (dist < this.flirData.closestDist) {
                this.flirData.closestDist = dist;
                this.flirData.closestEnemy = enemy;
            }
        }
    }
    
    updateWeaponSlots() {
        const player = this.game.player;
        let html = '';
        
        for (let i = 0; i < player.maxWeapons; i++) {
            const weapon = player.weapons[i];
            if (weapon) {
                html += `
                    <div class="weapon-slot active" title="${weapon.data.name} Lv${weapon.level}">
                        ${weapon.data.icon}
                        <span class="weapon-level">${weapon.level}</span>
                    </div>
                `;
            } else {
                html += `<div class="weapon-slot">-</div>`;
            }
        }
        
        this.elements.weaponSlots.innerHTML = html;
    }
    
    populateHangar() {
        const track = document.getElementById('carousel-track');
        const data = this.game.saveData;
        
        if (!track) return;
        
        // Store UAP list for navigation
        this.uapList = Object.keys(UAP_TYPES);
        this.carouselIndex = this.uapList.indexOf(data.selectedUAP);
        if (this.carouselIndex < 0) this.carouselIndex = 0;
        
        // Clear ship cards
        track.innerHTML = '';
        
        // Build ship cards
        this.uapList.forEach((uapId, index) => {
            const uap = UAP_TYPES[uapId];
            const unlocked = uap.unlocked || data.unlockedUAPs.includes(uapId);
            const isActive = index === this.carouselIndex;
            
            // Create card
            const card = document.createElement('div');
            card.className = `ship-card ${isActive ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
            card.dataset.uapId = uapId;
            card.dataset.index = index;
            
            if (unlocked) {
                card.innerHTML = `
                    <canvas width="60" height="60"></canvas>
                    <div class="ship-card-name">${uap.name}</div>
                `;
                
                // Draw UAP on card canvas - delay slightly to allow sprites to load
                const drawCanvas = () => {
                    const canvas = card.querySelector('canvas');
                    if (canvas) this.drawUAPOnCanvas(canvas, uapId, 25);
                };
                
                // Try immediately, and again after a short delay for sprite loading
                setTimeout(drawCanvas, 10);
                if (!Player.spritesLoaded) {
                    setTimeout(drawCanvas, 500);
                }
                
                card.addEventListener('click', () => this.selectCarouselItem(index));
            } else {
                card.innerHTML = `
                    <div class="ship-card-lock">🔒</div>
                    <div class="ship-card-name">???</div>
                `;
            }
            
            track.appendChild(card);
        });
        
        // Set up navigation arrows (only once)
        if (!this.carouselInitialized) {
            const prevBtn = document.getElementById('carousel-prev');
            const nextBtn = document.getElementById('carousel-next');
            if (prevBtn) prevBtn.addEventListener('click', () => this.carouselPrev());
            if (nextBtn) nextBtn.addEventListener('click', () => this.carouselNext());
            this.carouselInitialized = true;
        }
        
        // Show details for selected UAP
        this.showUAPDetails(this.uapList[this.carouselIndex]);
    }
    
    getWeaponName(weaponId) {
        const weapon = WEAPONS[weaponId];
        return weapon ? weapon.name : 'Unknown';
    }
    
    selectCarouselItem(index) {
        const uapId = this.uapList[index];
        const uap = UAP_TYPES[uapId];
        const unlocked = uap.unlocked || this.game.saveData.unlockedUAPs.includes(uapId);
        
        if (!unlocked) return;
        
        this.carouselIndex = index;
        this.game.saveData.selectedUAP = uapId;
        SaveManager.save(this.game.saveData);
        this.game.playSound?.('select');
        
        // Update active states on ship cards
        document.querySelectorAll('.ship-card').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        this.showUAPDetails(uapId);
    }
    
    carouselPrev() {
        let newIndex = this.carouselIndex - 1;
        if (newIndex < 0) newIndex = this.uapList.length - 1;
        
        // Skip locked UAPs
        const uap = UAP_TYPES[this.uapList[newIndex]];
        const unlocked = uap.unlocked || this.game.saveData.unlockedUAPs.includes(this.uapList[newIndex]);
        if (!unlocked) {
            this.carouselIndex = newIndex;
            this.carouselPrev();
            return;
        }
        
        this.selectCarouselItem(newIndex);
    }
    
    carouselNext() {
        let newIndex = this.carouselIndex + 1;
        if (newIndex >= this.uapList.length) newIndex = 0;
        
        // Skip locked UAPs
        const uap = UAP_TYPES[this.uapList[newIndex]];
        const unlocked = uap.unlocked || this.game.saveData.unlockedUAPs.includes(this.uapList[newIndex]);
        if (!unlocked) {
            this.carouselIndex = newIndex;
            this.carouselNext();
            return;
        }
        
        this.selectCarouselItem(newIndex);
    }
    
    updateCarouselPosition() {
        const track = document.getElementById('carousel-track');
        const viewport = document.querySelector('.carousel-viewport');
        if (!track || !viewport) return;
        
        // Card is 180px wide + 20px gap = 200px per item
        const itemWidth = 200;
        const viewportWidth = viewport.offsetWidth;
        
        // Calculate offset to center the current item in the viewport
        const centerOffset = (viewportWidth / 2) - (itemWidth / 2);
        const itemOffset = this.carouselIndex * itemWidth;
        const finalOffset = centerOffset - itemOffset;
        
        track.style.transform = `translateX(${finalOffset}px)`;
    }
    
    drawUAPOnCanvas(canvas, uapId, size) {
        const ctx = canvas.getContext('2d');
        const uap = UAP_TYPES[uapId];
        if (!ctx || !uap) return;
        
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        ctx.clearRect(0, 0, w, h);
        
        // Glow effect behind sprite
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 20;
        
        // Draw glow circle
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.8);
        gradient.addColorStop(0, 'rgba(0, 255, 204, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 204, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Try to use sprite from Player sprite cache
        const spriteKey = uapId.toLowerCase();
        const sprite = Player.spriteCache?.[spriteKey] || Player.spriteCache?.[uapId];
        
        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            // Draw the actual game sprite
            const spriteSize = size * 1.4;
            ctx.drawImage(sprite, cx - spriteSize/2, cy - spriteSize/2, spriteSize, spriteSize);
        } else {
            // Fallback to procedural drawing if sprite not loaded
            this.drawUAPFallback(ctx, uapId, cx, cy, size);
        }
    }
    
    drawUAPFallback(ctx, uapId, cx, cy, size) {
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur = 15;
        
        switch(uapId) {
            case 'tictac':
                // Tic-Tac shape (elongated capsule)
                ctx.fillStyle = '#e8e8e8';
                ctx.beginPath();
                ctx.ellipse(cx, cy, size * 0.35, size * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
                // Center glow
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(cx, cy - size * 0.1, size * 0.12, size * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'triangle':
                // Black triangle
                ctx.fillStyle = '#1a1a2e';
                ctx.strokeStyle = '#ff3300';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cx, cy - size * 0.65);
                ctx.lineTo(cx - size * 0.55, cy + size * 0.45);
                ctx.lineTo(cx + size * 0.55, cy + size * 0.45);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Corner lights
                ctx.fillStyle = '#ff3300';
                ctx.beginPath();
                ctx.arc(cx, cy - size * 0.55, 3, 0, Math.PI * 2);
                ctx.arc(cx - size * 0.45, cy + size * 0.35, 3, 0, Math.PI * 2);
                ctx.arc(cx + size * 0.45, cy + size * 0.35, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'orb':
                // Foo fighter (glowing orb)
                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.4, '#ffff88');
                gradient.addColorStop(1, 'rgba(255,255,136,0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'saucer':
                // Classic flying saucer
                ctx.fillStyle = '#777777';
                // Dome
                ctx.beginPath();
                ctx.ellipse(cx, cy - size * 0.1, size * 0.25, size * 0.3, 0, Math.PI, 0);
                ctx.fill();
                // Body
                ctx.fillStyle = '#aaaaaa';
                ctx.beginPath();
                ctx.ellipse(cx, cy + size * 0.05, size * 0.55, size * 0.18, 0, 0, Math.PI * 2);
                ctx.fill();
                // Lights
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const lx = cx + Math.cos(angle) * size * 0.4;
                    const ly = cy + size * 0.05 + Math.sin(angle) * size * 0.1;
                    ctx.beginPath();
                    ctx.arc(lx, ly, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'cigar':
                // Mothership (cigar shape)
                ctx.fillStyle = '#556688';
                // Main body
                ctx.beginPath();
                ctx.moveTo(cx - size * 0.6, cy);
                ctx.lineTo(cx - size * 0.4, cy - size * 0.2);
                ctx.lineTo(cx + size * 0.4, cy - size * 0.2);
                ctx.lineTo(cx + size * 0.6, cy);
                ctx.lineTo(cx + size * 0.4, cy + size * 0.25);
                ctx.lineTo(cx - size * 0.4, cy + size * 0.25);
                ctx.closePath();
                ctx.fill();
                // Bridge
                ctx.fillStyle = '#445566';
                ctx.fillRect(cx - size * 0.15, cy - size * 0.35, size * 0.3, size * 0.15);
                // Engine glow
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(cx - size * 0.25, cy + size * 0.25, size * 0.5, size * 0.08);
                break;
        }
        
        ctx.shadowBlur = 0;
    }
    
    showUAPDetails(uapId) {
        const uap = UAP_TYPES[uapId];
        if (!uap) return;
        
        document.getElementById('uap-name').textContent = uap.name;
        document.getElementById('uap-description').textContent = uap.description;
        
        // Draw on preview canvas (larger size for new layout)
        const previewCanvas = document.getElementById('uap-preview-canvas');
        if (previewCanvas) {
            const drawPreview = () => this.drawUAPOnCanvas(previewCanvas, uapId, 120);
            drawPreview();
            // Redraw after sprites load if not already loaded
            if (!Player.spritesLoaded) {
                setTimeout(drawPreview, 500);
            }
        }
        
        // Calculate max values for stat bars
        const maxSpeed = 400;
        const maxHealth = 2000;
        const maxDamage = 1.5;
        const maxRange = 100;
        
        // Build horizontal stat bars for new layout
        const statsHtml = `
            <div class="hangar-stat">
                <span class="stat-label">SPD</span>
                <div class="hangar-stat-bar">
                    <div class="hangar-stat-fill" style="width: ${(uap.stats.speed / maxSpeed) * 100}%"></div>
                </div>
                <span class="stat-value">${uap.stats.speed}</span>
            </div>
            <div class="hangar-stat">
                <span class="stat-label">HP</span>
                <div class="hangar-stat-bar">
                    <div class="hangar-stat-fill" style="width: ${(uap.stats.maxHealth / maxHealth) * 100}%"></div>
                </div>
                <span class="stat-value">${uap.stats.maxHealth}</span>
            </div>
            <div class="hangar-stat">
                <span class="stat-label">DMG</span>
                <div class="hangar-stat-bar">
                    <div class="hangar-stat-fill" style="width: ${(uap.stats.damage / maxDamage) * 100}%"></div>
                </div>
                <span class="stat-value">${uap.stats.damage}x</span>
            </div>
            <div class="hangar-stat">
                <span class="stat-label">RNG</span>
                <div class="hangar-stat-bar">
                    <div class="hangar-stat-fill" style="width: ${(uap.stats.pickupRange / maxRange) * 100}%"></div>
                </div>
                <span class="stat-value">${uap.stats.pickupRange}</span>
            </div>
        `;
        document.getElementById('uap-stats').innerHTML = statsHtml;
        
        // Update ability display
        const abilityName = document.getElementById('uap-ability-name');
        const abilityText = document.getElementById('uap-ability-text');
        
        if (abilityName && abilityText) {
            if (uap.stats.healthRegen > 0) {
                abilityName.textContent = 'REGENERATION';
                abilityText.textContent = `+${uap.stats.healthRegen} HP/sec`;
            } else if (uap.stats.cooldownReduction > 0) {
                abilityName.textContent = 'RAPID FIRE';
                abilityText.textContent = `${(uap.stats.cooldownReduction * 100).toFixed(0)}% faster cooldowns`;
            } else if (uap.id === 'orb' || uapId === 'orb') {
                abilityName.textContent = 'PHASE SHIFT';
                abilityText.textContent = 'Ethereal dodge movement';
            } else if (uap.id === 'cigar' || uapId === 'cigar') {
                abilityName.textContent = 'HEAVY ARMOR';
                abilityText.textContent = 'Massive damage resistance';
            } else {
                abilityName.textContent = 'STANDARD';
                abilityText.textContent = 'Balanced performance';
            }
        }
    }
    
    populateUpgrades() {
        const container = document.getElementById('upgrade-tree');
        const data = this.game.saveData;
        
        this.elements.upgradeCurrency.textContent = Utils.formatNumber(data.currency);
        
        // Clear container
        container.innerHTML = '';
        container.className = 'star-chart-container';
        
        // Create SVG for connections
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('star-chart-connections');
        container.appendChild(svg);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'star-node-tooltip hidden';
        container.appendChild(tooltip);
        
        // Render branches
        for (const [branchId, branch] of Object.entries(UPGRADES)) {
            let prevNode = null;
            
            branch.upgrades.forEach((upgrade, index) => {
                const currentLevel = data.upgrades[upgrade.name] || 0;
                const maxed = currentLevel >= upgrade.maxLevel;
                const cost = upgrade.cost * (currentLevel + 1);
                const canAfford = data.currency >= cost;
                const isUnlocked = index === 0 || (data.upgrades[branch.upgrades[index-1].name] >= 1); // Unlock if previous has at least 1 level
                
                // Create Node
                const node = document.createElement('div');
                node.className = `star-node ${maxed ? 'maxed' : ''} ${!isUnlocked ? 'locked' : ''} ${canAfford && isUnlocked && !maxed ? 'available' : ''}`;
                node.style.left = `${upgrade.x}%`;
                node.style.top = `${upgrade.y}%`;
                node.style.setProperty('--branch-color', branch.color);
                
                // Icon
                node.innerHTML = `<div class="star-node-icon">${branch.icon}</div>`;
                
                // Click handler
                node.addEventListener('click', () => {
                    if (!isUnlocked || maxed) return;
                    
                    if (data.currency >= cost) {
                        data.currency -= cost;
                        data.upgrades[upgrade.name] = (data.upgrades[upgrade.name] || 0) + 1;
                        SaveManager.save(data);
                        this.game.playSound?.('upgrade');
                        this.populateUpgrades(); // Refresh
                    } else {
                        this.game.playSound?.('error');
                    }
                });
                
                // Hover handler for tooltip
                node.addEventListener('mouseenter', (e) => {
                    tooltip.classList.remove('hidden');
                    tooltip.style.left = `${upgrade.x}%`;
                    tooltip.style.top = `${upgrade.y - 10}%`;
                    tooltip.innerHTML = `
                        <div class="tooltip-title" style="color: ${branch.color}">${upgrade.name}</div>
                        <div class="tooltip-desc">${upgrade.desc}</div>
                        <div class="tooltip-stats">
                            <div>Level: <span style="color: #fff">${currentLevel}/${upgrade.maxLevel}</span></div>
                            ${!maxed ? `<div>Cost: <span style="color: #ffcc00">⚡ ${cost}</span></div>` : '<div style="color: #00ff00">MAXED</div>'}
                        </div>
                        ${!isUnlocked ? '<div class="tooltip-locked">LOCKED - Upgrade previous node</div>' : ''}
                    `;
                });
                
                node.addEventListener('mouseleave', () => {
                    tooltip.classList.add('hidden');
                });
                
                container.appendChild(node);
                
                // Draw connection line to previous node
                if (prevNode) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', `${prevNode.x}%`);
                    line.setAttribute('y1', `${prevNode.y}%`);
                    line.setAttribute('x2', `${upgrade.x}%`);
                    line.setAttribute('y2', `${upgrade.y}%`);
                    line.setAttribute('stroke', isUnlocked ? branch.color : '#333');
                    line.setAttribute('stroke-width', isUnlocked ? '2' : '1');
                    line.setAttribute('stroke-dasharray', isUnlocked ? 'none' : '5,5');
                    svg.appendChild(line);
                }
                
                prevNode = upgrade;
            });
        }
        
        // Add central "Core" visual (just for flavor)
        const core = document.createElement('div');
        core.className = 'star-core';
        core.innerHTML = '🛸';
        container.appendChild(core);
    }
    
    // =====================================================
    // RECORDS SCREEN
    // =====================================================
    async populateRecords() {
        const data = this.game.saveData;
        const localStats = data.stats || {};
        const localBestRuns = data.bestRuns || {};
        
        // Helper to set record values
        const setRecord = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        // Check if user is logged in
        const user = window.supabaseService?.getUser();
        const loginPrompt = document.getElementById('records-login-prompt');
        
        if (loginPrompt) {
            loginPrompt.style.display = user ? 'none' : 'flex';
        }
        
        // Use cloud stats if logged in, otherwise local
        let stats = localStats;
        let bestRuns = localBestRuns;
        let recentRuns = [];
        
        if (user && window.supabaseService?.initialized) {
            // Try to get cloud stats
            const { data: cloudStats } = await window.supabaseService.getPlayerStats();
            if (cloudStats) {
                stats = {
                    totalPlayTime: cloudStats.total_play_time || 0,
                    runsCompleted: cloudStats.runs_completed || 0,
                    runsAttempted: cloudStats.runs_attempted || 0,
                    totalKills: cloudStats.total_kills || 0,
                    elitesDefeated: cloudStats.elites_defeated || 0,
                    bossesDefeated: cloudStats.bosses_defeated || 0,
                    highestLevel: cloudStats.highest_level || 0,
                    longestSurvival: cloudStats.longest_survival || 0
                };
            }
            
            // Get personal bests from leaderboard
            const { data: personalBests } = await window.supabaseService.getPersonalBests(10);
            if (personalBests && personalBests.length > 0) {
                // Find best stats from leaderboard entries
                let maxSurvival = 0, maxLevel = 0, maxKills = 0;
                personalBests.forEach(run => {
                    if (run.time_survived > maxSurvival) maxSurvival = run.time_survived;
                    if (run.level_reached > maxLevel) maxLevel = run.level_reached;
                    if (run.kills > maxKills) maxKills = run.kills;
                });
                bestRuns = {
                    longestSurvival: { time: maxSurvival },
                    highestLevel: { level: maxLevel },
                    mostKills: { kills: maxKills }
                };
            }
            
            // Get recent runs
            const { data: recent } = await window.supabaseService.getRecentRuns(5);
            recentRuns = recent || [];
        }
        
        // Populate Pilot Stats
        const totalSeconds = stats.totalPlayTime || 0;
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        setRecord('rec-total-time', `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        
        setRecord('rec-runs-completed', Utils.formatNumber(stats.runsCompleted || 0));
        setRecord('rec-runs-attempted', Utils.formatNumber(stats.runsAttempted || 0));
        setRecord('rec-total-kills', Utils.formatNumber(stats.totalKills || 0));
        setRecord('rec-elites', Utils.formatNumber(stats.elitesDefeated || 0));
        setRecord('rec-bosses', Utils.formatNumber(stats.bossesDefeated || 0));
        
        // Populate Personal Bests
        const survivalData = bestRuns.longestSurvival || {};
        setRecord('best-survival', survivalData.time ? Utils.formatTime(survivalData.time) : '--:--');
        
        const levelData = bestRuns.highestLevel || {};
        setRecord('best-level', levelData.level || 0);
        
        const killsData = bestRuns.mostKills || {};
        setRecord('best-kills', Utils.formatNumber(killsData.kills || 0));
        
        // Populate Recent Runs
        this.populateRecentRuns(recentRuns);
    }
    
    populateRecentRuns(runs) {
        const container = document.getElementById('recent-runs-list');
        if (!container) return;
        
        if (!runs || runs.length === 0) {
            container.innerHTML = '<div class="recent-runs-empty">No missions recorded yet</div>';
            return;
        }
        
        container.innerHTML = runs.map((run, index) => {
            const date = new Date(run.created_at);
            const dateStr = date.toLocaleDateString();
            const timeStr = Utils.formatTime(run.time_survived || 0);
            const escaped = (run.time_survived || 0) >= 1800; // 30 minutes = escape
            const statusIcon = escaped ? '✅' : '💀';
            const statusClass = escaped ? 'escaped' : 'failed';
            
            return `
                <div class="recent-run-item ${statusClass}">
                    <div class="recent-run-status">${statusIcon}</div>
                    <div class="recent-run-info">
                        <div class="recent-run-time">${timeStr}</div>
                        <div class="recent-run-details">Lv.${run.level_reached || 0} • ${Utils.formatNumber(run.kills || 0)} kills</div>
                    </div>
                    <div class="recent-run-date">${dateStr}</div>
                </div>
            `;
        }).join('');
    }
    
    // =====================================================
    // TITLE SCREEN LEADERBOARD
    // =====================================================
    async populateLeaderboard() {
        const container = document.getElementById('leaderboard-entries');
        const emptyMsg = document.getElementById('leaderboard-empty');
        if (!container) return;
        
        // Try to get global leaderboard from Supabase
        let leaderboard = [];
        let isGlobal = false;
        
        if (window.supabaseService?.initialized) {
            const { data, error } = await window.supabaseService.getGlobalLeaderboard(5);
            if (!error && data && data.length > 0) {
                leaderboard = data.map(entry => ({
                    time: entry.time_survived,
                    level: entry.level_reached,
                    kills: entry.kills,
                    difficulty: entry.difficulty,
                    playerName: entry.player_name
                }));
                isGlobal = true;
            }
        }
        
        // Fallback to local leaderboard
        if (leaderboard.length === 0) {
            leaderboard = this.game.saveData?.leaderboard || [];
        }
        
        // Update header to show global/local
        const headerTitle = document.querySelector('.leaderboard-title');
        if (headerTitle) {
            headerTitle.textContent = isGlobal ? 'GLOBAL RANKINGS' : 'HIGH SCORES';
        }
        
        // Keep header row, remove old data rows
        const headerRow = container.querySelector('.header-row');
        container.innerHTML = '';
        if (headerRow) {
            // Update header for global (add NAME column)
            if (isGlobal) {
                headerRow.innerHTML = `
                    <span class="lb-rank">#</span>
                    <span class="lb-stat lb-name">PILOT</span>
                    <span class="lb-stat">TIME</span>
                    <span class="lb-stat">LVL</span>
                    <span class="lb-stat">KILLS</span>
                `;
            } else {
                headerRow.innerHTML = `
                    <span class="lb-rank">#</span>
                    <span class="lb-stat">TIME</span>
                    <span class="lb-stat">LVL</span>
                    <span class="lb-stat">KILLS</span>
                    <span class="lb-difficulty">MODE</span>
                `;
            }
            container.appendChild(headerRow);
        }
        
        // Show/hide empty message
        if (emptyMsg) {
            emptyMsg.style.display = leaderboard.length === 0 ? 'block' : 'none';
        }
        
        // Add entries
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = `leaderboard-row data-row rank-${index + 1}`;
            
            // Format time as MM:SS
            const time = entry.time || 0;
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
            
            if (isGlobal) {
                // Global leaderboard shows player name
                const playerName = (entry.playerName || 'Anonymous').substring(0, 12);
                row.innerHTML = `
                    <span class="lb-rank">${index + 1}</span>
                    <span class="lb-stat lb-name">${playerName}</span>
                    <span class="lb-stat">${timeStr}</span>
                    <span class="lb-stat">${entry.level || 1}</span>
                    <span class="lb-stat">${Utils.formatNumber(entry.kills || 0)}</span>
                `;
            } else {
                // Local leaderboard shows difficulty
                const diffId = entry.difficulty || 'normal';
                const diffClass = `diff-${diffId}`;
                const diffDisplay = diffId.charAt(0).toUpperCase() + diffId.slice(1);
                row.innerHTML = `
                    <span class="lb-rank">${index + 1}</span>
                    <span class="lb-stat">${timeStr}</span>
                    <span class="lb-stat">${entry.level || 1}</span>
                    <span class="lb-stat">${Utils.formatNumber(entry.kills || 0)}</span>
                    <span class="lb-difficulty ${diffClass}">${diffDisplay}</span>
                `;
            }
            
            container.appendChild(row);
        });
    }
    
    // =====================================================
    // SETTINGS SCREEN
    // =====================================================
    populateSettings() {
        const data = this.game.saveData;
        const settings = data.settings || {};
        
        // Volume sliders
        const masterSlider = document.getElementById('setting-master-volume');
        const sfxSlider = document.getElementById('setting-sfx-volume');
        const musicSlider = document.getElementById('setting-music-volume');
        
        if (masterSlider) {
            masterSlider.value = (settings.masterVolume ?? 1) * 100;
            document.getElementById('master-volume-value').textContent = `${Math.round(masterSlider.value)}%`;
            masterSlider.addEventListener('input', (e) => this.updateSetting('masterVolume', e.target.value / 100));
        }
        
        if (sfxSlider) {
            sfxSlider.value = (settings.sfxVolume ?? 0.8) * 100;
            document.getElementById('sfx-volume-value').textContent = `${Math.round(sfxSlider.value)}%`;
            sfxSlider.addEventListener('input', (e) => this.updateSetting('sfxVolume', e.target.value / 100));
        }
        
        if (musicSlider) {
            musicSlider.value = (settings.musicVolume ?? 0.6) * 100;
            document.getElementById('music-volume-value').textContent = `${Math.round(musicSlider.value)}%`;
            musicSlider.addEventListener('input', (e) => this.updateSetting('musicVolume', e.target.value / 100));
        }
        
        // Toggle switches
        const screenShake = document.getElementById('setting-screen-shake');
        const damageNumbers = document.getElementById('setting-damage-numbers');
        const minimap = document.getElementById('setting-minimap');
        
        if (screenShake) {
            screenShake.checked = settings.screenShake !== false;
            screenShake.addEventListener('change', (e) => this.updateSetting('screenShake', e.target.checked));
        }
        
        if (damageNumbers) {
            damageNumbers.checked = settings.showDamageNumbers !== false;
            damageNumbers.addEventListener('change', (e) => this.updateSetting('showDamageNumbers', e.target.checked));
        }
        
        if (minimap) {
            minimap.checked = settings.showMinimap !== false;
            minimap.addEventListener('change', (e) => this.updateSetting('showMinimap', e.target.checked));
        }
        
        // Particle quality
        const particleQuality = document.getElementById('setting-particle-quality');
        if (particleQuality) {
            particleQuality.value = settings.particleQuality || 'high';
            particleQuality.addEventListener('change', (e) => this.updateSetting('particleQuality', e.target.value));
        }
        
        // Colorblind / Accessibility settings
        const colorMode = document.getElementById('setting-color-mode');
        if (colorMode) {
            colorMode.value = settings.colorMode || 'normal';
            setColorMode(colorMode.value);
            colorMode.addEventListener('change', (e) => {
                this.updateSetting('colorMode', e.target.value);
                setColorMode(e.target.value);
            });
        }
        
        const shapeIndicators = document.getElementById('setting-shape-indicators');
        if (shapeIndicators) {
            shapeIndicators.checked = settings.shapeIndicators === true;
            shapeIndicators.addEventListener('change', (e) => this.updateSetting('shapeIndicators', e.target.checked));
        }
        
        // Keybindings
        this.populateKeybindings();
        
        // Reset keybindings button
        const resetKeybindsBtn = document.getElementById('btn-reset-keybindings');
        if (resetKeybindsBtn) {
            const newBtn = resetKeybindsBtn.cloneNode(true);
            resetKeybindsBtn.parentNode.replaceChild(newBtn, resetKeybindsBtn);
            newBtn.addEventListener('click', () => {
                if (confirm('Reset all keybindings to defaults?')) {
                    resetKeybindings();
                    this.updateSetting('keybindings', window.UFO.currentKeybindings);
                    this.populateKeybindings();
                    this.game.playSound?.('click');
                }
            });
        }
        
        // Reset button
        const resetBtn = document.getElementById('btn-reset-save');
        if (resetBtn) {
            // Remove old listeners by cloning
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            
            newResetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
                    if (confirm('This will delete all your stats, unlocks, and currency. Are you REALLY sure?')) {
                        localStorage.removeItem('tic_tac_survivor');
                        localStorage.removeItem('ufo_survivor_save');
                        location.reload();
                    }
                }
            });
        }
    }
    
    updateSetting(key, value) {
        const data = this.game.saveData;
        if (!data.settings) data.settings = {};
        data.settings[key] = value;
        SaveManager.save(data);
        
        // Update display values
        if (key === 'masterVolume') {
            document.getElementById('master-volume-value').textContent = `${Math.round(value * 100)}%`;
            if (this.game.sound) this.game.sound.setMasterVolume(value);
            // Also update the main menu sound toggle state
            this.updateSoundToggleState();
        } else if (key === 'sfxVolume') {
            document.getElementById('sfx-volume-value').textContent = `${Math.round(value * 100)}%`;
            if (this.game.sound) this.game.sound.setSFXVolume(value);
        } else if (key === 'musicVolume') {
            document.getElementById('music-volume-value').textContent = `${Math.round(value * 100)}%`;
            if (this.game.sound) this.game.sound.setMusicVolume(value);
        } else if (key === 'showMinimap') {
            const minimapContainer = document.getElementById('minimap-container');
            if (minimapContainer) {
                minimapContainer.style.display = value ? 'block' : 'none';
            }
        }
        
        this.game.playSound?.('click');
    }
    
    // =====================================================
    // KEYBINDING UI
    // =====================================================
    populateKeybindings() {
        const container = document.getElementById('keybindings-container');
        if (!container) return;
        
        const bindings = window.UFO?.currentKeybindings || DEFAULT_KEYBINDINGS;
        const labels = window.UFO?.KEYBINDING_LABELS || KEYBINDING_LABELS;
        
        container.innerHTML = '';
        
        // Group bindings by category
        const categories = {
            movement: ['moveUp', 'moveDown', 'moveLeft', 'moveRight'],
            actions: ['dash', 'phaseShift', 'pause'],
            powerups: ['powerOverdrive', 'powerShield', 'powerChronoBurst', 'powerDroplet'],
            abilities: ['ability1', 'ability2', 'ability3', 'ability4', 'ability5']
        };
        
        // Only show movement and actions for rebinding (powerups/abilities are contextual)
        const rebindable = [...categories.movement, ...categories.actions];
        
        for (const action of rebindable) {
            const keys = bindings[action] || [];
            const label = labels[action] || action;
            
            const item = document.createElement('div');
            item.className = 'keybinding-item';
            
            item.innerHTML = `
                <span class="keybinding-label">${label}</span>
                <div class="keybinding-keys">
                    <button class="keybinding-btn" data-action="${action}" data-slot="0" 
                            aria-label="Primary key for ${label}: ${keyCodeToDisplay(keys[0] || '')}">
                        ${keyCodeToDisplay(keys[0] || '---')}
                    </button>
                    <button class="keybinding-btn secondary" data-action="${action}" data-slot="1"
                            aria-label="Secondary key for ${label}: ${keyCodeToDisplay(keys[1] || '')}">
                        ${keyCodeToDisplay(keys[1] || '---')}
                    </button>
                </div>
            `;
            
            container.appendChild(item);
        }
        
        // Add click handlers
        container.querySelectorAll('.keybinding-btn').forEach(btn => {
            btn.addEventListener('click', () => this.startKeybindListen(btn));
        });
    }
    
    startKeybindListen(button) {
        // Remove any existing listeners
        if (this.keybindListener) {
            document.removeEventListener('keydown', this.keybindListener);
        }
        
        // Clear any other listening buttons
        document.querySelectorAll('.keybinding-btn.listening').forEach(b => {
            b.classList.remove('listening');
        });
        
        button.classList.add('listening');
        button.textContent = 'Press key...';
        
        const action = button.dataset.action;
        const slot = parseInt(button.dataset.slot);
        
        this.keybindListener = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // ESC cancels
            if (e.code === 'Escape') {
                button.classList.remove('listening');
                const keys = window.UFO?.currentKeybindings?.[action] || [];
                button.textContent = keyCodeToDisplay(keys[slot] || '---');
                document.removeEventListener('keydown', this.keybindListener);
                this.keybindListener = null;
                return;
            }
            
            // Ignore modifier-only presses
            if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key) && !e.code.includes('Left') && !e.code.includes('Right')) {
                return;
            }
            
            // Set the binding
            setKeybinding(action, e.code, slot);
            
            // Save to settings
            this.updateSetting('keybindings', window.UFO.currentKeybindings);
            
            // Update display
            button.classList.remove('listening');
            button.textContent = keyCodeToDisplay(e.code);
            
            // Update aria-label
            const labels = window.UFO?.KEYBINDING_LABELS || {};
            button.setAttribute('aria-label', `${slot === 0 ? 'Primary' : 'Secondary'} key for ${labels[action] || action}: ${keyCodeToDisplay(e.code)}`);
            
            // Refresh all buttons to reflect any conflicts resolved
            this.populateKeybindings();
            
            document.removeEventListener('keydown', this.keybindListener);
            this.keybindListener = null;
            
            this.game.playSound?.('click');
        };
        
        document.addEventListener('keydown', this.keybindListener);
    }

    // =====================================================
    // CODEX SCREEN
    // =====================================================
    populateCodex(category = 'artifacts') {
        const tabsContainer = document.getElementById('codex-tabs');
        const gridContainer = document.getElementById('codex-grid');
        const detailPanel = document.getElementById('codex-detail');
        const progressText = document.getElementById('codex-progress-text');
        
        if (!tabsContainer || !gridContainer) return;
        
        const data = this.game.saveData;
        const collections = data.collections || {};
        
        // Store current category
        this.currentCodexCategory = category;
        
        // Build tabs
        let tabsHtml = '';
        const categories = CODEX?.categories || {};
        
        for (const [catId, cat] of Object.entries(categories)) {
            const isActive = catId === category;
            const collectedCount = this.getCodexCollectionCount(catId, collections);
            const totalCount = this.getCodexTotalCount(catId);
            
            tabsHtml += `
                <div class="codex-tab ${isActive ? 'active' : ''}" data-category="${catId}">
                    <span class="codex-tab-icon">${cat.icon}</span>
                    <span>${cat.name}</span>
                    <span class="codex-tab-count">${collectedCount}/${totalCount}</span>
                </div>
            `;
        }
        tabsContainer.innerHTML = tabsHtml;
        
        // Tab click handlers
        tabsContainer.querySelectorAll('.codex-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.game.playSound?.('click');
                this.populateCodex(tab.dataset.category);
            });
        });
        
        // Calculate total progress
        let totalCollected = 0;
        let totalItems = 0;
        for (const catId of Object.keys(categories)) {
            totalCollected += this.getCodexCollectionCount(catId, collections);
            totalItems += this.getCodexTotalCount(catId);
        }
        if (progressText) {
            progressText.textContent = `${totalCollected}/${totalItems}`;
        }
        
        // Build grid based on category
        let gridHtml = '';
        const items = this.getCodexItems(category);
        
        for (const item of items) {
            const isCollected = this.isCodexItemCollected(category, item.id, collections);
            const rarityClass = item.rarity || 'common';
            
            gridHtml += `
                <div class="codex-item ${isCollected ? '' : 'locked'} ${this.selectedCodexItem === item.id ? 'selected' : ''}" 
                     data-item-id="${item.id}" data-category="${category}">
                    ${item.rarity ? `<span class="codex-item-rarity ${rarityClass}">${rarityClass}</span>` : ''}
                    <span class="codex-item-icon">${isCollected ? item.icon : '❓'}</span>
                    <span class="codex-item-name">${isCollected ? item.name : '???'}</span>
                </div>
            `;
        }
        gridContainer.innerHTML = gridHtml;
        
        // Grid item click handlers
        gridContainer.querySelectorAll('.codex-item').forEach(item => {
            item.addEventListener('click', () => {
                const itemId = item.dataset.itemId;
                const cat = item.dataset.category;
                const isCollected = !item.classList.contains('locked');
                
                if (isCollected) {
                    this.game.playSound?.('click');
                    this.selectedCodexItem = itemId;
                    this.showCodexDetail(cat, itemId);
                    
                    // Update selected state
                    gridContainer.querySelectorAll('.codex-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                }
            });
        });
        
        // Reset detail panel
        if (detailPanel) {
            detailPanel.innerHTML = `
                <div class="codex-detail-empty">
                    <span class="codex-detail-icon">📖</span>
                    <p>Select an entry to view details</p>
                </div>
            `;
        }
    }
    
    getCodexCollectionCount(category, collections) {
        switch (category) {
            case 'artifacts':
                return (collections.artifacts || []).length;
            case 'enemies':
                return (collections.enemies || []).length;
            case 'events':
                return (collections.ufoEvents || []).length;
            case 'weapons':
                return (collections.weapons || []).length;
            case 'uap_types':
                return this.game.saveData.unlockedUAPs?.length || 1;
            default:
                return 0;
        }
    }
    
    getCodexTotalCount(category) {
        switch (category) {
            case 'artifacts':
                return typeof ARTIFACTS !== 'undefined' ? Object.keys(ARTIFACTS).length : 0;
            case 'enemies':
                return typeof ENEMY_TYPES !== 'undefined' ? Object.keys(ENEMY_TYPES).length : 0;
            case 'events':
                return typeof UFO_EVENTS !== 'undefined' ? Object.keys(UFO_EVENTS).length : 0;
            case 'weapons':
                return typeof WEAPONS !== 'undefined' ? Object.keys(WEAPONS).length : 0;
            case 'uap_types':
                return typeof UAP_TYPES !== 'undefined' ? Object.keys(UAP_TYPES).length : 0;
            default:
                return 0;
        }
    }
    
    getCodexItems(category) {
        const items = [];
        
        switch (category) {
            case 'artifacts':
                if (typeof ARTIFACTS !== 'undefined') {
                    for (const [id, artifact] of Object.entries(ARTIFACTS)) {
                        items.push({
                            id,
                            name: artifact.name,
                            icon: artifact.icon,
                            rarity: artifact.rarity,
                            description: artifact.description,
                            lore: artifact.lore,
                            effects: artifact.effects,
                            source: artifact.source
                        });
                    }
                }
                break;
                
            case 'enemies':
                if (typeof ENEMY_TYPES !== 'undefined') {
                    for (const [id, enemy] of Object.entries(ENEMY_TYPES)) {
                        items.push({
                            id,
                            name: enemy.name || id,
                            icon: enemy.icon || '✈️',
                            description: enemy.description || 'Military hostile',
                            health: enemy.health,
                            damage: enemy.damage
                        });
                    }
                }
                break;
                
            case 'events':
                if (typeof UFO_EVENTS !== 'undefined') {
                    for (const [id, event] of Object.entries(UFO_EVENTS)) {
                        items.push({
                            id,
                            name: event.name,
                            icon: '📋',
                            description: event.description,
                            lore: event.fullReport,
                            date: event.date,
                            location: event.location
                        });
                    }
                }
                break;
                
            case 'weapons':
                if (typeof WEAPONS !== 'undefined') {
                    for (const [id, weapon] of Object.entries(WEAPONS)) {
                        items.push({
                            id,
                            name: weapon.name,
                            icon: weapon.icon,
                            description: weapon.description,
                            damage: weapon.damage,
                            cooldown: weapon.cooldown
                        });
                    }
                }
                break;
                
            case 'uap_types':
                if (typeof UAP_TYPES !== 'undefined') {
                    for (const [id, uap] of Object.entries(UAP_TYPES)) {
                        items.push({
                            id,
                            name: uap.name,
                            icon: '🛸',
                            description: uap.description,
                            stats: uap.stats
                        });
                    }
                }
                break;
        }
        
        return items;
    }
    
    isCodexItemCollected(category, itemId, collections) {
        switch (category) {
            case 'artifacts':
                return (collections.artifacts || []).includes(itemId);
            case 'enemies':
                return (collections.enemies || []).includes(itemId);
            case 'events':
                return (collections.ufoEvents || []).includes(itemId);
            case 'weapons':
                return (collections.weapons || []).includes(itemId);
            case 'uap_types':
                const uap = UAP_TYPES?.[itemId];
                return uap?.unlocked || (this.game.saveData.unlockedUAPs || []).includes(itemId);
            default:
                return false;
        }
    }
    
    showCodexDetail(category, itemId) {
        const detailPanel = document.getElementById('codex-detail');
        if (!detailPanel) return;
        
        const items = this.getCodexItems(category);
        const item = items.find(i => i.id === itemId);
        
        if (!item) return;
        
        let effectsHtml = '';
        if (item.effects && item.effects.length > 0) {
            effectsHtml = `
                <div class="codex-detail-effects">
                    <div class="codex-detail-effects-title">Effects</div>
                    ${item.effects.map(eff => `
                        <div class="codex-effect-item">
                            <span class="codex-effect-icon">✦</span>
                            <span>${eff.description}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        let sourceHtml = '';
        if (item.source) {
            const event = typeof UFO_EVENTS !== 'undefined' ? UFO_EVENTS[item.source] : null;
            sourceHtml = `<div class="codex-detail-source">Source: ${event?.name || item.source}</div>`;
        }
        if (item.date && item.location) {
            sourceHtml = `<div class="codex-detail-source">${item.date} • ${item.location}</div>`;
        }
        
        detailPanel.innerHTML = `
            <div class="codex-detail-header">
                <div class="codex-detail-icon-large">${item.icon}</div>
                <div class="codex-detail-name">${item.name}</div>
                ${sourceHtml}
            </div>
            <div class="codex-detail-desc">${item.description || ''}</div>
            ${item.lore ? `<div class="codex-detail-lore">"${item.lore}"</div>` : ''}
            ${effectsHtml}
        `;
    }

    // Level-up choice system removed - upgrades now come from pickups only
    showLevelUpChoices(choices, includePassives = false) {
        // This method is deprecated - kept for compatibility
        // Upgrades are now pickup-based only!
    }
    
    rerollChoices() {
        // Deprecated - level-up choices removed
    }
    
    selectUpgrade(choiceId, isPassive = false) {
        // Deprecated - level-up choices removed
    }
    
    hideLevelUpChoices() {
        this.elements.levelupContainer?.classList.add('hidden');
        if (this.levelUpKeyHandler) {
            document.removeEventListener('keydown', this.levelUpKeyHandler);
            this.levelUpKeyHandler = null;
        }
        this.currentChoices = null;
    }
    
    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
    }
    
    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    }
    
    // Tutorial overlay for new players
    showTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        const dismissBtn = document.getElementById('btn-tutorial-dismiss');
        const dontShowCheckbox = document.getElementById('tutorial-dont-show');
        
        if (!overlay) return;
        
        overlay.classList.remove('hidden');
        
        // Handle dismiss button
        if (dismissBtn) {
            const handleDismiss = () => {
                // Save preference if checkbox is checked
                if (dontShowCheckbox?.checked) {
                    this.game.saveData.settings = this.game.saveData.settings || {};
                    this.game.saveData.settings.tutorialDismissed = true;
                    SaveManager.save(this.game.saveData);
                }
                
                this.hideTutorial();
                dismissBtn.removeEventListener('click', handleDismiss);
            };
            dismissBtn.addEventListener('click', handleDismiss);
        }
        
        // Also allow pressing any key to dismiss
        const handleKey = (e) => {
            if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
                this.hideTutorial();
                document.removeEventListener('keydown', handleKey);
            }
        };
        setTimeout(() => {
            document.addEventListener('keydown', handleKey);
        }, 500); // Small delay to prevent instant dismiss
    }
    
    hideTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        // Unpause the game
        if (this.game) {
            this.game.paused = false;
        }
    }
    
    // Show tutorial from main menu (not during game)
    showTutorialFromMenu() {
        const overlay = document.getElementById('tutorial-overlay');
        const dismissBtn = document.getElementById('btn-tutorial-dismiss');
        
        if (!overlay) return;
        
        // Temporarily move overlay to menu for visibility
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu && !mainMenu.contains(overlay)) {
            mainMenu.appendChild(overlay);
        }
        
        overlay.classList.remove('hidden');
        
        // Change button text for menu context
        if (dismissBtn) {
            dismissBtn.textContent = 'GOT IT!';
            const handleDismiss = () => {
                overlay.classList.add('hidden');
                dismissBtn.textContent = 'BEGIN MISSION';
                // Move overlay back to game screen
                const gameScreen = document.getElementById('game-screen');
                if (gameScreen) {
                    gameScreen.appendChild(overlay);
                }
                dismissBtn.removeEventListener('click', handleDismiss);
            };
            dismissBtn.addEventListener('click', handleDismiss);
        }
    }
    
    showGameOver(victory, stats) {
        this.showScreen('gameover');
        
        this.elements.goTitle.textContent = victory ? 'ESCAPED' : 'CAPTURED';
        this.elements.goTitle.classList.toggle('victory', victory);
        
        // Show reason for failure or victory message
        if (this.elements.goReason) {
            if (victory) {
                this.elements.goReason.textContent = 'You evaded containment for 30 minutes and escaped!';
                this.elements.goReason.classList.add('victory');
            } else {
                this.elements.goReason.textContent = stats.failReason || 'Your craft was shot down';
                this.elements.goReason.classList.remove('victory');
            }
        }
        
        this.elements.goTime.textContent = Utils.formatTime(stats.time);
        this.elements.goKills.textContent = Utils.formatNumber(stats.kills);
        this.elements.goLevel.textContent = stats.level;
        this.elements.goCurrency.textContent = '+' + Utils.formatNumber(stats.currency);
    }
    
    // Flash the screen red when taking damage
    flashDamage() {
        const flash = document.getElementById('damage-flash');
        if (!flash) return;
        
        // Remove and re-add class to restart animation
        flash.classList.remove('active');
        void flash.offsetWidth; // Force reflow
        flash.classList.add('active');
        
        // Clean up
        setTimeout(() => flash.classList.remove('active'), 300);
    }
    
    // Update low health warning state
    updateLowHealthWarning(healthPercent) {
        const overlay = document.getElementById('low-health-overlay');
        if (!overlay) return;
        
        if (healthPercent <= 0.25) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    // =====================================================
    // QUIT CONFIRMATION DIALOG
    // =====================================================
    showQuitConfirmation() {
        // Create or reuse confirmation overlay
        let overlay = document.getElementById('quit-confirm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'quit-confirm-overlay';
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-content quit-confirm-modal">
                    <h2 class="modal-title">⚠️ ABORT MISSION?</h2>
                    <p class="quit-confirm-text">All progress in this run will be lost.</p>
                    <div class="modal-buttons">
                        <button id="btn-confirm-quit" class="menu-btn danger">ABORT</button>
                        <button id="btn-cancel-quit" class="menu-btn primary">CONTINUE</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Add event listeners
            overlay.querySelector('#btn-confirm-quit').addEventListener('click', () => {
                this.game.playSound?.('click');
                this.hideQuitConfirmation();
                this.game.quitToMenu();
            });
            
            overlay.querySelector('#btn-cancel-quit').addEventListener('click', () => {
                this.game.playSound?.('click');
                this.hideQuitConfirmation();
            });
            
            // Click outside modal to cancel
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.game.playSound?.('click');
                    this.hideQuitConfirmation();
                }
            });
        }
        
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
    }
    
    hideQuitConfirmation() {
        const overlay = document.getElementById('quit-confirm-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('active');
        }
    }
    
    showWarning(text, type = 'alert') {
        // Use the integrated HUD warning area instead of side popups
        const warningText = document.getElementById('hud-warning-text');
        if (!warningText) return;
        
        // Determine colors based on type
        const colors = {
            alert: '#ff3333',
            success: '#00ff00',
            info: '#00ffff',
            boss: '#ff0000'
        };
        const color = colors[type] || colors.alert;
        
        // Set warning content and color
        warningText.textContent = text;
        warningText.style.setProperty('--warning-color', color);
        warningText.classList.add('active');
        
        // Clear any existing timeout
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
        }
        
        // Auto-hide after delay (longer for boss warnings)
        const duration = type === 'boss' ? 4000 : 2000;
        this.warningTimeout = setTimeout(() => {
            warningText.classList.remove('active');
        }, duration);
    }
    
    // =====================================================
    // SALVAGE UPGRADE SYSTEM - Non-pausing choice overlay
    // =====================================================
    
    showSalvageUpgradeOverlay(choices, rerollCount, currentSalvage, timeRemaining) {
        const overlay = document.getElementById('salvage-upgrade-overlay');
        const choicesContainer = document.getElementById('salvage-choices');
        const rerollBtn = document.getElementById('salvage-reroll-btn');
        const rerollCost = document.getElementById('salvage-reroll-cost');
        const salvageCurrent = document.getElementById('salvage-current');
        const timer = document.getElementById('salvage-timer');
        
        if (!overlay || !choicesContainer) return;
        
        // Store current choices for selection
        this.salvageChoices = choices;
        
        // Build choice cards
        choicesContainer.innerHTML = choices.map((choice, idx) => {
            const data = choice.isPassive ? PASSIVE_ITEMS[choice.id] : WEAPONS[choice.id];
            if (!data) return '';
            
            const isNew = choice.currentLevel === 0;
            const levelText = isNew ? 'NEW!' : `LV ${choice.currentLevel} → ${choice.currentLevel + 1}`;
            const classes = ['salvage-choice'];
            if (isNew) classes.push('new-item');
            if (choice.isPassive) classes.push('passive-item');
            
            // Get description for current/next level
            let desc = data.description || '';
            if (data.levels && data.levels[choice.currentLevel]) {
                desc = data.levels[choice.currentLevel].description || desc;
            }
            
            return `
                <div class="${classes.join(' ')}" data-index="${idx}" onclick="game.selectSalvageUpgrade(${idx})">
                    <div class="salvage-choice-key">${idx + 1}</div>
                    <div class="salvage-choice-icon">${data.icon || '⚡'}</div>
                    <div class="salvage-choice-name">${data.name}</div>
                    <div class="salvage-choice-level">${levelText}</div>
                    <div class="salvage-choice-desc">${desc}</div>
                </div>
            `;
        }).join('');
        
        // Update reroll button
        const costs = GAME_CONFIG.SALVAGE_REROLL_COSTS || [10, 25, 50, 100];
        const maxRerolls = GAME_CONFIG.SALVAGE_REROLL_MAX || 4;
        const nextCost = rerollCount < maxRerolls ? costs[Math.min(rerollCount, costs.length - 1)] : Infinity;
        const canReroll = currentSalvage >= nextCost && rerollCount < maxRerolls;
        
        if (rerollBtn) {
            rerollBtn.disabled = !canReroll;
            rerollBtn.onclick = () => this.game.rerollSalvageUpgrades();
        }
        
        if (rerollCost) {
            if (rerollCount >= maxRerolls) {
                rerollCost.textContent = 'MAX';
            } else {
                rerollCost.textContent = `${nextCost} ⚡`;
            }
        }
        
        if (salvageCurrent) {
            salvageCurrent.textContent = `${currentSalvage} ⚡`;
        }
        
        // Update timer
        if (timer) {
            timer.textContent = `${Math.ceil(timeRemaining)}s`;
            timer.classList.toggle('urgent', timeRemaining <= 5);
        }
        
        // Show overlay
        overlay.classList.remove('hidden');
        
        // Setup keyboard handler
        if (!this.salvageKeyHandler) {
            this.salvageKeyHandler = (e) => this.handleSalvageKeyPress(e);
            document.addEventListener('keydown', this.salvageKeyHandler);
        }
    }
    
    updateSalvageTimer(timeRemaining, currentSalvage) {
        const timer = document.getElementById('salvage-timer');
        const salvageCurrent = document.getElementById('salvage-current');
        
        if (timer) {
            timer.textContent = `${Math.ceil(timeRemaining)}s`;
            timer.classList.toggle('urgent', timeRemaining <= 5);
        }
        
        if (salvageCurrent) {
            salvageCurrent.textContent = `${currentSalvage} ⚡`;
        }
    }
    
    hideSalvageUpgradeOverlay() {
        const overlay = document.getElementById('salvage-upgrade-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        
        // Remove keyboard handler
        if (this.salvageKeyHandler) {
            document.removeEventListener('keydown', this.salvageKeyHandler);
            this.salvageKeyHandler = null;
        }
        
        this.salvageChoices = null;
    }
    
    handleSalvageKeyPress(e) {
        if (!this.game.salvageUpgradeActive) return;
        
        // Number keys 1-3 to select
        if (e.key >= '1' && e.key <= '3') {
            const idx = parseInt(e.key) - 1;
            if (this.salvageChoices && this.salvageChoices[idx]) {
                this.game.selectSalvageUpgrade(idx);
            }
        }
        
        // R to reroll
        if (e.key.toLowerCase() === 'r') {
            this.game.rerollSalvageUpgrades();
        }
        
        // Escape to skip/dismiss
        if (e.key === 'Escape') {
            this.game.dismissSalvageUpgrade();
        }
    }
}

// Add warning animation to stylesheet dynamically
const style = document.createElement('style');
style.textContent = `
    .game-warning {
        position: fixed;
        right: 0;
        padding: 10px 20px 10px 15px;
        background: var(--warning-bg);
        border-left: 3px solid var(--warning-color);
        border-top: 1px solid var(--warning-color);
        border-bottom: 1px solid var(--warning-color);
        border-radius: 4px 0 0 4px;
        z-index: 1000;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Share Tech Mono', monospace;
        box-shadow: 
            0 0 20px var(--warning-color),
            inset 0 0 30px var(--warning-bg);
        animation: warningSlideIn 0.3s ease-out forwards;
        backdrop-filter: blur(8px);
        transform: translateX(100%);
    }
    
    .warning-bar {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--warning-color);
        box-shadow: 0 0 10px var(--warning-color);
        animation: warningBarPulse 0.5s ease-in-out infinite alternate;
    }
    
    .warning-icon {
        font-size: 1.2rem;
        color: var(--warning-color);
        text-shadow: 0 0 8px var(--warning-color);
        flex-shrink: 0;
    }
    
    .warning-text {
        font-size: 1rem;
        font-weight: bold;
        color: var(--warning-color-light);
        text-shadow: 0 0 10px var(--warning-color);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        white-space: nowrap;
    }
    
    .game-warning-boss {
        padding: 15px 25px 15px 20px;
        border-left-width: 5px;
        animation: warningSlideIn 0.3s ease-out forwards, bossWarningFlash 0.2s ease-in-out 3;
    }
    
    .game-warning-boss .warning-text {
        font-size: 1.3rem;
    }
    
    .game-warning-boss .warning-icon {
        font-size: 1.5rem;
    }
    
    @keyframes warningSlideIn {
        0% { 
            transform: translateX(100%);
            opacity: 0;
        }
        100% { 
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .warning-exit {
        animation: warningSlideOut 0.4s ease-in forwards !important;
    }
    
    @keyframes warningSlideOut {
        0% { 
            transform: translateX(0);
            opacity: 1;
        }
        100% { 
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes warningBarPulse {
        from { opacity: 1; box-shadow: 0 0 10px var(--warning-color); }
        to { opacity: 0.5; box-shadow: 0 0 20px var(--warning-color); }
    }
    
    @keyframes bossWarningFlash {
        0%, 100% { background: var(--warning-bg); }
        50% { background: rgba(255, 0, 0, 0.5); }
    }
`;
document.head.appendChild(style);
