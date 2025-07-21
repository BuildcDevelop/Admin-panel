import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mockovaná databáze světů - rozšířená verze
let mockWorlds = [
  {
    id: 1,
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
    id: 2,
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
let nextWorldId = 3;

// Test route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Admin API running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Admin routes - GET endpoint s mock daty
app.get('/api/admin/worlds', (req, res) => {
  res.json({
    worlds: mockWorlds,
    total: mockWorlds.length
  });
});

// Admin routes - GET endpoint pro jednotlivý svět
app.get('/api/admin/worlds/:id', (req, res) => {
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

// Admin routes - POST endpoint pro vytváření světů
app.post('/api/admin/worlds', (req, res) => {
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
  const newWorld = {
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
  
  console.log('🌍 Nový svět vytvořen:', newWorld);
  
  res.json({
    success: true,
    world: newWorld,
    message: `Svět "${name}" byl vytvořen úspěšně!`
  });
});

// Admin routes - PUT endpoint pro editaci světa
app.put('/api/admin/worlds/:id', (req, res) => {
  const worldId = parseInt(req.params.id);
  const { settings } = req.body;
  
  // Najdi svět
  const worldIndex = mockWorlds.findIndex(w => w.id === worldId);
  if (worldIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Svět nebyl nalezen'
    });
  }
  
  const world = mockWorlds[worldIndex];
  
  // Zkontroluj, zda lze svět editovat
  if (world.status !== 'active') {
    return res.status(400).json({
      success: false,
      error: 'Lze editovat pouze aktivní světy'
    });
  }
  
  // Validace nastavení
  if (!settings) {
    return res.status(400).json({
      success: false,
      error: 'Nastavení jsou povinná'
    });
  }
  
  // Validace jednotlivých hodnot
  if (settings.speed && (settings.speed < 0.1 || settings.speed > 10)) {
    return res.status(400).json({
      success: false,
      error: 'Rychlost hry musí být mezi 0.1 a 10'
    });
  }
  
  if (settings.unitSpeed && (settings.unitSpeed < 0.1 || settings.unitSpeed > 5)) {
    return res.status(400).json({
      success: false,
      error: 'Rychlost jednotek musí být mezi 0.1 a 5'
    });
  }
  
  if (settings.barbarianSpawnChance && (settings.barbarianSpawnChance < 0 || settings.barbarianSpawnChance > 100)) {
    return res.status(400).json({
      success: false,
      error: 'Šance na barbary musí být mezi 0 a 100'
    });
  }
  
  if (settings.maxPlayers && settings.maxPlayers < world.currentPlayers) {
    return res.status(400).json({
      success: false,
      error: `Maximum hráčů nemůže být menší než současný počet hráčů (${world.currentPlayers})`
    });
  }
  
  // Aktualizuj nastavení
  const updatedWorld = {
    ...world,
    settings: {
      ...world.settings,
      ...settings
    },
    maxPlayers: settings.maxPlayers || world.maxPlayers,
    updatedAt: new Date().toISOString()
  };
  
  // Ulož změny
  mockWorlds[worldIndex] = updatedWorld;
  
  console.log('⚙️ Svět upraven:', updatedWorld);
  
  res.json({
    success: true,
    world: updatedWorld,
    message: `Nastavení světa "${world.name}" bylo úspěšně změněno!`
  });
});

// Admin routes - PUT endpoint pro pozastavení světa
app.put('/api/admin/worlds/:id/pause', (req, res) => {
  const worldId = parseInt(req.params.id);
  
  // Najdi svět
  const worldIndex = mockWorlds.findIndex(w => w.id === worldId);
  if (worldIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Svět nebyl nalezen'
    });
  }
  
  const world = mockWorlds[worldIndex];
  
  // Zkontroluj, zda lze svět pozastavit
  if (world.status !== 'active') {
    return res.status(400).json({
      success: false,
      error: 'Lze pozastavit pouze aktivní světy'
    });
  }
  
  // Pozastav svět
  const pausedWorld = {
    ...world,
    status: 'paused',
    pausedAt: new Date().toISOString()
  };
  
  // Ulož změny
  mockWorlds[worldIndex] = pausedWorld;
  
  console.log('⏸️ Svět pozastaven:', pausedWorld);
  
  res.json({
    success: true,
    world: pausedWorld,
    message: `Svět "${world.name}" byl pozastaven. Hráčům se zobrazí informační zpráva.`
  });
});

// Admin routes - PUT endpoint pro obnovení světa
app.put('/api/admin/worlds/:id/resume', (req, res) => {
  const worldId = parseInt(req.params.id);
  
  // Najdi svět
  const worldIndex = mockWorlds.findIndex(w => w.id === worldId);
  if (worldIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Svět nebyl nalezen'
    });
  }
  
  const world = mockWorlds[worldIndex];
  
  // Zkontroluj, zda lze svět obnovit
  if (world.status !== 'paused') {
    return res.status(400).json({
      success: false,
      error: 'Lze obnovit pouze pozastavené světy'
    });
  }
  
  // Obnov svět
  const resumedWorld = {
    ...world,
    status: 'active',
    resumedAt: new Date().toISOString()
  };
  
  // Ulož změny
  mockWorlds[worldIndex] = resumedWorld;
  
  console.log('▶️ Svět obnoven:', resumedWorld);
  
  res.json({
    success: true,
    world: resumedWorld,
    message: `Svět "${world.name}" byl obnoven a je opět aktivní.`
  });
});

