// =====================================================
// SUPABASE INTEGRATION
// Authentication & Global Leaderboard
// =====================================================

const SUPABASE_URL = 'https://soybbifyisaqbqpvauzf.supabase.co';
// Get this from: Supabase Dashboard > Settings > API > Project API keys > anon/public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveWJiaWZ5aXNhcWJxcHZhdXpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTc0MjAsImV4cCI6MjA4NDUzMzQyMH0.XxYAmnvpSRsjmXhCEGesP12vXI84gBLW6_HcAWC_keU';

class SupabaseService {
    constructor() {
        this.client = null;
        this.user = null;
        this.initialized = false;
    }

    // Initialize Supabase client
    async init() {
        if (this.initialized) return;
        
        try {
            // Check if Supabase library is loaded
            if (typeof supabase === 'undefined' || !supabase.createClient) {
                console.warn('Supabase library not loaded');
                return false;
            }

            this.client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.initialized = true;

            // Check for existing session
            const { data: { session } } = await this.client.auth.getSession();
            if (session) {
                this.user = session.user;
                console.log('Restored session for:', this.user.email);
            }

            // Listen for auth changes
            this.client.auth.onAuthStateChange((event, session) => {
                this.user = session?.user || null;
                console.log('Auth state changed:', event, this.user?.email);
                
                // Dispatch custom event for UI updates
                window.dispatchEvent(new CustomEvent('authStateChanged', { 
                    detail: { user: this.user, event } 
                }));
            });

            return true;
        } catch (error) {
            console.error('Supabase init error:', error);
            return false;
        }
    }

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    // Sign up with email
    async signUp(email, password, displayName) {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName || email.split('@')[0]
                }
            }
        });

        if (!error && data.user) {
            // Create player profile
            await this.createPlayerProfile(data.user.id, displayName || email.split('@')[0]);
        }

        return { data, error };
    }

    // Sign in with email
    async signIn(email, password) {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });

        return { data, error };
    }

    // Sign in with OAuth (Google, Discord, GitHub)
    async signInWithOAuth(provider) {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });

        return { data, error };
    }

    // Sign out
    async signOut() {
        if (!this.client) return { error: 'Not initialized' };

        const { error } = await this.client.auth.signOut();
        this.user = null;
        return { error };
    }

    // Get current user
    getUser() {
        return this.user;
    }

    // Get display name
    getDisplayName() {
        if (!this.user) return 'Guest';
        return this.user.user_metadata?.display_name || 
               this.user.email?.split('@')[0] || 
               'Player';
    }

    // =====================================================
    // PLAYER PROFILES
    // =====================================================

    async createPlayerProfile(userId, displayName) {
        if (!this.client) return { error: 'Not initialized' };

        const { data, error } = await this.client
            .from('players')
            .upsert({
                id: userId,
                display_name: displayName,
                created_at: new Date().toISOString()
            }, { onConflict: 'id' });

        return { data, error };
    }

    async updateDisplayName(displayName) {
        if (!this.client || !this.user) return { error: 'Not logged in' };

        // Update auth metadata
        await this.client.auth.updateUser({
            data: { display_name: displayName }
        });

        // Update players table
        const { data, error } = await this.client
            .from('players')
            .update({ display_name: displayName })
            .eq('id', this.user.id);

        return { data, error };
    }

    // =====================================================
    // PLAYER STATS (Cloud-synced)
    // =====================================================

    // Sync local stats to cloud
    async syncStats(localStats) {
        if (!this.client || !this.user) return { error: 'Not logged in' };

        // Get current cloud stats
        const { data: existing } = await this.client
            .from('player_stats')
            .select('*')
            .eq('player_id', this.user.id)
            .single();

        // Merge stats (take the higher values)
        const mergedStats = {
            player_id: this.user.id,
            total_play_time: Math.max(localStats.totalPlayTime || 0, existing?.total_play_time || 0),
            runs_completed: Math.max(localStats.runsCompleted || 0, existing?.runs_completed || 0),
            runs_attempted: Math.max(localStats.runsAttempted || 0, existing?.runs_attempted || 0),
            total_kills: Math.max(localStats.totalKills || 0, existing?.total_kills || 0),
            total_deaths: Math.max(localStats.totalDeaths || 0, existing?.total_deaths || 0),
            total_xp_earned: Math.max(localStats.totalXPEarned || 0, existing?.total_xp_earned || 0),
            highest_level: Math.max(localStats.highestLevel || 0, existing?.highest_level || 0),
            longest_survival: Math.max(localStats.longestSurvival || 0, existing?.longest_survival || 0),
            total_damage_dealt: Math.max(localStats.totalDamageDealt || 0, existing?.total_damage_dealt || 0),
            bosses_defeated: Math.max(localStats.bossesDefeated || 0, existing?.bosses_defeated || 0),
            elites_defeated: Math.max(localStats.elitesDefeated || 0, existing?.elites_defeated || 0),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.client
            .from('player_stats')
            .upsert(mergedStats, { onConflict: 'player_id' })
            .select();

        if (error) {
            console.error('Failed to sync stats:', error);
        }

        return { data, error };
    }

    // Get player's cloud stats
    async getPlayerStats() {
        if (!this.client || !this.user) return { data: null, error: 'Not logged in' };

        const { data, error } = await this.client
            .from('player_stats')
            .select('*')
            .eq('player_id', this.user.id)
            .single();

        return { data, error };
    }

    // Get player's recent runs (from leaderboard)
    async getRecentRuns(limit = 5) {
        if (!this.client || !this.user) return { data: [], error: 'Not logged in' };

        const { data, error } = await this.client
            .from('leaderboard')
            .select('*')
            .eq('player_id', this.user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        return { data: data || [], error };
    }

    // =====================================================
    // GLOBAL LEADERBOARD
    // =====================================================

    // Submit a score to the global leaderboard
    async submitScore(scoreData) {
        if (!this.client) {
            console.warn('Supabase not initialized - score not submitted to cloud');
            return { error: 'Not initialized' };
        }

        const entry = {
            player_id: this.user?.id || null,
            player_name: this.getDisplayName(),
            time_survived: Math.floor(scoreData.time),
            level_reached: scoreData.level,
            kills: scoreData.kills,
            difficulty: scoreData.difficulty,
            score: this.calculateScore(scoreData),
            created_at: new Date().toISOString()
        };

        const { data, error } = await this.client
            .from('leaderboard')
            .insert(entry)
            .select();

        if (error) {
            console.error('Failed to submit score:', error);
        } else {
            console.log('Score submitted to global leaderboard');
        }

        return { data, error };
    }

    // Calculate composite score for ranking
    calculateScore(data) {
        // Score formula: time * 10 + kills * 5 + level * 100 + difficulty bonus
        const difficultyMultiplier = {
            'easy': 0.5,
            'normal': 1,
            'hard': 1.5,
            'nightmare': 2,
            'impossible': 3
        };
        const mult = difficultyMultiplier[data.difficulty] || 1;
        return Math.floor((data.time * 10 + data.kills * 5 + data.level * 100) * mult);
    }

    // Get global leaderboard (top scores, best per player)
    async getGlobalLeaderboard(limit = 10, orderBy = 'score') {
        if (!this.client) return { data: [], error: 'Not initialized' };

        // Fetch more entries to ensure we get enough unique players
        const { data, error } = await this.client
            .from('leaderboard')
            .select('*')
            .order(orderBy, { ascending: false })
            .limit(limit * 5);

        if (error || !data) return { data: data || [], error };

        // Filter to best score per unique player
        const bestByPlayer = new Map();
        for (const entry of data) {
            const key = entry.player_name || entry.player_id || 'anonymous';
            if (!bestByPlayer.has(key) || entry.score > bestByPlayer.get(key).score) {
                bestByPlayer.set(key, entry);
            }
        }

        // Sort by score and limit
        const uniqueEntries = Array.from(bestByPlayer.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return { data: uniqueEntries, error: null };
    }

    // Get leaderboard filtered by difficulty
    async getLeaderboardByDifficulty(difficulty, limit = 10) {
        if (!this.client) return { data: [], error: 'Not initialized' };

        const { data, error } = await this.client
            .from('leaderboard')
            .select('*')
            .eq('difficulty', difficulty)
            .order('score', { ascending: false })
            .limit(limit);

        return { data: data || [], error };
    }

    // Get player's personal best scores
    async getPersonalBests(limit = 5) {
        if (!this.client || !this.user) return { data: [], error: 'Not logged in' };

        const { data, error } = await this.client
            .from('leaderboard')
            .select('*')
            .eq('player_id', this.user.id)
            .order('score', { ascending: false })
            .limit(limit);

        return { data: data || [], error };
    }

    // Get player's rank on leaderboard
    async getPlayerRank() {
        if (!this.client || !this.user) return { rank: null, error: 'Not logged in' };

        // Get player's best score
        const { data: personalBest } = await this.client
            .from('leaderboard')
            .select('score')
            .eq('player_id', this.user.id)
            .order('score', { ascending: false })
            .limit(1);

        if (!personalBest || personalBest.length === 0) {
            return { rank: null, error: null };
        }

        // Count how many scores are higher
        const { count, error } = await this.client
            .from('leaderboard')
            .select('*', { count: 'exact', head: true })
            .gt('score', personalBest[0].score);

        return { rank: (count || 0) + 1, error };
    }
}

// Create global instance
window.supabaseService = new SupabaseService();
