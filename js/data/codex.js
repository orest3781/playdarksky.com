// =====================================================
// CODEX & COLLECTION SYSTEM
// Diablo-style collection tracking with lore unlocks
// =====================================================

const CODEX = {
    // =====================================================
    // COLLECTION CATEGORIES
    // =====================================================
    categories: {
        uap_types: {
            name: 'UAP Types',
            icon: '🛸',
            description: 'Documented unidentified aerial phenomena',
            color: '#44aaff'
        },
        enemies: {
            name: 'Hostiles',
            icon: '✈️',
            description: 'Military forces encountered',
            color: '#ff4444'
        },
        artifacts: {
            name: 'Artifacts',
            icon: '💎',
            description: 'Recovered materials and objects',
            color: '#ffaa00'
        },
        events: {
            name: 'Incidents',
            icon: '📋',
            description: 'Documented UFO events',
            color: '#44ff88'
        },
        weapons: {
            name: 'Weapons',
            icon: '⚡',
            description: 'Offensive capabilities unlocked',
            color: '#ff44ff'
        },
        locations: {
            name: 'Locations',
            icon: '🗺️',
            description: 'Known hotspot areas',
            color: '#88ff44'
        },
        lore: {
            name: 'Classified',
            icon: '🔒',
            description: 'Secret documents and programs',
            color: '#aaaaaa'
        },
        achievements: {
            name: 'Achievements',
            icon: '🏆',
            description: 'Milestones reached',
            color: '#ffd700'
        }
    }
};

