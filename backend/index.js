// backend/index.js
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Admin API running' });
});

// Admin routes - GET endpoint s mock daty
app.get('/api/admin/worlds', (req, res) => {
  // Mock data pro testování
  const mockWorlds = [
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
    }
  ];
  
  res.json({ 
    worlds: mockWorlds, 
    total: mockWorlds.length 
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
  
  // TODO: Později uložit do databáze
  // Pro teď jen mockup response
  const newWorld = {
    id: Date.now(), // Dočasné ID
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
    currentPlayers: 0
  };
  
  console.log('🌍 Nový svět vytvořen:', newWorld);
  
  res.json({
    success: true,
    world: newWorld,
    message: `Svět "${name}" byl vytvořen úspěšně!`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin API running on http://localhost:${PORT}`);
});