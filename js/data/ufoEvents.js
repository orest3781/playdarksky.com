// =====================================================
// DOCUMENTED UFO EVENTS DATABASE
// Real historical UFO/UAP incidents for game content
// =====================================================

const UFO_EVENTS = {
    // =====================================================
    // MILITARY ENCOUNTERS - High credibility cases
    // =====================================================
    
    nimitz2004: {
        id: 'nimitz2004',
        name: 'USS Nimitz Encounter',
        aka: 'Tic Tac Incident',
        date: 'November 14, 2004',
        year: 2004,
        location: 'Pacific Ocean, off San Diego',
        coordinates: { lat: 31.5, lng: -117.5 },
        witnesses: ['Cmdr. David Fravor', 'Lt. Cmdr. Alex Dietrich', 'USS Princeton radar operators'],
        craft: {
            shape: 'tictac',
            size: '40 feet',
            color: 'White',
            features: ['No wings', 'No exhaust', 'No visible propulsion']
        },
        behavior: [
            'Dropped from 80,000 feet to sea level in seconds',
            'Hovered over churning water',
            'Mirrored F/A-18 movements',
            'Accelerated beyond visual range instantly'
        ],
        evidence: ['FLIR video', 'Radar data', 'Multiple pilot testimony'],
        classification: 'declassified',
        credibility: 'very_high',
        category: 'military',
        description: 'Navy pilots from USS Nimitz encountered a white, oblong object performing impossible maneuvers. The craft showed no flight surfaces yet outmaneuvered F/A-18 Super Hornets.',
        unlocks: {
            uap: 'tictac',
            map: 'pacific_carrier',
            achievement: 'first_contact'
        }
    },
    
    gimbal2015: {
        id: 'gimbal2015',
        name: 'GIMBAL Encounter',
        aka: 'Roosevelt Incidents',
        date: '2014-2015',
        year: 2015,
        location: 'Atlantic Ocean, East Coast',
        coordinates: { lat: 36.8, lng: -75.5 },
        witnesses: ['Multiple Navy pilots', 'USS Roosevelt crew'],
        craft: {
            shape: 'saucer',
            size: '15-20 feet',
            color: 'Dark',
            features: ['Rotating aura', 'No visible exhaust', 'Fleet of objects']
        },
        behavior: [
            'Stationary against 120 knot winds',
            'Rotation without banking',
            'Formation flying',
            'Daily sightings for months'
        ],
        evidence: ['GIMBAL video', 'GOFAST video', 'Pilot interviews'],
        classification: 'declassified',
        credibility: 'very_high',
        category: 'military',
        description: 'Navy pilots reported daily encounters with unknown craft during training exercises. Objects held position in hurricane-force winds and performed unexplainable maneuvers.',
        unlocks: {
            weapon: 'gimbalSpin',
            achievement: 'daily_observer'
        }
    },
    
    rendlesham1980: {
        id: 'rendlesham1980',
        name: 'Rendlesham Forest Incident',
        aka: 'Britain\'s Roswell',
        date: 'December 26-28, 1980',
        year: 1980,
        location: 'Suffolk, England',
        coordinates: { lat: 52.08, lng: 1.43 },
        witnesses: ['Lt. Col. Charles Halt', 'Sgt. Jim Penniston', 'Airman John Burroughs'],
        craft: {
            shape: 'triangle',
            size: '9 feet wide, 6 feet tall',
            color: 'Metallic with colored lights',
            features: ['Hieroglyphic symbols', 'Smooth surface', 'Tripod landing gear marks']
        },
        behavior: [
            'Landed in forest',
            'Emitted bright lights',
            'Left physical traces',
            'Returned multiple nights'
        ],
        evidence: ['Audio recording', 'Radiation readings', 'Ground impressions', 'Halt memo'],
        classification: 'declassified',
        credibility: 'very_high',
        category: 'military',
        description: 'US Air Force personnel at RAF Bentwaters witnessed a landed craft in Rendlesham Forest. Lt. Col. Halt recorded his observations live as a beam of light struck the ground near him.',
        unlocks: {
            uap: 'triangle',
            artifact: 'rendlesham_binary',
            map: 'forest_base'
        }
    },
    
    tehran1976: {
        id: 'tehran1976',
        name: 'Tehran UFO Incident',
        aka: 'Iranian F-4 Encounter',
        date: 'September 19, 1976',
        year: 1976,
        location: 'Tehran, Iran',
        coordinates: { lat: 35.7, lng: 51.4 },
        witnesses: ['Gen. Parviz Jafari', 'Lt. Yaddi Nazeri', 'Multiple radar operators'],
        craft: {
            shape: 'diamond',
            size: 'Large, unknown',
            color: 'Intense multicolored lights',
            features: ['Smaller craft deployed', 'Electromagnetic effects']
        },
        behavior: [
            'Disabled weapons systems when approached',
            'Disabled communications',
            'Released smaller object',
            'Outran F-4 Phantom jets'
        ],
        evidence: ['Radar data', 'DIA report', 'Pilot testimony'],
        classification: 'declassified',
        credibility: 'very_high',
        category: 'military',
        description: 'Iranian F-4 Phantoms scrambled to intercept UFO. When pilots attempted weapons lock, all systems failed. Object deployed smaller craft and demonstrated electronic warfare capabilities.',
        unlocks: {
            ability: 'emp_disable',
            enemy: 'phantom_jet',
            achievement: 'system_failure'
        }
    },
    
    japanAirlines1986: {
        id: 'japanAirlines1986',
        name: 'Japan Airlines Flight 1628',
        aka: 'Alaska Giant',
        date: 'November 17, 1986',
        year: 1986,
        location: 'Alaska, USA',
        coordinates: { lat: 64.5, lng: -147.0 },
        witnesses: ['Capt. Kenju Terauchi', 'Co-pilot', 'Flight engineer'],
        craft: {
            shape: 'walnut',
            size: 'Larger than aircraft carrier',
            color: 'Dark with lights',
            features: ['Two smaller escorts', 'Massive mothership', 'Heat emissions']
        },
        behavior: [
            'Paced 747 cargo jet for 50 minutes',
            'Confirmed on FAA radar',
            'Smaller craft performed aerobatics',
            'Massive ship appeared behind clouds'
        ],
        evidence: ['FAA radar data', 'FAA interview tapes', 'Pilot drawings'],
        classification: 'investigated',
        credibility: 'high',
        category: 'aviation',
        description: 'A JAL cargo flight was followed by massive craft over Alaska. Captain Terauchi described a mothership "the size of two aircraft carriers" that tracked them for nearly an hour.',
        unlocks: {
            uap: 'cigar',
            enemy: 'mothershipBoss',
            map: 'alaska_corridor'
        }
    },

    // =====================================================
    // MASS SIGHTINGS - Multiple witnesses
    // =====================================================
    
    phoenixLights1997: {
        id: 'phoenixLights1997',
        name: 'Phoenix Lights',
        aka: 'Arizona Mass Sighting',
        date: 'March 13, 1997',
        year: 1997,
        location: 'Phoenix, Arizona',
        coordinates: { lat: 33.45, lng: -112.07 },
        witnesses: ['Governor Fife Symington', 'Thousands of residents', 'Multiple police officers'],
        craft: {
            shape: 'boomerang',
            size: 'Over 1 mile wide',
            color: 'Black with amber lights',
            features: ['V-formation lights', 'Silent', 'Blocked out stars']
        },
        behavior: [
            'Traveled across entire state',
            'Moved silently',
            'Visible for hours',
            'Passed directly over city'
        ],
        evidence: ['Video footage', 'Thousands of witnesses', 'Governor testimony'],
        classification: 'unexplained',
        credibility: 'very_high',
        category: 'mass_sighting',
        description: 'A massive V-shaped craft with lights passed over the entire state of Arizona, witnessed by thousands including the governor. It remains one of the most witnessed UFO events in history.',
        unlocks: {
            uap: 'boomerang',
            map: 'desert_city',
            achievement: 'mass_witness'
        }
    },
    
    belgianWave1990: {
        id: 'belgianWave1990',
        name: 'Belgian UFO Wave',
        aka: 'Black Triangle Wave',
        date: 'November 1989 - April 1990',
        year: 1990,
        location: 'Belgium',
        coordinates: { lat: 50.85, lng: 4.35 },
        witnesses: ['13,500+ witnesses', 'Police officers', 'F-16 pilots'],
        craft: {
            shape: 'triangle',
            size: '100+ feet',
            color: 'Black with three lights',
            features: ['Central red light', 'Corner white lights', 'Silent hovering']
        },
        behavior: [
            'Hovered over highways',
            'Accelerated from hover to high speed instantly',
            'Tracked on radar at 1,000+ mph',
            'Dropped from 10,000 to 500 feet in seconds'
        ],
        evidence: ['F-16 radar lock data', 'Police reports', 'Photo (Petit-Rechain)'],
        classification: 'investigated',
        credibility: 'very_high',
        category: 'mass_sighting',
        description: 'Over a six-month period, thousands witnessed large triangular craft over Belgium. F-16 fighters scrambled but could not intercept. Radar showed impossible acceleration.',
        unlocks: {
            enemy: 'f16_interceptor',
            artifact: 'belgian_radar_tape',
            achievement: 'wave_survivor'
        }
    },

    stephenville2008: {
        id: 'stephenville2008',
        name: 'Stephenville Lights',
        aka: 'Texas Mass Sighting',
        date: 'January 8, 2008',
        year: 2008,
        location: 'Stephenville, Texas',
        coordinates: { lat: 32.22, lng: -98.2 },
        witnesses: ['Dozens of residents', 'Pilots', 'Police officers', 'Business owners'],
        craft: {
            shape: 'rectangular',
            size: 'Over 1 mile long',
            color: 'Bright lights',
            features: ['Multiple light configurations', 'Silent', 'F-16 pursuit']
        },
        behavior: [
            'Moved toward Bush Ranch',
            'Chased by military jets',
            'Changed light patterns',
            'Disappeared instantly'
        ],
        evidence: ['MUFON investigation', 'Radar data (FOIA)', 'Multiple witnesses'],
        classification: 'unexplained',
        credibility: 'high',
        category: 'mass_sighting',
        description: 'Dozens of Texas residents witnessed a massive silent object pursued by F-16s. FOIA requests revealed radar data showing unknown returns near the Bush Ranch.',
        unlocks: {
            map: 'texas_ranch',
            achievement: 'ranch_defender'
        }
    },

    // =====================================================
    // HISTORICAL ENCOUNTERS - Classic cases
    // =====================================================
    
    roswell1947: {
        id: 'roswell1947',
        name: 'Roswell Incident',
        aka: 'The Crash',
        date: 'July 1947',
        year: 1947,
        location: 'Roswell, New Mexico',
        coordinates: { lat: 33.39, lng: -104.52 },
        witnesses: ['Mac Brazel', 'Jesse Marcel', 'Multiple military personnel'],
        craft: {
            shape: 'disc',
            size: '15-20 feet diameter',
            color: 'Metallic',
            features: ['Memory metal debris', 'Hieroglyphic symbols', 'I-beam structures']
        },
        behavior: [
            'Crashed during storm',
            'Debris field 3/4 mile long',
            'Material with unusual properties',
            'Bodies reported (disputed)'
        ],
        evidence: ['Initial press release', 'Debris descriptions', 'Witness testimony'],
        classification: 'covered_up',
        credibility: 'legendary',
        category: 'crash',
        description: 'The most famous UFO case. Initial Army press release announced "flying disc" recovery, later retracted. Witnesses described indestructible metal and small bodies.',
        unlocks: {
            artifact: 'roswell_metal',
            map: 'desert_crash',
            achievement: 'crash_investigator',
            lore: 'majestic_12'
        }
    },
    
    kenethArnold1947: {
        id: 'kenethArnold1947',
        name: 'Kenneth Arnold Sighting',
        aka: 'Birth of Flying Saucers',
        date: 'June 24, 1947',
        year: 1947,
        location: 'Mount Rainier, Washington',
        coordinates: { lat: 46.85, lng: -121.76 },
        witnesses: ['Kenneth Arnold'],
        craft: {
            shape: 'crescent',
            size: '45-50 feet',
            color: 'Bright, reflective',
            features: ['Chain of 9 objects', 'Skipping motion', 'Estimated 1,200 mph']
        },
        behavior: [
            'Formation flying',
            'Weaving between peaks',
            'Extreme speed for era',
            '"Like saucers skipping on water"'
        ],
        evidence: ['Arnold testimony', 'Contemporary news reports'],
        classification: 'unexplained',
        credibility: 'foundational',
        category: 'historical',
        description: 'The sighting that started it all. Pilot Kenneth Arnold\'s description of objects moving "like a saucer skipped across water" coined the term "flying saucer."',
        unlocks: {
            achievement: 'original_witness',
            lore: 'project_sign'
        }
    },
    
    washingtonDC1952: {
        id: 'washingtonDC1952',
        name: 'Washington D.C. UFO Incident',
        aka: 'Washington Flap',
        date: 'July 19-27, 1952',
        year: 1952,
        location: 'Washington D.C.',
        coordinates: { lat: 38.9, lng: -77.0 },
        witnesses: ['Air traffic controllers', 'Pilots', 'Thousands of citizens'],
        craft: {
            shape: 'orb',
            size: 'Various',
            color: 'Bright lights',
            features: ['Multiple objects', 'Radar confirmed', 'Over restricted airspace']
        },
        behavior: [
            'Flew over White House',
            'Flew over Capitol',
            'Outran F-94 interceptors',
            'Returned one week later'
        ],
        evidence: ['Radar data', 'Interceptor reports', 'Newspaper front pages'],
        classification: 'investigated',
        credibility: 'very_high',
        category: 'historical',
        description: 'UFOs flew over the nation\'s capital two weekends in a row, tracked on radar and chased by jets. Made front-page news and prompted largest Pentagon press conference since WWII.',
        unlocks: {
            map: 'capital_restricted',
            enemy: 'f94_interceptor',
            achievement: 'capital_invader'
        }
    },
    
    // =====================================================
    // CLOSE ENCOUNTERS - Contact cases
    // =====================================================
    
    travisWalton1975: {
        id: 'travisWalton1975',
        name: 'Travis Walton Abduction',
        aka: 'Fire in the Sky',
        date: 'November 5, 1975',
        year: 1975,
        location: 'Apache-Sitgreaves National Forest, Arizona',
        coordinates: { lat: 34.4, lng: -110.0 },
        witnesses: ['Travis Walton', 'Six coworkers'],
        craft: {
            shape: 'disc',
            size: '20 feet diameter',
            color: 'Golden/yellow glow',
            features: ['Hovering', 'Beam of light', 'Humming sound']
        },
        behavior: [
            'Hovered over clearing',
            'Blue-green beam struck Walton',
            'Walton missing for 5 days',
            'Coworkers passed polygraphs'
        ],
        evidence: ['Polygraph tests', 'Multiple witness testimony', 'Missing person report'],
        classification: 'close_encounter_4',
        credibility: 'high',
        category: 'abduction',
        description: 'Logger Travis Walton was struck by a beam and vanished for five days. All six coworkers passed polygraphs. Walton described being aboard a craft with multiple types of beings.',
        unlocks: {
            artifact: 'examination_table',
            ability: 'beam_weapon',
            achievement: 'survivor'
        }
    },
    
    bettyBarney1961: {
        id: 'bettyBarney1961',
        name: 'Betty and Barney Hill',
        aka: 'First Abduction Case',
        date: 'September 19-20, 1961',
        year: 1961,
        location: 'White Mountains, New Hampshire',
        coordinates: { lat: 44.3, lng: -71.3 },
        witnesses: ['Betty Hill', 'Barney Hill'],
        craft: {
            shape: 'disc',
            size: '60-80 feet',
            color: 'Metallic with lights',
            features: ['Windows', 'Beings visible', 'Landed']
        },
        behavior: [
            'Followed car',
            'Missing time (2 hours)',
            'Physical marks on car',
            'Memories recovered under hypnosis'
        ],
        evidence: ['Betty\'s star map', 'Physical evidence on car', 'Psychiatric evaluations'],
        classification: 'close_encounter_4',
        credibility: 'high',
        category: 'abduction',
        description: 'The case that defined the modern abduction phenomenon. Under hypnosis, the Hills recalled being taken aboard a craft. Betty\'s star map later matched the Zeta Reticuli system.',
        unlocks: {
            artifact: 'star_map',
            lore: 'zeta_reticuli',
            achievement: 'missing_time'
        }
    },
    
    // =====================================================
    // INTERNATIONAL CASES
    // =====================================================
    
    ariel1994: {
        id: 'ariel1994',
        name: 'Ariel School Encounter',
        aka: 'Zimbabwe Children Sighting',
        date: 'September 16, 1994',
        year: 1994,
        location: 'Ruwa, Zimbabwe',
        coordinates: { lat: -17.9, lng: 31.2 },
        witnesses: ['62 schoolchildren', 'Teachers'],
        craft: {
            shape: 'disc',
            size: 'Small craft',
            color: 'Silver',
            features: ['Landed', 'Beings emerged', 'Telepathic communication']
        },
        behavior: [
            'Landed near schoolyard',
            'Small beings approached children',
            'Telepathic environmental warnings',
            'Children drew consistent pictures'
        ],
        evidence: ['Child interviews (John Mack)', 'Drawings', 'Consistent testimony 25+ years later'],
        classification: 'close_encounter_3',
        credibility: 'very_high',
        category: 'contact',
        description: '62 children witnessed a craft land and beings emerge. Harvard psychiatrist John Mack interviewed them. Decades later, the now-adults maintain their accounts.',
        unlocks: {
            lore: 'environmental_warning',
            achievement: 'children_witness',
            artifact: 'ariel_drawings'
        }
    },
    
    colares1977: {
        id: 'colares1977',
        name: 'Colares UFO Flap',
        aka: 'Operation Saucer',
        date: '1977-1978',
        year: 1977,
        location: 'Colares Island, Brazil',
        coordinates: { lat: -0.85, lng: -48.28 },
        witnesses: ['Hundreds of residents', 'Brazilian Air Force', 'Medical doctors'],
        craft: {
            shape: 'various',
            size: 'Various',
            color: 'Bright lights',
            features: ['Beams that caused burns', 'Various shapes', 'Aggressive behavior']
        },
        behavior: [
            'Attacked residents with beams',
            'Caused burn injuries',
            'Nightly appearances',
            'Brazilian military investigation'
        ],
        evidence: ['Operation Saucer documents', 'Medical records', 'Military photos', 'Captain Hollanda testimony'],
        classification: 'investigated',
        credibility: 'high',
        category: 'hostile',
        description: 'Brazilian island terrorized by UFOs that attacked residents with light beams, causing burns and puncture wounds. The Air Force launched Operation Saucer to investigate.',
        unlocks: {
            ability: 'beam_attack',
            enemy: 'hostile_probe',
            map: 'jungle_island',
            achievement: 'operation_saucer'
        }
    },
    
    varginha1996: {
        id: 'varginha1996',
        name: 'Varginha Incident',
        aka: 'Brazilian Roswell',
        date: 'January 20, 1996',
        year: 1996,
        location: 'Varginha, Brazil',
        coordinates: { lat: -21.55, lng: -45.43 },
        witnesses: ['Three women', 'Military personnel', 'Firefighters', 'Hospital staff'],
        craft: {
            shape: 'submarine-like',
            size: 'Unknown',
            color: 'Metallic',
            features: ['Crashed', 'Beings recovered', 'Military coverup']
        },
        behavior: [
            'Crash or forced landing',
            'Creatures spotted in town',
            'Military cordoned areas',
            'Hospital staff died mysteriously'
        ],
        evidence: ['Multiple witness testimony', 'Military activity documentation', 'Death of involved soldier'],
        classification: 'covered_up',
        credibility: 'high',
        category: 'crash',
        description: 'A craft crashed near Varginha, Brazil. Residents spotted strange creatures. The military conducted extensive recovery operations while denying everything.',
        unlocks: {
            enemy: 'creature',
            artifact: 'varginha_sample',
            lore: 'brazilian_coverup'
        }
    },
    
    // =====================================================
    // MODERN ENCOUNTERS - Recent cases
    // =====================================================
    
    ticTac2019: {
        id: 'ticTac2019',
        name: 'Navy UAP Acknowledgment',
        aka: 'Pentagon Confirmation',
        date: '2017-2020',
        year: 2020,
        location: 'Various, USA',
        coordinates: { lat: 38.9, lng: -77.0 },
        witnesses: ['Pentagon officials', 'Navy personnel', 'Intelligence community'],
        craft: {
            shape: 'various',
            size: 'Various',
            color: 'Various',
            features: ['Trans-medium travel', 'Anti-gravity', 'No visible propulsion']
        },
        behavior: [
            'Pentagon acknowledged videos authentic',
            'Created UAP Task Force',
            'Congressional briefings',
            'Ongoing investigation'
        ],
        evidence: ['Official Pentagon statements', 'Congressional reports', 'AARO establishment'],
        classification: 'acknowledged',
        credibility: 'official',
        category: 'disclosure',
        description: 'The US government officially acknowledged UAP are real and under investigation. Multiple classified briefings to Congress have occurred.',
        unlocks: {
            achievement: 'disclosure',
            lore: 'aaro_files'
        }
    },
    
    langley2023: {
        id: 'langley2023',
        name: 'Langley AFB Drone Swarm',
        aka: 'Virginia Incursions',
        date: 'December 2023',
        year: 2023,
        location: 'Langley Air Force Base, Virginia',
        coordinates: { lat: 37.08, lng: -76.36 },
        witnesses: ['Air Force personnel', 'Security forces'],
        craft: {
            shape: 'drone-like',
            size: 'Small',
            color: 'Various',
            features: ['Swarm behavior', 'Coordinated movement', 'Unknown origin']
        },
        behavior: [
            'Repeated incursions over base',
            'Evaded countermeasures',
            'Unknown operators',
            'Penetrated restricted airspace'
        ],
        evidence: ['Official Air Force statements', 'News reports', 'Congressional concern'],
        classification: 'ongoing',
        credibility: 'official',
        category: 'military',
        description: 'Unknown drones repeatedly penetrated airspace over Langley AFB, one of America\'s most sensitive bases. Origin and operators remain unknown.',
        unlocks: {
            enemy: 'unknown_drone_swarm',
            map: 'airforce_base'
        }
    },
    
    // =====================================================
    // LEGENDARY CASES - Folklore meets reality
    // =====================================================
    
    fooFighters1944: {
        id: 'fooFighters1944',
        name: 'Foo Fighters',
        aka: 'WWII Mystery Lights',
        date: '1944-1945',
        year: 1944,
        location: 'European and Pacific Theaters',
        coordinates: { lat: 49.0, lng: 8.0 },
        witnesses: ['Allied pilots', 'Axis pilots', 'Ground crews'],
        craft: {
            shape: 'orb',
            size: '1-5 feet',
            color: 'Red, orange, white',
            features: ['Glowing', 'Following aircraft', 'Impossible maneuvers']
        },
        behavior: [
            'Followed aircraft on missions',
            'Matched speed and maneuvers',
            'Never attacked',
            'Seen by both sides'
        ],
        evidence: ['Mission reports', 'Intelligence documents', 'Pilot debriefs'],
        classification: 'unexplained',
        credibility: 'high',
        category: 'historical',
        description: 'During WWII, pilots on all sides reported glowing orbs following their aircraft. Initially suspected to be enemy weapons, but no side claimed them.',
        unlocks: {
            uap: 'orb',
            achievement: 'foo_fighter',
            map: 'ww2_europe'
        }
    },
    
    battleOfLA1942: {
        id: 'battleOfLA1942',
        name: 'Battle of Los Angeles',
        aka: 'Great LA Air Raid',
        date: 'February 24-25, 1942',
        year: 1942,
        location: 'Los Angeles, California',
        coordinates: { lat: 34.05, lng: -118.25 },
        witnesses: ['Thousands of residents', 'Military personnel', 'Newspaper reporters'],
        craft: {
            shape: 'disc',
            size: 'Large',
            color: 'Illuminated by searchlights',
            features: ['Survived anti-aircraft fire', 'Slow moving', 'Multiple objects']
        },
        behavior: [
            'Triggered full air raid alert',
            '1,400+ rounds fired',
            'No damage to object',
            'Caused civilian deaths from friendly fire'
        ],
        evidence: ['Famous photograph', 'Military records', 'Newspaper coverage'],
        classification: 'unexplained',
        credibility: 'documented',
        category: 'historical',
        description: 'Months after Pearl Harbor, the US military opened fire on unknown objects over LA. Despite 1,400 anti-aircraft rounds, nothing was shot down.',
        unlocks: {
            achievement: 'battle_survivor',
            map: 'coastal_city',
            artifact: 'la_photo'
        }
    }
};