// =====================================================
// ARTIFACTS - Diablo-style legendary items
// Each has unique effects and lore
// =====================================================
const ARTIFACTS = {
    // ===== LEGENDARY ARTIFACTS (From real events) =====
    
    roswell_metal: {
        id: 'roswell_metal',
        name: 'Memory Metal Fragment',
        rarity: 'legendary',
        icon: '🔩',
        source: 'roswell1947',
        description: 'A fragment of the mysterious material recovered at Roswell. It returns to its original shape when deformed.',
        lore: 'Witnesses described metal that, when crumpled, would unfold itself perfectly. No known material behaves this way.',
        effects: [
            { type: 'health_regen', value: 2, description: '+2 HP/sec regeneration' },
            { type: 'damage_reduction', value: 0.1, description: '10% damage reduction' }
        ],
        setBonus: 'roswell_set',
        visualEffect: 'metallic_shimmer'
    },
    
    rendlesham_binary: {
        id: 'rendlesham_binary',
        name: 'Binary Code Download',
        rarity: 'legendary',
        icon: '💾',
        source: 'rendlesham1980',
        description: 'Mental imprint received by Sgt. Penniston when he touched the craft. Contains coordinates and a message.',
        lore: 'The binary, when decoded, revealed coordinates to ancient sites and the message: "EXPLORATION OF HUMANITY"',
        effects: [
            { type: 'xp_bonus', value: 0.25, description: '+25% XP gained' },
            { type: 'reveal_map', value: true, description: 'Reveals hidden locations' }
        ],
        setBonus: 'rendlesham_set',
        visualEffect: 'binary_aura'
    },
    
    star_map: {
        id: 'star_map',
        name: 'Zeta Reticuli Star Map',
        rarity: 'legendary',
        icon: '🗺️',
        source: 'bettyBarney1961',
        description: 'Betty Hill drew this map under hypnosis. It matches the Zeta Reticuli binary star system.',
        lore: 'The map was dismissed until 1968 when the Zeta Reticuli system was catalogued - matching Betty\'s drawing perfectly.',
        effects: [
            { type: 'pickup_range', value: 0.5, description: '+50% pickup range' },
            { type: 'enemy_reveal', value: 300, description: 'Shows enemies on minimap within 300 units' }
        ],
        setBonus: 'abductee_set',
        visualEffect: 'star_constellation'
    },
    
    la_photo: {
        id: 'la_photo',
        name: 'Battle of LA Photograph',
        rarity: 'epic',
        icon: '📷',
        source: 'battleOfLA1942',
        description: 'The famous searchlight photograph showing the object over Los Angeles.',
        lore: 'Despite 1,400 anti-aircraft rounds fired, the object was undamaged. The photo shows searchlights converging on it.',
        effects: [
            { type: 'projectile_resistance', value: 0.15, description: '15% projectile damage reduction' }
        ],
        visualEffect: 'searchlight_glow'
    },
    
    ariel_drawings: {
        id: 'ariel_drawings',
        name: 'Children\'s Witness Drawings',
        rarity: 'epic',
        icon: '🎨',
        source: 'ariel1994',
        description: 'Collected drawings from the 62 children who witnessed the Ariel School landing.',
        lore: 'Children from different classes drew remarkably consistent images of the beings and craft.',
        effects: [
            { type: 'cooldown_reduction', value: 0.15, description: '15% ability cooldown reduction' },
            { type: 'innocence', value: true, description: 'First hit each encounter deals no damage' }
        ],
        setBonus: 'witness_set',
        visualEffect: 'childlike_aura'
    },
    
    flir_footage: {
        id: 'flir_footage',
        name: 'Declassified FLIR Video',
        rarity: 'legendary',
        icon: '📹',
        source: 'nimitz2004',
        description: 'The authentic FLIR footage from the Nimitz encounter, showing the Tic Tac.',
        lore: '"It\'s rotating!" - The object displayed impossible flight characteristics captured in infrared.',
        effects: [
            { type: 'crit_chance', value: 0.2, description: '+20% critical hit chance' },
            { type: 'tracking', value: true, description: 'Projectiles slightly home toward enemies' }
        ],
        setBonus: 'nimitz_set',
        visualEffect: 'flir_overlay'
    },
    
    halt_tape: {
        id: 'halt_tape',
        name: 'Halt Audio Recording',
        rarity: 'epic',
        icon: '🎙️',
        source: 'rendlesham1980',
        description: 'Lt. Col. Halt\'s live recording as a beam of light struck the ground near him.',
        lore: '"It\'s coming this way... there\'s no doubt about it... this is weird!"',
        effects: [
            { type: 'beam_damage', value: 0.25, description: '+25% beam weapon damage' }
        ],
        setBonus: 'rendlesham_set',
        visualEffect: 'audio_waves'
    },
    
    // ===== EPIC ARTIFACTS =====
    
    foo_fighter_orb: {
        id: 'foo_fighter_orb',
        name: 'Captured Foo Fighter',
        rarity: 'epic',
        icon: '💡',
        source: 'fooFighters1944',
        description: 'A dormant orb recovered from a WWII aircraft that made an emergency landing.',
        lore: 'The orb followed a B-17 bomber for hours before attaching to the fuselage and going dark.',
        effects: [
            { type: 'orbiting_damage', value: 0.3, description: '+30% orbiting weapon damage' },
            { type: 'speed', value: 0.1, description: '+10% movement speed' }
        ],
        visualEffect: 'following_orb'
    },
    
    operation_saucer_files: {
        id: 'operation_saucer_files',
        name: 'Operation Saucer Dossier',
        rarity: 'epic',
        icon: '📁',
        source: 'colares1977',
        description: 'Brazilian Air Force investigation documents with photos of injured civilians.',
        lore: 'Captain Hollanda led the investigation and later spoke publicly before his mysterious death.',
        effects: [
            { type: 'damage_bonus', value: 0.15, description: '+15% damage dealt' },
            { type: 'intel', value: true, description: 'Shows enemy health bars' }
        ],
        visualEffect: 'classified_stamp'
    },
    
    gimbal_signature: {
        id: 'gimbal_signature',
        name: 'GIMBAL Heat Signature',
        rarity: 'epic',
        icon: '🎯',
        source: 'gimbal2015',
        description: 'The impossible thermal signature of the rotating craft.',
        lore: 'The object rotated without banking - violating known aerodynamics.',
        effects: [
            { type: 'area_damage', value: 0.2, description: '+20% AoE damage' },
            { type: 'rotation_speed', value: 0.25, description: '+25% weapon rotation speed' }
        ],
        visualEffect: 'thermal_rotation'
    },
    
    // ===== RARE ARTIFACTS =====
    
    belgian_radar_tape: {
        id: 'belgian_radar_tape',
        name: 'F-16 Radar Recording',
        rarity: 'rare',
        icon: '📊',
        source: 'belgianWave1990',
        description: 'Radar data showing the triangle craft\'s impossible acceleration.',
        lore: 'The craft accelerated from hover to over 1,000 mph in seconds while also dropping altitude.',
        effects: [
            { type: 'acceleration', value: 0.2, description: '+20% acceleration' }
        ],
        visualEffect: 'radar_blip'
    },
    
    examination_table: {
        id: 'examination_table',
        name: 'Fragment of Examination Table',
        rarity: 'rare',
        icon: '🛏️',
        source: 'travisWalton1975',
        description: 'A small piece of the table Travis Walton found himself on.',
        lore: 'Walton described waking on a table surrounded by small grey beings.',
        effects: [
            { type: 'health_max', value: 0.1, description: '+10% max health' }
        ],
        visualEffect: 'medical_glow'
    },
    
    varginha_sample: {
        id: 'varginha_sample',
        name: 'Varginha Biological Sample',
        rarity: 'rare',
        icon: '🧬',
        source: 'varginha1996',
        description: 'Alleged tissue sample from the Varginha incident.',
        lore: 'The creatures were described as having oily brown skin and large red eyes.',
        effects: [
            { type: 'poison_damage', value: 15, description: 'Attacks apply 15 poison damage over 3 seconds' }
        ],
        visualEffect: 'biological_aura'
    },
    
    phoenix_footage: {
        id: 'phoenix_footage',
        name: 'Phoenix Lights VHS Tape',
        rarity: 'rare',
        icon: '📼',
        source: 'phoenixLights1997',
        description: 'Home video footage of the massive V-shaped craft.',
        lore: 'Thousands witnessed the craft, including Governor Symington who later mocked a press conference.',
        effects: [
            { type: 'formation_bonus', value: true, description: 'Drone weapons deal +15% damage' }
        ],
        visualEffect: 'vhs_static'
    }
};

