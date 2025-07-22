-- SQL příkazy pro rozšíření databáze o generování map
-- Umístit jako: backend/database/schema.sql

-- 0. Vytvoření základních tabulek (pokud neexistují)
CREATE TABLE IF NOT EXISTS worlds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'preparing' CHECK (status IN ('preparing', 'active', 'paused', 'ended')),
    current_players INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{"speed": 1.0, "unitSpeed": 1.0, "barbarianSpawnChance": 100, "maxPlayers": 500}'
);

CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 1. Rozšíření existující tabulky worlds
ALTER TABLE worlds 
ADD COLUMN IF NOT EXISTS map_size_x INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS map_size_y INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS seed INTEGER DEFAULT NULL;

-- 2. Vytvoření tabulky pro jednotlivé dlaždice mapy
CREATE TABLE IF NOT EXISTS map_tiles (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    terrain_type VARCHAR(20) NOT NULL CHECK (terrain_type IN ('plains', 'forest', 'mountain', 'river', 'lake')),
    owner_id INTEGER DEFAULT NULL REFERENCES players(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(world_id, x, y)
);

-- 3. Indexy pro rychlé vyhledávání
CREATE INDEX IF NOT EXISTS idx_map_tiles_world_id ON map_tiles(world_id);
CREATE INDEX IF NOT EXISTS idx_map_tiles_coordinates ON map_tiles(world_id, x, y);
CREATE INDEX IF NOT EXISTS idx_map_tiles_terrain ON map_tiles(terrain_type);
CREATE INDEX IF NOT EXISTS idx_map_tiles_owner ON map_tiles(owner_id);

-- 4. Vytvoření tabulky pro ukládání metadat světů
CREATE TABLE IF NOT EXISTS world_metadata (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    generation_time_ms INTEGER DEFAULT NULL,
    terrain_stats JSONB DEFAULT NULL, -- Statistiky terénů {"plains": 60, "forest": 15, ...}
    generation_seed INTEGER DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(world_id)
);

-- 5. Trigger pro automatické aktualizování updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_map_tiles_updated_at 
    BEFORE UPDATE ON map_tiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();