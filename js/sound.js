// =====================================================
// SOUND MANAGER - External Audio Files + Web Audio Synthesis Fallback
// =====================================================

class SoundManager {
    constructor() {
        this.enabled = true;
        this.masterVolume = 0.7;
        this.sfxVolume = 1.0;
        this.musicVolume = 0.4;
        
        this.sounds = {};
        this.music = null;
        this.audioContext = null;
        this.musicBuffer = null;
        this.musicLoaded = false;
        
        // Track which sounds have external files loaded
        this.externalSounds = new Set();
        
        // Track playing instances for pooling
        this.activeSounds = new Map();
        
        // Sound throttling - prevent sound spam
        this.soundCooldowns = new Map();
        this.maxConcurrentSounds = 8; // Max sounds playing at once
        this.currentSoundCount = 0;
        
        // Cooldown times in ms for different sound categories
        this.cooldownTimes = {
            // Frequent sounds - longer cooldowns
            explosionSmall: 50,
            pickupXP: 30,
            shoot: 40,
            
            // Medium frequency
            explosion: 80,
            pickup: 60,
            hit: 100,
            
            // Rare/important sounds - short or no cooldown
            explosionBig: 200,
            levelUp: 500,
            phaseChange: 1000,
            bossWarning: 2000,
            pickupPowerup: 100,
            pickupHealth: 100,
            
            // Default for unlisted sounds
            default: 50
        };
        
        // =====================================================
        // EXTERNAL AUDIO FILE MAPPINGS
        // Empty = use synthesized sounds (default)
        // Uncomment lines to enable external audio files
        // =====================================================
        this.audioFiles = {
            // === WEAPONS ===
            // shoot: 'sci-fi-sfx/shoot_01.ogg',
            // shootHeavy: 'sci-fi-sfx/shoot_02.ogg',
            // plasma: 'sci-fi-sfx/retro_laser_01.ogg',
            // missile: 'sci-fi-sfx/rocket_01.ogg',
            // railgun: 'sci-fi-sfx/retro_laser_02.ogg',
            
            // === EXPLOSIONS ===
            // explosion: 'sci-fi-sfx/explosion_01.ogg',
            // explosionSmall: 'sci-fi-sfx/retro_explosion.ogg',
            // explosionBig: 'sci-fi-sfx/explosion_02.ogg',
            
            // === PICKUPS ===
            // pickup: 'sci-fi-sfx/beep_01.ogg',
            // pickupXP: 'sci-fi-sfx/retro_beep_01.ogg',
            // pickupHealth: 'sci-fi-sfx/retro_beep_03.ogg',
            // pickupPowerup: 'sci-fi-sfx/retro_beep_05.ogg',
            
            // === PLAYER ===
            // hit: 'sci-fi-sfx/misc_03.ogg',
            // death: 'sci-fi-sfx/weird_01.ogg',
            // heal: 'sci-fi-sfx/retro_beep_04.ogg',
            // shield: 'sci-fi-sfx/misc_05.ogg',
            // boost: 'sci-fi-sfx/misc_06.ogg',
            
            // === LEVEL/PROGRESS ===
            // levelUp: 'sci-fi-sfx/retro_beep_06.ogg',
            // upgrade: 'sci-fi-sfx/beep_02.ogg',
            // phaseChange: 'sci-fi-sfx/weird_02.ogg',
            // victory: 'sci-fi-sfx/retro_beep_05.ogg',
            
            // === UI ===
            // click: 'sci-fi-sfx/terminal_01.ogg',
            // hover: 'sci-fi-sfx/terminal_02.ogg',
            // select: 'sci-fi-sfx/terminal_03.ogg',
            // error: 'sci-fi-sfx/terminal_08.ogg',
            // pause: 'sci-fi-sfx/terminal_05.ogg',
            
            // === ALERTS ===
            // warning: 'sci-fi-sfx/beep_03.ogg',
            // missileAlert: 'sci-fi-sfx/misc_01.ogg',
            // radarPing: 'sci-fi-sfx/misc_02.ogg',
            // bossWarning: 'sci-fi-sfx/weird_03.ogg',
            
            // === ENEMIES ===
            // enemyShoot: 'sci-fi-sfx/retro_laser_01.ogg',
            // enemySpawn: 'sci-fi-sfx/teleport_01.ogg',
            // launch: 'sci-fi-sfx/rocket_01.ogg',
            // droneBuzz: 'sci-fi-sfx/misc_04.ogg',
            // alarm: 'sci-fi-sfx/misc_07.ogg',
            // sonarPing: 'sci-fi-sfx/misc_02.ogg',
            // stealthReveal: 'sci-fi-sfx/teleport_02.ogg',
            
            // === ABILITIES ===
            // ability: 'sci-fi-sfx/weird_04.ogg',
            // chronoBurst: 'sci-fi-sfx/weird_05.ogg',
            // phaseShift: 'sci-fi-sfx/teleport_02.ogg',
            // overdrive: 'sci-fi-sfx/misc_08.ogg',
        };
        
        // Initialize
        this.init();
    }
    