// =====================================================
// ARTIFACT SETS - Bonus for collecting related items
// =====================================================
const ARTIFACT_SETS = {
    roswell_set: {
        name: 'Roswell Collection',
        items: ['roswell_metal', 'roswell_bodies', 'roswell_craft_fragment'],
        bonuses: {
            2: { type: 'crash_site_reveal', description: 'Reveals crash sites on map' },
            3: { type: 'legendary_drop', value: 0.1, description: '+10% legendary drop chance' }
        }
    },
    
    rendlesham_set: {
        name: 'Rendlesham Files',
        items: ['rendlesham_binary', 'halt_tape', 'rendlesham_soil'],
        bonuses: {
            2: { type: 'beam_resistance', value: 0.2, description: '20% beam damage reduction' },
            3: { type: 'symbol_reader', description: 'Decode alien symbols for bonuses' }
        }
    },
    
    nimitz_set: {
        name: 'Nimitz Encounter Evidence',
        items: ['flir_footage', 'nimitz_radar_data', 'pilot_testimony'],
        bonuses: {
            2: { type: 'navy_intel', description: 'Enemies take 10% more damage from behind' },
            3: { type: 'tic_tac_mode', description: 'Unlock Tic Tac maneuver ability' }
        }
    },
    
    abductee_set: {
        name: 'Abductee Evidence',
        items: ['star_map', 'implant_fragment', 'missing_time_watch'],
        bonuses: {
            2: { type: 'time_sense', description: 'Slow-motion when below 25% health' },
            3: { type: 'communication', description: 'Chance to pacify enemies' }
        }
    },
    
    witness_set: {
        name: 'Witness Testimonies',
        items: ['ariel_drawings', 'phoenix_footage', 'belgian_radar_tape'],
        bonuses: {
            2: { type: 'truth_seeker', value: 0.15, description: '+15% XP from first-time enemy kills' },
            3: { type: 'mass_witness', description: 'Nearby enemies deal 10% less damage' }
        }
    }
};

