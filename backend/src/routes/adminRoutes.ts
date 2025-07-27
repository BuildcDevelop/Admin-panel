// admin-panel/backend/src/routes/adminRoutes.ts - ÚPRAVA
import express from 'express';
import vervenAPI from '../services/vervenAPI'; // ✅ NOVÝ IMPORT

const router = express.Router();

// ===== MÍSTO PostgreSQL queries, použij vervenAPI =====

// GET /api/admin/worlds - Seznam světů z Vervenu
router.get('/worlds', async (req, res) => {
  try {
    console.log('🌍 Načítám světy z Vervenu...');
    
    const worlds = await vervenAPI.getWorlds();
    
    res.json({
      worlds: worlds,
      total: worlds.length
    });
  } catch (error: any) {
    console.error('❌ Chyba při načítání světů:', error.message);
    res.status(500).json({ 
      error: 'Chyba při načítání světů z Vervenu',
      details: error.message 
    });
  }
});

// POST /api/admin/world/create - Vytvoření světa přes Verven
router.post('/world/create', async (req, res) => {
  try {
    console.log('🔨 Vytvářím svět přes Verven API...');
    
    const { name, mapSize, seed, settings } = req.body;
    
    // Validace (stejná jako před)
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
    
    // Volání Verven API místo PostgreSQL
    const result = await vervenAPI.createWorld({
      name,
      mapSize,
      seed,
      settings: settings || {
        speed: 1.0,
        unitSpeed: 1.0,
        maxPlayers: 500,
        barbarianSpawnChance: 100
      }
    });
    
    console.log('✅ Svět vytvořen:', result);
    
    res.json({
      success: true,
      message: `Svět "${name}" byl úspěšně vytvořen`,
      data: result
    });
    
  } catch (error: any) {
    console.error('❌ Chyba při vytváření světa:', error.message);
    res.status(500).json({ 
      error: 'Chyba při vytváření světa',
      details: error.message 
    });
  }
});

// GET /api/admin/worlds/:id - Detail světa z Vervenu
router.get('/worlds/:id', async (req, res) => {
  try {
    const worldId = req.params.id;
    console.log(`🔍 Načítám detail světa ${worldId} z Vervenu...`);
    
    const world = await vervenAPI.getWorldDetail(worldId);
    
    res.json({
      success: true,
      world: world
    });
  } catch (error: any) {
    console.error('❌ Chyba při načítání detailu světa:', error.message);
    res.status(404).json({ 
      error: 'Svět nebyl nalezen',
      details: error.message 
    });
  }
});

// DELETE /api/admin/worlds/:id - Smazání světa přes Verven
router.delete('/worlds/:id', async (req, res) => {
  try {
    const worldId = req.params.id;
    console.log(`🗑️ Mažu svět ${worldId} přes Verven API...`);
    
    const result = await vervenAPI.deleteWorld(worldId);
    
    res.json({
      success: true,
      message: 'Svět byl úspěšně smazán',
      data: result
    });
  } catch (error: any) {
    console.error('❌ Chyba při mazání světa:', error.message);
    res.status(500).json({ 
      error: 'Chyba při mazání světa',
      details: error.message 
    });
  }
});

// ===== ZACHOVAT ADMIN SPECIFICKÉ FUNKCE =====
// (admin login, logs, atd. - ty zůstávají na PostgreSQL)

export default router;