// Admin routes - DELETE endpoint pro smazání světa
app.delete('/api/admin/worlds/:id', (req, res) => {
  const worldId = parseInt(req.params.id);
  
  // Najdi svět
  const worldIndex = mockWorlds.findIndex(w => w.id === worldId);
  if (worldIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Svět nebyl nalezen'
    });
  }
  
  const world = mockWorlds[worldIndex];
  
  // Odstraň svět z mock databáze
  mockWorlds.splice(worldIndex, 1);
  
  console.log('🗑️ Svět smazán:', world);
  
  res.json({
    success: true,
    message: `Svět "${world.name}" byl úspěšně smazán.`
  });
});

// Public API pro hráče - kontrola statusu světa
app.get('/api/world/:slug/status', (req, res) => {
  const worldSlug = req.params.slug;
  
  // Najdi svět podle slug
  const world = mockWorlds.find(w => w.slug === worldSlug);
  
  if (!world) {
    return res.status(404).json({
      success: false,
      error: 'Svět nebyl nalezen',
      status: 'not_found'
    });
  }
  
  // Vytvoř odpověď podle statusu světa
  const response = {
    success: true,
    status: world.status,
    name: world.name,
    slug: world.slug
  };
  
  // Přidej specifické zprávy podle statusu
  switch (world.status) {
    case 'active':
      response.message = 'Svět je aktivní a připraven ke hře!';
      response.canPlay = true;
      break;
      
    case 'preparing':
      response.message = 'Svět se připravuje. Brzy bude spuštěn!';
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
  
  // Přidej základní statistiky (jen pro aktivní světy)
  if (world.status === 'active') {
    response.stats = {
      currentPlayers: world.currentPlayers,
      maxPlayers: world.maxPlayers,
      occupancy: Math.round((world.currentPlayers / world.maxPlayers) * 100)
    };
  }
  
  res.json(response);
});

// Public API pro seznam dostupných světů
app.get('/api/worlds/public', (req, res) => {
  // Vrať pouze veřejné informace o světech
  const publicWorlds = mockWorlds
    .filter(world => world.status === 'active' || world.status === 'preparing')
    .map(world => ({
      id: world.id,
      name: world.name,
      slug: world.slug,
      status: world.status,
      currentPlayers: world.currentPlayers,
      maxPlayers: world.maxPlayers,
      settings: {
        speed: world.settings.speed,
        unitSpeed: world.settings.unitSpeed
      },
      occupancy: Math.round((world.currentPlayers / world.maxPlayers) * 100)
    }));
  
  res.json({
    success: true,
    worlds: publicWorlds,
    total: publicWorlds.length
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Interní chyba serveru'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint nebyl nalezen'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
  console.log(`📊 Mock data contains ${mockWorlds.length} worlds`);
});