-- Player Stats Table for Dark Sky UFO Survivor
-- Run this in your Supabase SQL Editor

-- Create the player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
    player_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_play_time INTEGER DEFAULT 0,
    runs_completed INTEGER DEFAULT 0,
    runs_attempted INTEGER DEFAULT 0,
    total_kills INTEGER DEFAULT 0,
    total_deaths INTEGER DEFAULT 0,
    total_xp_earned INTEGER DEFAULT 0,
    highest_level INTEGER DEFAULT 0,
    longest_survival INTEGER DEFAULT 0,
    total_damage_dealt BIGINT DEFAULT 0,
    bosses_defeated INTEGER DEFAULT 0,
    elites_defeated INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Users can only read their own stats
CREATE POLICY "Users can read own stats"
    ON player_stats FOR SELECT
    USING (auth.uid() = player_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
    ON player_stats FOR INSERT
    WITH CHECK (auth.uid() = player_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats"
    ON player_stats FOR UPDATE
    USING (auth.uid() = player_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);

-- Add player_id column to leaderboard if it doesn't exist
-- This allows tracking which runs belong to which user
ALTER TABLE leaderboard 
    ADD COLUMN IF NOT EXISTS player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for player's runs
CREATE INDEX IF NOT EXISTS idx_leaderboard_player_id ON leaderboard(player_id);
