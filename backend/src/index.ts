// Admin-panel/backend/src/index.ts
// Hlavní server s integrací automatického generování map
import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

// Import našich nových routes s generováním map
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ JEDEN globální pool
const dbPool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}) : null;

// ✅ Middleware pouze jednou
app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);

// =======================================================
// LEGACY MOCK ENDPOINTY (pro kompatibilitu s frontendem)
// =======================================================

// Typy pro mock data
interface MockWorld {
  id: number;
  name: string;
  slug: string;
  status: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
  settings: {
    speed: number;
    unitSpeed: number;
    barbarianSpawnChance: number;
    maxPlayers: number;
  };
  map_size_x?: number;
  map_size_y?: number;
  seed?: string;
}

// Mockovaná databáze světů - rozšířená verze
let mockWorlds: MockWorld[] = [
  {
    id: 9001,  // ✅ Změněno z 1 na 9001
    name: 'Hlavní server',
    slug: 'hlavni-server',
    status: 'active',
    currentPlayers: 45,
    maxPlayers: 500,
    createdAt: '2025-01-15T10:00:00Z',
    settings: {
      speed: 1.0,
      unitSpeed: 1.0,
      barbarianSpawnChance: 100,
      maxPlayers: 500
    }
  },
  {
    id: 9002,  // ✅ Změněno z 2 na 9002
    name: 'Rychlý svět',
    slug: 'rychly-svet',
    status: 'active',
    currentPlayers: 23,
    maxPlayers: 100,
    createdAt: '2025-01-20T14:30:00Z',
    settings: {
      speed: 5.0,
      unitSpeed: 2.0,
      barbarianSpawnChance: 80,
      maxPlayers: 100
    }
  }
];

// Globální ID counter pro nové světy
let nextWorldId = 9003;

// ===== ENDPOINTS =====

// ✅ Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Admin API running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// LEGACY: Admin routes - GET endpoint s mock daty
app.get('/api/admin/worlds', async (req: Request, res: Response) => {
  try {
    let allWorlds = [...mockWorlds];
    
    // Přidej světy z databáze
    if (dbPool) {
      try {
        const client = await dbPool.connect();
        try {
          const result = await client.query(`
            SELECT id, name, slug, status, created_at, settings
            FROM worlds ORDER BY created_at DESC
          `);
          
          const dbWorlds = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            status: row.status,
            currentPlayers: 0,
            maxPlayers: row.settings?.maxPlayers || 500,
            createdAt: row.created_at,
            settings: row.settings || {
              speed: 1.0,
              unitSpeed: 1.0,
              barbarianSpawnChance: 100,
              maxPlayers: 500
            }
          }));
          
          allWorlds = [...dbWorlds, ...mockWorlds];
        } finally {
          client.release();
        }
      } catch (dbError: any) {
        console.warn('⚠️ Chyba při čtení světů z databáze:', dbError.message);
      }
    }
    
    res.json({
      worlds: allWorlds,
      total: allWorlds.length
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Chyba při načítání světů' });
  }
});
// LEGACY: Admin routes - GET endpoint pro jednotlivý svět
app.get('/api/admin/worlds/:id', (req: Request, res: Response) => {
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

// LEGACY POST endpoint pro vytváření světů (BEZ generování map)
app.post('/api/admin/worlds', (req: Request, res: Response) => {
  const { name, settings } = req.body;
  
  // Validace
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Název světa je povinný'
    });
  }
  
  // Vytvoř slug z názvu
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Nový svět
  const newWorld: MockWorld = {
    id: nextWorldId++,
    name: name.trim(),
    slug,
    status: 'preparing',
    settings: settings || {
      speed: 1.0,
      unitSpeed: 1.0,
      barbarianSpawnChance: 100,
      maxPlayers: 500
    },
    createdAt: new Date().toISOString(),
    currentPlayers: 0,
    maxPlayers: settings?.maxPlayers || 500
  };
  
  // Přidat do mock databáze
  mockWorlds.push(newWorld);
  
  console.log('🌍 Nový svět vytvořen (LEGACY):', newWorld);
  
  res.json({
    success: true,
    world: newWorld,
    message: `Svět "${name}" byl vytvořen úspěšně!`
  });
});

// PUBLIC API endpoints
app.get('/api/worlds/public', (req: Request, res: Response) => {
  const publicWorlds = mockWorlds
    .filter(world => world.status === 'active')
    .map(world => ({
      id: world.id,
      name: world.name,
      slug: world.slug,
      status: world.status,
      currentPlayers: world.currentPlayers,
      maxPlayers: world.maxPlayers || world.settings.maxPlayers,
      createdAt: world.createdAt
    }));

  res.json({
    success: true,
    worlds: publicWorlds,
    total: publicWorlds.length
  });
});

