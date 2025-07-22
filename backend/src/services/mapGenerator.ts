// Admin-panel/backend/src/routes/adminRoutes.ts
// Rozšířené admin API pro vytváření světů s automatickým generováním map

import express from 'express';
import { Pool } from 'pg';
import { MapGenerator } from '../services/mapGenerator.js';
import { MapTile, TerrainUtils } from '../models/Terrain.js';

const router = express.Router();

// PostgreSQL pool connection (přidat do vaší konfigurace)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/verven',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Mockovaná databáze světů (zachovat pro kompatibilitu)
let mockWorlds = [
  {
    id: 1,
    name: 'Hlavní server',
    slug: 'hlavni-server',
    status: 'active',
    currentPlayers: 45,
    maxPlayers: 500,
    mapSizeX: 1000,
    mapSizeY: 1000,
    seed: 123456,
    createdAt: '2025-01-15T10:00:00Z',
    settings: {
      speed: 1.0,
      unitSpeed: 1.0,
      barbarianSpawnChance: 100,
      maxPlayers: 500
    }
  }
];

let nextWorldId = 2;

/**
 * POST /api/admin/world/create - Nový endpoint pro vytváření světů s mapou
 */
router.post('/world/create', async (req, res) => {
  try {
    const { name, mapSize, seed } = req.body;

    // Validace vstupu
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Název světa je povinný'
      });
    }

    if (!mapSize || !mapSize.width || !mapSize.height) {
      return res.status(400).json({
        error: 'Velikost mapy (width, height) je povinná'
      });
    }

    if (mapSize.width < 100 || mapSize.width > 2000 || 
        mapSize.height < 100 || mapSize.height > 2000) {
      return res.status(400).json({
        error: 'Velikost mapy musí být mezi 100x100 a 2000x2000'
      });
    }

    console.log(`🌍 Začínám vytváření světa "${name}" (${mapSize.width}x${mapSize.height})`);
    const startTime = performance.now();

    // Generování seed pokud není poskytnut
    const finalSeed = seed || TerrainUtils.getRandomSeed();

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      // 1. Vytvoření záznamu světa
      const worldResult = await client.query(`
        INSERT INTO worlds (name, slug, status, map_size_x, map_size_y, seed, created_at, settings)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
        RETURNING id, name, slug, status, map_size_x, map_size_y, seed, created_at
      `, [
        name.trim(),
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        'preparing',
        mapSize.width,
        mapSize.height,
        finalSeed,
        JSON.stringify({
          speed: 1.0,
          unitSpeed: 1.0,
          barbarianSpawnChance: 100,
          maxPlayers: 500
        })
      ]);

      const world = worldResult.rows[0];
      const worldId = world.id;

      console.log(`✅ Svět vytvořen s ID ${worldId}, generuji mapu...`);

      // 2. Generování mapy
      const mapGenerator = new MapGenerator({
        width: mapSize.width,
        height: mapSize.height,
        seed: finalSeed
      });

      const generatedMap = await mapGenerator.generateMap(worldId);

      console.log(`📊 Mapa vygenerována: ${generatedMap.tiles.length} dlaždic za ${generatedMap.generationTimeMs}ms`);

      // 3. Hromadné ukládání dlaždic do databáze (batch insert)
      const batchSize = 1000;
      for (let i = 0; i < generatedMap.tiles.length; i += batchSize) {
        const batch = generatedMap.tiles.slice(i, i + batchSize);
        
        const values: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        for (const tile of batch) {
          values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
          params.push(worldId, tile.x, tile.y, tile.terrainType);
          paramIndex += 4;
        }

        await client.query(`
          INSERT INTO map_tiles (world_id, x, y, terrain_type)
          VALUES ${values.join(', ')}
        `, params);

        console.log(`💾 Uloženo ${Math.min(i + batchSize, generatedMap.tiles.length)}/${generatedMap.tiles.length} dlaždic`);
      }

      // 4. Uložení metadat
      await client.query(`
        INSERT INTO world_metadata (world_id, generation_time_ms, terrain_stats, generation_seed)
        VALUES ($1, $2, $3, $4)
      `, [
        worldId,
        generatedMap.generationTimeMs,
        JSON.stringify(generatedMap.stats),
        finalSeed
      ]);

      // 5. Aktualizace statusu světa na "active"
      await client.query(`
        UPDATE worlds SET status = 'active', updated_at = NOW() WHERE id = $1
      `, [worldId]);

      await client.query('COMMIT');

      // 6. Vytvoření náhledu mapy (prvních 50x50 polí)
      const previewSize = Math.min(50, mapSize.width, mapSize.height);
      const mapPreview = generatedMap.tiles
        .filter(tile => tile.x < previewSize && tile.y < previewSize)
        .reduce((preview: any[][], tile) => {
          if (!preview[tile.y]) preview[tile.y] = [];
          preview[tile.y][tile.x] = {
            x: tile.x,
            y: tile.y,
            terrainType: tile.terrainType,
            color: TerrainUtils.getTerrainByName(tile.terrainType)?.color || '#000000'
          };
          return preview;
        }, []);

      const totalTime = Math.round(performance.now() - startTime);
      console.log(`🎉 Svět "${name}" úspěšně vytvořen za ${totalTime}ms`);

      // Response
      res.json({
        success: true,
        worldId: worldId,
        world: {
          id: worldId,
          name: world.name,
          slug: world.slug,
          status: 'active',
          mapSize: {
            width: world.map_size_x,
            height: world.map_size_y
          },
          seed: finalSeed,
          createdAt: world.created_at,
          generationStats: {
            totalTiles: generatedMap.tiles.length,
            generationTimeMs: generatedMap.generationTimeMs,
            totalTimeMs: totalTime,
            terrainStats: generatedMap.stats
          }
        },
        mapPreview: mapPreview,
        message: `Svět "${name}" byl úspěšně vytvořen s mapou ${mapSize.width}x${mapSize.height}!`
      });

    } catch (dbError) {
      if (client) {
        await client.query('ROLLBACK');
      }
      throw dbError;
    } finally {
      if (client) {
        client.release();
      }
    }

  } catch (error) {
    console.error('❌ Chyba při vytváření světa:', error);
    res.status(500).json({
      error: 'Chyba při vytváření světa',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    });
  }
});