// =====================================================
// LORE DOCUMENTS - Unlockable story content
// =====================================================
const LORE_DOCUMENTS = {
    // ===== GOVERNMENT PROGRAMS =====
    
    project_sign: {
        id: 'project_sign',
        name: 'Project SIGN',
        category: 'government',
        classification: 'declassified',
        year: 1948,
        description: 'The first official US Air Force UFO investigation.',
        content: `PROJECT SIGN - CLASSIFIED
        
Established: 1948
Status: TERMINATED
Successor: Project GRUDGE

Initial Estimate of the Situation concluded that UFOs were of extraterrestrial origin. This conclusion was rejected by Air Force Chief of Staff Hoyt Vandenberg and the report was ordered destroyed.

Key Findings:
- Multiple credible pilot reports
- Radar confirmations
- Objects displaying impossible flight characteristics
- No conventional explanation found for majority of cases

RECOMMENDATION: Continue investigation under new project designation.`,
        unlockCondition: 'kenethArnold1947'
    },
    
    project_blue_book: {
        id: 'project_blue_book',
        name: 'Project Blue Book',
        category: 'government',
        classification: 'declassified',
        year: 1952,
        description: 'The Air Force\'s long-running UFO study.',
        content: `PROJECT BLUE BOOK
        
Duration: 1952-1969
Cases Investigated: 12,618
Unexplained: 701 (5.5%)

The project was criticized for explaining away credible sightings with implausible theories. Dr. J. Allen Hynek, the project's scientific consultant, later became a UFO advocate.

Notable Cases:
- Washington D.C. 1952
- Levelland, Texas 1957
- Exeter, New Hampshire 1965

CONCLUSION: No evidence of extraterrestrial vehicles.
INTERNAL NOTE: This conclusion was mandated, not derived.`,
        unlockCondition: 'washingtonDC1952'
    },
    
    majestic_12: {
        id: 'majestic_12',
        name: 'Majestic-12 Briefing',
        category: 'government',
        classification: 'disputed',
        year: 1947,
        description: 'Alleged secret committee formed after Roswell.',
        content: `MAJESTIC-12 BRIEFING DOCUMENT
        
CLASSIFICATION: TOP SECRET/MAJIC EYES ONLY

This briefing is for the incoming President regarding the recovery of extraterrestrial biological entities and craft debris near Roswell, New Mexico in July 1947.

MJ-12 MEMBERS:
1. Adm. Roscoe Hillenkoetter
2. Dr. Vannevar Bush
3. Sec. James Forrestal
4. Gen. Nathan Twining
[ADDITIONAL NAMES REDACTED]

RECOVERED MATERIALS:
- Craft debris with unusual properties
- Four extraterrestrial biological entities (deceased)
- Control mechanisms of unknown function

CURRENT STATUS: Material under study at [REDACTED]

NOTE: Document authenticity disputed. Included for historical context.`,
        unlockCondition: 'roswell1947'
    },
    
    aaro_files: {
        id: 'aaro_files',
        name: 'AARO Historical Report',
        category: 'government',
        classification: 'official',
        year: 2024,
        description: 'Pentagon\'s All-domain Anomaly Resolution Office report.',
        content: `ALL-DOMAIN ANOMALY RESOLUTION OFFICE
HISTORICAL RECORD REPORT - VOLUME 1

KEY FINDINGS:

1. No verifiable evidence of extraterrestrial technology in USG possession
2. Many historical UFO sightings attributed to misidentified technology programs
3. No evidence of cover-up or reverse engineering programs

NOTABLE PROGRAMS MISTAKEN FOR UFOs:
- U-2 spy plane (1950s)
- SR-71 Blackbird
- F-117 Stealth Fighter development
- Various drone programs

ONGOING CONCERNS:
- Unexplained incursions over sensitive installations
- Trans-medium craft reports
- Foreign adversary technology possibility

STATUS: Investigation ongoing. Additional volumes forthcoming.`,
        unlockCondition: 'ticTac2019'
    },
    
    // ===== WITNESS ACCOUNTS =====
    
    fravor_testimony: {
        id: 'fravor_testimony',
        name: 'Commander Fravor Testimony',
        category: 'witness',
        classification: 'public',
        year: 2017,
        description: 'First-hand account of the Nimitz Tic Tac encounter.',
        content: `WITNESS STATEMENT - CMDR. DAVID FRAVOR, USN (Ret.)

"We're at about 20,000 feet when the controller says, 'We've got some objects going down from 80,000 feet to 20,000 feet and then going back up.'

When I looked down at the water... I saw a white object that was about 40 feet long, shaped like a Tic Tac. It was just hovering above the water, which was churning beneath it.

I started a descent to intercept it. As I got close, it started to mirror me. It was aware of us. Then it took off like nothing I've ever seen. It was gone. Poof.

I've been flying for 24 years. I've seen a lot of things. But I've never seen anything that could do what that thing did. Not even close."

[Testimony given to Congress, 2023]`,
        unlockCondition: 'nimitz2004'
    },
    
    environmental_warning: {
        id: 'environmental_warning',
        name: 'Ariel School Message',
        category: 'contact',
        classification: 'witness',
        year: 1994,
        description: 'The telepathic message received by the Ariel School children.',
        content: `ARIEL SCHOOL - WITNESS INTERVIEWS
Conducted by: Dr. John Mack, Harvard University

COMMON THEMES FROM CHILDREN:

"They showed me pictures in my head. Pictures of the world ending."

"They said we're hurting the Earth. That technology is bad."

"I could hear them in my mind. They were scared for us."

"They looked sad. Like they wanted to help but couldn't."

DR. MACK'S NOTES:
The consistency of the children's accounts is remarkable. Despite being separated and interviewed individually, they described nearly identical beings and received similar environmental warnings.

The beings communicated telepathically, showing images of environmental destruction.

FOLLOW-UP (2022):
Now adults, the witnesses maintain their accounts.`,
        unlockCondition: 'ariel1994'
    },
    
    // ===== SCIENTIFIC ANALYSIS =====
    
    five_observables: {
        id: 'five_observables',
        name: 'The Five Observables',
        category: 'scientific',
        classification: 'analysis',
        year: 2017,
        description: 'Key characteristics of genuine UAP sightings.',
        content: `THE FIVE OBSERVABLES
As identified by AATIP (Advanced Aerospace Threat Identification Program)

1. ANTI-GRAVITY LIFT
Objects appear to defy gravity without conventional propulsion. No wings, no exhaust, no rotors.

2. SUDDEN & INSTANTANEOUS ACCELERATION
From hover to hypersonic in seconds. No gradual acceleration. G-forces would be fatal to humans.

3. HYPERSONIC VELOCITY WITHOUT SIGNATURE
Speeds exceeding Mach 5 without sonic boom or heat signature.

4. LOW OBSERVABILITY (STEALTH)
Difficult to track on radar despite visual confirmation. Some produce no radar return at all.

5. TRANS-MEDIUM TRAVEL
Ability to operate in air, water, and potentially space without change in capability.

ANALYSIS: Any craft displaying multiple observables cannot be explained by current human technology.`,
        unlockCondition: 'Complete 5 different event investigations'
    },
    
    zeta_reticuli: {
        id: 'zeta_reticuli',
        name: 'Zeta Reticuli Analysis',
        category: 'scientific',
        classification: 'research',
        year: 1968,
        description: 'Analysis of Betty Hill\'s star map.',
        content: `ZETA RETICULI STAR MAP CORRELATION
Research by: Marjorie Fish (1968-1973)

BACKGROUND:
Under hypnosis, Betty Hill drew a star map shown to her during her abduction. She claimed the beings showed her their home system.

ANALYSIS:
When the Gliese Catalogue was updated in 1969, amateur astronomer Marjorie Fish found a match.

The pattern of stars in Hill's map matches the view from Zeta Reticuli - a binary star system 39 light-years from Earth.

KEY POINTS:
- Hill drew the map BEFORE the star positions were known
- Zeta Reticuli is Sun-like and could support habitable planets
- The probability of a random match is extremely low

SKEPTICAL NOTES:
Some astronomers dispute the match. However, no better correlation has been found.`,
        unlockCondition: 'bettyBarney1961'
    }
};