// =====================================================
// EVENT CATEGORIES FOR FILTERING
// =====================================================
const EVENT_CATEGORIES = {
    military: { name: 'Military Encounters', icon: '🎖️', color: '#4488ff' },
    mass_sighting: { name: 'Mass Sightings', icon: '👥', color: '#44ff88' },
    historical: { name: 'Historical Cases', icon: '📜', color: '#ffaa44' },
    crash: { name: 'Crash Retrievals', icon: '💥', color: '#ff4444' },
    abduction: { name: 'Abduction Cases', icon: '👽', color: '#aa44ff' },
    contact: { name: 'Contact Events', icon: '🤝', color: '#44ffff' },
    hostile: { name: 'Hostile Encounters', icon: '⚠️', color: '#ff0000' },
    disclosure: { name: 'Disclosure Events', icon: '📋', color: '#ffffff' },
    aviation: { name: 'Aviation Encounters', icon: '✈️', color: '#88aaff' }
};

// =====================================================
// TIMELINE DATA FOR CHRONOLOGICAL VIEW
// =====================================================
const UFO_TIMELINE = Object.values(UFO_EVENTS)
    .sort((a, b) => a.year - b.year)
    .map(e => ({ id: e.id, year: e.year, name: e.name, category: e.category }));

// Export for use
if (typeof module !== 'undefined') {
    module.exports = { UFO_EVENTS, EVENT_CATEGORIES, UFO_TIMELINE };
}
