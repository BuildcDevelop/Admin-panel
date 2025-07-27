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

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ HLAVNÍ ROUTER - používá vervenAPI → Convex
app.use('/api/admin', adminRoutes);

// ===== ZACHOVANÉ ENDPOINTY =====

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

// ✅ World status endpoint (pro herní část Vervenu)
app.get('/api/world/:slug/status', async (req: Request, res: Response) => {
  const worldSlug = req.params.slug;
  
  try {
    let world: any = null;
    
    // Zkus najít svět v databázi
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
              currentPlayers: 0,
              maxPlayers: dbWorld.settings?.maxPlayers || 500,
              createdAt: dbWorld.created_at,
              settings: dbWorld.settings
            };
          }
        } finally {
          client.release();
        }
      } catch (dbError: any) {
        console.warn('⚠️ Chyba při čtení z databáze:', dbError.message);
      }
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
      'GET /api/admin/worlds (via vervenAPI)',
      'POST /api/admin/world/create (via vervenAPI)',
      'GET /api/world/:slug/status'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'PostgreSQL Connected' : 'Environment variable DATABASE_URL not set'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(``);
  console.log(`🎯 === DOSTUPNÉ ENDPOINTY ===`);
  console.log(`✅ NOVÉ (přes vervenAPI → Convex):`);
  console.log(`   GET  /api/admin/worlds - Seznam světů`);
  console.log(`   POST /api/admin/world/create - Vytvoření světa`);
  console.log(`   GET  /api/admin/worlds/:id - Detail světa`);
  console.log(`   DELETE /api/admin/worlds/:id - Smazání světa`);
  console.log(``);
  console.log(`🌐 OSTATNÍ:`);
  console.log(`   GET /api/world/:slug/status - Status konkrétního světa`);
  console.log(`   GET /api/health - Health check`);
  console.log(``);
  console.log(`🔗 Propojení: Admin Panel → Verven API (port 4001) → Convex`);
});