// =====================================================
// COLLECTION TRACKER
// =====================================================
class CollectionTracker {
    constructor(saveData) {
        this.discovered = saveData.discovered || {
            events: [],
            artifacts: [],
            enemies: [],
            uapTypes: [],
            weapons: [],
            locations: [],
            lore: [],
            achievements: []
        };
        this.stats = saveData.collectionStats || {
            totalDiscovered: 0,
            totalPossible: this.calculateTotalPossible(),
            completionPercentage: 0
        };
    }
    
    calculateTotalPossible() {
        return Object.keys(UFO_EVENTS).length +
               Object.keys(ARTIFACTS).length +
               Object.keys(ENEMY_TYPES).length +
               Object.keys(UAP_TYPES).length +
               Object.keys(WEAPONS).length +
               Object.keys(LORE_DOCUMENTS).length;
    }
    
    discover(category, id) {
        if (!this.discovered[category]) {
            this.discovered[category] = [];
        }
        
        if (!this.discovered[category].includes(id)) {
            this.discovered[category].push(id);
            this.stats.totalDiscovered++;
            this.stats.completionPercentage = 
                (this.stats.totalDiscovered / this.stats.totalPossible) * 100;
            
            return true; // New discovery
        }
        return false; // Already discovered
    }
    
    isDiscovered(category, id) {
        return this.discovered[category]?.includes(id) || false;
    }
    