/**
 * GET /api/admin/world/:id/map - Získání dat mapy pro world
 */
router.get('/world/:id/map', async (req, res) => {
  try {
    const worldId = parseInt(req.params.id);
    const { startX = 0, startY = 0, width = 100, height = 100 } = req.query;

    if (isNaN(worldId)) {
      return res.status(400).json({ error: 'Neplatné ID světa' });
    }

    const client = await pool.connect();
    try {
      // Získání základních informací o světě
      const worldResult = await client.query(`
        SELECT w.*, wm.terrain_stats, wm.generation_time_ms
        FROM worlds w
        LEFT JOIN world_metadata wm ON w.id = wm.world_id
        WHERE w.id = $1
      `, [worldId]);

      if (worldResult.rows.length === 0) {
        return res.status(404).json({ error: 'Svět nebyl nalezen' });
      }

      const world = worldResult.rows[0];

      // Získání dlaždic v požadované oblasti
      const tilesResult = await client.query(`
        SELECT x, y, terrain_type
        FROM map_tiles
        WHERE world_id = $1 
        AND x >= $2 AND x < $3
        AND y >= $4 AND y < $5
        ORDER BY y, x
      `, [
        worldId,
        parseInt(startX as string),
        parseInt(startX as string) + parseInt(width as string),
        parseInt(startY as string),
        parseInt(startY as string) + parseInt(height as string)
      ]);

      const tiles = tilesResult.rows.map(row => ({
        x: row.x,
        y: row.y,
        terrainType: row.terrain_type,
        color: TerrainUtils.getTerrainByName(row.terrain_type)?.color || '#000000'
      }));

      res.json({
        success: true,
        world: {
          id: world.id,
          name: world.name,
          mapSize: {
            width: world.map_size_x,
            height: world.map_size_y
          },
          seed: world.seed
        },
        viewport: {
          startX: parseInt(startX as string),
          startY: parseInt(startY as string),
          width: parseInt(width as string),
          height: parseInt(height as string)
        },
        tiles: tiles,
        stats: world.terrain_stats ? JSON.parse(world.terrain_stats) : null,
        generationTimeMs: world.generation_time_ms
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Chyba při načítání mapy:', error);
    res.status(500).json({
      error: 'Chyba při načítání mapy',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    });
  }
});

// Zachovat existující API pro kompatibilitu
router.get('/worlds', (req, res) => {
  res.json({
    worlds: mockWorlds,
    total: mockWorlds.length
  });
});

router.get('/worlds/:id', (req, res) => {
  const worldId = parseInt(req.params.id);
  const world = mockWorlds.find(w => w.id === worldId);
  
  if (!world) {
    return res.status(404).json({
      success: false,
      error: 'Svět nebyl nalezen'
    });
  }
  
  res.json({
    success: true,
    world: world
  });
});

export default MapGenerator;