// ✅ OPRAVENÝ World status endpoint (pro tlačítko "Svět")  
app.get('/api/world/:slug/status', async (req: Request, res: Response) => {
  const worldSlug = req.params.slug;
  
  try {
    let world: any = null;
    
    // ✅ NOVÉ: Nejdříve zkusit najít svět v databázi (nové světy s mapami)
    if (dbPool) {
      try {
        const client = await dbPool.connect();
        try {
          const result = await client.query(`
            SELECT id, name, slug, status, map_size_x, map_size_y, seed, created_at, settings
            FROM worlds 
            WHERE slug = $1
          `, [worldSlug]);
          
          if (result.rows.length > 0) {
            const dbWorld = result.rows[0];
            world = {
              id: dbWorld.id,
              name: dbWorld.name,
              slug: dbWorld.slug,
              status: dbWorld.status,
              map_size_x: dbWorld.map_size_x,
              map_size_y: dbWorld.map_size_y,
              seed: dbWorld.seed,
              currentPlayers: 0, // TODO: Načítat skutečný počet z players tabulky
              maxPlayers: dbWorld.settings?.maxPlayers || 500,
              createdAt: dbWorld.created_at,
              settings: dbWorld.settings
            };
          }
        } finally {
          client.release();
        }
      } catch (dbError: any) {
        console.warn('⚠️ Chyba při čtení z databáze, používám mock data:', dbError.message);
      }
    }
    
    // ✅ Fallback na mock data pokud svět nebyl nalezen v databázi
    if (!world) {
      world = mockWorlds.find(w => w.slug === worldSlug);
    }
    
    if (!world) {
      return res.status(404).json({
        success: false,
        error: 'Svět nebyl nalezen',
        message: 'Zadaný svět neexistuje.'
      });
    }

    const response: any = {
      success: true,
      world: {
        id: world.id,
        name: world.name,
        slug: world.slug,
        status: world.status,
        map_size_x: world.map_size_x || undefined,
        map_size_y: world.map_size_y || undefined,
        seed: world.seed || undefined,
        currentPlayers: world.currentPlayers,
        maxPlayers: world.maxPlayers || world.settings?.maxPlayers
      }
    };

    // Zprávy podle statusu světa
    switch (world.status) {
      case 'active':
        response.message = 'Svět je aktivní a připraven ke hře!';
        response.canPlay = true;
        response.displayMessage = `Vítejte ve světě "${world.name}"!`;
        break;
      case 'preparing':
        response.message = 'Svět se právě připravuje. Brzy bude spuštěn!';
        response.canPlay = false;
        break;
      case 'paused':
        response.message = 'Svět byl z technických důvodů pozastaven.';
        response.canPlay = false;
        response.displayMessage = 'Omlouváme se za dočasné problémy. Svět bude brzy obnoven.';
        break;
      case 'ended':
        response.message = 'Tento svět byl ukončen.';
        response.canPlay = false;
        response.displayMessage = 'Děkujeme za účast! Podívejte se na ostatní aktivní světy.';
        break;
      default:
        response.message = 'Neznámý status světa.';
        response.canPlay = false;
    }

    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Chyba při načítání světa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba při načítání světa',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Interní chyba serveru',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint nebyl nalezen',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/admin/worlds (legacy)',
      'POST /api/admin/world/create (new with map generation)',
      'GET /api/admin/world/:id/map',
      'GET /api/worlds/public',
      'GET /api/world/:slug/status'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'PostgreSQL Connected' : 'Environment variable DATABASE_URL not set'}`);
  console.log(`📊 Mock data contains ${mockWorlds.length} legacy worlds`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(``);
  console.log(`🎯 === DOSTUPNÉ ENDPOINTY ===`);
  console.log(`✅ NOVÉ (s generováním map):`);
  console.log(`   POST /api/admin/world/create - Vytvoří svět s automaticky generovanou mapou`);
  console.log(`   GET  /api/admin/world/:id/map - Načte data mapy pro zobrazení`);
  console.log(``);
  console.log(`📋 LEGACY (kompatibilita s frontendem):`);
  console.log(`   GET  /api/admin/worlds - Seznam světů (mock)`);
  console.log(`   POST /api/admin/worlds - Vytvoření světa (bez mapy)`);
  console.log(`   GET/PUT/DELETE /api/admin/worlds/:id - Správa světů (mock)`);
  console.log(``);
  console.log(`🌐 PUBLIC API:`);
  console.log(`   GET /api/worlds/public - Veřejný seznam světů`);
  console.log(`   GET /api/world/:slug/status - Status konkrétního světa`);
  console.log(`   GET /api/health - Health check s informacemi`);
  
  if (!process.env.DATABASE_URL) {
    console.log(``);
    console.log(`⚠️  UPOZORNĚNÍ: DATABASE_URL není nastavena!`);
    console.log(`   Vytvořte .env soubor s: DATABASE_URL=postgresql://postgres:heslo@localhost:5432/verven`);
    console.log(`   Bez toho nebude fungovat generování map.`);
  } else {
    console.log(``);
    console.log(`🗺️  Map Generation: AKTIVNÍ`);
    console.log(`   Můžete vytvářet světy s automaticky generovanými mapami!`);
  }
});