    init() {
        // Create audio context for synthesis
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
            return;
        }
        
        // Generate all synthesized sounds (as fallback)
        this.generateSounds();
        
        // Load external audio files (will override synthesized)
        this.loadExternalSounds();
        
        // Load theme music from file
        this.loadThemeMusic();
        
        // Load voice clips
        this.loadVoiceClips();
        
        if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.log('SoundManager initialized');
    }
    
    // Load external audio files, falling back to synthesized on failure
    async loadExternalSounds() {
        const loadPromises = [];
        
        for (const [name, path] of Object.entries(this.audioFiles)) {
            loadPromises.push(this.loadExternalSound(name, path));
        }
        
        await Promise.allSettled(loadPromises);
        
        if (this.externalSounds.size > 0) {
            console.log(`Loaded ${this.externalSounds.size} external sound(s):`, [...this.externalSounds]);
        }
    }
    
    async loadExternalSound(name, path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Override the synthesized sound with external file
            this.sounds[name] = buffer;
            this.externalSounds.add(name);
            
            if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
                console.log(`Loaded external sound: ${name} from ${path}`);
            }
        } catch (e) {
            // Silently fall back to synthesized sound (already generated)
            if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
                console.log(`Using synthesized fallback for: ${name}`);
            }
        }
    }
    
    // Load theme music from WAV file
    async loadThemeMusic() {
        try {
            const response = await fetch('theme-music.wav');
            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.musicLoaded = true;
            if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.log('Theme music loaded successfully');
        } catch (e) {
            if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.warn('Failed to load theme music, falling back to synthesized:', e);
            // Fallback to synthesized music
            this.createAmbientMusic();
        }
    }
    
    // Load voice clips from files
    async loadVoiceClips() {
        const voiceFiles = {
            'subsurfaceContact': 'subsurface-contact-detected.mp3'
        };
        
        for (const [name, file] of Object.entries(voiceFiles)) {
            try {
                const response = await fetch(file);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds[name] = buffer;
                if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.log(`Voice clip loaded: ${name}`);
            } catch (e) {
                if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.warn(`Failed to load voice clip ${name}:`, e);
            }
        }
    }
    
    // Play a voice clip with radio/comms effects
    playVoice(name, volume = 1.0, effects = true) {
        if (!this.enabled || !this.sounds[name] || !this.audioContext) return null;
        
        const ctx = this.audioContext;
        const source = ctx.createBufferSource();
        source.buffer = this.sounds[name];
        
        // Final output gain
        const outputGain = ctx.createGain();
        outputGain.gain.value = volume * this.sfxVolume * this.masterVolume;
        
        if (effects) {
            // === RADIO COMMS EFFECT CHAIN ===
            
            // 1. High-pass filter (removes low frequencies like a radio)
            const highPass = ctx.createBiquadFilter();
            highPass.type = 'highpass';
            highPass.frequency.value = 300;
            highPass.Q.value = 0.7;
            
            // 2. Low-pass filter (removes high frequencies, radio bandwidth limit)
            const lowPass = ctx.createBiquadFilter();
            lowPass.type = 'lowpass';
            lowPass.frequency.value = 3500;
            lowPass.Q.value = 0.7;
            
            // 3. Peaking filter (boost mid frequencies for "tinny" radio sound)
            const midBoost = ctx.createBiquadFilter();
            midBoost.type = 'peaking';
            midBoost.frequency.value = 1500;
            midBoost.gain.value = 4;
            midBoost.Q.value = 1;
            
            // 4. Compressor (makes it punchy and consistent like military comms)
            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 12;
            compressor.ratio.value = 8;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.1;
            
            // 5. Subtle distortion (adds grit/static quality)
            const distortion = ctx.createWaveShaper();
            distortion.curve = this.makeRadioDistortionCurve(50);
            distortion.oversample = '2x';
            
            // 6. Another gain stage to compensate for filter losses
            const makeupGain = ctx.createGain();
            makeupGain.gain.value = 1.0;
            
            // Connect the chain: source -> highPass -> lowPass -> midBoost -> compressor -> distortion -> makeupGain -> outputGain -> destination
            source.connect(highPass);
            highPass.connect(lowPass);
            lowPass.connect(midBoost);
            midBoost.connect(compressor);
            compressor.connect(distortion);
            distortion.connect(makeupGain);
            makeupGain.connect(outputGain);
            
            // Add subtle static noise burst at start
            this.addRadioStatic(ctx, outputGain, 0.15, 0.08);
            
        } else {
            // No effects, direct connection
            source.connect(outputGain);
        }
        
        outputGain.connect(ctx.destination);
        source.start(0);
        
        return source;
    }
    
    // Create distortion curve for radio effect
    makeRadioDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }
    
    // Add a short burst of radio static
    addRadioStatic(ctx, destination, duration, volume) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate pink-ish noise (more realistic radio static)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            
            // Fade in/out envelope
            const env = Math.sin((i / bufferSize) * Math.PI);
            data[i] = pink * 0.05 * env;
        }
        
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        
        // Filter the static to sound more radio-like
        const staticFilter = ctx.createBiquadFilter();
        staticFilter.type = 'bandpass';
        staticFilter.frequency.value = 2000;
        staticFilter.Q.value = 0.5;
        
        const staticGain = ctx.createGain();
        staticGain.gain.value = volume * this.sfxVolume * this.masterVolume;
        
        noiseSource.connect(staticFilter);
        staticFilter.connect(staticGain);
        staticGain.connect(destination);
        noiseSource.start(0);
    }
    
    // Resume audio context (required after user interaction)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    generateSounds() {
        // Define all game sounds with synthesis parameters
        const soundDefs = {
            // Weapons
            shoot: { type: 'laser', freq: 880, duration: 0.1, decay: 0.08 },
            shootHeavy: { type: 'laser', freq: 440, duration: 0.15, decay: 0.12 },
            plasma: { type: 'noise', freq: 200, duration: 0.12, decay: 0.1, filter: 800 },
            missile: { type: 'sweep', freqStart: 400, freqEnd: 100, duration: 0.3 },
            railgun: { type: 'impact', freq: 80, duration: 0.4, decay: 0.3 },
            
            // Explosions
            explosion: { type: 'explosion', freq: 100, duration: 0.5 },
            explosionSmall: { type: 'explosion', freq: 200, duration: 0.25 },
            explosionBig: { type: 'explosion', freq: 60, duration: 0.8 },
            
            // Player
            hit: { type: 'noise', freq: 150, duration: 0.15, decay: 0.1, filter: 400 },
            death: { type: 'sweep', freqStart: 800, freqEnd: 50, duration: 1.0 },
            heal: { type: 'arp', freqs: [400, 500, 600, 800], duration: 0.4 },
            shield: { type: 'hum', freq: 220, duration: 0.3 },
            boost: { type: 'sweep', freqStart: 200, freqEnd: 600, duration: 0.2 },
            
            // Pickups
            pickup: { type: 'arp', freqs: [600, 800], duration: 0.15 },
            pickupXP: { type: 'blip', freq: 1200, duration: 0.05 },
            pickupHealth: { type: 'arp', freqs: [400, 600, 800], duration: 0.25 },
            pickupPowerup: { type: 'arp', freqs: [300, 400, 500, 600, 800], duration: 0.4 },
            
            // Level/Progress
            levelUp: { type: 'fanfare', freqs: [400, 500, 600, 800, 1000], duration: 0.6 },
            upgrade: { type: 'arp', freqs: [500, 700, 900], duration: 0.3 },
            phaseChange: { type: 'alarm', freq: 400, duration: 1.0 },
            victory: { type: 'fanfare', freqs: [400, 500, 600, 700, 800, 1000, 1200], duration: 1.2 },
            
            // UI
            click: { type: 'blip', freq: 800, duration: 0.03 },
            hover: { type: 'blip', freq: 600, duration: 0.02 },
            select: { type: 'arp', freqs: [600, 900], duration: 0.1 },
            error: { type: 'buzz', freq: 150, duration: 0.2 },
            pause: { type: 'sweep', freqStart: 600, freqEnd: 400, duration: 0.15 },
            
            // Alerts/Warnings
            warning: { type: 'alarm', freq: 600, duration: 0.3 },
            missileAlert: { type: 'alarm', freq: 800, duration: 0.5, pulses: 3 },
            radarPing: { type: 'ping', freq: 1000, duration: 0.2 },
            bossWarning: { type: 'alarm', freq: 200, duration: 1.5, pulses: 4 },
            
            // Enemies
            enemyShoot: { type: 'laser', freq: 300, duration: 0.1, decay: 0.08 },
            enemySpawn: { type: 'sweep', freqStart: 100, freqEnd: 300, duration: 0.2 },
            
            // Abilities
            ability: { type: 'sweep', freqStart: 300, freqEnd: 1200, duration: 0.25 },
            chronoBurst: { type: 'sweep', freqStart: 1200, freqEnd: 200, duration: 0.4 },
            phaseShift: { type: 'hum', freq: 150, duration: 0.5 },
            overdrive: { type: 'sweep', freqStart: 200, freqEnd: 800, duration: 0.3 },
            
            // Enemy-specific sounds
            launch: { type: 'sweep', freqStart: 500, freqEnd: 200, duration: 0.25 },
            droneBuzz: { type: 'buzz', freq: 300, duration: 0.4 },
            alarm: { type: 'alarm', freq: 500, duration: 0.6, pulses: 2 },
            sonarPing: { type: 'ping', freq: 800, duration: 0.3 },
            stealthReveal: { type: 'sweep', freqStart: 1500, freqEnd: 600, duration: 0.2 },
        };
        
        // Pre-generate audio buffers for each sound
        for (const [name, params] of Object.entries(soundDefs)) {
            this.sounds[name] = this.synthesize(params);
        }
    }
    
    synthesize(params) {
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;
        const duration = params.duration || 0.2;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        switch (params.type) {
            case 'laser':
                this.synthLaser(data, params, sampleRate);
                break;
            case 'explosion':
                this.synthExplosion(data, params, sampleRate);
                break;
            case 'noise':
                this.synthNoise(data, params, sampleRate);
                break;
            case 'sweep':
                this.synthSweep(data, params, sampleRate);
                break;
            case 'arp':
                this.synthArp(data, params, sampleRate);
                break;
            case 'blip':
                this.synthBlip(data, params, sampleRate);
                break;
            case 'fanfare':
                this.synthFanfare(data, params, sampleRate);
                break;
            case 'alarm':
                this.synthAlarm(data, params, sampleRate);
                break;
            case 'ping':
                this.synthPing(data, params, sampleRate);
                break;
            case 'hum':
                this.synthHum(data, params, sampleRate);
                break;
            case 'buzz':
                this.synthBuzz(data, params, sampleRate);
                break;
            case 'impact':
                this.synthImpact(data, params, sampleRate);
                break;
            default:
                this.synthBlip(data, params, sampleRate);
        }
        
        return buffer;
    }
    
    // Synthesis methods
    synthLaser(data, params, sr) {
        const freq = params.freq || 880;
        const decay = params.decay || 0.1;
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.exp(-t / decay);
            const freqMod = freq * (1 + Math.exp(-t * 20) * 2);
            data[i] = Math.sin(2 * Math.PI * freqMod * t) * env * 0.4;
            // Add harmonics
            data[i] += Math.sin(4 * Math.PI * freqMod * t) * env * 0.2;
        }
    }
    
    synthExplosion(data, params, sr) {
        const freq = params.freq || 100;
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.exp(-t * 4);
            // Noise burst
            const noise = (Math.random() * 2 - 1) * env;
            // Low rumble
            const rumble = Math.sin(2 * Math.PI * freq * t * (1 - t * 2)) * env;
            data[i] = (noise * 0.6 + rumble * 0.4) * 0.5;
        }
    }
    
    synthNoise(data, params, sr) {
        const decay = params.decay || 0.1;
        const filterFreq = params.filter || 1000;
        let lastSample = 0;
        const filterCoeff = Math.exp(-2 * Math.PI * filterFreq / sr);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.exp(-t / decay);
            const noise = Math.random() * 2 - 1;
            // Simple low-pass filter
            lastSample = lastSample * filterCoeff + noise * (1 - filterCoeff);
            data[i] = lastSample * env * 0.5;
        }
    }
    
    synthSweep(data, params, sr) {
        const freqStart = params.freqStart || 400;
        const freqEnd = params.freqEnd || 200;
        const duration = params.duration || 0.2;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const progress = t / duration;
            const freq = freqStart + (freqEnd - freqStart) * progress;
            const env = Math.exp(-t * 3);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.4;
        }
    }
    
    synthArp(data, params, sr) {
        const freqs = params.freqs || [400, 600, 800];
        const duration = params.duration || 0.3;
        const noteLength = duration / freqs.length;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const noteIndex = Math.min(Math.floor(t / noteLength), freqs.length - 1);
            const noteT = t - noteIndex * noteLength;
            const freq = freqs[noteIndex];
            const env = Math.exp(-noteT * 10);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.3;
        }
    }
    
    synthBlip(data, params, sr) {
        const freq = params.freq || 800;
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.exp(-t * 30);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.3;
        }
    }
    
    synthFanfare(data, params, sr) {
        const freqs = params.freqs || [400, 500, 600, 800, 1000];
        const duration = params.duration || 0.6;
        const noteLength = duration / freqs.length;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const noteIndex = Math.min(Math.floor(t / noteLength), freqs.length - 1);
            const noteT = t - noteIndex * noteLength;
            const freq = freqs[noteIndex];
            // Longer envelope for fanfare
            const env = Math.exp(-noteT * 5) * (1 - Math.exp(-noteT * 50));
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.25;
            // Add harmony
            data[i] += Math.sin(2 * Math.PI * freq * 1.5 * t) * env * 0.15;
        }
    }
    
    synthAlarm(data, params, sr) {
        const freq = params.freq || 600;
        const pulses = params.pulses || 2;
        const duration = params.duration || 0.3;
        const pulseLength = duration / pulses;
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const pulseT = t % pulseLength;
            const pulsePhase = pulseT / pulseLength;
            // On/off pattern
            const on = pulsePhase < 0.5 ? 1 : 0;
            const env = on * (1 - pulsePhase * 2);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.35;
            // Add urgency with slight frequency wobble
            data[i] += Math.sin(2 * Math.PI * (freq * 1.02) * t) * env * 0.15;
        }
    }
    
    synthPing(data, params, sr) {
        const freq = params.freq || 1000;
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.exp(-t * 15) * Math.sin(t * 50);
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.max(0, env) * 0.3;
        }
    }
    
    synthHum(data, params, sr) {
        const freq = params.freq || 200;
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.sin(Math.PI * t / params.duration);
            // Rich hum with harmonics
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.2;
            data[i] += Math.sin(2 * Math.PI * freq * 2 * t) * env * 0.1;
            data[i] += Math.sin(2 * Math.PI * freq * 3 * t) * env * 0.05;
        }
    }
    
    synthBuzz(data, params, sr) {
        const freq = params.freq || 150;
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.exp(-t * 5);
            // Square-ish wave for buzz
            const phase = (t * freq) % 1;
            const square = phase < 0.5 ? 1 : -1;
            data[i] = square * env * 0.25;
        }
    }
    
    synthImpact(data, params, sr) {
        const freq = params.freq || 80;
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const env = Math.exp(-t * 8);
            // Heavy low impact
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.5;
            // Initial click
            if (t < 0.01) {
                data[i] += (Math.random() * 2 - 1) * (1 - t * 100) * 0.5;
            }
        }
    }
    
    // Play a sound
    play(name, options = {}) {
        if (!this.enabled || !this.sounds[name]) return null;
        
        // Check cooldown - prevent sound spam
        const now = performance.now();
        const lastPlayed = this.soundCooldowns.get(name) || 0;
        const cooldown = this.cooldownTimes[name] || this.cooldownTimes.default;
        
        if (now - lastPlayed < cooldown) {
            return null; // Sound on cooldown, skip it
        }
        
        // Limit concurrent sounds to prevent audio overload
        if (this.currentSoundCount >= this.maxConcurrentSounds) {
            // Only allow important sounds through when at max
            const importantSounds = ['levelUp', 'phaseChange', 'bossWarning', 'death', 'explosionBig', 'pickupPowerup'];
            if (!importantSounds.includes(name)) {
                return null;
            }
        }
        
        this.soundCooldowns.set(name, now);
        this.resume();
        
        const buffer = this.sounds[name];
        const ctx = this.audioContext;
        
        // Create source
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Track sound count
        this.currentSoundCount++;
        source.onended = () => {
            this.currentSoundCount = Math.max(0, this.currentSoundCount - 1);
        };
        
        // Create gain node for volume
        const gainNode = ctx.createGain();
        // Reduce volume when many sounds playing
        const volumeScale = this.currentSoundCount > 4 ? 0.7 : 1.0;
        const volume = (options.volume || 1) * this.sfxVolume * this.masterVolume * volumeScale;
        gainNode.gain.value = volume;
        
        // Optional: Panning for positional audio
        let panner = null;
        if (options.x !== undefined && options.y !== undefined) {
            panner = ctx.createStereoPanner();
            // Simple stereo panning based on x position (-1 to 1)
            const pan = Math.max(-1, Math.min(1, (options.x - 0.5) * 2));
            panner.pan.value = pan;
            source.connect(panner);
            panner.connect(gainNode);
        } else {
            source.connect(gainNode);
        }
        
        gainNode.connect(ctx.destination);
        
        // Playback rate variation for variety
        if (options.pitchVariation) {
            source.playbackRate.value = 1 + (Math.random() - 0.5) * options.pitchVariation;
        }
        
        source.start(0);
        
        return source;
    }
    
    // Create procedural ambient music
    createAmbientMusic() {
        // Simple ambient drone that loops
        const ctx = this.audioContext;
        const duration = 8; // 8 second loop
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(2, length, sampleRate); // Stereo
        
        const left = buffer.getChannelData(0);
        const right = buffer.getChannelData(1);
        
        // Create ambient pad
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const progress = t / duration;
            
            // Base drone frequencies (Cmaj7 chord spread)
            const f1 = 65.41;  // C2
            const f2 = 98.00;  // G2
            const f3 = 123.47; // B2
            const f4 = 146.83; // D3
            
            // Slow LFO for movement
            const lfo1 = Math.sin(2 * Math.PI * 0.1 * t);
            const lfo2 = Math.sin(2 * Math.PI * 0.07 * t + 1);
            
            // Smooth envelope for looping
            const loopEnv = Math.sin(Math.PI * progress);
            
            // Generate pad sound
            let sampleL = 0, sampleR = 0;
            
            sampleL += Math.sin(2 * Math.PI * f1 * t) * 0.15;
            sampleL += Math.sin(2 * Math.PI * f2 * t) * 0.1 * (1 + lfo1 * 0.3);
            sampleL += Math.sin(2 * Math.PI * f3 * t) * 0.08;
            
            sampleR += Math.sin(2 * Math.PI * f1 * t) * 0.15;
            sampleR += Math.sin(2 * Math.PI * f4 * t) * 0.1 * (1 + lfo2 * 0.3);
            sampleR += Math.sin(2 * Math.PI * f3 * t + 0.5) * 0.08;
            
            // Add subtle noise texture
            const noise = (Math.random() * 2 - 1) * 0.02;
            sampleL += noise;
            sampleR += noise * 0.8;
            
            left[i] = sampleL * loopEnv;
            right[i] = sampleR * loopEnv;
        }
        
        this.musicBuffer = buffer;
    }
    
    // Start background music
    startMusic() {
        if (!this.enabled || this.musicPlaying) return;
        
        // If music not loaded yet, retry after a short delay
        if (!this.musicBuffer) {
            setTimeout(() => this.startMusic(), 500);
            return;
        }
        
        this.resume();
        
        const ctx = this.audioContext;
        
        this.musicSource = ctx.createBufferSource();
        this.musicSource.buffer = this.musicBuffer;
        this.musicSource.loop = true;
        
        this.musicGain = ctx.createGain();
        this.musicGain.gain.value = this.musicVolume * this.masterVolume;
        
        this.musicSource.connect(this.musicGain);
        this.musicGain.connect(ctx.destination);
        
        this.musicSource.start(0);
        this.musicPlaying = true;
    }
    
    // Stop background music
    stopMusic() {
        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch (e) {}
            this.musicSource = null;
        }
        this.musicPlaying = false;
    }
    
    // Fade music
    fadeMusic(targetVolume, duration = 1) {
        if (!this.musicGain) return;
        
        const ctx = this.audioContext;
        this.musicGain.gain.linearRampToValueAtTime(
            targetVolume * this.masterVolume,
            ctx.currentTime + duration
        );
    }
    
    // Volume controls
    setMasterVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume * this.masterVolume;
        }
    }
    
    setSFXVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    }
    
    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume * this.masterVolume;
        }
    }
    
    // Toggle sound
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
        return this.enabled;
    }
    
    // Mute/unmute
    mute() {
        this.setMasterVolume(0);
    }
    
    unmute() {
        this.setMasterVolume(0.7);
    }
}

// Global instance (created when game starts)
window.SoundManager = SoundManager;