    getCategoryProgress(category) {
        const discovered = this.discovered[category]?.length || 0;
        let total = 0;
        
        switch(category) {
            case 'events': total = Object.keys(UFO_EVENTS).length; break;
            case 'artifacts': total = Object.keys(ARTIFACTS).length; break;
            case 'enemies': total = Object.keys(ENEMY_TYPES).length; break;
            case 'uapTypes': total = Object.keys(UAP_TYPES).length; break;
            case 'weapons': total = Object.keys(WEAPONS).length; break;
            case 'lore': total = Object.keys(LORE_DOCUMENTS).length; break;
        }
        
        return { discovered, total, percentage: (discovered / total) * 100 };
    }
    
    getCompletionRewards() {
        const rewards = [];
        const percentage = this.stats.completionPercentage;
        
        if (percentage >= 25) rewards.push('codex_novice');
        if (percentage >= 50) rewards.push('codex_researcher');
        if (percentage >= 75) rewards.push('codex_expert');
        if (percentage >= 100) rewards.push('codex_master');
        
        return rewards;
    }
    
    save() {
        return {
            discovered: this.discovered,
            collectionStats: this.stats
        };
    }
}

// Export
if (typeof module !== 'undefined') {
    module.exports = { 
        CODEX, 
        ARTIFACTS, 
        ARTIFACT_SETS, 
        LORE_DOCUMENTS, 
        CollectionTracker 
    };
}
